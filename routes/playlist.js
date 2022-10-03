const express = require('express');
const router = express.Router();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/database/playlist.db');

function dbAll(query) {
    return new Promise(function (resolve) {
        db.all(query, [], (err, rows) => {
            if (err) resolve({'err': err});
            else resolve({'err': err, 'result': rows});
        });
    });
}

function dbRun(query) {
    return new Promise(function (resolve) {
        db.run(query, (err) => {
            resolve({'err': err});
        });
    });
}

function dbGet(query) {
    return new Promise(function (resolve) {
        db.get(query, (err, row) => {
            if (err) resolve({'err': err});
            else resolve({'err': err, 'result': row});
        });
    });
}

function arrToStr(arr) {
    let str = '';
    for (let num = 0; num < arr.length; num++) {
        str += arr[num];
        if (num !== arr.length - 1) str += '|:|';
    }

    return str
}

function createKey(key) {
    for (let num = 0; num < 3; num++) {
        let type = Math.floor(Math.random() * 10) % 3;
        if (type === 0) {
            key += String.fromCharCode(Math.floor(Math.random() * (57 - 48 + 1)) + 48);
        } else if (type === 1) {
            key += String.fromCharCode(Math.floor(Math.random() * (90 - 65 + 1)) + 65);
        } else if (type === 2) {
            key += String.fromCharCode(Math.floor(Math.random() * (122 - 97 + 1)) + 97);
        }
    }

    return key;
}

function normalStatus(data = {}) {
    let result = {'status': 200};
    let keys = Object.keys(data);
    for (let num = 0; num < keys.length; num++) {
        result[keys[num]] = data[keys[num]]
    }

    return result;
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) next();
    else res.sendStatus(403);
}

const wrongStatus = {'status': 400};
const errorStatus = {'status': 404};

// 플레이리스트 생성 API
router.post('/create', isLoggedIn, async function (req, res) {
    let isStatus = null;
    let title = req.body.title;
    let creator = req.body.creator;
    let platform = req.body.platform;
    let image = req.body.image;
    let songList = arrToStr(req.body.songlist);
    let isPublic = req.body.public;
    let clientId = req.body.clientId;

    await dbAll(`SELECT key FROM playlist where clientId='${clientId}'`).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            let duplicateCheck = [false];
            resolve.result.forEach((row) => {
                duplicateCheck.push(row.key);
            });

            while (true) {
                let key = createKey(clientId);
                // noinspection JSCheckFunctionSignatures
                if (duplicateCheck.includes(key)) duplicateCheck[0] = true
                if (duplicateCheck[0] === false) break;
            }
        }
    });

    if (isStatus) return res.status(200).json(isStatus);

    await dbRun(`INSERT INTO playlist VALUES ('${key}', '${title}', '${creator}', '${platform}', '${image}', '${songList}', '${isPublic}', '${clientId}', '${clientId}')`).then((resolve) => {
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
    await dbAll(`SELECT key, title, creator, platform, image FROM playlist WHERE subscribe LIKE '%${clientId}%'`).then((resolve) => {
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
                'creator': playlistArray[num]['creator'],
                'platform': playlistArray[num]['platform'],
                'image': playlistArray[num]['image']
            });
        }
    }

    return res.status(200).json(normalStatus({'playlist': playlist}));
});

// 플레이리스트 상세 조회 API
router.get('/detail/:key/:clientId', async function (req, res) {
    let isStatus = null;
    let key = req.params.key;
    let clientId = req.params.clientId;

    await dbGet(`SELECT * FROM playlist WHERE key='${key}'`).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            isStatus = normalStatus({
                'title': resolve.result['title'],
                'creator': resolve.result['creator'],
                'platform': resolve.result['platform'],
                'image': resolve.result['image'],
                'public': resolve.result['public'],
                'clientId': resolve.result['clientId'],
                'songlist': resolve.result['songlist'].split('|:|'),
                'subscribe': resolve.result['subscribe'].split('|:|')
            });
        } else {
            isStatus = wrongStatus;
        }
    });

    if (isStatus && isStatus.public === "false" && (!req.isAuthenticated() || clientId !== isStatus.clientId))
        return res.sendStatus(403);

    return res.status(200).json(isStatus);
});

// 플레이리스트 수정 API
router.post('/edit/:key', isLoggedIn, async function (req, res) {
    let isStatus = null;
    let key = req.params.key;
    let title = req.body.title;
    let image = req.body.image;
    let songList = arrToStr(req.body.songlist);
    let isPublic = req.body.public;
    let clientId = req.body.clientId;

    await dbGet(`SELECT * FROM playlist WHERE key='${key}'`).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            if (resolve.result['clientId'] !== clientId) isStatus = wrongStatus;
        } else return isStatus = wrongStatus;
    });

    if (isStatus) return res.status(200).json(isStatus);

    await dbRun(`UPDATE playlist SET title = '${title}', image = '${image}', songlist = '${songList}', public = '${isPublic}' WHERE key = '${key}'`).then((resolve) => {
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

    await dbGet(`SELECT * FROM playlist WHERE key='${key}'`).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            if (resolve.result['clientId'] !== clientId) isStatus = wrongStatus;
        } else isStatus = wrongStatus;
    });

    if (isStatus) return res.status(200).json(isStatus);

    await dbRun(`DELETE FROM playlist WHERE key = '${key}'`).then((resolve) => {
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

    await dbRun(`UPDATE playlist SET subscribe = subscribe || '|:|${clientId}' WHERE key = '${key}'`).then((resolve) => {
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
    await dbGet(`SELECT * FROM playlist WHERE key = '${key}' AND subscribe LIKE '%|:|${clientId}%'`).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else if (resolve.result) {
            subscribe = resolve.result['subscribe'];
        } else isStatus = wrongStatus;
    });

    if (isStatus) return res.status(200).json(isStatus);

    await dbRun(`UPDATE playlist SET subscribe = '${subscribe.replace(`|:|${clientId}`, '')}' WHERE key = '${key}'`).then((resolve) => {
        if (resolve.err) isStatus = errorStatus;
        else isStatus = normalStatus();
    });

    return res.status(200).json(isStatus);
});

module.exports = router;
