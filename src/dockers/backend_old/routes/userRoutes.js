import fs from 'fs';
import path from 'path';
import sqlite3Module from 'sqlite3';
import crypto from 'crypto';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlite3 = sqlite3Module.verbose();


// Creamos el router de Fastify (usando el plugin system)
export async function userRoutes(fastify, options) {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const dbPath = '/var/lib/sqlite/sqlite.db';
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
            avatar: { type: 'string' },
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
}, async (request, reply) => {

  try {


      const decoded = await request.jwtVerify();

      const rows = await new Promise((resolve, reject) => {
        db.all(`
          SELECT 
              u.id AS id,
              u.username AS username,
              u.full_name AS full_name,
              u.email AS user_email,
              u.avatar_url AS avatar,
              CASE 
                  WHEN COUNT(*) > 0 THEN 'true'
                  ELSE 'false'
              END AS are_friends
          FROM 
              users u
          LEFT JOIN 
              user_relationships ur ON ur.user_id = u.id OR ur.related_user_id = u.id
          WHERE 
              ur.relationship_type = 'friend'
              AND (ur.user_id = ? OR ur.related_user_id = ?)
          GROUP BY 
              u.id;
          `, [decoded.id, decoded.id], (err, rows) => {
            if (err) {
              reject(new Error('Error al consultar la tabla users: ' + err.message));
              return;
            }
            resolve(rows);
          });
      });
      reply.send(rows);
    } catch (err) {
      console.error('Error:', err.message);
      reply.status(500).send({ error: 'Internal Server Error', message: err.message });

    }


  });

    // GET /protected-test


}

