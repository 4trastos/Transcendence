import crypto from "crypto";
// Importa SOLO las funciones auxiliares de auth.js y la configuración (como authConfig)
import { generateAccessToken, generateRefreshToken, revokeToken, verifyToken, verifyTempToken, config as authConfig } from "../auth.js"; 
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import {sendVerificationEmail, sendResetPasswordEmail} from "../emailService.js";

// Creamos el router de Fastify (usando el plugin system)
export async function authRoutes(fastify, options) {
    // Accede a la instancia de DB decorada por Fastify.
    const db = fastify.db; 

    // Helper para enviar errores
    const sendError = (reply, status, error, details = {}) => {
      const response = { success: false, error, ...details };
      console.error(`AuthRoutes Error [${status}]:`, response); 
      return reply.status(status).send(response);
    };

    // NOTA IMPORTANTE: fastify.addHook('preHandler', authMiddleware); HA SIDO ELIMINADO DE AQUÍ.
    // CADA RUTA PROTEGIDA DEBE ESPECIFICAR SU PROPIO preHandler CON request.jwtVerify()
    // Las rutas públicas NO DEBEN tener un preHandler de autenticación o usar 'preHandler: undefined'.

    // POST /register (Ruta pública)
    fastify.post(
      "/register",
      {
        schema: {
          body: {
            type: "object",
            required: ["username", "email", "password"],
            properties: {
              username: { type: "string", minLength: 3, maxLength: 30 },
              email: { type: "string", format: "email" },
              password: { type: "string", minLength: 8 },
              enable2FA: { type: "boolean", default: false },
              full_name: { type: "string", nullable: true },
              last_name: { type: "string", nullable: true },
              favourite_color: { type: "string", nullable: true },
              bio: { type: "string", nullable: true },
              country: { type: "string", nullable: true },
            },
          },
          response: {
            201: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                userId: { type: ["integer", "string"] },
                qrCode: {
                  type: "string",
                  nullable: true,
                  description: "QR code en base64 para configurar 2FA",
                },
                requiresVerification: { type: "boolean" },
              },
            },
            400: {
              type: "object",
              properties: {
                error: { type: "string" },
              },
            },
            409: {
              type: "object",
              properties: {
                error: { type: "string" },
                solution: { type: "string" },
              },
            },
            500: {
              type: "object",
              properties: {
                error: { type: "string" },
                details: { type: "string", nullable: true },
              },
            },
          },
          description:
            "Registra un nuevo usuario, opcionalmente habilita 2FA y envía email de verificación",
          tags: ["Auth"],
        },
        preHandler: undefined, // Esta ruta no requiere autenticación previa
      },
      async (request, reply) => {
        const { username, email, password, enable2FA, full_name, last_name, favourite_color, bio, country } = request.body;

        if (!username || !email || !password) {
          return sendError(reply, 400, "Faltan campos requeridos");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return sendError(reply, 400, "Formato de email inválido");
        }
        if (password.length < 8) {
          return sendError(reply, 400, "La contraseña debe tener al menos 8 caracteres");
        }

        try {
          const existingUser = await db.get("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
          if (existingUser) {
            console.warn("Intento de registro duplicado para:", email, username);
            return sendError(reply, 409, "El usuario o email ya están registrados", {
              solution: "Por favor utiliza otro email o nombre de usuario",
            });
          }

          const hashedPassword = await fastify.bcrypt.hash(password, 12);
          const verificationToken = crypto.randomBytes(32).toString("hex");

          let twoFactorSecret = null;
          let twoFactorEnabledValue = 0; 
          if (enable2FA) {
            const secret = speakeasy.generateSecret({ length: 20 });
            twoFactorSecret = secret.base32;
            twoFactorEnabledValue = 1; 
            console.log(`2FA Secret for ${email}: ${twoFactorSecret}`);
          }

          const result = await db.run(
            `INSERT INTO users 
              (username, email, password, verification_token, two_factor_secret, two_factor_enabled, is_verified, full_name, last_name, favourite_color, bio, country) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              username,
              email,
              hashedPassword,
              verificationToken,
              twoFactorSecret,
              twoFactorEnabledValue, 
              0, 
              full_name,
              last_name,
              favourite_color,
              bio,
              country,
            ]
          );

          const userId = result.lastID; 

          await db.run(
            `INSERT INTO security_logs (user_id, action_type, status) 
              VALUES (?, ?, ?)`,
            [userId, "register", "success"]
          );

          if (process.env.NODE_ENV !== "test") {
            try {
              const emailSent = await sendVerificationEmail(email, verificationToken);
              if (!emailSent) {
                console.error("Error: El email de verificación no pudo ser enviado");
              }
            } catch (emailError) {
              console.error("Error en el servicio de email:", emailError);
            }
          }

          if (enable2FA && twoFactorSecret) {
            const otpauthUrl = speakeasy.otpauthURL({
              secret: twoFactorSecret,
              label: encodeURIComponent(`Pong:${email}`), 
              issuer: fastify.jwt.options.issuer, // Usar issuer de Fastify JWT
              encoding: "base32",
            });

            const qrCode = await QRCode.toDataURL(otpauthUrl);

            return reply.status(201).send({
              success: true,
              message: "Usuario registrado. Verifica tu email y configura 2FA",
              userId,
              qrCode,
              requiresVerification: true,
            });
          }

          return reply.status(201).send({
            success: true,
            message: "Usuario registrado. Verifica tu email para activar la cuenta",
            userId,
            requiresVerification: true,
          });
        } catch (error) {
          console.error("Error en el proceso de registro:", error);
          return sendError(reply, 500, "Error interno del servidor", {
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          });
        }
      }
    );

    // POST /login (Ruta pública)
    fastify.post(
      "/login",
      {
        schema: {
          description: "Iniciar sesión con usuario y contraseña o como invitado. Soporta 2FA.",
          tags: ["Auth"],
          body: {
            type: "object",
            properties: {
              username: { type: "string" },
              password: { type: "string" },
              guestMode: { type: "boolean" },
            },
            oneOf: [
              {
                required: ["guestMode"],
              },
              {
                required: ["username", "password"],
              },
            ],
          },
          response: {
            200: {
              description: "Inicio de sesión exitoso",
              type: "object",
              properties: {
                success: { type: "boolean", nullable: true },
                token: { type: "string", nullable: true },
                userId: { type: "integer", nullable: true },
                username: { type: "string", nullable: true },
                avatar: { type: "string", nullable: true },
                email: { type: "string", nullable: true },
                requires2FA: { type: "boolean", nullable: true },
                tempToken: { type: "string", nullable: true },
                message: { type: "string" },
                timestamp: { type: "string", format: "date-time" },
              },
            },
            400: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                error: { type: "string" },
                details: { type: "string" },
              },
            },
            401: {
              description: "Contraseña incorrecta",
              type: "object",
              properties: {
                success: { type: "boolean" },
                error: { type: "string" },
                details: { type: "string" },
              },
            },
            403: {
              description: "Cuenta no verificada",
              type: "object",
              properties: {
                success: { type: "boolean" },
                error: { type: "string" },
                needsVerification: { type: "boolean" },
                solution: { type: "string" },
              },
            },
            404: {
              description: "Usuario no encontrado",
              type: "object",
              properties: {
                success: { type: "boolean" },
                error: { type: "string" },
                solution: { type: "string" },
              },
            },
            500: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                error: { type: "string" },
                message: { type: "string", nullable: true },
              },
            },
          },
        },
        preHandler: undefined, // Esta ruta no requiere autenticación previa
      },
      async (request, reply) => {
        const { username, password, guestMode } = request.body;

        try {
          if (guestMode) {
            return handleGuestLogin(request, reply);
          }

          if (!username?.trim() || !password?.trim()) {
            return sendError(reply, 400, "Credenciales inválidas", {
              details: "Username y password son requeridos",
            });
          }

          const user = await db.get(
            "SELECT id, username, email, password, is_verified, two_factor_secret, two_factor_enabled, avatar_url FROM users WHERE username = ?",
            [username.trim()]
          );

          if (!user) {
            return sendError(reply, 404, "Usuario no encontrado", {
              solution: "Verifique el username o regístrese",
            });
          }

          console.log("Datos para comparación:", {
            inputPassword: password,
            dbPassword: user.password ? `[hash de ${user.password.length} caracteres]` : "NULL",
          });

          const isMatch = await fastify.bcrypt.compare(password, user.password);
          if (!isMatch) {
            return sendError(reply, 401, "Credenciales inválidas", {
              details: "La contraseña es incorrecta",
            });
          }

          if (!user.is_verified && process.env.NODE_ENV !== "test") {
            return sendError(reply, 403, "Cuenta no verificada", {
              needsVerification: true,
              solution: "Verifique su email o contacte al administrador",
            });
          }

          if (user.two_factor_enabled && user.two_factor_secret) {
            // Generar token temporal para 2FA, usando fastify.jwt.sign
            const tempToken = fastify.jwt.sign( 
              {
                userId: user.id,
                purpose: authConfig.tempTokenPurpose, // Usar authConfig importado
                aud: fastify.jwt.options.audience,
                iss: fastify.jwt.options.issuer,
              },
              { expiresIn: fastify.jwt.options.accessExpiry } // Usar expiresIn del plugin JWT
            );

            console.log("Token 2FA generado para usuario:", {
              userId: user.id,
              username: user.username,
              tempToken: tempToken,
              twoFactorSecret: user.two_factor_secret,
            });

            return reply.send({
              requires2FA: true,
              tempToken,
              userId: user.id,
              username: user.username,
              avatar: user.avatar_url,
              email: user.email,
              message: "Se requiere verificación 2FA",
              timestamp: new Date().toISOString(),
            });
          }

          return handleStandardLogin(user, reply);
        } catch (error) {
          console.error("Error completo en proceso de login:", {
            error: error.message,
            stack: error.stack,
            requestBody: request.body,
          });
          return sendError(reply, 500, "Error interno del servidor", {
            message: process.env.NODE_ENV === "development" ? error.message : undefined,
          });
        }
      }
    );

    // Funciones auxiliares (manejo de invitados, 2FA, y login estándar)
    async function handleGuestLogin(request, reply) {
      try {
        const guestUsername = `guest_${crypto.randomBytes(8).toString("hex")}`;
        const guestEmail = `${guestUsername}@example.com`;

        const result = await db.run(
          "INSERT INTO users (username, email, password, is_active) VALUES (?, ?, ?, ?)",
          [guestUsername, guestEmail, "guest_password", 1]
        );

        const sessionToken = crypto.randomBytes(64).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.run(
          "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)",
          [result.lastID, sessionToken, expiresAt.toISOString()]
        );

        // Generar JWT para el invitado, usando fastify.jwt.sign
        const jwtToken = fastify.jwt.sign({ id: result.lastID, user: guestUsername, roles: ["guest"] }, { expiresIn: "1h" }); 

        return reply
        .setCookie('token', jwtToken, { 
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax',
          path: '/',
          maxAge: 3600, 
        })
        .send({
            success: true,
            message: "Login successful",
            token: jwtToken, 
            user: {
              id: result.lastID,
              username: guestUsername,
              email: guestEmail,
              role: "guest",
            },
          });
      } catch (error) {
        console.error("Error en login de invitado:", error);
        throw error; 
      }
    }

    async function handle2FALogin(user, reply) {
      // Generar token temporal para 2FA, usando fastify.jwt.sign
      const tempToken = fastify.jwt.sign(
          {
              userId: user.id,
              purpose: authConfig.tempTokenPurpose,
              aud: fastify.jwt.options.audience,
              iss: fastify.jwt.options.issuer,
          },
          { expiresIn: fastify.jwt.options.accessExpiry } // Usar expiresIn del plugin JWT
      );

      return reply.send({
        success: true,
        requires2FA: true,
        tempToken,
        user: { id: user.id, username: user.username },
        message: "Se requiere verificación 2FA",
      });
    }

    async function handleStandardLogin(user, reply) {
      // Generar JWT estándar, usando fastify.jwt.sign
      const jwtToken = fastify.jwt.sign( 
        { id: user.id, user: user.username, roles: ["standard"] },
        { expiresIn: "1h" }
      );

      return reply
        .setCookie("token", jwtToken, { 
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        })
        .send({
          success: true,
          token: jwtToken, 
          userId: user.id,
          username: user.username,
          avatar: user.avatar_url,
        });
    }

    // GET /protected-test (Ruta protegida)
    fastify.get(
      "/protected-test",
      {
        preHandler: async (request, reply) => { 
            try {
                const authHeader = request.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    throw new Error('Authorization header missing or invalid format');
                }
                const token = authHeader.split(' ')[1];
                // ¡IMPORTANTE! Pasar fastify y db a verifyToken
                request.user = await verifyToken(token, fastify, db); 
            } catch (err) {
                const statusCode = err.statusCode || 401;
                reply.status(statusCode).send({ status: 'error', message: err.message || 'No autorizado o token inválido' });
                throw err; // Crucial para detener el pipeline de la solicitud
            }
        },
        schema: {
          description:
            "Ruta de prueba para validar acceso con JWT. Requiere autenticación.",
          tags: ["Auth"],
          security: [
            {
              bearerAuth: [],
            },
          ],
          response: {
            200: {
              description: "Acceso concedido al recurso protegido",
              type: "object",
              properties: {
                message: { type: "string" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    username: { type: "string" },
                    email: { type: "string" },
                  },
                },
                timestamp: { type: "string", format: "date-time" },
              },
            },
            401: {
              description: "Token inválido o no proporcionado",
              type: "object",
              properties: {
                error: { type: "string" },
              },
            },
          },
        },
      },
      (request, reply) => {
        reply.send({
          message: "Acceso concedido",
          user: request.user,
          timestamp: new Date().toISOString(),
        });
      }
    );

    // POST /refresh-token (Ruta pública, maneja su propia validación de token de refresco)
    fastify.post(
      "/refresh-token",
      {
        schema: {
          description:
            "Genera un nuevo accessToken y refreshToken a partir de un refreshToken válido",
          tags: ["Auth"],
          body: {
            type: "object",
            required: ["refreshToken"],
            properties: {
              refreshToken: {
                type: "string",
                description: "Refresh token válido no expirado ni revocado",
              },
            },
          },
          response: {
            200: {
              description: "Tokens generados correctamente",
              type: "object",
              properties: {
                accessToken: {
                  type: "string",
                  description: "Nuevo token JWT de acceso",
                },
                refreshToken: {
                  type: "string",
                  description: "Nuevo refresh token persistido",
                },
              },
            },
            401: {
              description: "Refresh token inválido, expirado o revocado",
              type: "object",
              properties: {
                error: { type: "string" },
              },
            },
          },
        },
        preHandler: undefined, // No necesita autenticación JWT, maneja su propio token de refresco
      },
      async (request, reply) => {
        const { refreshToken } = request.body;

        try { 
          const tokenRecord = await db.get(
            `SELECT user_id FROM refresh_tokens 
                 WHERE token = ? AND expires_at > ? AND revoked = 0`,
            [refreshToken, new Date().toISOString()] 
          );

          if (!tokenRecord) {
            return sendError(reply, 401, "Invalid refresh token"); 
          }
          
          // Genera el nuevo accessToken, pasando fastify y request
          const newAccessToken = generateAccessToken(
            { id: tokenRecord.user_id, user: "TODO_USERNAME", roles: ["view"] }, // TODO: Obtener el username del usuario real si es necesario
            fastify,
            request
          );
          
          // Genera un nuevo refreshToken, pasando fastify, db y request
          const newRefreshToken = await generateRefreshToken(tokenRecord.user_id, fastify, db, request); 

          // Revoca el refreshToken antiguo (si estás rotando tokens)
          await db.run(`UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`, [
            refreshToken, 
          ]);

          reply
            .setCookie("refreshToken", newRefreshToken, { // Establece el nuevo refresh token en una cookie
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: "/",
              maxAge: 7 * 24 * 60 * 60 * 1000 // Expira en 7 días
            })
            .send({
              accessToken: newAccessToken, 
              refreshToken: newRefreshToken, 
            });
        } catch (error) {
            console.error('Error in refresh-token:', error);
            sendError(reply, 500, "Internal server error during token refresh.", { details: error.message });
        }
      }
    );

    // POST /logout (Ruta protegida)
    fastify.post(
      "/logout",
      {
        preHandler: async (request, reply) => { 
            try {
                const authHeader = request.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    throw new Error('Authorization header missing or invalid format');
                }
                const token = authHeader.split(' ')[1];
                // ¡IMPORTANTE! Pasar fastify y db a verifyToken
                request.user = await verifyToken(token, fastify, db); 
            } catch (err) {
                const statusCode = err.statusCode || 401;
                reply.status(statusCode).send({ status: 'error', message: err.message || 'No autorizado o token inválido' });
                throw err;
            }
        },
        schema: {
          description: "Revoca el token JWT actual del usuario autenticado",
          tags: ["Auth"],
          security: [{ bearerAuth: [] }],
          response: {
            200: {
              description: "Logout exitoso",
              type: "object",
              properties: {
                message: { type: "string", example: "Logged out successfully" },
              },
            },
            401: {
              description: "No autorizado o token inválido",
              type: "object",
              properties: {
                error: { type: "string" },
              },
            },
          },
        },
      },
      async (request, reply) => {
        try {
            // revocarToken espera el JTI si lo estás manejando
            // Asegúrate de que el JWT que creas incluye un 'jti' si lo vas a revocar.
            if (request.user && request.user.jti) {
                // Pasar db a revokeToken
                await revokeToken(request.user.jti, db); 
            }

            reply
            .clearCookie("token", { // Limpia la cookie del token de sesión
              path: "/",
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
            .send({ message: "Logged out successfully" });
        } catch (error) {
            console.error('Error during logout:', error);
            sendError(reply, 500, "Logout failed.", { details: error.message });
        }
      }
    );

    // GET /validate-token (Ruta pública - valida un token si se proporciona, no falla si no hay)
    fastify.get(
      "/validate-token",
      {
        schema: {
          description:
            "Valida un token JWT y devuelve su estado y datos decodificados",
          tags: ["Auth"],
          response: {
            200: {
              description: "Token válido",
              type: "object",
              properties: {
                valid: { type: "boolean", example: true },
                decoded: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    user: { type: "string" },
                    roles: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 1
                    },
                    iat: { type: "integer" },
                    exp: { type: "integer" }
                  },
                  description: "Datos decodificados del token",
                },
                expiresAt: {
                  type: "string",
                  format: "date-time",
                  example: "2025-06-02T12:00:00.000Z",
                },
              },
            },
            400: {
              description: "Token no proporcionado o inválido",
              type: "object",
              properties: {
                valid: { type: "boolean", example: false },
                error: { type: "string", example: "Token no proporcionado" },
              },
            },
          },
        },
        preHandler: async (request, reply) => { // Intenta verificar, pero no lanza error si no hay token
            try {
                const authHeader = request.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.split(' ')[1];
                    // ¡IMPORTANTE! Pasar fastify y db a verifyToken
                    request.user = await verifyToken(token, fastify, db); 
                } else {
                    request.user = null; // No hay token o formato incorrecto
                }
            } catch (err) {
                request.user = null; // Token inválido o no proporcionado
                if (err.message !== 'Authorization header missing' && err.message !== 'jwt must be provided') {
                    console.warn(`Token inválido en /validate-token: ${err.message}`);
                }
            }
        },
      },
      async (request, reply) => {
          if (request.user) {
            // Si request.user está presente, el token fue válido
            reply.send({
              valid: true,
              decoded: request.user, // request.user ya contiene los datos decodificados del JWT
              expiresAt: new Date(request.user.exp * 1000).toISOString(),
            });
          } else {
            // Si request.user es null, no se proporcionó token o era inválido
            reply.status(400).send({ 
                valid: false, 
                error: "Token no proporcionado o inválido." 
            });
          }
      }
    );

    // PUT /change-password (Ruta protegida)
    fastify.put("/change-password",{
        preHandler: async (request, reply) => { 
            try {
                const authHeader = request.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    throw new Error('Authorization header missing or invalid format');
                }
                const token = authHeader.split(' ')[1];
                // ¡IMPORTANTE! Pasar fastify y db a verifyToken
                request.user = await verifyToken(token, fastify, db); 
            } catch (err) {
                const statusCode = err.statusCode || 401;
                reply.status(statusCode).send({ status: 'error', message: err.message || 'No autorizado o token inválido' });
                throw err;
            }
        },
        schema: {
          description: "Cambia el password del usuario autenticado.",
          tags: ["Auth"],
          body: {
            type: "object",
            required: ["currentPassword", "newPassword"],
            properties: {
              currentPassword: {
                type: "string",
                minLength: 8,
              },
              newPassword: {
                type: "string",
                minLength: 8,
                pattern: "^(?=.*[A-Za-z])(?=.*\\d).+$"
              }
            },
          },
          headers: {
            type: "object",
            properties: {
              authorization: {
                type: "string",
                description: "JWT de autenticación en formato Bearer",
              },
            },
          },
          response: {
            200: {
              description: "Cambio de contraseña exitoso",
              type: "object",
              properties: { success: { type: "boolean" }, message: { type: "string" } }
            },
            400: { type: "object", properties: { error: { type: "string" }, details: { type: "string" } } },
            401: { type: "object", properties: { error: { type: "string" }, details: { type: "string" } } },
            403: { type: "object", properties: { error: { type: "string" }, details: { type: "string" } } },
            404: { type: "object", properties: { error: { type: "string" }, details: { type: "string" } } },
            500: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
          },
        },
    }, async (request, reply) => {
        const { currentPassword, newPassword } = request.body;
        const userId = request.user.id; // ID del usuario del JWT

        try {
            if (!newPassword?.trim() || !currentPassword?.trim()) {
                return sendError(reply, 400, "Credenciales inválidas", {
                    details: "La contraseña actual y la nueva son requeridas",
                });
            }

            const user = await db.get(
                "SELECT id, password FROM users WHERE id = ?",
                [userId]
            );

            if (!user) { 
                return sendError(reply, 404, "Usuario no encontrado", {
                    solution: "El usuario autenticado no existe",
                });
            }

            const isMatch = await fastify.bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return sendError(reply, 401, "Credenciales inválidas", {
                    details: "La contraseña actual es incorrecta",
                });
            }

            const hashedPassword = await fastify.bcrypt.hash(newPassword, 12);
            const updateResult = await db.run(`UPDATE users SET password =? WHERE id = ?`, [hashedPassword, userId]);

            if (updateResult.changes === 0) {
                return sendError(reply, 500, "Error al actualizar la contraseña", { details: "No se encontró el usuario para actualizar." });
            }
            
            reply.send({ success: true, message: "Contraseña actualizada correctamente." });

        } catch (error) {
            console.error('Error changing password:', error);
            sendError(reply, 500, "Error interno al cambiar la contraseña.", { details: error.message });
        }
    });

    // POST /send-reset-email-password (Ruta pública)
    fastify.post("/send-reset-email-password", {
      schema: {
        description: "Envía un correo con el enlace para restablecer la contraseña.",
        tags: ["Auth"],
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Correo electrónico del usuario."
            },
          },
        },
        response: {
          200: {
            description: "Correo enviado correctamente",
            type: "object",
            properties: {
              message: { type: "string", example: "Correo enviado con éxito" },
            },
          },
          404: {
            description: "Usuario no encontrado", 
            type: "object",
            properties: {
              error: { type: "string" },
              details: { type: "string" },
            },
          },
          400: {
            description: "Error al enviar correo",
            type: "object",
            properties: {
              error: { type: "string" },
              details: { type: "string" },
            },
          },
        },
      },
      preHandler: undefined, // Esta ruta es pública
    }, async (request, reply) => {
      const { email } = request.body;
      try {
        const user = await db.get("SELECT id FROM users WHERE email = ?", [email]);

        if (!user) {
          // No informar directamente si el email existe por seguridad
          return reply.status(200).send({ message: "Si su email está registrado, recibirá un enlace para restablecer su contraseña." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 3600 * 1000); 

        // Actualizar o insertar el token de reseteo en la tabla password_resets
        await db.run(
          `INSERT OR REPLACE INTO password_resets (user_id, reset_token, expires_at, used) VALUES (?, ?, ?, 0)`,
          [user.id, resetToken, expiresAt.toISOString()]
        );

        console.log("Enviando mensaje de restablecimiento de contraseña a:", email);
        const sended = await sendResetPasswordEmail(email, resetToken);
        console.log("Mensaje enviado:", sended);

        if (!sended) {
          console.error(`Email de restablecimiento no enviado a ${email}`);
          return sendError(reply, 500, "Error al enviar correo de restablecimiento.", {
            details: "No se pudo enviar el email de restablecimiento. Intente de nuevo.",
          });
        }

        reply.status(200).send({ message: "Si su email está registrado, recibirá un enlace para restablecer su contraseña." });

      } catch (error) {
        console.error("Error en send-reset-email-password:", error);
        sendError(reply, 500, "Error interno del servidor al solicitar restablecimiento de contraseña.", {
          details: error.message,
        });
      }
    });

    // PUT /reset-password (Ruta pública)
    fastify.put("/reset-password", {
      schema: {
        querystring: {
          type: "object",
          required: ["token", "email"],
          properties: {
            token: { type: "string", minLength: 1, description: "Token enviado por correo." },
            email: { type: "string", format: "email", description: "Correo electrónico del usuario." },
          },
        },
        body: {
          type: "object",
          required: ["password"],
          properties: {
            password: {
              type: "string",
              minLength: 8,
              pattern: "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$",
              description: "Nueva contraseña (mínimo 8 caracteres, incluye letras y números).",
            },
          },
        },
        response: {
          200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
          400: { type: "object", properties: { error: { type: "string" } } },
          500: { type: "object", properties: { error: { type: "string" } } },
        },
        description: "Actualiza la contraseña del usuario tras validar el token de recuperación.",
        tags: ["Auth"],
      },
      preHandler: undefined, // Esta ruta es pública
    }, async (request, reply) => {
      const { token, email } = request.query;
      const { password } = request.body;

      if (!token || !email || !password) {
        return sendError(reply, 400, "Token, email y contraseña son requeridos");
      }

      try {
        const resetRecord = await db.get('SELECT user_id FROM password_resets WHERE reset_token = ? AND expires_at > datetime("now") AND used = 0', [token]);

        if (!resetRecord) {
          return sendError(reply, 400, "Token inválido o expirado.");
        }

        const hashedPassword = await fastify.bcrypt.hash(password, 12);
        
        const updatePasswordResult = await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resetRecord.user_id]);
        if (updatePasswordResult.changes === 0) {
            throw new Error("No se pudo actualizar la contraseña del usuario.");
        }

        await db.run('UPDATE password_resets SET used = 1 WHERE reset_token = ?', [token]); // Marca el token como usado

        return reply.status(200).send({
          success: true,
          message: "Contraseña actualizada correctamente",
        });

      } catch (err) {
        console.error("Error en reset-password:", err);
        sendError(reply, 400, err.message || "Error actualizando la contraseña");
      }
    });

    // POST /verify-2fa (Ruta pública - usa un tempToken, no un JWT regular)
    fastify.post(
      "/verify-2fa",
      {
        schema: {
          description: "Verifica un código 2FA y un token temporal, y genera nuevos tokens de acceso y refresco.",
          tags: ["Auth"],
          body: {
            type: "object",
            required: ["code"],
            properties: {
              code: {
                type: "string",
                description: "Código 2FA de 6 dígitos generado por la app autenticadora",
                pattern: "^\\d{6}$",
              },
              tempToken: {
                type: "string",
                description: "Token temporal enviado en body",
                nullable: true 
              },
            },
          },
          headers: {
            type: "object",
            properties: {
              authorization: {
                type: "string",
                description: "Token temporal en formato Bearer",
                nullable: true 
              },
            },
          },
          response: {
            200: {
              description: "Autenticación 2FA exitosa",
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 123 },
                    username: { type: "string", example: "usuario123" },
                  },
                },
                message: { type: "string", example: "Autenticación 2FA exitosa" },
              },
            },
            400: { type: "object", properties: { error: { type: "string" }, receivedCode: { type: "string" } } },
            401: { type: "object", properties: { error: { type: "string" }, solution: { type: "string" } } },
            403: { type: "object", properties: { error: { type: "string" }, details: { type: "string" } } },
            500: { type: "object", properties: { error: { type: "string" }, message: { type: "string" }, details: { type: "string" } } },
          },
        },
        preHandler: undefined, // Esta ruta no necesita autenticación JWT regular, maneja su propio token temporal
      },
      async (request, reply) => {
        const { code, tempToken } = request.body;
        const authHeader = request.headers.authorization;

        console.log("Inicio verificación 2FA:", {
          code,
          tempToken: tempToken ? `${tempToken.substring(0, 15)}...` : "undefined",
          authHeader: authHeader ? `${authHeader.substring(0, 15)}...` : "undefined",
        });

        try {
          if (!code?.match(/^\d{6}$/)) {
            return sendError(reply, 400, "Código 2FA inválido - debe ser 6 dígitos", { receivedCode: code });
          }

          const tokenToVerify = tempToken || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);
          if (!tokenToVerify) {
            return sendError(reply, 401, "Token temporal no proporcionado", { solution: "Debe incluirse en el body o en el header Authorization" });
          }

          console.log("Verificando token temporal...");
          // Pasar fastify a verifyTempToken
          const tokenData = verifyTempToken(tokenToVerify, fastify); 
          console.log("Token verificado:", {
            userId: tokenData.userId,
            purpose: tokenData.purpose,
            exp: new Date(tokenData.exp * 1000).toISOString(),
          });

          const user = await db.get(
            `SELECT id, username, two_factor_secret 
             FROM users 
             WHERE id = ? AND two_factor_secret IS NOT NULL AND two_factor_enabled = 1`,
            [tokenData.userId]
          );

          if (!user?.two_factor_secret) {
            console.error("Error al recuperar secreto 2FA:", { userId: tokenData.userId, userData: user, time: new Date().toISOString() });
            return sendError(reply, 403, "Configuración 2FA inválida o incompleta", { details: "El usuario no tiene un secreto 2FA válido configurado" });
          }

          console.log("Verificando código 2FA para usuario:", { userId: user.id, username: user.username, secretPresent: !!user.two_factor_secret });
          console.log("Tiempo del servidor:", { serverTime: new Date().toISOString(), serverTimestamp: Math.floor(Date.now() / 1000), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });

          const secretToUse = user.two_factor_secret.trim();

          if (!secretToUse.match(/^[A-Z2-7]{16,}$/)) {
            console.error("Formato inválido de secreto 2FA:", { secret: user.two_factor_secret, userId: user.id });
            return sendError(reply, 500, "Error de configuración 2FA", { message: "El secreto 2FA tiene un formato inválido" });
          }

          const verificationTime = Math.floor(Date.now() / 1000);
          const verified = speakeasy.totp.verify({
            secret: secretToUse,
            encoding: "base32",
            token: code,
            window: 1,
            step: 30,
            time: verificationTime,
          });

          console.log("Detalles de verificación:", {
            userId: user.id, secretUsed: secretToUse, codeReceived: code, serverTime: new Date(verificationTime * 1000).toISOString(),
            calculatedCodes: {
              current: speakeasy.totp({ secret: secretToUse, encoding: "base32", time: verificationTime }),
              previous: speakeasy.totp({ secret: secretToUse, encoding: "base32", time: verificationTime - 30 }),
              next: speakeasy.totp({ secret: secretToUse, encoding: "base32", time: verificationTime + 30 }),
            },
          });

          if (!verified) {
            console.error("Código 2FA no válido. Códigos esperados:", {
              current: speakeasy.totp({ secret: secretToUse, encoding: "base32", time: verificationTime }),
              previous: speakeasy.totp({ secret: secretToUse, encoding: "base32", time: verificationTime - 30 }),
              next: speakeasy.totp({ secret: secretToUse, encoding: "base32", time: verificationTime + 30 }),
            });
            return sendError(reply, 401, "Código 2FA inválido", {
              hint: "Verifica que el código sea el actual y que el reloj esté sincronizado",
              debug: process.env.NODE_ENV === "development" ? {
                    currentCode: speakeasy.totp({ secret: secretToUse, encoding: "base32", time: verificationTime }),
                    timeWindow: verificationTime,
                  } : undefined,
            });
          }

          // Generar accessToken, pasando fastify y request
          const accessToken = generateAccessToken( 
            { id: user.id, username: user.username, two_fa_verified: true, auth_method: "2fa", },
            fastify,
            request
          );

          // Generar refreshToken, pasando fastify, db y request
          const refreshToken = await generateRefreshToken(user.id, fastify, db, request); 

          console.log("Autenticación 2FA exitosa para usuario:", user.id);

          return reply
            .setCookie("refreshToken", refreshToken, { 
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production', 
              sameSite: 'lax',
              path: "/",
              maxAge: 7 * 24 * 60 * 60 * 1000 
            })
            .send({
              success: true,
              accessToken,
              refreshToken, 
              user: {
                id: user.id,
                username: user.username,
              },
              message: "Autenticación 2FA exitosa",
            });
        } catch (error) {
          console.error("Error en verify-2fa:", {
            error: error.message, stack: error.stack, requestBody: request.body, time: new Date().toISOString(),
          });

          const statusCode = error.statusCode || 500;
          return sendError(reply, statusCode, "Error en verificación 2FA", {
            message: error.message,
            ...(process.env.NODE_ENV === "development" && {
              details: error.stack,
            }),
          });
        }
      }
    );

    // POST /resend-2fa (Ruta pública)
    fastify.post(
      "/resend-2fa",
      {
        schema: {
          description: "Re-envía un código 2FA (simulado).",
          tags: ["Auth"],
          body: {
            type: "object",
            required: ["username"],
            properties: {
              username: { type: "string" },
            },
          },
        },
      },
      async (request, reply) => {
        const { username } = request.body;

        try {
          const user = await db.get(
            "SELECT two_factor_secret FROM users WHERE username = ?",
            [username]
          );

          if (!user || !user.two_factor_secret) {
            return sendError(reply, 404, "Usuario o 2FA no configurado");
          }

          console.log(`Nuevo código 2FA para ${username}: (simulado)`);

          reply.send({ message: "Código 2FA reenviado" });
        } catch (error) {
          console.error("Error al re-enviar el código 2FA:", error);
          sendError(reply, 500, "Error interno del servidor");
        }
      }
    );

    // GET /verify-email (Ruta pública)
    fastify.get(
      "/verify-email",
      {
        schema: {
          querystring: {
            type: "object",
            required: ["token", "email"],
            properties: {
              token: { type: "string", minLength: 1, description: "Token de verificación" },
              email: { type: "string", format: "email", description: "Correo electrónico del usuario" },
            },
          },
          response: {
            200: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } },
            400: { type: "object", properties: { error: { type: "string" } } },
          },
          description: "Verifica el email del usuario con un token",
          tags: ["Auth"],
        },
        preHandler: undefined, // Esta ruta es pública
      },
      async (request, reply) => {
        const { token, email } = request.query;

        if (!token || !email) {
          return sendError(reply, 400, "Token y email son requeridos");
        }

        try {
          const result = await db.run(
            "UPDATE users SET is_verified = 1, verification_token = NULL WHERE email = ? AND verification_token = ?",
            [email, token]
          );

          if (result.changes === 0) {
            return sendError(reply, 400, "Token inválido o email incorrecto");
          }

          reply.send({ success: true, message: "Email verificado correctamente" });
        } catch (error) {
          console.error("Error al verificar email:", error);
          sendError(reply, 400, error.message);
        }
      }
    );

    // GET /check-2fa-status/:userId (Ruta protegida)
    fastify.get(
      "/check-2fa-status/:userId",
      {
        schema: {
          params: {
            type: "object",
            required: ["userId"],
            properties: {
              userId: { type: "integer", description: "ID del usuario (numérico)" }, 
            },
          },
          response: {
            200: {
              type: "object",
              properties: {
                has2FA: { type: "boolean", description: "Indica si el usuario tiene configurado 2FA" },
                is2FAEnabled: { type: "boolean", description: "Indica si el usuario tiene activado 2FA" },
              },
            },
            404: { type: "object", properties: { error: { type: "string" } } },
            500: { type: "object", properties: { error: { type: "string" } } },
          },
          description: "Consulta el estado de configuración y activación del 2FA de un usuario",
          tags: ["Auth"],
        },
        preHandler: async (request, reply) => { 
            try {
                const authHeader = request.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    throw new Error('Authorization header missing or invalid format');
                }
                const token = authHeader.split(' ')[1];
                // ¡IMPORTANTE! Pasar fastify y db a verifyToken
                request.user = await verifyToken(token, fastify, db); 
            } catch (err) {
                const statusCode = err.statusCode || 401;
                reply.status(statusCode).send({ status: 'error', message: err.message || 'No autorizado o token inválido' });
                throw err;
            }
        }
      },
      async (request, reply) => {
        const { userId } = request.params;

        try {
          const user = await db.get(
            `SELECT two_factor_secret, two_factor_enabled 
                   FROM users WHERE id = ?`,
            [userId]
          );

          if (!user) {
            return sendError(reply, 404, "Usuario no encontrado");
          }

          reply.send({
            has2FA: !!user.two_factor_secret,
            is2FAEnabled: !!user.two_factor_enabled,
          });
        } catch (error) {
          console.error("Error al verificar estado 2FA:", error);
          sendError(reply, 500, "Error interno del servidor");
        }
      }
    );
}
