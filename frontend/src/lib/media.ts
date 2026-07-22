/** Медиа URL түзүү */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const api = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
  const base = api.replace(/\/api\/v1\/?$/, '');
  return `${base}${path}`;
}
