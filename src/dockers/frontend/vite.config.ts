import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default {
  server: {
    port: 3001,
    host: true,
  },
  build:{
    outDir: 'dist',
    emptyOutDir: true,  // Limpia el directorio de salida antes de construir
    rollupOptions: {
      input: {
        main: resolve(__dirname, './index.html'),  // Indica que `index.html` es el punto de entrada
        style: './src/app.css',  // Añade el archivo CSS generado por Tailwind
      },
      output: {
        assetFileNames: 'assets/[name].[ext]' // Configura cómo se deben generar los nombres de los archivos
      }
    }
  },
  css: {
    postcss: './postcss.config.js'
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': '/src', // Alias para simplificar rutas, opcional
    },
  },
  root: '.',
  mode: 'production',  // Especifica el modo de construcción
  base: './',  // Establece el path base relativo para producción
};