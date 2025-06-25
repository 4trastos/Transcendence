import crypto from 'crypto'; 

// Creamos el router de Fastify (usando el plugin system)
export async function userRoutes(fastify, options) { 
    // Accede a la instancia de la base de datos a través de fastify.db
    const db = fastify.db; 

    // Helper para enviar errores
    const sendError = (reply, status, message, details = {}) => {
        console.error(`UserRoutes Error [${status}]:`, message, details);
        return reply.status(status).send({ status: 'error', message: message, ...details });
    };

    // GET /users (Ruta protegida)
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
                            is_verified: { type: 'boolean' },
                            two_factor_enabled: { type: 'boolean' },
                            full_name: { type: 'string', nullable: true },
                            last_name: { type: 'string', nullable: true },
                            favourite_color: { type: 'string', nullable: true },
                            bio: { type: 'string', nullable: true },
                            country: { type: 'string', nullable: true },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time', nullable: true },
                            avatar_url: { type: 'string', nullable: true },
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
            },
            security: [{ bearerAuth: [] }], 
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
        try {
            // Seleccionar solo los campos seguros para devolver
            const rows = await db.all('SELECT id, username, email, is_verified, two_factor_enabled, full_name, last_name, favourite_color, bio, country, created_at, updated_at, avatar_url FROM users', []);
            reply.send(rows);
        } catch (err) {
            console.error('Error al consultar la tabla users:', err.message);
            sendError(reply, 500, 'Error al consultar la tabla users', { details: err.message });
        }
    });

    // GET /users/:id (Ruta protegida)
    fastify.get('/users/:id', {
        schema: {
            description: 'Obtiene un usuario por su ID.',
            tags: ['Users'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'integer', description: 'ID del usuario' }
                }
            },
            response: {
                200: {
                    description: 'Detalles del usuario',
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        is_verified: { type: 'boolean' },
                        two_factor_enabled: { type: 'boolean' },
                        full_name: { type: 'string', nullable: true },
                        last_name: { type: 'string', nullable: true },
                        favourite_color: { type: 'string', nullable: true },
                        bio: { type: 'string', nullable: true },
                        country: { type: 'string', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time', nullable: true },
                        avatar_url: { type: 'string', nullable: true },
                    }
                },
                404: {
                    description: 'Usuario no encontrado',
                    type: 'object',
                    properties: { error: { type: 'string' } }
                },
                500: {
                    description: 'Error del servidor',
                    type: 'object',
                    properties: { error: { type: 'string' } }
                }
            },
            security: [{ bearerAuth: [] }], 
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
        const { id } = request.params;
        try {
            const user = await db.get(
                `SELECT id, username, email, is_verified, two_factor_enabled, full_name, last_name, favourite_color, bio, country, created_at, updated_at, avatar_url 
                 FROM users WHERE id = ?`, 
                [id]
            );
            if (!user) {
                return sendError(reply, 404, 'Usuario no encontrado');
            }
            reply.send(user);
        } catch (err) {
            console.error(`Error al obtener usuario con ID ${id}:`, err.message);
            sendError(reply, 500, 'Error al obtener usuario', { details: err.message });
        }
    });

    // PUT /users/:id (Actualizar usuario - Ruta protegida)
    fastify.put('/users/:id', {
        schema: {
            description: 'Actualiza la información de un usuario por su ID.',
            tags: ['Users'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'integer', description: 'ID del usuario a actualizar' }
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
                minProperties: 1, 
            },
            response: {
                200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
                400: { type: 'object', properties: { error: { type: 'string' }, details: { type: 'string' } } },
                404: { type: 'object', properties: { error: { type: 'string' } } },
                409: { type: 'object', properties: { error: { type: 'string' }, solution: { type: 'string' } } },
                500: { type: 'object', properties: { error: { type: 'string' }, details: { type: 'string' } } },
            },
            security: [{ bearerAuth: [] }], 
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
                // Opcional: Asegurarse de que el usuario solo puede actualizar su propio perfil
                if (request.user.id !== parseInt(request.params.id)) {
                    reply.status(403).send({ status: 'error', message: 'No tiene permiso para actualizar este perfil.' });
                    throw new Error('Forbidden');
                }
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err;
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const updates = request.body;
        
        if (Object.keys(updates).length === 0) {
            return sendError(reply, 400, 'No se proporcionaron datos para actualizar.');
        }

        try {
            const existingUser = await db.get('SELECT id FROM users WHERE id = ?', [id]);
            if (!existingUser) {
                return sendError(reply, 404, 'Usuario no encontrado para actualizar.');
            }

            const setClauses = [];
            const params = [];
            const restrictedFields = ['password', 'two_factor_secret', 'is_verified', 'created_at'];

            for (const key in updates) {
                if (updates[key] !== undefined && !restrictedFields.includes(key)) {
                    setClauses.push(`${key} = ?`);
                    params.push(updates[key]);
                } else if (restrictedFields.includes(key)) {
                    console.warn(`Intento de actualizar campo restringido: ${key}. Ignorando.`);
                }
            }

            if (setClauses.length === 0) {
                return sendError(reply, 400, 'No se proporcionaron campos válidos para actualizar.');
            }

            params.push(new Date().toISOString()); 
            params.push(id); 

            const query = `UPDATE users SET ${setClauses.join(', ')}, updated_at = ? WHERE id = ?`;
            const result = await db.run(query, params);

            if (result.changes === 0) {
                return sendError(reply, 500, 'Fallo al actualizar el usuario (ningún cambio realizado).');
            }

            reply.send({ success: true, message: 'Usuario actualizado correctamente.' });

        } catch (err) {
            console.error(`Error al actualizar usuario con ID ${id}:`, err.message, err.stack);
            if (err.message && err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
                return sendError(reply, 409, 'El email o nombre de usuario ya está en uso.', { solution: 'Por favor, elija un email o nombre de usuario diferente.' });
            }
            sendError(reply, 500, 'Error al actualizar usuario', { details: err.message });
        }
    });

    // DELETE /users/:id (Ruta protegida)
    fastify.delete('/users/:id', {
        schema: {
            description: 'Elimina un usuario por su ID.',
            tags: ['Users'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'integer', description: 'ID del usuario a eliminar' }
                }
            },
            response: {
                200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
                404: { type: 'object', properties: { error: { type: 'string' } } },
                500: { type: 'object', properties: { error: { type: 'string' } } },
            },
            security: [{ bearerAuth: [] }], 
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
                // Opcional: Asegurarse de que el usuario solo puede eliminar su propio perfil (o si es admin)
                if (request.user.id !== parseInt(request.params.id)) {
                    reply.status(403).send({ status: 'error', message: 'No tiene permiso para eliminar esta cuenta.' });
                    throw new Error('Forbidden');
                }
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err;
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
            
            if (result.changes === 0) {
                return sendError(reply, 404, 'Usuario no encontrado para eliminar.');
            }

            reply.send({ success: true, message: 'Usuario eliminado correctamente.' });
        } catch (err) {
            console.error(`Error al eliminar usuario con ID ${id}:`, err.message);
            sendError(reply, 500, 'Error al eliminar usuario', { details: err.message });
        }
    });
}
