# Sensores-iot — SlideWatch Dashboard 

Frontend del sistema **SlideWatch**: una alerta temprana de deslizamientos de tierra. Es un dashboard en **React + Vite** que consume la API de [`BackIOT_Sensores`](https://github.com/DilanMamani/BackIOT_Sensores), con vistas separadas para **administradores** (monitoreo en tiempo real, histórico, alertas, mapa) y **ciudadanos** (reportar incidentes, ver sus reportes, mapa).

## Stack

- **React 18 + Vite 5**
- **React Router v6** — ruteo con rutas protegidas por rol
- **Socket.IO Client** — actualización en tiempo real de lecturas de sensores
- **Recharts** — gráficos de series temporales
- **SweetAlert2** — modales y alertas de UI
- **lucide-react** — iconografía
- **Open-Meteo API** — clima actual (sin API key)

## Estructura del proyecto
sensores-iot/

├── src/

│   ├── api/                 # Cliente HTTP, socket y llamadas a cada módulo del backend

│   │   ├── http.js           # fetch wrapper + manejo de JWT (localStorage)

│   │   ├── socket.js          # cliente Socket.IO singleton

│   │   ├── authApi.js, dashboardApi.js, alertsApi.js, historyApi.js,

│   │   │   riskHistoryApi.js, mapApi.js, reportsApi.js, weatherApi.js

│   ├── components/

│   │   ├── dashboard/         # StatCard, SensorChart, AlertPanel, StatusPanel, Sidebar

│   │   └── layout/             # ProtectedRoute, PublicOnlyRoute

│   ├── context/

│   │   └── AuthContext.jsx      # sesión, login/register/logout, restauración de sesión

│   ├── hooks/                    # useDashboardData, useSocketSnapshot, useAlerts,

│   │                               useHistoryData, useRiskHistory, useMapSocket, useWeather

│   ├── pages/

│   │   ├── public/Landing.jsx     # landing pública

│   │   ├── auth/Login.jsx, Register.jsx

│   │   ├── Dashboard.jsx          # vista admin: snapshot + series en tiempo real

│   │   ├── Historico.jsx

│   │   ├── AlertasHistorico.jsx

│   │   ├── admin/AdminMap.jsx

│   │   └── citizen/                # CitizenLayout, CitizenHome, MisReportes, NuevoReporte, CitizenMap

│   ├── routes/AppRouter.jsx        # definición de todas las rutas

│   ├── utils/                       # formatters, statusHelpers

│   └── styles/                       # CSS por sección

├── public/

├── index.html

├── vite.config.js

├── eslint.config.js

└── package.json

## Requisitos previos

- Node.js 18+ (recomendado 20+)
- npm 10+
- El backend [`BackIOT_Sensores`](https://github.com/DilanMamani/BackIOT_Sensores) corriendo (local o desplegado)

## Instalación

```bash
git clone https://github.com/TaniaPerezD/sensores-iot.git
cd sensores-iot
npm install
```

Crea un archivo `.env` en la raíz:

```env
VITE_API_URL=http://localhost:3000
```

Si no defines `VITE_API_URL`, por defecto apunta a `http://localhost:3000`.

## Scripts disponibles

```bash
npm run dev       # entorno de desarrollo (Vite)
npm run build     # build de producción
npm run preview   # previsualiza el build de producción
```

## Funcionalidades

**Autenticación y roles**
- Login / registro contra `/api/auth`, con JWT guardado en `localStorage` (`sensores_iot_auth`).
- Rutas protegidas por rol vía `ProtectedRoute` (`admin` vs `ciudadano`); cada uno es redirigido automáticamente a su área si intenta entrar a una ruta que no le corresponde.

**Vista administrador** (`/dashboard`, `/mapa`)
- Snapshot y series históricas por dispositivo (`esp32-node-001` por defecto), con selector de rango temporal.
- Actualización en tiempo real vía Socket.IO (evento `snapshot:update`).
- Panel de alertas y clima actual (Open-Meteo) para contextualizar el riesgo de deslizamiento.
- Mapa con dispositivos IoT y reportes ciudadanos geolocalizados.

**Vista ciudadano** (`/ciudadano/*`)
- Crear reportes de incidentes (grietas, hundimientos, derrumbes, etc.) con foto y nivel de urgencia.
- Ver sus propios reportes y su estado (pendiente / en revisión / atendido / descartado).
- Mapa ciudadano con reportes recientes.

## Conexión con el backend

Este frontend espera que `BackIOT_Sensores` esté corriendo y expuesto en `VITE_API_URL`, incluyendo:
- API REST en `/api/*` (auth, dashboard, history, alerts, devices, reports, map, risk-history)
- WebSocket (Socket.IO) en la misma URL base, para el evento `snapshot:update`
