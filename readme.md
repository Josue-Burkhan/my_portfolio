# Portafolio personal

Base full-stack organizada con Next.js, TypeScript, Tailwind CSS, PostgreSQL,
Drizzle ORM, Three.js, React Three Fiber, Drei y Anime.js.

## Inicio rápido

1. Usa Node.js 22 o una versión LTS más reciente.
2. Copia `.env.example` a `.env.local`.
3. Inicia PostgreSQL con `docker compose up -d postgres` o usa una instancia externa.
4. Ejecuta `npm run db:push` cuando existan tablas en el esquema.
5. Inicia el entorno local con `npm run dev`.

## Organización

- `src/app`: rutas, layouts, páginas y endpoints HTTP de Next.js.
- `src/components`: componentes compartidos, escenas 3D y animaciones visuales.
- `src/features`: módulos del portafolio agrupados por dominio.
- `src/server`: base de datos, repositorios, servicios y acciones de servidor.
- `src/lib`: utilidades compartidas y validación del entorno.
- `public`: recursos estáticos, modelos 3D, texturas, imágenes y fuentes.
- `drizzle`: migraciones SQL generadas por Drizzle Kit.

El proyecto contiene únicamente la infraestructura inicial; el contenido y las
funcionalidades del portafolio se añadirán después.
