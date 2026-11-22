const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const videoId = req.query?.videoId;
  if (!videoId) return res.status(400).json({ error: 'Missing videoId parameter' });

  let title = 'YouTube Video';
  try {
    const infoRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    const info = await infoRes.json();
    title = info.title || title;
  } catch {}

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const transcript = segments.map(s => s.text).join(' ');
    return res.status(200).json({ title, transcript, hasRealTranscript: transcript.length > 20 });
  } catch (e) {
    return res.status(200).json({ title, transcript: '', hasRealTranscript: false, reason: e.message });
  }
};
