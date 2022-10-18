const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/database/charts.db');

class SQL {
    all(query) {
        return new Promise(function (resolve, reject) {
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    run(query) {
        return new Promise(function (resolve, reject) {
            db.run(query, (err) => {
                if (err) reject(err);
            });
        });
    }

    get(query, params) {
        return new Promise(function (resolve, reject) {
            db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
}

module.exports = SQL;