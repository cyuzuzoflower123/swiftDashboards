# Swift Fleet Project Structure

The project is split into two folders:

- `frontend-project` - React + Vite + Tailwind frontend. Runs on port `5173`.
- `backend-project` - Express + MySQL backend. Runs on port `3000`.

## Backend

```bash
cd backend-project
npm install
npm start
```

Import `backend-project/schema.sql` into MySQL before starting the backend.

## Frontend

```bash
cd frontend-project
npm install
npm run dev
```

The frontend calls the backend at `http://localhost:3000/api`.