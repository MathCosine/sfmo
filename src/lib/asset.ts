/**
 * Resolves a file in /public against the deploy base, so the same code works
 * at mathcosine.github.io/sfmo/ and at sfmathopen.org/.
 */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
