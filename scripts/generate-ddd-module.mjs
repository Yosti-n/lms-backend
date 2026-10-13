import { existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDirectory, '..');
const rawName = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!rawName || rawName.startsWith('--')) {
  console.error('Uso: npm run generate:module -- <nombre> [--dry-run]');
  process.exit(1);
}

const moduleName = rawName
  .trim()
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/[\s_]+/g, '-')
  .toLowerCase();

if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(moduleName)) {
  console.error(
    'El nombre debe usar letras, números y guiones; por ejemplo: human-resource.',
  );
  process.exit(1);
}

const moduleRoot = join(projectRoot, 'src', 'modules', moduleName);

if (existsSync(moduleRoot) && !dryRun) {
  console.error(`El módulo "${moduleName}" ya existe.`);
  process.exit(1);
}

const nestCli = join(
  projectRoot,
  'node_modules',
  '@nestjs',
  'cli',
  'bin',
  'nest.js',
);

if (!existsSync(nestCli)) {
  console.error('No se encontró Nest CLI. Ejecuta primero: npm install');
  process.exit(1);
}

const nestArguments = [
  nestCli,
  'generate',
  'module',
  `modules/${moduleName}`,
  '--no-spec',
];

if (dryRun) {
  nestArguments.push('--dry-run');
}

const nestResult = spawnSync(process.execPath, nestArguments, {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (nestResult.status !== 0) {
  process.exit(nestResult.status ?? 1);
}

const directories = [
  'interfaces/controllers',
  'interfaces/requests',
  'application/dto',
  'application/services',
  'application/use-cases',
  'domain/entities',
  'domain/exceptions',
  'domain/ports',
  'domain/services',
  'infrastructure/repositories',
];

if (dryRun) {
  console.log('\nCarpetas DDD que se crearían:');
  for (const directory of directories) {
    console.log(`  src/modules/${moduleName}/${directory}`);
  }
} else {
  for (const directory of directories) {
    mkdirSync(join(moduleRoot, directory), { recursive: true });
  }

  console.log(`\nMódulo DDD "${moduleName}" creado correctamente.`);
}
