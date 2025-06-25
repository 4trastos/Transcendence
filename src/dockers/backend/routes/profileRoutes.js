// Este archivo debe acceder a la base de datos a través de fastify.db,
// que es proporcionado por el sqlitePlugin.

// Creamos el router de Fastify (usando el plugin system)
export async function profileRoutes(fastify, options) { // Asegúrate de que el nombre de la función exportada sea profileRoutes
    // Accede a la instancia de la base de datos a través de fastify.db
    const db = fastify.db; 

    // Helper para enviar errores
    const sendError = (reply, status, message, details = {}) => {
        console.error(`ProfileRoutes Error [${status}]:`, message, details);
        return reply.status(status).send({ status: 'error', message: message, ...details });
    };

    // GET /profile/:userId - Obtener el perfil de un usuario (Ruta protegida)
    fastify.get('/profile/:userId', {
        schema: {
            summary: 'Obtener el perfil de un usuario',
            description: 'Devuelve la información de perfil de un usuario por su ID.',
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'integer', description: 'ID del usuario' }
                }
            },
            response: {
                200: {
                    description: 'Perfil del usuario',
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        full_name: { type: 'string', nullable: true },
                        last_name: { type: 'string', nullable: true },
                        favourite_color: { type: 'string', nullable: true },
                        bio: { type: 'string', nullable: true },
                        country: { type: 'string', nullable: true },
                        avatar_url: { type: 'string', nullable: true },
                        is_verified: { type: 'boolean' },
                        two_factor_enabled: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time', nullable: true }
                    }
                },
                404: {
                    description: 'Usuario no encontrado',
                    type: 'object',
                    properties: { error: { type: 'string' } }
                },
                500: {
                    description: 'Error interno del servidor',
                    type: 'object',
                    properties: { error: { type: 'string' } }
                }
            },
            tags: ['Profile'],
            security: [
                {
                    bearerAuth: [],
                },
            ],
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err;
            }
        }
    }, async (request, reply) => {
        const { userId } = request.params;
        try {
            const user = await db.get(
                `SELECT id, username, email, full_name, last_name, favourite_color, bio, country, avatar_url, is_verified, two_factor_enabled, created_at, updated_at
                 FROM users WHERE id = ?`,
                [userId]
            );

            if (!user) {
                return sendError(reply, 404, 'Usuario no encontrado');
            }
            reply.send(user);
        } catch (err) {
            console.error(`Error al obtener perfil del usuario ${userId}:`, err.message);
            sendError(reply, 500, 'Error interno del servidor al obtener perfil', { details: err.message });
        }
    });

    // PUT /profile/:userId - Actualizar el perfil de un usuario (Ruta protegida)
    fastify.put('/profile/:userId', {
        schema: {
            summary: 'Actualizar la información de perfil de un usuario',
            description: 'Permite actualizar campos específicos del perfil de un usuario por su ID.',
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'integer', description: 'ID del usuario a actualizar' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string', minLength: 3, maxLength: 30, nullable: true },
                    email: { type: 'string', format: 'email', nullable: true },
                    full_name: { type: 'string', nullable: true },
                    last_name: { type: 'string', nullable: true },
                    favourite_color: { type: 'string', nullable: true },
                    bio: { type: 'string', nullable: true },
                    country: { type: 'string', nullable: true },
                    avatar_url: { type: 'string', nullable: true },
                },
                minProperties: 1 
            },
            response: {
                200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
                400: { type: 'object', properties: { error: { type: 'string' }, details: { type: 'string' } } },
                404: { type: 'object', properties: { error: { type: 'string' } } },
                409: { type: 'object', properties: { error: { type: 'string' }, solution: { type: 'string' } } },
                500: { type: 'object', properties: { error: { type: 'string' }, details: { type: 'string' } } }
            },
            tags: ['Profile'],
            security: [
                {
                    bearerAuth: [],
                },
            ],
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
                // Opcional: Asegurarse de que el usuario solo puede actualizar su propio perfil
                if (request.user.id !== parseInt(request.params.userId)) {
                    reply.status(403).send({ status: 'error', message: 'No tiene permiso para actualizar este perfil.' });
                    throw new Error('Forbidden');
                }
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err;
            }
        }
    }, async (request, reply) => {
        const { userId } = request.params;
        const updates = request.body;

        if (Object.keys(updates).length === 0) {
            return sendError(reply, 400, 'No se proporcionaron datos para actualizar.');
        }

        try {
            const existingUser = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
            if (!existingUser) {
                return sendError(reply, 404, 'Usuario no encontrado para actualizar.');
            }

            const setClauses = [];
            const params = [];
            const restrictedFields = ['password', 'two_factor_secret', 'is_verified', 'two_factor_enabled', 'created_at'];

            for (const key in updates) {
                if (updates[key] !== undefined && !restrictedFields.includes(key)) {
                    setClauses.push(`${key} = ?`);
                    params.push(updates[key]);
                } else if (restrictedFields.includes(key)) {
                    console.warn(`Intento de actualizar campo restringido '${key}'. Ignorando.`);
                }
            }

            if (setClauses.length === 0) {
                return sendError(reply, 400, 'No se proporcionaron campos válidos para actualizar.');
            }

            params.push(new Date().toISOString()); 
            params.push(userId); 

            const query = `UPDATE users SET ${setClauses.join(', ')}, updated_at = ? WHERE id = ?`;
            const result = await db.run(query, params);

            if (result.changes === 0) {
                return sendError(reply, 500, 'Fallo al actualizar el perfil (ningún cambio realizado).');
            }

            reply.send({ success: true, message: 'Perfil actualizado correctamente.' });

        } catch (err) {
            console.error(`Error al actualizar perfil del usuario ${userId}:`, err.message);
            if (err.message && err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
                return sendError(reply, 409, 'El email o nombre de usuario ya está en uso.', { solution: 'Por favor, elija un email o nombre de usuario diferente.' });
            }
            sendError(reply, 500, 'Error al actualizar perfil', { details: err.message });
        }
    });

    // DELETE /profile/:userId - Eliminar un perfil de usuario (ej. cuenta) (Ruta protegida)
    fastify.delete('/profile/:userId', {
        schema: {
            summary: 'Eliminar un perfil de usuario',
            description: 'Elimina completamente la cuenta de un usuario por su ID.',
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'integer', description: 'ID del usuario a eliminar' }
                }
            },
            response: {
                200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
                404: { type: 'object', properties: { error: { type: 'string' } } },
                500: { type: 'object', properties: { error: { type: 'string' } } },
            },
            tags: ['Profile'],
            security: [
                {
                    bearerAuth: [],
                },
            ],
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
                // Opcional: Verificar que request.user.id coincide con userId para prevenir eliminación de otras cuentas
                if (request.user.id !== parseInt(request.params.userId)) {
                    reply.status(403).send({ status: 'error', message: 'No tiene permiso para eliminar esta cuenta.' });
                    throw new Error('Forbidden');
                }
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err;
            }
        }
    }, async (request, reply) => {
        const { userId } = request.params;
        try {
            const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);
            
            if (result.changes === 0) {
                return sendError(reply, 404, 'Perfil de usuario no encontrado para eliminar.');
            }

            reply.send({ success: true, message: 'Perfil de usuario eliminado correctamente.' });
        } catch (err) { // CORREGIDO: Eliminado '=>' aquí
            console.error(`Error al eliminar perfil del usuario ${userId}:`, err.message);
            sendError(reply, 500, 'Error al eliminar perfil de usuario', { details: err.message });
        }
    });
}
