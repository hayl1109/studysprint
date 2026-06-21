import axios from 'axios';

export default async function handler(req, res) {
  // Grab the secure authentication code Spotify sent back to us
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided.' });
  }

  // Vercel environment variables (We will set these up next)
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'https://studysprint-orpin.vercel.app/api/callback';

  // Base64 encode the credentials as required by Spotify's API
  const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

  try {
    // Exchange the code for a temporary user access token
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Bounce the user back to your frontend React app along with their new tokens!
    res.redirect(`/#access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);

  } catch (error) {
    console.error('Spotify token exchange failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to complete secure login token exchange' });
  }
}
