export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing playlist id' });
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

    // 2. Check full playlist page if RSS returned fewer items
    try {
      const htmlRes = await fetch(`https://www.youtube.com/playlist?list=${id}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const vids = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
        const uniqueIds = [...new Set(vids)];
        if (uniqueIds.length > tracks.length) {
          const knownIds = new Set(tracks.map(t => t.id));
          for (const vid of uniqueIds) {
            if (!knownIds.has(vid)) {
              tracks.push({
                id: vid,
                title: `Track ${tracks.length + 1}`,
                channel: 'मैथिली Banger'
              });
            }
          }
        }
      }
    } catch {}

    // Cache header for Vercel edge CDN: 1 hour cache, stale-while-revalidate 1 day
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ tracks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
