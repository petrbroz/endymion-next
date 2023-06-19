const express = require('express');
const { getAuthorizationUrl, authCallbackMiddleware, authRefreshMiddleware, getUserProfile } = require('../services/aps.js');

let router = express.Router();

router.get('/auth/login', function (req, res) {
    res.redirect(getAuthorizationUrl());
});

router.get('/auth/logout', function (req, res) {
    req.session = null;
    res.redirect('/');
});

router.get('/auth/callback', authCallbackMiddleware, function (req, res) {
    res.redirect('/');
});

router.get('/auth/token', authRefreshMiddleware, function (req, res) {
    res.json(req.publicOAuthToken);
});

router.get('/auth/profile', authRefreshMiddleware, async function (req, res, next) {
    try {
        const profile = await getUserProfile(req.internalOAuthToken);
        res.json({ name: `${profile.firstName} ${profile.lastName}` });
    } catch (err) {
        next(err);
    }
});

module.exports = router;