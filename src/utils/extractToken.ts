export default function extractToken(url: string): string | null {
  if (!/^https?:\/\//i.test(url)) return null;
  const urlObject = new URL(url);

  const queryToken = urlObject.searchParams.get("token");
  if (queryToken) return queryToken;

  const segments = urlObject.pathname.split("/").filter(Boolean);
  const pathToken = segments[segments.length - 1];

  if (pathToken && pathToken.length === 32) return pathToken;
  return null;
}
