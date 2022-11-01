const express = require('express');
const router = express.Router();


router.get('/bug',(req, res) => {
    res.redirect('https://forms.gle/R6vrPeokJqfB3gCR8');
});

router.get('/addmusic', (req, res) => {
    res.redirect('https://docs.google.com/spreadsheets/d/1n8bRCE_OBUOND4pfhlqwEBMR6qifVLyWk5YrHclRWfY');
});

router.get('/privacy', (req, res) => {
    res.redirect('https://www.notion.so/waktaverse/ddca30a20d634ff68d41d20957439bd5');
});

router.get('/app/ios', (req, res) => {
    res.redirect('https://apps.apple.com/app/billboardoo/id1641642735');
});

router.get('/app/android', (req, res) => {
    res.redirect('https://play.google.com/store/apps/details?id=com.waktaverse.music');
});

module.exports = router;
