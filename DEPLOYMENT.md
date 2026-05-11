# LexiFlow Deployment

## Frontend (Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_FASTAPI_URL=https://your-api.railway.app
```

## Backend (Railway)

```env
DEEPL_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
OPENAI_API_KEY=
TELEGRAM_BOT_TOKEN=
ALLOWED_ORIGINS=https://your-app.vercel.app
```

For local and production frontend access, set Railway `ALLOWED_ORIGINS` to:

```env
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

## Deployment Steps

1. Deploy `lexiflow-api/` to Railway.
2. Copy the Railway public URL.
3. Deploy the Next.js root project to Vercel.
4. Set the frontend environment variables in Vercel and backend variables in Railway.
5. Update Supabase Auth URLs:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URL: `https://your-app.vercel.app/auth/callback`
   - Local redirect URL: `http://localhost:3000/auth/callback`
6. Set the Telegram webhook after Railway is deployed:

```bash
curl "https://your-api.railway.app/api/telegram/setup-webhook?url=https://your-api.railway.app"
```

7. Restart both deployments after environment variables are saved.
