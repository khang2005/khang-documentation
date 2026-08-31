export interface Env {
  DOCS: R2Bucket;
}

const assetCache = new Map<string, { body: ArrayBuffer; contentType: string; etag: string }>();

async function getAsset(path: string, env: Env): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  if (assetCache.has(path)) {
    const cached = assetCache.get(path)!;
    return { body: cached.body, contentType: cached.contentType };
  }

  const object = await env.DOCS.get(path);
  if (!object) {
    return null;
  }

  const body = await object.arrayBuffer();
  const contentType = object.httpMetadata?.contentType || getContentType(path);
  const etag = object.etag;

  assetCache.set(path, { body, contentType, etag });

  return { body, contentType };
}

function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
  };
  return mimeTypes[ext || ''] || 'text/plain';
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let path = url.pathname.replace(/^\//, '');

  if (path === '' || path.endsWith('/')) {
    path = path + 'index.html';
  }

  let asset = await getAsset(path, env);

  if (!asset && !path.includes('.')) {
    asset = await getAsset(path + '/index.html', env);
  }

  if (!asset) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new Response(asset.body, {
    headers: {
      'Content-Type': asset.contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
