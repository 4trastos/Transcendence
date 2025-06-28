

export default class ProfileController {

	db;
	constructor(db) {
		this.db = db;
		this.findProfileById = this.findProfileById.bind(this);
		this.addFriend = this.addFriend.bind(this);
		this.removeFriend = this.removeFriend.bind(this);
	}
	async findProfileById(req, reply) {
		const username = req.params.username;

        if (!username){
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
            WHERE u.username = ?
        `;

		return new Promise((resolve, reject) => {
            this.db.all(query, [username], (err, rows) => {
                if (err) {
                    console.error('Error al consultar la base de datos:', err.message)
                    reply.code(500).send({ status: 'error', message: 'Error interno del servidor' })
                    return reject(err)
                }
				if (!rows || rows.length === 0) {
					reply.code(404).send({ status: 'error', message: 'Usuario no encontrado' })
					return resolve()
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
                }
                for (const row of rows) {
                  if (row.contact_id)
                    userData.contacts.push(row.contact_id)
                }

                reply.code(200).send({status: 'ok', data: userData})
                resolve()
            })
        })
	} 

	async removeFriend(req, reply) {
		const decoded = await req.jwtVerify(); // Usuario autenticado
		const currentUser = parseInt(decoded.id);
		const friendUsername = req.params.username; // asumiendo que lo pasas en la URL

		// Consulta para obtener el ID del amigo (por username)
		const queryGetFriendId = `SELECT id FROM users WHERE username = ?`;

		// Consulta para insertar la relación
		const queryDeleteFriend = `
		DELETE FROM user_relationships
		WHERE (user_id = ? AND related_user_id = ?)
     OR (user_id = ? AND related_user_id = ?);
		`;


		return new Promise((resolve, reject) => {
			this.db.get(queryGetFriendId, [friendUsername], (err, friendRow) => {
				if (err) {
					console.error('Error al consultar el usuario amigo:', err.message);
					return reply.code(500).send({ status: 'error', message: 'Error interno del servidor' });
				}
				if (!friendRow) {
					return reply.code(404).send({ status: 'error', message: 'Usuario no encontrado: ' + queryGetFriendId });
				}

				// Verificamos que no exista ya la relación
				const queryCheckExists = `
					SELECT 1 FROM user_relationships
					WHERE (user_id = ? AND related_user_id = ? ) OR (user_id = ? AND related_user_id = ? ) AND relationship_type = 'friend'
				`;

				this.db.get(queryCheckExists, [currentUser, friendRow.id], (err, existsRow) => {
					if (err) {
						console.error('Error al verificar relación existente:', err.message);
						return reply.code(500).send({ status: 'error', message: 'Error interno del servidor' });
					}
					if (!existsRow) {
						return reply.code(409).send({ status: 'error', message: 'No son amigos' });
					}

					this.db.run(queryDeleteFriend, [currentUser, friendRow.id,friendRow.id ,currentUser], function (err) {
						if (err) {
							console.error('Error al borrar la relación:', err.message);
							return reply.code(500).send({ status: 'error', message: 'Error interno del servidor' });
						}
						if (this.changes === 0) {
							return reply.code(404).send({ status: 'error', message: 'Relación no encontrada' });
						}
						reply.code(200).send({ status: 'ok', message: 'Relación eliminada correctamente' });
						resolve();
					});
				});
			});
		});
	

	}
	async addFriend(req, reply) {
		const decoded = await req.jwtVerify(); // Usuario autenticado
		const currentUser = parseInt(decoded.id);
		const friendUsername = req.params.username; // asumiendo que lo pasas en la URL

		// Consulta para obtener el ID del amigo (por username)
		const queryGetFriendId = `SELECT id FROM users WHERE username = ?`;

		// Consulta para insertar la relación
		const queryInsertFriend = `
		INSERT INTO user_relationships (user_id, related_user_id, relationship_type)
		VALUES (?, ?, 'friend'), (?, ?, 'friend');
		`;

		return new Promise((resolve, reject) => {
			this.db.get(queryGetFriendId, [friendUsername], (err, friendRow) => {
				if (err) {
					console.error('Error al consultar el usuario amigo:', err.message);
					return reply.code(500).send({ status: 'error', message: 'Error interno del servidor' });
				}
				if (!friendRow) {
					return reply.code(404).send({ status: 'error', message: 'Usuario no encontrado: ' + friendUsername });
				}

				// Verificamos que no exista ya la relación
				const queryCheckExists = `
					SELECT 1 FROM user_relationships
					WHERE user_id = ? AND related_user_id = ? AND relationship_type = 'friend'
				`;

				this.db.get(queryCheckExists, [currentUser, friendRow.id], (err, existsRow) => {
					if (err) {
						console.error('Error al verificar relación existente:', err.message);
						return reply.code(500).send({ status: 'error', message: 'Error interno del servidor' });
					}
					if (existsRow) {
						return reply.code(409).send({ status: 'error', message: 'Ya son amigos' });
					}

					// Insertamos la relación
					this.db.run(queryInsertFriend, [currentUser, friendRow.id,friendRow.id, currentUser], function (err) {
						if (err) {
							console.error('Error al insertar la relación:', err.message);
							return reply.code(500).send({ status: 'error', message: 'Error al conectar con el usuario' });
						}
						reply.code(201).send({ status: 'ok', message: 'Usuario agregado como amigo' });
						resolve();
					});
				});
			});
		});
	

	}
}