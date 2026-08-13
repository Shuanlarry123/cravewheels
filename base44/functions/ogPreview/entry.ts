import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80';
const DEFAULT_TITLE = 'Cravewheels — Video Food Delivery';
const DEFAULT_DESC =
  'Discover and order your next meal through immersive video clips from local restaurants on Cravewheels.';
const APP_ORIGIN = 'https://cravewheels.com';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let type = url.searchParams.get('type');
    let id = url.searchParams.get('id');

    // Fallback: read from JSON body for POST requests (SDK calls / test tool)
    if ((!type || !id) && req.method === 'POST') {
      try {
        const body = await req.clone().json();
        if (!type) type = body.type;
        if (!id) id = body.id;
      } catch {
        /* not JSON — ignore */
      }
    }

    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESC;
    let image = DEFAULT_IMG;
    let video = '';
    let redirect = '/';

    if (type && id) {
      if (type === 'post') {
        try {
          const post = await base44.asServiceRole.entities.Post.get(id);
          if (post) {
            title = post.caption || `${post.author_name || 'Creator'} on Cravewheels`;
            description = `Watch this video post by ${post.author_name || 'a creator'} on Cravewheels.`;
            if (post.thumbnail_url) image = post.thumbnail_url;
            if (post.video_url) video = post.video_url;
            redirect = `/post/${id}`;
          }
        } catch (e) {
          console.error('ogPreview: post fetch error', e?.message || e);
        }
      } else if (type === 'item') {
        try {
          const item = await base44.asServiceRole.entities.MenuItem.get(id);
          if (item) {
            title = `${item.name} — ${item.restaurant_name || 'Cravewheels'}`;
            description = item.description || `Watch this dish video and order delivery on Cravewheels.`;
            if (item.thumbnail_url) image = item.thumbnail_url;
            if (item.video_url) video = item.video_url;
            redirect = `/item/${id}`;
          }
        } catch (e) {
          console.error('ogPreview: item fetch error', e?.message || e);
        }
      }
    }

    const fullRedirect = `${APP_ORIGIN}${redirect}`;

    const videoTags = video
      ? `
<meta property="og:video" content="${esc(video)}" />
<meta property="og:video:url" content="${esc(video)}" />
<meta property="og:video:secure_url" content="${esc(video)}" />
<meta property="og:video:type" content="video/mp4" />
<meta property="og:video:width" content="720" />
<meta property="og:video:height" content="1280" />`
      : '';

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="${video ? 'video.other' : 'website'}" />
<meta property="og:url" content="${esc(fullRedirect)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Cravewheels" />${videoTags}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
</head>
<body>
<p>Redirecting to Cravewheels…</p>
<script>window.location.replace('${esc(fullRedirect)}');</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    const html = `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${APP_ORIGIN}/"></head><body>Redirecting…</body></html>`;
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}