# Back (Backend)

Backend mínimo para **usuarios**, **login (JWT)**, **historial de compras** y **checkout**.

## Requisitos

- Node.js 18+ (recomendado 20+)

## Instalar y ejecutar

```bash
cd Back
npm install
npm run dev
```

Por defecto corre en `http://localhost:4000`.

## Endpoints

- `GET /api/health`
- `POST /api/auth/register` `{ username, password }`
- `POST /api/auth/login` `{ username, password }` → `{ token }`
- `GET /api/me` (Bearer token)
- `GET /api/orders` (Bearer token)
- `POST /api/checkout` (Bearer token) `{ items: [...] }` → `{ orderId }` (y en el futuro `{ checkoutUrl }`)

