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
            hasFriend: { type: 'boolean' },
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
          SELECT DISTINCT
              u.id AS id,
              u.username AS username,
              u.full_name AS full_name,
              u.email AS email,
              u.avatar_url AS avatar,
              CASE 
                  WHEN 
                      (ur.user_id = ? OR ur.related_user_id = ?)
                      AND ur.relationship_type = 'friend'
                  THEN 1
                  ELSE 0
              END AS hasFriend
          FROM 
              users u
          LEFT JOIN 
              user_relationships ur 
              ON ur.user_id = u.id OR ur.related_user_id = u.id
          WHERE
            u.id != ?
          `, [decoded.id, decoded.id, decoded.id], (err, rows) => {
            if (err) {
              reject(new Error('Error al consultar la tabla users: ' + err.message));
              return;
            }
            resolve(rows);
          });
      });


      const mappedUsers = rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        hasFriend: user.hasFriend === 1,
      }));
      reply.send(mappedUsers);
    } catch (err) {
      console.error('Error:', err.message);
      reply.status(500).send({ error: 'Internal Server Error', message: err.message });

    }


  });
  fastify.delete('/users/me', async (request, reply) => {
    const decoded = await request.jwtVerify();
    
    const userId = decoded.id;

    if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    console.log("→ Intentando borrar usuario con ID:", userId);

    const dbPath = '/var/lib/sqlite/sqlite.db';
    const db = new sqlite3.Database(dbPath);

    db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
        if (err) {
            console.error('→ Error al eliminar usuario:', err.message);
            db.close();
            return reply.status(500).send({ success: false, error: 'Database error' });
        }

        console.log("→ Cambios realizados en la base:", this.changes);

        if (this.changes === 0) {
            db.close();
            return reply.status(404).send({ success: false, error: 'User not found' });
        }

        console.log(`→ Usuario con ID ${userId} eliminado`);
        db.close();  // ✅ cerrar solo aquí

        return reply
            .clearCookie("token", {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                secure: false
            })
            .send({ success: true, message: 'User deleted successfully' });
    });
});

}

