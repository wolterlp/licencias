# Sistema de Licencias SaaS

Este módulo implementa un servidor de licencias independiente para la validación y gestión de suscripciones del sistema POS.

## Estructura

- **src/config**: Configuración de base de datos (MongoDB).
- **src/controllers**: Controladores de la API REST.
- **src/models**: Modelos de Mongoose (License).
- **src/routes**: Definición de rutas de la API.
- **src/services**: Lógica de negocio (generación de claves, renovación, validación).
- **src/utils**: Utilidades de criptografía y seguridad.

## Instalación

1.  Navegar a la carpeta `licencias`:
    ```bash
    cd licencias
    ```
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Configurar variables de entorno:
    - Copiar `.env.example` a `.env`
    - Ajustar `MONGO_URI` y `LICENSE_SECRET`

## Uso

### Iniciar Servidor
```bash
npm run dev
```

### Endpoints API

- **POST /api/licenses/create**: Generar una nueva licencia.
- **POST /api/licenses/validate**: Validar una licencia existente (usado por el POS).
- **POST /api/licenses/renew**: Renovar una licencia.
- **POST /api/licenses/deactivate**: Suspender una licencia.
- **GET /api/licenses/:licenseKey**: Obtener detalles de una licencia.

## Integración con POS

El sistema POS debe realizar una petición POST a `/api/licenses/validate` al inicio y periódicamente.
Si la respuesta es `valid: false`, el POS debe bloquear el acceso.
