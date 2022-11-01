const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/database/user.db');

router.get('/', (req, res) => {
    res.redirect('https://wakmusic.xyz');
});

router.get('/:key', (req, res) => {
    db.get(`SELECT * FROM playlist WHERE key = ?`, [req.params.key], (err, rows) => {
        if (err || !rows) res.redirect('https://wakmusic.xyz');
        else {
            res.redirect('https://wakmusic.xyz/playlist/' + rows.key);
        }
    })
})

module.exports = router;
