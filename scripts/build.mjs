import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outdir = path.join(root, 'build');

await fs.rm(outdir, { recursive: true, force: true });
await fs.mkdir(outdir, { recursive: true });

for (const fileName of ['main.html', 'styles.css', 'tailwind.css', 'TIMBRADO_JERO_template.docx']) {
  await fs.copyFile(path.join(root, fileName), path.join(outdir, fileName));
}

await build({
  entryPoints: [path.join(root, 'app.js'), path.join(root, 'word-export.js')],
  outdir,
  bundle: true,
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  target: ['es2020'],
  format: 'iife'
});

console.log('Build concluído em build/.');
