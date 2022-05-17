const express = require('express');
const port = require('../local').port();
const url = require('../local').expressurl();
// const { clientId, clientSecret } = require('../local').auth;
const mongo = require('./mongo')

const app = express();

app.get('/', async (request, response) => {
    response.redirect('https://cdn.cryptofyre.org/Videos/lagtrain.mp4');
});

app.get('/connect-login', (request, response) => {
    response.redirect(`https://connect.cidercollective.dev/callback/discord`)
});

app.get('/release/:branch', async (request, response) => {
    const release = await mongo.getLatestRelease(request.params.branch || 'main');
    response.json(release);
});

app.listen(port, () => consola.info(`App listening at http://${url}`));
