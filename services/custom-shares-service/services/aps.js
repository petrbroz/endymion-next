const APS = require('forge-apis');
const axios = require('axios').default;
const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, APS_STORAGE_BUCKET } = require('../config.js');
const internalAuthClient = new APS.AuthClientThreeLegged(APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, ['data:read', 'data:create', 'data:write', 'bucket:read', 'bucket:create']);
const internalTwoLeggedClient = new APS.AuthClientTwoLegged(APS_CLIENT_ID, APS_CLIENT_SECRET, ['data:read', 'data:create', 'data:write', 'bucket:read', 'bucket:create']);
const publicAuthClient = new APS.AuthClientThreeLegged(APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, ['viewables:read']);

function getAuthorizationUrl() {
    return internalAuthClient.generateAuthUrl();
}

async function authCallbackMiddleware(req, res, next) {
    const internalCredentials = await internalAuthClient.getToken(req.query.code);
    const publicCredentials = await publicAuthClient.refreshToken(internalCredentials);
    req.session.public_token = publicCredentials.access_token;
    req.session.internal_token = internalCredentials.access_token;
    req.session.refresh_token = publicCredentials.refresh_token;
    req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    next();
}

async function authRefreshMiddleware(req, res, next) {
    const { refresh_token, expires_at } = req.session;
    if (!refresh_token) {
        res.status(401).end();
        return;
    }

    if (expires_at < Date.now()) {
        const internalCredentials = await internalAuthClient.refreshToken({ refresh_token });
        const publicCredentials = await publicAuthClient.refreshToken(internalCredentials);
        req.session.public_token = publicCredentials.access_token;
        req.session.internal_token = internalCredentials.access_token;
        req.session.refresh_token = publicCredentials.refresh_token;
        req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    }
    req.internalOAuthToken = {
        access_token: req.session.internal_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000)
    };
    req.publicOAuthToken = {
        access_token: req.session.public_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000)
    };
    next();
}

async function getUserProfile(token) {
    const resp = await new APS.UserProfileApi().getUserProfile(internalAuthClient, token);
    return resp.body;
}

async function getHubs(token) {
    const resp = await new APS.HubsApi().getHubs(null, internalAuthClient, token);
    return resp.body.data;
}

async function getProjects(hubId, token) {
    const resp = await new APS.ProjectsApi().getHubProjects(hubId, null, internalAuthClient, token);
    return resp.body.data;
};

async function getProjectContents(hubId, projectId, folderId, token) {
    if (!folderId) {
        const resp = await new APS.ProjectsApi().getProjectTopFolders(hubId, projectId, internalAuthClient, token);
        return resp.body.data;
    } else {
        const resp = await new APS.FoldersApi().getFolderContents(projectId, folderId, null, internalAuthClient, token);
        return resp.body.data;
    }
}

async function getItemVersions(projectId, itemId, token) {
    const resp = await new APS.ItemsApi().getItemVersions(projectId, itemId, null, internalAuthClient, token);
    return resp.body.data;
}

async function getManifest(urn, token) {
    const resp = await new APS.DerivativesApi().getManifest(urn, null, internalAuthClient, token);
    return resp.body;
}

async function getInternalToken() {
    if (!internalTwoLeggedClient.isAuthorized()) {
        await internalTwoLeggedClient.authenticate();
    }
    return internalTwoLeggedClient.getCredentials();
}

async function ensureBucketExists(bucketKey) {
    try {
        await new APS.BucketsApi().getBucketDetails(bucketKey, null, await getInternalToken());
    } catch (err) {
        if (err.response.status === 404) {
            await new APS.BucketsApi().createBucket({ bucketKey, policyKey: 'persistent' }, {}, null, await getInternalToken());
        } else {
            throw err;
        }
    }
}

async function listObjects(prefix) {
    await ensureBucketExists(APS_STORAGE_BUCKET);
    const resp = await new APS.ObjectsApi().getObjects(APS_STORAGE_BUCKET, { beginsWith: prefix }, null, await getInternalToken());
    return resp.body.items;
}

async function getObject(objectKey) {
    await ensureBucketExists(APS_STORAGE_BUCKET);
    const resp = await new APS.ObjectsApi().downloadResources(APS_STORAGE_BUCKET, [{ objectKey, responseType: 'json' }], null, null, await getInternalToken());
    if (resp[0].error) {
        throw new Error(resp[0].downloadParams.body);
    } else {
        return resp[0].data;
    }
}

async function putObject(objectKey, data) {
    await ensureBucketExists(APS_STORAGE_BUCKET);
    const resp = await new APS.ObjectsApi().uploadResources(APS_STORAGE_BUCKET, [{ objectKey, data }], null, null, await getInternalToken());
    return resp[0];
}

async function deleteObject(objectKey) {
    await ensureBucketExists(APS_STORAGE_BUCKET);
    await new APS.ObjectsApi().deleteObject(APS_STORAGE_BUCKET, objectKey, null, await getInternalToken());
}

async function getScopedToken(urn) {
    // const client = new APS.AuthClientTwoLegged(APS_CLIENT_ID, APS_CLIENT_SECRET, ['viewables:read']);
    // const credentials = await client.authenticate();
    // return credentials;
    const decodedUrn = Buffer.from(urn, 'base64').toString();
    const response = await axios.post('https://developer.api.autodesk.com/authentication/v2/token', {
        grant_type: 'client_credentials',
        scope: 'data:read:' + decodedUrn
    }, {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(APS_CLIENT_ID + ':' + APS_CLIENT_SECRET).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data;
}

module.exports = {
    getAuthorizationUrl,
    authCallbackMiddleware,
    authRefreshMiddleware,
    getUserProfile,
    getHubs,
    getProjects,
    getProjectContents,
    getItemVersions,
    getManifest,
    listObjects,
    getObject,
    putObject,
    deleteObject,
    getScopedToken,
};
