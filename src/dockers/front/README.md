
# Arquitectura de directorios
```
proyecto/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── Button/
│   │   │   ├── Button.ts
│   │   │   ├── Button.html
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── Card.ts
│   │   │   ├── Card.html
│   │   │   └── index.ts
│   │   └── ...
│   ├── pages/            # Páginas concretas
│   │   ├── home/
│   │   │   ├── home.ts
│   │   │   └── home.html
│   │   └── ...
│   ├── utils/            # Utilidades
│   │   └── component.ts  # Clase base para componentes
│   ├── styles/           # Estilos específicos que complementan Tailwind
│   │   └── main.css
│   └── main.ts           # Punto de entrada
├── public/              # Assets estáticos
│   ├── index.html
│   ├── css/
│   │   └── tailwind.css  # CSS compilado de Tailwind
│   └── js/
│       └── bundle.js     # JavaScript compilado
├── server.js            # Servidor Fastify
├── tailwind.config.js   # Configuración de Tailwind
├── tsconfig.json        # Configuración de TypeScript
└── package.json

```