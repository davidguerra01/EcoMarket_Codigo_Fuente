# 🌿 EcoMarket — Plataforma de Comercio Ecológico Local

**EcoMarket** es una aplicación móvil fullstack para conectar productores locales con consumidores, promoviendo el comercio sostenible. Desarrollada con **FastAPI + PostgreSQL** (backend) y **Expo React Native** (mobile).

---

## 📦 Estructura del Proyecto

```
EcoMarket/
├── backend/                  ← API REST (FastAPI + PostgreSQL + JWT)
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py     ← Variables de entorno con Pydantic Settings
│   │   │   └── security.py   ← JWT: crear, validar, get_current_user
│   │   ├── db/
│   │   │   ├── base.py       ← Base declarativa SQLAlchemy
│   │   │   └── session.py    ← Engine + get_db dependency
│   │   ├── models/           ← Modelos ORM (User, Product, Order, etc.)
│   │   ├── routes/
│   │   │   ├── auth_routes.py      ← /auth/register, /login, /logout, /refresh
│   │   │   ├── protected_routes.py ← /protected/dashboard (requiere Bearer token)
│   │   │   └── all_routes.py       ← categorías, productos, carrito, órdenes, pagos, notificaciones
│   │   ├── schemas/          ← Pydantic schemas (validación de entrada/salida)
│   │   └── utils/
│   │       └── seed_data.py  ← Seed inicial: roles + categorías
│   ├── alembic/              ← Migraciones de base de datos
│   ├── Dockerfile
│   ├── docker-compose.yml    ← PostgreSQL + API + pgAdmin
│   ├── entrypoint.sh
│   ├── requirements.txt
│   └── .env.example
│
├── mobile/                   ← App móvil (Expo React Native SDK 54)
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js    ← JWT + AsyncStorage (persistencia de sesión)
│   │   ├── hooks/
│   │   │   ├── useCamera.js      ← Lógica nativa de cámara (desacoplada)
│   │   │   └── useLocation.js    ← Lógica nativa de GPS (desacoplada)
│   │   ├── navigation/
│   │   │   ├── AuthStack.js      ← Login / Registro
│   │   │   └── AppTabs.js        ← Tabs: Inicio, Carrito, Pedidos, Cámara, Ubicación
│   │   └── screens/
│   │       ├── LoginScreen.js
│   │       ├── RegisterScreen.js
│   │       ├── HomeScreen.js     ← Catálogo con filtros
│   │       ├── CartScreen.js     ← Carrito + checkout
│   │       ├── OrdersScreen.js   ← Historial de órdenes
│   │       ├── CameraScreen.js   ← Cámara nativa (UI desacoplada)
│   │       └── LocationScreen.js ← GPS + productores cercanos
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🚀 Inicio Rápido

### Backend (Opción A — Docker, recomendado)

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env

# Levantar todo (PostgreSQL + API + pgAdmin)
docker compose up -d --build
```

**URLs disponibles:**
| Servicio | URL |
|---|---|
| API REST | http://localhost:8000 |
| Swagger (docs) | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

> pgAdmin: `admin@ecomarket.local` / `admin123`

---

### Backend (Opción B — PostgreSQL en la nube)

```bash
cd backend
pip install -r requirements.txt

# En .env, pegar el connection string de Neon o Supabase:
# DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require

alembic upgrade head
python -m app.utils.seed_data
uvicorn app.main:app --reload
```

---

### Mobile

```bash
cd mobile
npm install

# Configurar URL del backend
cp .env.example .env
# Editar EXPO_PUBLIC_API_URL con la IP de tu PC

npx expo start
```

Escanea el QR con **Expo Go** (Android/iOS) o presiona `a` para emulador Android.

---

## 🔐 A. Autenticación JWT

### Endpoints de Auth

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/auth/roles` | Listar roles disponibles | No |
| POST | `/auth/register` | Registro (CLIENTE o PRODUCTOR) | No |
| POST | `/auth/login` | Login → Access Token + Refresh Token | No |
| POST | `/auth/logout` | Invalidar token en BD | ✅ Bearer |
| POST | `/auth/refresh` | Renovar Access Token | No |

### Flujo completo

```
1. POST /auth/login  { email, password }
   ↓
   { access_token, refresh_token, user: { id, nombre, role } }

2. Guardar tokens en AsyncStorage (persistencia segura en el cliente)

3. Todas las peticiones protegidas:
   Authorization: Bearer <access_token>

4. POST /auth/logout → token invalidado en tabla sesiones_tokens

5. POST /auth/refresh { refresh_token } → nuevo access_token (7 días)
```

---

## 🛡️ B. Protección de Endpoints

Todos los endpoints marcados con 🔒 requieren el header:
```
Authorization: Bearer <access_token>
```

El middleware `get_current_user` en `app/core/security.py`:
1. Extrae el token del header `Authorization: Bearer ...`
2. Decodifica y verifica la firma JWT
3. Verifica que el token esté activo en la tabla `sesiones_tokens`
4. Retorna el usuario autenticado o lanza HTTP 401

```python
@router.get("/protected/dashboard")
def dashboard(current_user: User = Depends(get_current_user)):
    return {"message": f"Bienvenido {current_user.nombre}"}
```

---

## 📱 C. Funcionalidades Nativas (Hardware)

### 📷 Cámara (`useCamera.js` + `CameraScreen.js`)

| Función | Descripción |
|---|---|
| `requestPermissions()` | Solicita permisos de cámara Y galería (mínimo acceso) |
| `takePhoto()` | Captura foto con calidad 0.7 |
| `savePhoto(uri)` | Guarda en galería del dispositivo |
| `toggleFacing()` | Alterna cámara frontal / trasera |
| `discardPhoto()` | Descarta foto para repetir |

### 📍 Geolocalización (`useLocation.js` + `LocationScreen.js`)

| Función | Descripción |
|---|---|
| `requestPermission()` | Solo foreground (nunca background) |
| `getCurrentLocation()` | Coordenadas actuales + geocodificación inversa |
| `startWatching()` | Seguimiento continuo (cada 5s / 10m) |
| `stopWatching()` | Libera recursos del GPS |

---

## 🏗️ D. Gestión de Permisos

Todos los permisos siguen el principio de **mínimo acceso**:

| Estado | Comportamiento |
|---|---|
| `granted` | Funcionalidad activada directamente |
| `denied` | Mensaje explicativo + opción a Configuración |
| `blocked` | Guía para activar manualmente en el sistema |

---

## 🗺️ Flujo Demo para Clase

```
1. GET  /auth/roles                         → ver IDs de roles
2. POST /auth/register                      → crear cuenta CLIENTE
3. POST /auth/login                         → obtener token
4. GET  /protected/dashboard                → ruta protegida (Bearer token)
5. GET  /categorias/                        → ver categorías
6. GET  /productos/?q=café                  → buscar productos
7. POST /carrito/items                      → agregar al carrito
8. GET  /carrito/                           → ver carrito
9. POST /carrito/checkout                   → crear orden
10. POST /pagos/confirmar                   → confirmar pago
11. GET  /ordenes/mias                      → historial
12. GET  /notificaciones?no_leidas=true     → notificaciones
```

---

## 🛠️ Tecnologías

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| FastAPI | 0.115.2 | Framework API REST |
| SQLAlchemy | 2.0.32 | ORM |
| Alembic | 1.13.2 | Migraciones |
| python-jose | 3.3.0 | JWT |
| passlib + bcrypt | 1.7.4 / 4.0.1 | Hash de contraseñas |
| PostgreSQL | 15 | Base de datos |

### Mobile
| Tecnología | Versión | Uso |
|---|---|---|
| Expo | ~54.0.0 | Framework React Native |
| expo-camera | ~17.0.10 | Cámara nativa |
| expo-location | ~19.0.8 | GPS y geocodificación |
| expo-media-library | ~18.2.1 | Galería del dispositivo |
| AsyncStorage | 2.2.0 | Persistencia de sesión |
| Axios | ^1.7.7 | Cliente HTTP |

---

## 👨‍💻 Autor

**David Paúl Guerra Delgado**
Universidad Estatal Amazónica — Aplicaciones Móviles 2025-2026

---

## 📄 Licencia

MIT
