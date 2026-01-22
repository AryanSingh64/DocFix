# Railway Deployment Configuration

This project is configured to deploy on Railway with Ghostscript support.

## Quick Deploy Steps

1. **Push to GitHub** (if not already)
2. **Go to [Railway](https://railway.app)** and sign in with GitHub
3. **New Project → Deploy from GitHub Repo → Select this repo**
4. **Add Environment Variables** (Settings → Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

5. **Deploy!** Railway auto-detects Next.js and installs Ghostscript

## Notes
- Free tier: $5/month credit (renews monthly)
- Ghostscript is installed via `railway.toml` config
- App may sleep after 20-30 min of inactivity (wakes on request)
