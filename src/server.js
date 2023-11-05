const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

const githubUrl = {
  authorize: `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`,
  accessToken: `https://github.com/login/oauth/access_token`,
  accessTokenBody: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code={code}&redirect_uri=${REDIRECT_URI}`,
  user: `https://api.github.com/user`,
};

// / : /static/index.html
app.use(express.static(path.join(__dirname, 'static')));

app.get('/login', (req, res) => {
  res.redirect(githubUrl.authorize);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const body = githubUrl.accessTokenBody.replace('{code}', code);

  try {
    const tokenResponse = await fetch(githubUrl.accessToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const tokenData = await tokenResponse.text();
    // https://docs.github.com/ko/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens
    console.log(tokenData);
    const params = new URLSearchParams(tokenData);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    res.redirect(`/?access_token=${accessToken}&refresh_token=${refreshToken}`);

    // if (!accessToken) {
    //   throw new Error('Failed to get access token');
    // }
    // const userResponse = await fetch(githubUrl.user, {
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // });
    // const userData = await userResponse.json();
    // res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to GitHub OAuth');
  }
});

app.get('/refresh/access-token', async (req, res) => {
  const refreshToken = req.query.refresh_token;
  const body = `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&refresh_token=${refreshToken}&grant_type=refresh_token`;

  try {
    const tokenResponse = await fetch(githubUrl.accessToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const tokenData = await tokenResponse.text();
    console.log(tokenData);
    const params = new URLSearchParams(tokenData);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to GitHub OAuth');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
