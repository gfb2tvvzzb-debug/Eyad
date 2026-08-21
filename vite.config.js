import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { readdir, readFile } from 'fs/promises';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files;
}

function copyTransformations() {
  return {
    name: 'copy-transformations',
    async generateBundle() {
      const sourceDir = resolve(rootDir, 'transformation');
      const files = await collectFiles(sourceDir);
      for (const file of files) {
        this.emitFile({
          type: 'asset',
          fileName: file.slice(rootDir.length).replace(/\\/g, '/').replace(/^\//, ''),
          source: await readFile(file),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [copyTransformations()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    rollupOptions: {
      input: [
        resolve(rootDir, 'index.html'),
        resolve(rootDir, 'about.html'),
        resolve(rootDir, 'auth-updated.html'),
        resolve(rootDir, 'dietary-log.html'),
        resolve(rootDir, 'exercise-history.html'),
        resolve(rootDir, 'food-preferences.html'),
        resolve(rootDir, 'health-history.html'),
        resolve(rootDir, 'nutrition-assessment-updated.html'),
        resolve(rootDir, 'transformations.html'),
      ],
    },
  },
});
