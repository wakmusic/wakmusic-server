const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/database/waklon.db');

router.get('/', (req, res) => {
    res.sendStatus(200);
});

router.get('/search/id/:id', (req, res) => {
    db.get(`SELECT * FROM template WHERE id = "${req.params.id}"`, (err, rows) => {
        res.json(rows);
    });
});

router.get('/search/ids/:id', (req, res) => {
    let ids = req.params.id.split(',').join('","');
    db.all(`SELECT * FROM template WHERE id IN ("${ids}")`, (err, rows) => {
        res.json(rows);
    });
});

router.get('/search/keyword/', (req, res) => {
    res.json([]);
});

router.get('/search/keyword/:value', (req, res) => {
    let value = req.params.value
    db.all(`SELECT * FROM template WHERE title LIKE "%${value}%" OR artist LIKE "%${value}%"`, (err, rows) => {
        res.json(rows);
    });
});

router.get('/search/tags/:value', (req, res) => {
    let value = req.params.value
    if (value === "all") {
        db.all(`SELECT * FROM template ORDER BY date DESC`, (err, rows) => {
            res.json(rows);
        });
    } else {
        db.all(`SELECT * FROM template WHERE tags LIKE "%${value}%" ORDER BY date DESC`, (err, rows) => {
            res.json(rows);
        });
    }
});

router.get('/new/:limit', (req, res) => {
    db.all('SELECT * FROM template ORDER BY date DESC', (err, rows) => {
        return res.json(rows.slice(undefined, req.params.limit === "undefined" ? undefined : req.params.limit));
    });
});

router.get('/update/:type', (req, res) => {
    db.get(`SELECT * FROM updated WHERE type = "${req.params.type}"`, (err, rows) => {
        return res.json(rows.time);
    });
});

router.get('/hourly/:limit', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'" +
        " UNION ALL SELECT name FROM sqlite_temp_master WHERE type IN ('table', 'view') ORDER BY 1;", (err, rows) => {
        let table = 0;
        rows.map((r) => {
            let convert = r.name.replace('hourly', '');
            if (r.name.includes('hourly') && table < parseInt(convert)) table = convert;
        });

        db.all(`SELECT * FROM hourly${table} ORDER BY increase DESC`, (err, rows) => {
            return res.json(rows.slice(undefined, req.params.limit));
        })
    })
})

router.get('/daily/:limit', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'" +
        " UNION ALL SELECT name FROM sqlite_temp_master WHERE type IN ('table', 'view') ORDER BY 1;", (err, rows) => {
        let table = 0;
        rows.map((r) => {
            let convert = r.name.replace('daily', '');
            if (r.name.includes('daily') && table < parseInt(convert)) table = convert;
        });

        db.all(`SELECT * FROM daily${table} ORDER BY increase DESC`, (err, rows) => {
            return res.json(rows.slice(undefined, req.params.limit));
        })
    })
})

router.get('/weekly/:limit', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'" +
        " UNION ALL SELECT name FROM sqlite_temp_master WHERE type IN ('table', 'view') ORDER BY 1;", (err, rows) => {
        let table = 0;
        rows.map((r) => {
            let convert = r.name.replace('weekly', '');
            if (r.name.includes('weekly') && table < parseInt(convert)) table = convert;
        });

        db.all(`SELECT * FROM weekly${table} ORDER BY increase DESC`, (err, rows) => {
            return res.json(rows.slice(undefined, req.params.limit));
        })
    })
})

router.get('/monthly/:limit', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'" +
        " UNION ALL SELECT name FROM sqlite_temp_master WHERE type IN ('table', 'view') ORDER BY 1;", (err, rows) => {
        let table = 0;
        rows.map((r) => {
            let convert = r.name.replace('monthly', '');
            if (r.name.includes('monthly') && table < parseInt(convert)) table = convert;
        });

        db.all(`SELECT * FROM monthly${table} ORDER BY increase DESC`, (err, rows) => {
            return res.json(rows.slice(undefined, req.params.limit));
        })
    })
})

router.get('/total/:limit', (req, res) => {
    db.all('SELECT * FROM total ORDER BY views DESC', (err, rows) => {
        return res.json(rows.slice(undefined, req.params.limit));
    });
});

module.exports = router;
