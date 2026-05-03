# Mobili — Mobiliario de Diseño

Aplicación web de catálogo y detalles de mobiliario de diseño con visualización 3D interactiva, inspirada en [Madera.app](https://madera.app).

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript 5
- **3D**: Three.js + React Three Fiber + Drei
- **UI**: Tailwind CSS 4 + shadcn/ui
- **Animaciones**: Framer Motion
- **Estado**: Zustand + TanStack Query
- **Tema**: Dark mode por defecto (next-themes)
- **ORM**: Prisma (SQLite)

## Funcionalidades

- Catálogo de mobiliario de diseño con filtros por categoría
- Visor 3D interactivo con modelos de muebles (rotación, zoom)
- Selector de acabados y materiales en tiempo real
- Vista de detalle con especificaciones completas
- Diseño responsivo (mobile-first)
- Modo claro/oscuro
- Búsqueda por nombre, diseñador o descripción

## Piezas incluidas

| Pieza | Diseñador | Año |
|-------|-----------|-----|
| Silla Wishbone CH24 | Hans J. Wegner | 1949 |
| Mesa Noguchi | Isamu Noguchi | 1947 |
| Sofá Barcelona | Ludwig Mies van der Rohe | 1929 |
| Estante String | Nisse Strinning | 1949 |
| Lámpara AJ | Arne Jacobsen | 1957 |
| Cama Platform | Estudio Møbel | 2020 |
| Silla Ant 3100 | Arne Jacobsen | 1952 |
| Mesa Circular Saarinen | Eero Saarinen | 1957 |

## Desarrollo

```bash
# Instalar dependencias
bun install

# Iniciar servidor de desarrollo
bun run dev

# Inicializar base de datos
bun run db:push
```

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout con tema oscuro
│   ├── page.tsx           # Página principal
│   └── api/               # API routes
├── components/
│   ├── furniture/         # Componentes del catálogo y detalle
│   ├── viewer/            # Modelos 3D de muebles
│   ├── layout/            # Header y navegación
│   └── ui/                # Componentes shadcn/ui
├── hooks/                 # Custom hooks
├── lib/                   # Datos y utilidades
├── store/                 # Estado global (Zustand)
└── types/                 # Tipos TypeScript
```

## Licencia

MIT
