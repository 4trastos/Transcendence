declare namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      DATABASE_PASSWORD: string;
      VAULT_ADDR: string;
      VAULT_TOKEN: string;
      ROOT_TOKEN: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      REFRESH_TOKEN_EXPIRES_IN: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_REDIRECT_URI: string;
      EMAIL_FROM: string;
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_USER: string;
      EMAIL_PASS: string;
      NODE_ENV: string;
      BASE_URL: string;
      REACT_APP_GOOGLE_CLIENT_ID: string; // Si lo usas en el frontend
    }
  }