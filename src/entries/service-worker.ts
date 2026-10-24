const dynamicHosts = [
  'api.github.com',
  'tjy-gitnub.github.io/win12-theme',
  'win12server.freehk.svipss.top',
  'assets.msn.cn',
];
export const cacheName = 'def';
export const protectedPaths = [
  '/fonts/',
  '/img/',
  '/apps/icons/',
  '/bootstrap-icons.css',
];

export function isDynamicRequest(url: URL): boolean {
  return dynamicHosts.some((host) =>
    `${url.host}${url.pathname}`.includes(host),
  );
}

export function isProtected(url: string): boolean {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return false;
  }
  return protectedPaths.some((path) => pathname.includes(path));
}

export async function updateCache(force = false): Promise<void> {
  const keys = await caches.keys();
  if (!keys.includes(cacheName)) return;
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  await Promise.all(
    requests.map((request) => {
      if (force || !isProtected(request.url)) return cache.delete(request);
      return undefined;
    }),
  );
}

self.addEventListener('fetch', (event: any) => {
  const request = event.request as Request;
  const url = new URL(request.url);
  if (!/^https?:$/.test(url.protocol) || request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (isDynamicRequest(url)) return fetch(request);
      if (cached?.ok) return cached;
      return fetch(request).then(async (response) => {
        if (!response.ok) return response;
        try {
          await (await caches.open(cacheName)).put(request, response.clone());
        } catch {}
        return response;
      });
    }),
  );
});

self.addEventListener('message', (event: any) => {
  if (event.data?.head !== 'update') return;
  const update = updateCache(Boolean(event.data.force));
  event.waitUntil?.(update);
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(updateCache(false));
});
