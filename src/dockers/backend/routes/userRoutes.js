const fastify = require('fastify');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const { config, verifyTempToken, generateAccessToken, generateRefreshToken, middleware: authMiddleware } = require('../auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const emailService = require('../emailService');


// Creamos el router de Fastify (usando el plugin system)
async function userRoutes(fastify, options) {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const dbPath = path.join(__dirname, '..', 'data', 'sqlite.db');
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err.message);
        } else {
            console.log('Conectado a la base de datos SQLite');
            db.serialize(); // <--- Añadido serialize() aquí
        }
    });

    const initSQL = fs.readFileSync(path.join(__dirname, '..', 'tools', 'init.sql'), 'utf-8');
    db.exec(initSQL, (err) => {
        if (err) {
            console.error('Error al inicializar la base de datos:', err.message);
        } else {
            console.log('Base de datos inicializada correctamente');
        }
    });


    // GET /users
    fastify.get('/users', {
  schema: {
    description: 'Obtiene todos los usuarios registrados en la base de datos.',
    tags: ['Users'],
    response: {
      200: {
        description: 'Lista de usuarios',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
            is_verified: { type: 'boolean' },
            two_factor_enabled: { type: 'boolean' },
            two_factor_secret: { type: 'string', nullable: true }
          }
        }
      },
      500: {
        description: 'Error del servidor al consultar la base de datos',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, (request, reply) => {
        db.all('SELECT * FROM users', [], (err, rows) => {
            if (err) {
                console.error('Error al consultar la tabla users:', err.message);
                reply.status(500).send('Error al consultar la tabla users');
                return;
            }
            reply.send(rows);
        });
    });

    // GET /protected-test


}


module.exports = userRoutes;