import { chmod } from 'node:fs/promises'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['bin/cli.ts'],
  outDir: 'dist-cli/bin',
  format: ['esm'],
  target: 'es2022',
  platform: 'node',
  splitting: false,
  clean: false,
  shims: true,
  external: [
    'commander',
    'inquirer',
    '@prisma/internals',
    'glob',
    '@swc/core',
    'ink',
  ],
  async onSuccess() {
    // Make the CLI executable
    await chmod('dist-cli/bin/cli.js', 0o755)
  },
})
