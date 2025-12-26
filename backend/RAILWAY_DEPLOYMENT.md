# Railway Deployment Guide

## Prerequisites
- Railway account (sign up at https://railway.app)
- Your backend code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step-by-Step Deployment

### 1. Create a New Project on Railway

1. Go to https://railway.app and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your repository (shajgoj)
6. Railway will auto-detect the backend folder

### 2. Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will create a PostgreSQL instance
4. Click on the PostgreSQL service
5. Go to **"Variables"** tab
6. Copy the `DATABASE_URL` (you'll need this)

### 3. Configure Environment Variables

1. Click on your backend service (not the database)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add these variables:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=031535f7d8d9762b802fa8ca1d0a8286f707869bebdcfeca92e6d6a5662e7dee59da2ff17693fdf34d656dfb56e1f57a10b785fb7a3ec87fa5812a34538ae058
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
FRONTEND_URLS=https://your-frontend-domain.vercel.app,https://your-frontend-domain.com
CLOUDINARY_CLOUD_NAME=dz6uaimeu
CLOUDINARY_API_KEY=173428117978167
CLOUDINARY_API_SECRET=BoPQg6hqxqkT9exRNNcx_hKbIRY
```

**Important Notes:**
- Replace `https://your-frontend-domain.vercel.app` with your actual frontend URL
- The `${{Postgres.DATABASE_URL}}` syntax references your Railway PostgreSQL database
- Update `FRONTEND_URLS` with all your frontend domains (comma-separated)

### 4. Set Root Directory (If Needed)

If your repository has both frontend and backend:

1. Click on your backend service
2. Go to **"Settings"** tab
3. Find **"Root Directory"**
4. Set it to `backend`
5. Click **"Save"**

### 5. Run Database Migrations

After the first deployment:

1. Click on your backend service
2. Go to **"Deployments"** tab
3. Wait for the build to complete
4. Click on the latest deployment
5. Open **"View Logs"**
6. In the **"Settings"** tab, find **"Custom Start Command"**
7. Temporarily change it to: `npx prisma migrate deploy --schema ./prisma/schema.prisma && npm run start`
8. Redeploy

Or use Railway CLI:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy --schema ./prisma/schema.prisma
```

### 6. Get Your Backend URL

1. Click on your backend service
2. Go to **"Settings"** tab
3. Find **"Domains"** section
4. Click **"Generate Domain"**
5. Railway will give you a URL like: `https://your-app.up.railway.app`
6. Copy this URL - you'll use it in your frontend

### 7. Configure Frontend to Use Railway Backend

In your frontend `.env` or `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
# or
VITE_API_URL=https://your-app.up.railway.app
```

### 8. Update CORS in Backend

Make sure your Railway backend URL is in the `FRONTEND_URLS` environment variable:

```
FRONTEND_URLS=https://your-frontend.vercel.app,http://localhost:3000
```

## Troubleshooting

### Build Fails

1. Check the build logs in Railway
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript compiles locally: `npm run build`

### Database Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Check that Prisma migrations ran successfully
3. Try running migrations manually via Railway CLI

### CORS Errors

1. Add your frontend URL to `FRONTEND_URLS` environment variable
2. Include both with and without `www` if applicable
3. Redeploy after changing environment variables

### Port Issues

Railway automatically assigns a `PORT` environment variable. Your server.ts already handles this:
```typescript
const PORT = process.env.PORT || 5000;
```

## Monitoring

- **Logs**: Click on your service → "Deployments" → Select deployment → "View Logs"
- **Metrics**: Railway provides CPU, Memory, and Network metrics
- **Alerts**: Set up in Railway dashboard for deployment failures

## Auto-Deploy

Railway automatically deploys when you push to your main branch. To disable:

1. Go to service **"Settings"**
2. Find **"Automatic Deployments"**
3. Toggle on/off

## Custom Domain (Optional)

1. Go to service **"Settings"**
2. Find **"Domains"** section
3. Click **"Custom Domain"**
4. Add your domain (e.g., `api.yourdomain.com`)
5. Update DNS records as shown by Railway

## Cost

Railway offers:
- **Free Tier**: $5 worth of usage per month
- **Pro Plan**: $20/month with $20 credit

Monitor your usage in the Railway dashboard.

## Useful Commands

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# View logs
railway logs

# Run a command in Railway environment
railway run <command>

# Deploy manually
railway up
```

## Health Check

Your backend has a health endpoint at `/health`. Test it:

```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Next Steps

1. Test all API endpoints with your Railway URL
2. Update frontend to use the new backend URL
3. Run a full test of your application
4. Set up monitoring and alerts
5. Consider adding a custom domain for production

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
