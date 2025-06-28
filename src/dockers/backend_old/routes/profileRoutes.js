import { pipeline } from 'node:stream/promises';
import fs from "fs";
import path from "path";
import sqlite3Module from "sqlite3";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import ProfileController from '../controllers/ProfileController.js';

const sqlite3 = sqlite3Module.verbose();


export async function profileRoutes(fastify, options) {

  const dbPath = '/var/lib/sqlite/sqlite.db';
  const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err.message)
        } else {
            console.log('Conectado a la base de datos SQLite')
        }
    })

    /**
     * Ejecutar el script de inicialización de la base de datos desde tools/init.sql
     */
    const initSQL = fs.readFileSync(path.join(__dirname, '..', 'tools', 'init.sql'), 'utf-8');
    db.exec(initSQL, (err) => {
        if (err) {
            console.error('Error al inicializar la base de datos:', err.message)
        } else {
            console.log('Base de datos inicializada correctamente')
        }
    })

    const profileController = new ProfileController(db);

    fastify.post('/friends/:username', profileController.addFriend);
    fastify.delete('/friends/:username', profileController.removeFriend);

    fastify.get('/profile', {
        schema: {
            summary: 'Obtener los datos de perfil de un usuario',
            description: 'Devuelve todos los datos neccesarios para montar el perfil del usuario en el front',
            response: {
                200: {
                    description: 'Datos del usuario',
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'ok' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                username: { type: 'string' },
                                email: { type: 'string' },
                                full_name: { type: 'string' },
                                last_name: { type: 'string' },
                                favourite_color: { type: 'string' },
                                pfp: { type: 'string' },
                                country: { type: 'string' },
                                bio: { type: 'string' },
                                contacts: {
                                  type: 'array',
                                  items: { type: 'string' },
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'ID inválido',
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    description: 'Error del servidor',
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    },async (request, reply) => {
        const decoded = await request.jwtVerify();
        const id = parseInt(decoded.id);
        console.log(decoded);

        if (isNaN(id)){
            return reply.code(400).send({status: 'error', message: 'ID invalido'})
        }

        const query = `
            SELECT 
              u.*, 
              ur.related_user_id AS friend_id, 
              u2.username AS friend_username, 
              u2.id AS friend_user_id
            FROM users u
            LEFT JOIN user_relationships ur 
              ON u.id = ur.user_id AND ur.relationship_type = 'friend'
            LEFT JOIN users u2 
              ON ur.related_user_id = u2.id
            WHERE u.id = ?
        `;

        return new Promise((resolve, reject) => {
            db.all(query, [id], (err, rows) => {
                if (err) {
                    console.error('Error al consultar la base de datos:', err.message)
                    reply.code(500).send({ status: 'error', message: 'Error interno del servidor' })
                    return reject(err)
                }
                if (!rows || rows.length === 0) {
                  return reply.code(404).send({ status: 'error', message: 'Usuario no encontrado o sin amigos' });
                }
                const user = rows[0]

                const userData = {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  full_name: user.full_name,
                  last_name: user.last_name,
                  favourite_color: user.favourite_color,
                  pfp: user.avatar_url,
                  country: user.country,
                  bio: user.bio,
                  contacts: []
                };
          
                for (const row of rows) {
                  if (row.friend_user_id) {
                    userData.contacts.push({
                      username: row.friend_username
                    });
                  }
                }

                reply.code(200).send({status: 'ok', data: userData})
                resolve()
            })
        })
    })

    fastify.put('/profile', {
        schema: {
          summary: 'Actualizar el perfil de un usuario',
          description: 'Actualiza los datos del perfil del usuario',
          body: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              email: { type: 'string'},
              full_name: { type: 'string' },
              last_name: { type: 'string' },
              favourite_color: { type: 'string' },
              country: { type: 'string' },
              bio: { type: 'string' },
              avatar_url: { type: 'string' }
            },
            additionalProperties: false
          },
          response: {
            200: {
              description: 'Usuario actualizado',
              type: 'object',
              properties: {
                status: { type: 'string' },
                message: { type: 'string' }
              }
            },
            400: {
              description: 'Error de validación',
              type: 'object',
              properties: {
                status: { type: 'string' },
                message: { type: 'string' }
              }
            },
            500: {
              description: 'Error del servidor',
              type: 'object',
              properties: {
                status: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }, async (request, reply) => {
        const decoded = await request.jwtVerify();

        const userId = parseInt(decoded.id)
      
        if (isNaN(userId)) {
          return reply.code(400).send({ status: 'error', message: 'ID inválido' })
        }
      
        const fields = request.body
      
        if (Object.keys(fields).length === 0) {
          return reply.code(400).send({ status: 'error', message: 'No se enviaron campos para actualizar' })
        }
      
        const allowedFields = [
          'username', 'email', 'full_name', 'last_name',
          'favourite_color', 'country', 'bio', 'avatar_url'
        ];
      
        const updates = []
        const values = []
      
        for (const key of allowedFields) {
          if (fields[key] !== undefined) {
            updates.push(`${key} = ?`)
            values.push(fields[key])
          }
        }
      
        if (updates.length === 0) {
          return reply.code(400).send({ status: 'error', message: 'Campos no válidos para actualizar' })
        }
      
        updates.push(`updated_at = CURRENT_TIMESTAMP`)
      
        const query = `
          UPDATE users
          SET ${updates.join(', ')}
          WHERE id = ?
        `
      
        values.push(userId)
      
        return new Promise((resolve, reject) => {
          db.run(query, values, function (err) {
            if (err) {
              console.error('Error al actualizar usuario:', err.message)
              reply.code(500).send({ status: 'error', message: 'Error interno del servidor' })
              return reject(err)
            }
      
            if (this.changes === 0) {
              reply.code(404).send({ status: 'error', message: 'Usuario no encontrado' })
              return resolve()
            }
      
            reply.code(200).send({ status: 'ok', message: 'Usuario actualizado correctamente' })
            resolve();
          })
        });
      })      

    fastify.post('/upload-avatar', async (request, reply) => {
      const data = await request.file();
      const decoded = await request.jwtVerify();
      
      const userId = parseInt(decoded.id)
      
      // Aquí procesas la imagen subida
      const filename = data.filename;
      const uploadDir = path.join(__dirname,'..', 'uploads');

      await fs.promises.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
        const query = `
          UPDATE users
          SET avatar_url = ?
          WHERE id = ?
        `

      // Ejemplo de guardar el archivo en disco (no recomendado para producción):
      if (data.file) {
        await pipeline(data.file, fs.createWriteStream(filePath))
          new Promise((resolve, reject) => {//Puede no ser reactiva
            db.run(query, [`http://localhost:3000/uploads/${filename}`,userId], function (err) {
              if (err) {
                console.error('Error al actualizar usuario:', err.message)
                reply.code(500).send({ status: 'error', message: 'Error interno del servidor' })
                return reject(err)
              }
        
              if (this.changes === 0) {
                reply.code(404).send({ status: 'error', message: 'Usuario no encontrado' })
                return resolve()
              }
        
              reply.code(200).send({ status: 'ok', message: 'Usuario actualizado correctamente' })
              resolve();
            })
          });
          reply.send({ message: 'Imagen subida con éxito', url: "/uploads/" + filename });
      } else {
          reply.status(400).send({ message: 'No se subió ningún archivo' });
      }
    });
}
