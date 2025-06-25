-- sqlite/tools/init.sql

-- Eliminar tablas existentes para asegurar una inicialización limpia en cada arranque si el volumen está vacío
-- Nota: En producción, querrías una estrategia de migración, no DROP IF EXISTS.
DROP TABLE IF EXISTS two_fa_tokens;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS revoked_tokens;
DROP TABLE IF EXISTS security_logs;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_relationships;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS items;


-- Tabla de usuarios principal
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    last_name TEXT,
    favourite_color TEXT,
    bio TEXT,
    country TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT 0,
    verification_token TEXT,
    avatar_url TEXT DEFAULT '/images/pfp.jpg',
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT 0
);

-- Tabla de juegos
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_id TEXT NOT NULL, -- Referencia al username, no al ID si la FOREIGN KEY es a username
    loser_id TEXT NOT NULL,  -- Referencia al username
    tournament BOOLEAN,
    score_winner INTEGER DEFAULT 0,
    score_loser INTEGER DEFAULT 0,
    exp_winner INTEGER DEFAULT 0,
    exp_loser INTEGER DEFAULT 0,
    game_duration INTEGER, -- en segundos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    -- Las FOREIGN KEY deberían ser a users(id) si id es el PK y el join es a ID
    -- Si winner_id y loser_id son los usernames, entonces no pueden ser FK a users(id)
    -- Asumo que winner_id/loser_id se refieren al 'username' de la tabla 'users'
    FOREIGN KEY (winner_id) REFERENCES users(username), -- Esto es inusual, normalmente es a ID.
    FOREIGN KEY (loser_id) REFERENCES users(username)   -- Si cambias users.username a UNIQUE, funciona.
);

-- Tabla de relaciones entre usuarios (amistades, bloqueos, etc.)
CREATE TABLE IF NOT EXISTS user_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    related_user_id INTEGER NOT NULL,
    relationship_type TEXT CHECK(relationship_type IN ('friend', 'blocked', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (related_user_id) REFERENCES users(id),
    UNIQUE(user_id, related_user_id, relationship_type)
);

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla para recuperación de contraseñas
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reset_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de logs de seguridad
CREATE TABLE IF NOT EXISTS security_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Añadido al final
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  device_info TEXT,
  revoked BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti TEXT PRIMARY KEY,
  user_id INTEGER,
  revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS two_fa_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_jti ON revoked_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_games_players ON games(winner_id, loser_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships ON user_relationships(user_id, related_user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Tabla items
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT
);

-- Insertar datos de prueba
INSERT INTO items (name, description) VALUES 
    ('Item 1', 'Descripción del Item 1'),
    ('Item 2', 'Descripción del Item 2');
