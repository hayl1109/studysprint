export default async function handler(req, res) {
  // Grab the authorization code Spotify sent back in the URL
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    // Exchange the authorization code for access and refresh tokens using native fetch
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    // Parse the response data
    const data = await response.json();

    if (!response.ok) {
      console.error('Spotify token exchange failed:', data);
      return res.status(response.status).json(data);
    }

    const { access_token, refresh_token } = data;

    // Redirect the user back to your frontend layout, appending tokens to the hash map
    return res.redirect(
      302,
      `https://studysprint-orpin.vercel.app/#access_token=${access_token}&refresh_token=${refresh_token}`
    );

  } catch (error) {
    console.error('Serverless function runtime error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
