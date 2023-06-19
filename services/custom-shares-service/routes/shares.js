const express = require('express');
const { generateSecret } = require('../services/shares.js');
const { authRefreshMiddleware, getUserProfile, getManifest, getScopedToken, listObjects, getObject, putObject, deleteObject } = require('../services/aps.js');

let router = express.Router();

async function requestHasAccess(urn, token) {
    try {
        await getManifest(urn, token);
        return true;
    } catch (err) {
        return false;
    }
}

router.get('/shares/:urn', authRefreshMiddleware, async function (req, res, next) {
    // TODO: validate URN
    const { urn } = req.params;
    if (!(await requestHasAccess(urn, req.internalOAuthToken))) {
        res.status(401).end();
        return;
    }
    try {
        const objects = await listObjects(urn + '/', req.internalOAuthToken);
        const secrets = objects.map(obj => obj.objectKey).map(key => key.substring(key.indexOf('/') + 1));
        res.json(secrets);
    } catch (err) {
        next(err);
    }
});

router.post('/shares/:urn', authRefreshMiddleware, async function (req, res, next) {
    // TODO: validate URN
    const { urn } = req.body;
    if (!urn) {
        res.status(400).end('Required `urn` field is missing in the payload.');
        return;
    }
    try {
        const user = await getUserProfile(req.internalOAuthToken);
        const secret = generateSecret();
        const data = JSON.stringify({ secret, urn, createdBy: user.userId, createdAt: new Date() });
        await putObject(urn + '/' + secret, data);
        res.type('json').end(data);
    } catch (err) {
        next(err);
    }
});

router.delete('/shares/:urn/:secret', authRefreshMiddleware, async function (req, res, next) {
    // TODO: validate URN and secret
    const { urn, secret } = req.params;
    if (!(await requestHasAccess(urn, req.internalOAuthToken))) {
        res.status(401).end();
        return;
    }
    try {
        await deleteObject(urn + '/' + secret);
        res.status(200).end();
    } catch (err) {
        next(err);
    }
});

router.get('/shares/:urn/:secret', async function (req, res, next) {
    // TODO: validate URN and secret
    const { urn, secret } = req.params;
    try {
        const data = await getObject(urn + '/' + secret);
        const credentials = await getScopedToken(urn);
        res.json({
            urn, credentials
        });
    } catch (err) {
        res.status(401).end();
    }
});

module.exports = router;
