# Deploy Backend Only to Railway

## Using Railway CLI (Direct Deploy)

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Navigate to Backend Folder
```bash
cd d:\shajgoj\backend
```

### 4. Initialize Railway Project
```bash
railway init
```
- Choose "Create a new project"
- Give it a name (e.g., "shajgoj-backend")

### 5. Add PostgreSQL Database
```bash
railway add --database postgres
```

### 6. Set Environment Variables
```bash
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway variables set DIRECT_URL='${{Postgres.DATABASE_URL}}'
railway variables set JWT_SECRET='031535f7d8d9762b802fa8ca1d0a8286f707869bebdcfeca92e6d6a5662e7dee59da2ff17693fdf34d656dfb56e1f57a10b785fb7a3ec87fa5812a34538ae058'
railway variables set NODE_ENV='production'
railway variables set FRONTEND_URL='http://localhost:3000'
railway variables set CLOUDINARY_CLOUD_NAME='dz6uaimeu'
railway variables set CLOUDINARY_API_KEY='173428117978167'
railway variables set CLOUDINARY_API_SECRET='BoPQg6hqxqkT9exRNNcx_hKbIRY'
```

### 7. Deploy
```bash
railway up
```

### 8. Run Database Migrations
```bash
railway run npx prisma migrate deploy --schema ./prisma/schema.prisma
```

### 9. Generate Domain
```bash
railway domain
```
Or do it in the Railway dashboard: Settings → Domains → Generate Domain

### 10. Get Your Backend URL
The CLI will show your URL, or check Railway dashboard.

---

## Using GitHub with Root Directory Set

If you prefer GitHub auto-deploy:

1. Push your code to GitHub
2. In Railway dashboard:
   - New Project → Deploy from GitHub
   - Select your repo
   - **Settings → Root Directory → `backend`**
3. Railway will only build/deploy the backend folder

---

## Verify Deployment

Test your backend:
```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{"status":"ok","message":"Server is running"}
```

---

## Update Frontend Environment Variable

After deployment, update your frontend `.env`:

```env
# For Next.js
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app

# For Vite/React
VITE_API_URL=https://your-app.up.railway.app
```

Don't forget to update the `FRONTEND_URL` in Railway to your actual frontend URL once deployed!
