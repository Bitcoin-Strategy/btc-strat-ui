import type { Plugin } from 'vite';

// Vite otherwise replaces a missing optional peer with a module that throws at runtime.
export const requireBundledDependencies = (): Plugin => ({
  name: 'mstrx:require-bundled-dependencies',
  apply: 'build',
  generateBundle(_options, bundle) {
    for (const output of Object.values(bundle)) {
      if (output.type !== 'chunk') continue;

      for (const [id, module] of Object.entries(output.modules)) {
        if (!id.includes('__vite-optional-peer-dep:')) continue;
        if (module.renderedLength === 0) continue;

        const [, dependency, parent] = id.split(':');
        this.error(
          `Missing runtime dependency "${dependency}" required by "${parent}" ` +
            `in ${output.fileName}. Install the compatible peer dependency before deploying.`,
        );
      }
    }
  },
});
