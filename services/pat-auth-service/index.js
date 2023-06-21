const express = require('express');
const axios = require('axios').default;
const helmet = require('helmet');
const { APS_CLIENT_ID, APS_CLIENT_SECRET } = process.env;
const PORT = process.env.PORT || 8080;

if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}

let app = express();
app.use(helmet());
app.post('/token', express.json(), async function (req, res) {
    const { personal_access_token } = req.body;
    try {
        const response = await axios.post(
            'https://developer-dev.api.autodesk.com/authentication/v2/token',
            new URLSearchParams({
                'grant_type': 'urn:ietf:params:oauth:grant-type:token-exchange',
                'subject_token': personal_access_token,
                'subject_token_type': 'urn:adsk:params:oauth:token-type:personal_access_token',
                'scope': 'viewables:read'
            }), {
                headers: {
                    'Authorization': `Basic ${Buffer.from(APS_CLIENT_ID + ':' + APS_CLIENT_SECRET).toString('base64')}`
                }
            }
        );
        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(400).end(err.response.data);
    }
});
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
