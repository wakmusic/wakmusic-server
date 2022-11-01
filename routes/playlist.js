const express = require('express');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const router = express.Router();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/database/user.db');

router.use(cookieParser());

function dbAll(query, params) {
    return new Promise(function (resolve) {
        db.all(query, params, (err, rows) => {
            if (err) resolve({'err': err});
            else resolve({'err': err, 'result': rows});
        });
    });
}

function dbRun(query, params) {
    return new Promise(function (resolve) {
        db.run(query, params, (err) => {
            resolve({'err': err});
        });
    });
}

function dbGet(query, params) {
    return new Promise(function (resolve) {
        db.get(query, params, (err, row) => {
            if (err) resolve({'err': err});
            else resolve({'err': err, 'result': row});
        });
    });
}

function arrToStr(arr) {
    const set = new Set(arr);
    const newArr = [...set];
    return newArr.join('|:|');
}

function createKey(num) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < num; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function normalStatus(data = {}) {
    let result = {'status': 200};
    let keys = Object.keys(data);
    for (let num = 0; num < keys.length; num++) {
        result[keys[num]] = data[keys[num]]
    }

    return result;
}

const isLoggedIn = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err) => {
        if (err) return res.sendStatus(401);
        next();
    });
}

const wrongStatus = {'status': 400};
const errorStatus = {'status': 404};

// 플레이리스트 생성 API
router.post('/create', isLoggedIn, async function (req, res) {
    let key;
    let isStatus = null;
    let title = req.body.title;
    let creator = req.body.creator;
    let platform = req.body.platform;
    let image = req.body.image;
    let songList = arrToStr(req.body.songlist);
    let isPublic = String(req.body.public);
    let clientId = req.body.clientId;

    await dbAll(`SELECT key FROM playlist where clientId='${clientId}'`).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            let duplicateCheck = [false];
            resolve.result.forEach((row) => {
                duplicateCheck.push(row.key);
            });

            while (true) {
                key = createKey(10);
                // noinspection JSCheckFunctionSignatures
                if (duplicateCheck.includes(key)) duplicateCheck[0] = true
                if (duplicateCheck[0] === false) break;
            }
        }
    });

    if (isStatus) return res.status(200).json(isStatus);

    let params = [key, title, creator, platform, image, songList, isPublic, clientId, clientId];
    await dbRun(`INSERT INTO playlist VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, params).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else isStatus = normalStatus({'key': key});
    });

    return res.status(200).json(isStatus);
});

// 플레이리스트 목록 조회 API
router.get('/list/:clientId', isLoggedIn, async function (req, res) {
    let isStatus = null;
    let clientId = req.params.clientId;

    let playlistArray;
    await dbAll(`SELECT key, title, creator, image, songlist, clientId FROM playlist WHERE subscribe LIKE ?`, ["%" + clientId + "%"]).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result !== []) {
            playlistArray = [];
            resolve.result.forEach((row) => {
                playlistArray.push(row);
            });
        } else if (resolve.result === []) {
            playlistArray = null;
        }
    });

    if (isStatus) return res.status(200).json(isStatus);

    let playlist = [];
    if (playlistArray) {
        for (let num = 0; num < playlistArray.length; num++) {
            playlist.push({
                'key': playlistArray[num]['key'],
                'title': playlistArray[num]['title'],
                'image': playlistArray[num]['image'],
                'count': playlistArray[num]['songlist'].split('|:|').length - 1,
                'clientId': playlistArray[num]['clientId'],
            });
        }
    }

    return res.status(200).json(normalStatus({'playlist': playlist}));
});

// 플레이리스트 상세 조회 API
router.get('/detail/:key', async function (req, res) {
    let isStatus = null;
    let key = req.params.key;

    await dbGet(`SELECT * FROM playlist WHERE key = ?`, [key]).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            isStatus = normalStatus({
                'key': resolve.result['key'],
                'title': resolve.result['title'],
                'creator': resolve.result['creator'],
                'platform': resolve.result['platform'],
                'image': resolve.result['image'],
                'public': resolve.result['public'] === 'true',
                'clientId': resolve.result['clientId'],
                'songlist': resolve.result['songlist'].split('|:|'),
                'subscribe': resolve.result['subscribe'].split('|:|')
            });
        } else {
            isStatus = wrongStatus;
        }
    });

    if (isStatus.public === "false") isLoggedIn(req, res, () => {
        return res.status(200).json(isStatus)
    });
    else return res.status(200).json(isStatus);

});

// 플레이리스트 수정 API
router.post('/edit/:key', isLoggedIn, async function (req, res) {
    let isStatus = null;
    let key = req.params.key;
    let title = req.body.title;
    let image = req.body.image;
    let songList = arrToStr(req.body.songlist);
    let isPublic = String(req.body.public);
    let clientId = req.body.clientId;

    await dbGet(`SELECT * FROM playlist WHERE key = ?`, [key]).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            if (resolve.result['clientId'] !== clientId) isStatus = wrongStatus;
        } else return isStatus = wrongStatus;
    });

    if (isStatus) return res.status(200).json(isStatus);

    let params = [title, image, songList, isPublic, clientId, key];
    await dbRun(`UPDATE playlist SET title = ?, image = ?, songlist = ?, public = ?, clientId = ? WHERE key = ?`, params).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else isStatus = normalStatus();
    });

    return res.status(200).json(isStatus);
});

// 플레이리스트 삭제 API
router.post('/delete/:key', isLoggedIn, async function (req, res) {
    let isStatus = null;
    let key = req.params.key;
    let clientId = req.body.clientId;

    await dbGet(`SELECT * FROM playlist WHERE key = ?`, [key]).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            if (resolve.result['clientId'] !== clientId) isStatus = wrongStatus;
        } else isStatus = wrongStatus;
    });

    if (isStatus) return res.status(200).json(isStatus);

    await dbRun(`DELETE FROM playlist WHERE key = ?`, [key]).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else isStatus = normalStatus();
    });

    return res.status(200).json(isStatus);
});

// 공유된 플레이리스트 추가
router.post('/add/:key', isLoggedIn, async function (req, res) {
    let isStatus = null;
    let key = req.params.key;
    let clientId = req.body.clientId;

    await dbRun(`UPDATE playlist SET subscribe = subscribe || ? WHERE key = ?`, ["|:|" + clientId, key]).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else isStatus = normalStatus();
    });

    return res.status(200).json(isStatus);
});

// 공유된 플레이리스트 삭제
router.post('/remove/:key', isLoggedIn, async function (req, res) {
    let isStatus = null;
    let key = req.params.key;
    let clientId = req.body.clientId;

    let subscribe;
    await dbGet(`SELECT * FROM playlist WHERE key = ? AND subscribe LIKE ?`, [key, "%|:|" + clientId + "%"]).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            subscribe = resolve.result['subscribe'];
        } else isStatus = wrongStatus;
    });

    if (isStatus) return res.status(200).json(isStatus);

    await dbRun(`UPDATE playlist SET subscribe = ? WHERE key = ?`, [subscribe.replace(`|:|${clientId}`, ''), key]).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else isStatus = normalStatus();
    });

    return res.status(200).json(isStatus);
});

module.exports = router;
