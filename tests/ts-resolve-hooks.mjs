/** Resolves extensionless relative imports from `src/` under Node. Only after Node's own resolution fails. */
const CANDIDATES = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (!specifier.startsWith('.')) throw error;

    for (const extension of CANDIDATES) {
      try {
        return await next(specifier + extension, context);
      } catch {
        // Try the next extension.
      }
    }
    throw error;
  }
}
