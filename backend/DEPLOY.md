Deploying the backend

Quick options:

- Render (recommended): Connect your GitHub repo, choose "Web Service" and use the following build and start commands:
  - Build command: `npm ci && npm run build`
  - Start command: `npm run start`
  - Set environment variables: `MONGO_URI`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, any other secrets.

- Docker (any provider supporting Docker): Build and push the image, run with `-p 5000:5000` and set env vars.

Required environment variables
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — secret for signing user tokens
- `ADMIN_JWT_SECRET` — secret for signing admin tokens
- `PORT` — optional (defaults to 5000)

Notes about WebSockets
- Ensure your host provides TLS (https/wss) otherwise browsers may block socket connections from secure sites.
- When the backend is deployed at `https://api.example.com`, configure the frontend environment variables on Vercel:
  - `NEXT_PUBLIC_API_URL=https://api.example.com/api`
  - `NEXT_PUBLIC_SOCKET_URL=https://api.example.com`
