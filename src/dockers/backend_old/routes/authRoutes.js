import fs from "fs";
import path from "path";
import sqlite3Module from "sqlite3";
import crypto from "crypto";
import { config, verifyTempToken,  authMiddleware } from "../auth.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import {sendVerificationEmail, sendResetPasswordEmail} from "../emailService.js";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlite3 = sqlite3Module.verbose();

// Creamos el router de Fastify (usando el plugin system)
export async function authRoutes(fastify, options) {
    const sendError = (reply, status, error, details = {}) => {
      const response = { success: false, error, ...details };
      console.error(`Login error [${status}]:`, response);
      return reply.status(status).send(response);
    };

    const dbPath = '/var/lib/sqlite/sqlite.db';
    const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error al conectar a la base de datos:", err.message);
    } else {
      console.log("Conectado a la base de datos SQLite");
      db.serialize(); // <--- Añadido serialize() aquí
    }
  });

  const initSQL = fs.readFileSync(
    path.join(__dirname, "..", "tools", "init.sql"),
    "utf-8"
  );
  db.exec(initSQL, (err) => {
    if (err) {
      console.error("Error al inicializar la base de datos:", err.message);
    } else {
      console.log("Base de datos inicializada correctamente");
    }
  });

  // POST /register
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
              message: { type: "string" },
            },
          },
          409: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
              solution: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
              details: { type: "string", nullable: true },
            },
          },
        },
        description:
          "Registra un nuevo usuario, opcionalmente habilita 2FA y envía email de verificación",
        tags: ["Auth"],
      },
    },
    async (request, reply) => {
      const { username, email, password, enable2FA } = request.body;

      // Validaciones básicas
      if (!username || !email || !password) {
        return reply.status(400).send({ error: "Faltan campos requeridos" });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return reply.status(400).send({ error: "Formato de email inválido" });
      }

      if (password.length < 8) {
        return reply
          .status(400)
          .send({ error: "La contraseña debe tener al menos 8 caracteres" });
      }

      try {
        // Verificar usuario existente (con manejo de errores mejorado)
        const userExists = await new Promise((resolve, reject) => {
          db.get(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email],
            (err, row) => {
              if (err) {
                console.error("Error al verificar usuario:", err);
                reject(err);
              } else {
                resolve(!!row);
              }
            }
          );
        });

        if (userExists) {
          console.warn("Intento de registro duplicado para:", email);
          return reply.status(409).send({
            error: "El usuario o email ya están registrados",
            solution: "Por favor utiliza otro email o nombre de usuario",
          });
        }

        // Generar hash de contraseña y token de verificación
        const hashedPassword = await fastify.bcrypt.hash(password, 12);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const isVerified = false; // Cuenta no verificada inicialmente

        // Configuración 2FA
        let twoFactorSecret = null;
        if (enable2FA) {
          const secret = speakeasy.generateSecret({ length: 20 });
          twoFactorSecret = secret.base32;
          console.log(`2FA Secret for ${email}: ${twoFactorSecret}`);
        }

        // Insertar usuario en la base de datos
        const { lastID: userId } = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO users 
                    (username, email, password, verification_token, two_factor_secret, two_factor_enabled, is_verified) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              username,
              email,
              hashedPassword,
              verificationToken,
              twoFactorSecret,
              enable2FA ? 1 : 0,
              0,
            ],
            function (err) {
              if (err) {
                console.error("Error al registrar usuario:", err);
                reject(err);
              } else {
                resolve(this);
              }
            }
          );
        });

        // Crear perfil de usuario


        // Registrar en logs de seguridad
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO security_logs (user_id, action_type, status) 
                    VALUES (?, ?, ?)`,
            [userId, "register", "success"],
            (err) => (err ? reject(err) : resolve(true))
          );
        });
        if (process.env.NODE_ENV !== "test") {
          try {
            const emailSent = await sendVerificationEmail(
              email,
              verificationToken
            );
            if (!emailSent) {
              console.error(
                "Error: El email de verificación no pudo ser enviado"
              );
            }
          } catch (emailError) {
            console.error("Error en el servicio de email:", emailError);
          }
        }

        // Respuesta para 2FA
        if (enable2FA && twoFactorSecret) {
          const otpauthUrl = speakeasy.otpauthURL({
            secret: twoFactorSecret,
            label: `Pong:${email}`,
            issuer: "PongApp",
            encoding: "base32",
          });

          const qrCode = await new Promise((resolve, reject) => {
            QRCode.toDataURL(otpauthUrl, (err, url) => {
              err ? reject(err) : resolve(url);
            });
          });

          return reply.status(201).send({
            success: true,
            message: "Usuario registrado. Verifica tu email y configura 2FA",
            userId,
            qrCode,
            requiresVerification: true,
          });
        }
        console.log("Hola5");

        // Respuesta normal
        return reply.status(201).send({
          success: true,
          message:
            "Usuario registrado. Verifica tu email para activar la cuenta",
          userId,
          requiresVerification: true,
        });
      } catch (error) {
        console.error("Error en el proceso de registro:", error);
        return reply.status(500).send({
          error: "Error interno del servidor",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  );

  // POST /login (Fastify - versión corregida)
  fastify.post(
    "/login",
    {
      schema: {
        description:
          "Iniciar sesión con usuario y contraseña o como invitado. Soporta 2FA.",
        tags: ["Auth"],
        body: {
          type: "object",
          properties: {
            username: { type: "string" },
            password: { type: "string" },
            guestMode: { type: "boolean" },
            gameMode: { type: "boolean" }
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
            description: "Credenciales inválidas",
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
            description: "Error interno del servidor",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              message: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { username, password, guestMode, gameMode } = request.body;


      try {
        if (guestMode) {
          return handleGuestLogin(request, reply);
        }

        if (!username?.trim() || !password?.trim()) {
          return sendError(reply, 400, "Credenciales inválidas", {
            details: "Username y password son requeridos",
          });
        }

        const user = await new Promise((resolve, reject) => {
          db.get(
            "SELECT id, username, email, password, is_verified, two_factor_secret, two_factor_enabled, avatar_url FROM users WHERE username = ?",
            [username.trim()],
            (err, row) => {
              if (err) {
                console.error("Error en la consulta SQL:", {
                  error: err,
                  query: "SELECT password FROM users WHERE username = ?",
                  params: [username.trim()],
                });
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        });

        if (!user) {
          return sendError(reply, 404, "Usuario no encontrado", {
            solution: "Verifique el username o regístrese",
          });
        }

        console.log("Datos para comparación:", {
          inputPassword: password,
          dbPassword: user.password
            ? `[hash de ${user.password.length} caracteres]`
            : "NULL",
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

        // Flujo 2FA - Versión corregida
        if (user.two_factor_enabled && user.two_factor_secret) {
          const tempToken = fastify.jwt.sign(
            {
              id: user.id, // Asegurar que sea userId (no user.id)
              purpose: config.tempTokenPurpose, // Usar la constante de configuración
              aud: config.audience,
              iss: config.issuer,
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutos
            },
            config.secret,
            { algorithm: config.algorithm }
          );

          console.log("Token 2FA generado para usuario:", {
            userId: user.id,
            username: user.username,
            tempToken: tempToken,
            twoFactorSecret: user.two_factor_secret,
          });

          if (gameMode) {
            return reply
              .send({
                requires2FA: true,
                tempToken,
                userId: user.id, // Enviar userId explícitamente
                username: user.username,
                avatar: user.avatar_url,
                email: user.email,
                message: "Se requiere verificación 2FA",
                timestamp: new Date().toISOString(),
              });
          } else {
            return reply
              .setCookie('token', tempToken, {
                httpOnly: true,
                secure: false, // Set to true in production
                sameSite: 'lax',
                path: '/',
                maxAge: 3600, // 1 hour in seconds
              })
              .send({
                requires2FA: true,
                tempToken,
                userId: user.id, // Enviar userId explícitamente
                username: user.username,
                avatar: user.avatar_url,
                email: user.email,
                message: "Se requiere verificación 2FA",
                timestamp: new Date().toISOString(),
              });
          }
        }

        return handleStandardLogin(user, reply);
      } catch (error) {
        console.error("Error completo en proceso de login:", {
          error: error.message,
          stack: error.stack,
          requestBody: request.body,
        });
        return sendError(reply, 500, "Error interno del servidor", {
          message:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  );

  // Funciones auxiliares separadas
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


		const jwt = fastify.jwt.sign({ user: auth.username, roles: ["guest"] }, { expiresIn: "1h" });

      return reply
      .setCookie('token', jwt, {
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: 'lax',
        path: '/',
        maxAge: 3600, // 1 hour in seconds
      })
    .send({
        success: true,
        message: "Login successful",
        token:jwt,
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

  async function handleStandardLogin(user, reply) {


    // const refreshToken = await generateRefreshToken(user.id);
    const jwt = fastify.jwt.sign(
      { id: user.id, user: user.username, roles: ["standard"] },
      { expiresIn: "1h" }
    );

    return reply
      .setCookie("token", jwt, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      })
      .send({
        success: true,
        token: jwt,
        userId: user.id,
        username: user.username,
        avatar: user.avatar_url,
      });
  }

  // GET /protected-test
  fastify.get(
    "/protected-test",
    {
      preHandler: [authMiddleware],
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
                  // Puedes extender esto según lo que tu JWT incluya
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

  // POST /refresh-token
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
    },
    async (request, reply) => {
      const { refreshToken } = request.body;

      const tokenRecord = await db.get(
        `SELECT user_id FROM refresh_tokens 
             WHERE token = ? AND expires_at > ? AND revoked = 0`,
        [refreshToken, new Date()]
      );

      if (!tokenRecord) {
        return reply.status(401).send({ error: "Invalid refresh token" });
      }

      //const newRefreshToken = await generateRefreshToken(tokenRecord.user_id);
      const jwt = fastify.jwt.sign(
        { user: auth.username, roles: ["view"] }, //TODO: Sacar el Rol de la base de datos.
        { expiresIn: "1h" }
      );

      await db.run(`UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`, [
        jwt,
      ]);

      reply
        .setCookie("token", jwt, {
          httpOnly: true,
          secure: false, // Set to true in production
          sameSite: "lax",
          path: "/",
          maxAge: 3600, // 1 hour in seconds
        })
        .send({
          accessToken,
          refreshToken: jwt,
        });
    }
  );

  // POST /logout
  fastify.post(
    "/logout",
    {
     // preHandler: [authMiddleware],
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

      reply
      .clearCookie("token", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false
      })
      .send({ message: "Logged out successfully" });
    }
  );

  // POST /validate-token
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
                  purpose: { type: "string" },
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
            description: "Falta el token en el cuerpo",
            type: "object",
            properties: {
              valid: { type: "boolean", example: false },
              message: { type: "string" },
              error: { type: "string", example: "Token no proporcionado" },
            },
          },
          401: {
            description: "Token inválido o expirado",
            type: "object",
            properties: {
              valid: { type: "boolean", example: false },
              error: { type: "string", example: "jwt expired" },
            },
          },
        },
      },
    },
    async (request, reply) => {
        const decoded = await request.jwtVerify();
        console.log(decoded);
        reply.send({
          valid: true,
          decoded:decoded,
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
        });c
    }
  );

  //TODO: POST reset password
  fastify.put("/change-password",{
      schema: {
        description:
          "Cambia el password.",
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
              description: "Token temporal en formato Bearer",
            },
          },
        },
        response: {
          200: {
            description: "Cambio de contraseña exitoso",
          },
          400: {
            description: "Código 2FA inválido",
            type: "object",
            properties: {
              message: { type: "string" },
              error: {
                type: "string",
                example: "Código 2FA inválido - debe ser 6 dígitos",
              },
              receivedCode: { type: "string", example: "12345" },
            },
          },
          401: {
            description:
              "Token temporal no proporcionado o código 2FA inválido",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Token temporal no proporcionado",
              },
              solution: {
                type: "string",
                example:
                  "Debe incluirse en el body o en el header Authorization",
              },
            },
          },
          403: {
            description: "Configuración 2FA inválida o incompleta",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Configuración 2FA inválida o incompleta",
              },
              details: {
                type: "string",
                example:
                  "El usuario no tiene un secreto 2FA válido configurado",
              },
            },
          },
          500: {
            description: "Error interno de configuración 2FA",
            type: "object",
            properties: {
              error: { type: "string", example: "Error de configuración 2FA" },
              message: {
                type: "string",
                example: "El secreto 2FA tiene un formato inválido",
              },
            },
          },
        },
      },
    }, async (request, reply) => {
      const { currentPassword, newPassword } = request.body;
      const decoded = await request.jwtVerify();
      const username = decoded.user;

        if (!newPassword?.trim() || !currentPassword?.trim()) {
          return sendError(reply, 400, "Credenciales inválidas", {
            details: "La contraseña es requerida",
          });
        }

        const user = await new Promise((resolve, reject) => {
          db.get(
            "SELECT id, username, email, password, is_verified, two_factor_secret, two_factor_enabled FROM users WHERE username = ?",
            [username.trim()],
            (err, row) => {
              if (err) {
                console.error("Error en la consulta SQL:", {
                  error: err,
                  query: "SELECT password FROM users WHERE username = ?",
                  params: [username.trim()],
                });
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        });

        if (!user) {
          return sendError(reply, 404, "Usuario no encontrado", {
            solution: "Verifique el username o regístrese",
          });
        }

        console.log("Datos para comparación:", {
          inputPassword: currentPassword,
          dbPassword: user.password
            ? `[hash de ${user.password.length} caracteres]`
            : "NULL",
        });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return sendError(reply, 401, "Credenciales inválidas", {
            details: "La contraseña es incorrecta",
          });
        }

        const hashedPassword = await fastify.bcrypt.hash(newPassword, 12);
        await new Promise((resolve, reject) => {
          db.run(`UPDATE users SET password =? WHERE username = ?`,
            [hashedPassword, username ],
              function (err) {
                if (err) return reject(err);
                if (this.changes === 0) {
                  return reject(new Error("Token inválido o email incorrecto"));
                }
                resolve();
              }
          );
        });
      reply.send();

  });

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
          error: { type: "string", example: "Usuario no encontrado" },
          details: { type: "string", example: "Usuario no encontrado en la DB" },
        },
      },
      400: {
        description: "Error al enviar correo",
        type: "object",
        properties: {
          error: { type: "string", example: "Error al enviar correo" },
          message: { type: "string" },
          details: { type: "string", example: "Email incorrecto" },
        },
      },
    },
  },
}, async (request, reply) => {
  const { email } = request.body;
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const userExists = await new Promise((resolve, reject) => {
    db.get("SELECT email FROM users WHERE email = ?", [email], (err, row) => {
      if (err) return reject(err);
      resolve(!!row);
    });
  });

  if (!userExists) {
    return sendError(reply, 404, "Usuario no encontrado", {
      details: "Usuario no encontrado en la DB",
    });
  }

  await new Promise((resolve, reject) => {
    db.run("UPDATE users SET verification_token = ? WHERE email = ?", [verificationToken, email],
      function (err) {
        if (err) return reject(err);
        if (this.changes === 0) return reject(new Error("No se pudo asignar el token"));
        resolve();
      }
    );
  });

  console.log("Enviando mensaje")
  const sended = await sendResetPasswordEmail(email, verificationToken);
  console.log("Mensaje enviado")
  if (!sended) {
    return sendError(reply, 400, "Error al enviar correo", {
      details: "Email incorrecto",
    });
  }

  reply.send({ message: "Correo enviado con éxito" });
});


  fastify.put("/reset-password", {
    schema: {
      querystring: {
        type: "object",
        required: ["token", "email"],
        properties: {
          token: {
            type: "string",
            minLength: 1,
            description: "Token enviado por correo para verificar la identidad",
          },
          email: {
            type: "string",
            format: "email",
            description: "Correo electrónico asociado al usuario",
          },
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
            description: "Nueva contraseña (mínimo 8 caracteres, incluye letras y números)",
          },
        },
      },
      response: {
        200: {
          description: "Contraseña actualizada exitosamente",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Contraseña actualizada correctamente",
            },
          },
        },
        400: {
          description: "Error por token inválido, email incorrecto o datos faltantes",
          type: "object",
          properties: {
            message: { type: "string" },
            error: {
              type: "string",
              example: "Token inválido o email incorrecto",
            },
          },
        },
        500: {
          description: "Error interno del servidor",
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Error actualizando la contraseña",
            },
          },
        },
      },
      description: "Actualiza la contraseña del usuario tras validar el token de recuperación",
      tags: ["Auth"],
    },
  }, async (request, reply) => {
    const { token, email } = request.query;
    const { password } = request.body;

    if (!token || !email || !password) {
      return reply
        .status(400)
        .send({ error: "Token, email y contraseña son requeridos" });
    }

    try {
      const hashedPassword = await fastify.bcrypt.hash(password, 12);
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE users SET password = ? WHERE email = ? AND verification_token = ?",
          [hashedPassword, email, token],
          function (err) {
            if (err) return reject(err);
            if (this.changes === 0) {
              return reject(new Error("Token inválido o email incorrecto"));
            }
            resolve();
          }
        );
      });

      return reply.status(200).send({
        success: true,
        message: "Contraseña actualizada correctamente",
      });

    } catch (err) {
      return reply.status(400).send({
        error: err.message || "Error actualizando la contraseña",
      });
    }
  });

  // POST /verify-2fa
  // POST /verify-2fa
  fastify.post(
    "/verify-2fa",
    {
      schema: {
        description:
          "Verifica un código 2FA y un token temporal, y genera nuevos tokens de acceso y refresco.",
        tags: ["Auth"],
        body: {
          type: "object",
          required: ["code"],
          properties: {
            code: {
              type: "string",
              description:
                "Código 2FA de 6 dígitos generado por la app autenticadora",
              pattern: "^\\d{6}$",
            },
            tempToken: {
              type: "string",
              description:
                "Token temporal enviado en body o en header Authorization",
            },
          },
        },
        response: {
          200: {
            description: "Autenticación 2FA exitosa",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              accessToken: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              },
              refreshToken: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              },
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
          400: {
            description: "Código 2FA inválido",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Código 2FA inválido - debe ser 6 dígitos",
              },
              receivedCode: { type: "string", example: "12345" },
            },
          },
          401: {
            description:
              "Token temporal no proporcionado o código 2FA inválido",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Token temporal no proporcionado",
              },
              solution: {
                type: "string",
                example:
                  "Debe incluirse en el body o en el header Authorization",
              },
            },
          },
          403: {
            description: "Configuración 2FA inválida o incompleta",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Configuración 2FA inválida o incompleta",
              },
              details: {
                type: "string",
                example:
                  "El usuario no tiene un secreto 2FA válido configurado",
              },
            },
          },
          500: {
            description: "Error interno de configuración 2FA",
            type: "object",
            properties: {
              error: { type: "string", example: "Error de configuración 2FA" },
              message: {
                type: "string",
                example: "El secreto 2FA tiene un formato inválido",
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { code, tempToken } = request.body;
      const decoded = await request.jwtVerify();
      const tokenToVerify = request.cookies.token;

      console.log("Inicio verificación 2FA:", {
        code,
        tempToken: tempToken ? `${tempToken.substring(0, 15)}...` : "undefined",
      });

      try {
        // Validaciones básicas
        if (!code?.match(/^\d{6}$/)) {
          return reply.status(400).send({
            error: "Código 2FA inválido - debe ser 6 dígitos",
            receivedCode: code,
          });
        }

        // Obtener token de header o body
        if (!tokenToVerify) {
          return reply.status(401).send({
            error: "Token temporal no proporcionado",
            solution: "Debe incluirse en el body o en el header Authorization",
          });
        }

        // Verificar token temporal
        console.log("Verificando token temporal...");
        const tokenData = await verifyTempToken(request, decoded);
        console.log("Token verificado:", {
          userId: tokenData.id,
          purpose: tokenData.purpose,
          exp: new Date(tokenData.exp * 1000).toISOString(),
        });

        // Función para obtener usuario con reintentos
        const getUserWithRetry = async (userId, maxRetries = 3) => {
          let retries = 0;
          while (retries < maxRetries) {
            try {
              const user = await new Promise((resolve, reject) => {
                db.get(
                  `
                                SELECT id, username, two_factor_secret 
                                FROM users 
                                WHERE id = ? 
                                AND two_factor_secret IS NOT NULL
                                AND two_factor_enabled = 1`,
                  [userId],
                  (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                  }
                );
              });

              if (user) return user;
            } catch (err) {
              if (err.code === "SQLITE_BUSY" && retries < maxRetries - 1) {
                retries++;
                await new Promise((resolve) =>
                  setTimeout(resolve, 100 * retries)
                );
                continue;
              }
              throw err;
            }
          }
          return null;
        };

        // Obtener usuario
        const user = await getUserWithRetry(tokenData.id);
        if (!user?.two_factor_secret) {
          console.error("Error al recuperar secreto 2FA:", {
            userId: tokenData.id,
            userData: user,
            time: new Date().toISOString(),
          });
          return reply.status(403).send({
            error: "Configuración 2FA inválida o incompleta",
            details: "El usuario no tiene un secreto 2FA válido configurado",
          });
        }

        console.log("Verificando código 2FA para usuario:", {
          userId: user.id,
          username: user.username,
          secretPresent: !!user.two_factor_secret,
        });

        console.log("Tiempo del servidor:", {
          serverTime: new Date().toISOString(),
          serverTimestamp: Math.floor(Date.now() / 1000),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        // Limpiar y validar el secreto
        const secretToUse = user.two_factor_secret.trim();

        if (!secretToUse.match(/^[A-Z2-7]{16,}$/)) {
          console.error("Formato inválido de secreto 2FA:", {
            secret: user.two_factor_secret,
            userId: user.id,
          });
          return reply.status(500).send({
            error: "Error de configuración 2FA",
            message: "El secreto 2FA tiene un formato inválido",
          });
        }

        // Verificación TOTP
        const verificationTime = Math.floor(Date.now() / 1000);
        const verified = speakeasy.totp.verify({
          secret: secretToUse,
          encoding: "base32",
          token: code,
          window: 1,
          step: 30,
          time: verificationTime,
        });

        // Depuración detallada
        console.log("Detalles de verificación:", {
          userId: user.id,
          secretUsed: secretToUse,
          codeReceived: code,
          serverTime: new Date(verificationTime * 1000).toISOString(),
          calculatedCodes: {
            current: speakeasy.totp({
              secret: secretToUse,
              encoding: "base32",
              time: verificationTime,
            }),
            previous: speakeasy.totp({
              secret: secretToUse,
              encoding: "base32",
              time: verificationTime - 30,
            }),
            next: speakeasy.totp({
              secret: secretToUse,
              encoding: "base32",
              time: verificationTime + 30,
            }),
          },
        });

        if (!verified) {
          console.error("Código 2FA no válido. Códigos esperados:", {
            current: speakeasy.totp({
              secret: secretToUse,
              encoding: "base32",
              time: verificationTime,
            }),
            previous: speakeasy.totp({
              secret: secretToUse,
              encoding: "base32",
              time: verificationTime - 30,
            }),
            next: speakeasy.totp({
              secret: secretToUse,
              encoding: "base32",
              time: verificationTime + 30,
            }),
          });
          return reply.status(401).send({
            error: "Código 2FA inválido",
            hint: "Verifica que el código sea el actual y que el reloj esté sincronizado",
            debug:
              process.env.NODE_ENV === "development"
                ? {
                  currentCode: speakeasy.totp({
                    secret: secretToUse,
                    encoding: "base32",
                    time: verificationTime,
                  }),
                  timeWindow: verificationTime,
                }
                : undefined,
          });
        }


        //const refreshToken = await generateRefreshToken(user.id, request);
        const jwt = fastify.jwt.sign(
          { id: user.id, user: user.username, roles: ["view"] },
          { expiresIn: "1h" }
        );

        console.log("Autenticación 2FA exitosa para usuario:", user.id);

        return reply
          .setCookie("token", jwt, {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: "lax",
            path: "/",
            maxAge: 3600, // 1 hour in seconds
          })
          .send({
            success: true,
            jwt,
            user: {
              id: user.id,
              username: user.username,
            },
            message: "Autenticación 2FA exitosa",
          });
      } catch (error) {
        console.error("Error en verify-2fa:", {
          error: error.message,
          stack: error.stack,
          requestBody: request.body,
          time: new Date().toISOString(),
        });

        const statusCode = error.statusCode || 500;
        return reply.status(statusCode).send({
          error: "Error en verificación 2FA",
          message: error.message,
          ...(process.env.NODE_ENV === "development" && {
            details: error.stack,
          }),
        });
      }
    }
  );


  // POST /resend-2fa
  fastify.post(
    "/resend-2fa",
    {
      schema: {
        description:
          "Verifica un código 2FA y un token temporal, y genera nuevos tokens de acceso y refresco.",
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
          return reply
            .status(404)
            .send({ error: "Usuario o 2FA no configurado" });
        }

        console.log(`Nuevo código 2FA para ${username}: (simulado)`);

        reply.send({ message: "Código 2FA reenviado" });
      } catch (error) {
        console.error("Error al re-enviar el código 2FA:", error);
        reply.status(500).send({ error: "Error interno del servidor" });
      }
    }
  );

  // GET /verify-email
  //TODO: Cambiar la columna verify de DB
  fastify.get(
    "/verify-email",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["token", "email"],
          properties: {
            token: {
              type: "string",
              minLength: 1,
              description: "Token de verificación",
            },
            email: {
              type: "string",
              format: "email",
              description: "Correo electrónico del usuario",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              error: { type: "string" },
            },
          },
        },
        description: "Verifica el email del usuario con un token",
        tags: ["Auth"],
      },
    },
    async (request, reply) => {
      const { token, email } = request.query;

      if (!token || !email) {
        return reply
          .status(400)
          .send({ error: "Token y email son requeridos" });
      }

      try {
        await new Promise((resolve, reject) => {
          db.run(
            "UPDATE users SET is_verified = 1 WHERE email = ? AND verification_token = ?",
            [email, token],
            function (err) {
              if (err) return reject(err);
              if (this.changes === 0) {
                return reject(new Error("Token inválido o email incorrecto"));
              }
              resolve();
            }
          );
        });

        reply.send({
          success: true,
          message: "Email verificado correctamente",
        })
        .redirect(process.env.FRONTEND_URL);
      } catch (error) {
        console.error("Error al verificar email:", error);
        reply.status(400).send({ error: error.message });
      }
    }
  );

  // GET /check-2fa-status/:userId
  fastify.get(
    "/check-2fa-status/:userId",
    {
      schema: {
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: {
              type: "string",
              pattern: "^[0-9]+$",
              description: "ID del usuario (numérico)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              has2FA: {
                type: "boolean",
                description: "Indica si el usuario tiene configurado 2FA",
              },
              is2FAEnabled: {
                type: "boolean",
                description: "Indica si el usuario tiene activado 2FA",
              },
            },
          },
          404: {
            type: "object",
            properties: {
              message: { type: "string" },
              error: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
        description:
          "Consulta el estado de configuración y activación del 2FA de un usuario",
        tags: ["Auth"],
      },
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
          return reply.status(404).send({ error: "Usuario no encontrado" });
        }

        reply.send({
          has2FA: !!user.two_factor_secret,
          is2FAEnabled: !!user.two_factor_enabled,
        });
      } catch (error) {
        console.error("Error al verificar estado 2FA:", error);
        reply.status(500).send({ error: "Error interno del servidor" });
      }
    }
  );
}

