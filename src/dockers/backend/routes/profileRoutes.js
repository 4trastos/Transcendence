const fastify = require('fastify');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function profileRoutes(fastify, options) {

    const dbPath = path.join(__dirname, '..', 'data', 'sqlite.db')
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

    fastify.get('/profile/:id', {
        schema: {
            summary: 'Obtener los datos de perfil de un usuario',
            description: 'Devuelve todos los datos neccesarios para montar el perfil del usuario en el front',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer', description: 'ID del usuario' }
                },
                required: ['id']
            },
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
                                bio: { type: 'string' }
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
        const userId = parseInt(request.params.id)

        if (isNaN(userId)){
            return reply.code(400).send({status: 'error', message: 'ID invalido'})
        }

        const query = `
            SELECT * FROM users
            WHERE id = ?
        `;

        return new Promise((resolve, reject) => {
            db.all(query, [userId], (err, rows) => {
                if (err) {
                    console.error('Error al consultar la base de datos:', err.message)
                    reply.code(500).send({ status: 'error', message: 'Error interno del servidor' })
                    return reject(err)
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
                    bio: user.bio
                }

                reply.code(200).send({status: 'ok', data: userData})
                resolve()
            })
        })
    })

    fastify.put('/profile/:id', {
        schema: {
          summary: 'Actualizar el perfil de un usuario',
          description: 'Actualiza los datos del perfil del usuario',
          params: {
            type: 'object',
            properties: {
              id: { type: 'integer', description: 'ID del usuario' }
            },
            required: ['id']
          },
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
        const userId = parseInt(request.params.id)
      
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
        })
      })      
}

module.exports = profileRoutes;