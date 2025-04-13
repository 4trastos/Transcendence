const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'sqlite.db');

if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath, 
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX, 
    (err) => {
      if (err) {
        console.error('Error al conectar a SQLite:', err);
      } else {
        console.log('Conectado a SQLite con modo FULLMUTEX');
        // Configuración optimizada
        db.exec('PRAGMA journal_mode = WAL;');
        db.exec('PRAGMA busy_timeout = 10000;'); // 10 segundos de timeout
        db.exec('PRAGMA synchronous = NORMAL;');
        db.exec('PRAGMA wal_autocheckpoint = 100;');
      }
    }
  );

const executeWithRetry = async (fn, maxRetries = 5, delay = 200) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (error.code === 'SQLITE_BUSY') {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

const runQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) {
                console.error('Error en runQuery:', err);
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};

async function withTransaction(callback) {
    await this.beginTransaction();
    try {
        const result = await callback();
        await this.commit();
        return result;
    } catch (error) {
        try {
            await this.rollback();
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        throw error;
    }
}

module.exports = {
    db,
    run: (query, params) => executeWithRetry(() => runQuery(query, params)),
    get: (query, params) => executeWithRetry(() => new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    })),
    all: (query, params) => executeWithRetry(() => new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    })),
    exec: (sql) => executeWithRetry(() => new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    })),
    beginTransaction: () => new Promise((resolve, reject) => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    }),
    commit: () => new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    }),
    rollback: () => new Promise((resolve, reject) => {
        db.run('ROLLBACK', (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    }),
    withTransaction // Añadido al module.exports
};