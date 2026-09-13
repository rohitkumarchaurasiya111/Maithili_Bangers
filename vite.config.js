import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

async function handlePlaylistRequest(req, res) {
  const parsed = new URL(req.url, 'http://localhost');
  const id = parsed.searchParams.get('id');
  if (!id) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Missing playlist id' }));
  }

  try {
    let tracks = [];
    // 1. Try YouTube RSS feed for reliable titles and author names
    try {
      const rss = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${id}`);
      if (rss.ok) {
        const xml = await rss.text();
        const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
        tracks = entries.map(e => {
          const chunk = e[1];
          const vidId = chunk.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
          const title = chunk.match(/<title>(.*?)<\/title>/)?.[1];
          const author = chunk.match(/<name>(.*?)<\/name>/)?.[1];
          return vidId ? { id: vidId, title: title || 'Song', channel: author || 'मैथिली Banger' } : null;
        }).filter(Boolean);
      }
    } catch {}

    // 2. Fetch full playlist page to detect ALL songs beyond the 15 RSS limit
    try {
      const htmlRes = await fetch(`https://www.youtube.com/playlist?list=${id}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const vids = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
        const uniqueIds = [...new Set(vids)];
        if (uniqueIds.length > tracks.length) {
          const knownIds = new Set(tracks.map(t => t.id));
          const newIds = uniqueIds.filter(vid => !knownIds.has(vid));
          const extraTracks = await Promise.all(newIds.map(async (vid, idx) => {
            try {
              const oembed = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`).then(r => r.json());
              if (oembed && oembed.title) {
                return {
                  id: vid,
                  title: oembed.title,
                  channel: oembed.author_name || 'मैथिली Banger'
                };
              }
            } catch {}
            return {
              id: vid,
              title: `Track ${tracks.length + idx + 1}`,
              channel: 'मैथिली Banger'
            };
          }));
          tracks.push(...extraTracks);
        }
      }
    } catch {}

    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ tracks }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err.message }));
  }
}

function playlistApiPlugin() {
  const middleware = async (req, res, next) => {
    if (req.url && req.url.startsWith('/api/playlist')) {
      await handlePlaylistRequest(req, res);
      return;
    }
    next();
  };

  return {
    name: 'playlist-api-plugin',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), playlistApiPlugin()],
})
