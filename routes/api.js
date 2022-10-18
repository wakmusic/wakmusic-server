const express = require('express');
const axios = require("axios");
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/database/static.db');


router.get('/news', async (req, res) => {
    let start = parseInt(req.query.start);
    if (!start) start = 0;

    await db.all(`SELECT * FROM news ORDER BY time DESC`, (err, rows) => {
        return res.json(rows.slice(start, start + 30));
    });
});

router.get('/artist/list', async (req, res) => {
    await db.all('SELECT * FROM artists', (err, rows) => {
        return res.json(rows);
    });
});

router.get('/teams', async (req, res) => {
    await db.all('SELECT * FROM teams', (err, rows) => {
        return res.json(rows);
    });
});

module.exports = router;
