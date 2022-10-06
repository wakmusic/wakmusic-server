const express = require('express');
const router = express.Router();
require('dotenv').config();
const passport = require("passport");
const {Strategy: GoogleStrategy} = require('passport-google-oauth20')
const {Strategy: NaverStrategy} = require("passport-naver");
const {Strategy: AppleStrategy} = require("passport-appleid");
const session = require("express-session");
const jwt = require("jsonwebtoken");

router.use(session({secret: process.env.TWITCH_CLIENT_SECRET, resave: false, saveUninitialized: false}));
router.use(passport.initialize(undefined));
router.use(passport.session(undefined));


router.use(session({secret: process.env.NAVER_CLIENT_SECRET, resave: false, saveUninitialized: false}));
passport.use('naver',
    new NaverStrategy({
            clientID: process.env.NAVER_CLIENT_ID,
            clientSecret: process.env.NAVER_CLIENT_SECRET,
            callbackURL: "/auth/callback/naver"
        },
        function (accessToken, refreshToken, profile, done) {
            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            done(null, profile);
        }
    ));

router.use(session({secret: process.env.GOOGLE_CLIENT_SECRET, resave: false, saveUninitialized: false}));
passport.use('google',
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/callback/google",
            passReqToCallback: true,
        },
        function (request, accessToken, refreshToken, profile, done) {
            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            return done(null, profile);
        }
    )
);

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

router.get('/auth/login/naver', passport.authenticate('naver', null, null));
router.get('/auth/callback/naver',
    passport.authenticate('naver', {failureRedirect: '/login'}, null),
    async (req, res) => {
        const token = jwt.sign({id: req.user.id}, process.env.JWT_SECRET);
        res.cookie('token', token, {httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7});
        res.redirect('/mypage');
    });

router.get('/auth/login/google', passport.authenticate('google', {scope: ['profile']}, null));
router.get('/auth/callback/google',
    passport.authenticate('google', {failureRedirect: '/login'}, null),
    async (req, res) => {
        const token = jwt.sign({id: req.user.id}, process.env.JWT_SECRET);
        res.cookie('token', token, {httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7});
        res.redirect('/mypage');
    });

router.get('/api/auth', (req, res) => {
    if (req.session && req.user) {
        res.json(req.user);
    } else {
        res.json({data: 401});
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    req.session.save(() => res.redirect('/'))
})

module.exports = router;