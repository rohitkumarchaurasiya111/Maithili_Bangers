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
    // 1. Try YouTube RSS feed (fastest, up to 15 items)
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

    // 60-second fresh cache so new songs show up within a minute
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ tracks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
