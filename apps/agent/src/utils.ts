export async function mapWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await mapper(items[index]!);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

import { resolve, relative } from "node:path";

export function getWorkspacePath(filePath: string): string {
  const resolved = resolve("/workspace", filePath);
  const relativePath = relative("/workspace", resolved);
  if (relativePath.startsWith("..") || relativePath === "..") {
    throw new Error(`Access Denied: Path '${filePath}' is outside of the workspace.`);
  }
  return resolved;
}
