# sensores-iot

Base en **React + Vite** para un dashboard de sensores IoT (giroscopio, humedad del suelo y vibración).

## Requisitos

- Node.js ^20.19.0 o >=22.12.0
- npm 10+

## Ejecutar en local

```bash
npm install
npm run dev
```

## Scripts disponibles

- `npm run dev`: inicia el entorno de desarrollo
- `npm run build`: genera build de producción
- `npm run lint`: ejecuta ESLint
- `npm run preview`: previsualiza el build

## Estado actual

La app incluye:

- Layout inicial de dashboard
- Tarjetas de sensores con estado (`Normal` / `Alerta`)
- Datos simulados y botón de actualización manual
