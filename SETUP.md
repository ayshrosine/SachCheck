# SachCheck Setup Guide

This guide will help you set up SachCheck from scratch. Follow these steps in order.

## Step 1: Prerequisites Installation

### Windows Setup

1. **Install Python 3.11+**
   - Download from [python.org](https://www.python.org/downloads/)
   - During installation, check "Add Python to PATH"

2. **Install Node.js 18+**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version

3. **Install Git**
   - Download from [git-scm.com](https://git-scm.com/download/win)

4. **Install Docker Desktop**
   - Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Start Docker Desktop after installation

## Step 2: Service Account Setup

### 2.1 Google AI Studio API (Free)

1. Go to [ai.google.dev](https://ai.google.dev)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy the API key
5. Save it for later

### 2.2 Supabase Setup (Free)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/login
4. Create a new project:
   - Name: `sachcheck`
   - Database password: (generate a strong password)
   - Region: Choose nearest to you
5. Wait for project to be created (2-3 minutes)
6. Go to Settings → API
7. Copy these values:
   - Project URL
   - anon public key
   - service_role key (secret!)
8. Go to SQL Editor and run the schema from `infra/schema.sql`

### 2.3 Cloudflare R2 Setup (Free)

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up/login
3. Go to R2 → Create Bucket
4. Create bucket named `sachcheck-media`
5. Go to R2 → Manage R2 API Tokens
6. Create API token with these permissions:
   - Object Read & Write
   - Admin Read
7. Copy:
   - Access Key ID
   - Secret Access Key
   - Account ID (from dashboard URL)

## Step 3: Backend Setup

### 3.1 Create Virtual Environment

```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

### 3.2 Install Dependencies

```bash
pip install -r requirements.txt
```

### 3.3 Configure Environment

```bash
copy .env.example .env
```

Edit `.env` file with your credentials:

```env
GOOGLE_AI_STUDIO_API_KEY=your_google_api_key
GEMMA_MODEL_ID=gemma-4-12b-unified
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_BUCKET=sachcheck-media
OLLAMA_BASE_URL=http://localhost:11434
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### 3.4 Test Backend

```bash
python -m uvicorn app.main:app --reload
```

Visit http://localhost:8000 to see the API documentation.

## Step 4: Web Frontend Setup

### 4.1 Install Dependencies

```bash
cd web
npm install
```

### 4.2 Configure Environment

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4.3 Test Frontend

```bash
npm run dev
```

Visit http://localhost:3000 to see the web interface.

## Step 5: Mobile App Setup

### 5.1 Install Dependencies

```bash
cd mobile
npm install
```

### 5.2 Configure Environment

Create `.env` file:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### 5.3 Test Mobile App

```bash
npx expo start
```

Scan the QR code with Expo Go app on your phone.

## Step 6: Docker Setup (Optional for Production)

### 6.1 Configure Caddyfile

Edit `infra/Caddyfile` and replace domain names:

```caddyfile
sachcheck.yourdomain.com {
    reverse_proxy web:3000
    encode gzip
}

api.sachcheck.yourdomain.com {
    reverse_proxy backend:8000
    encode gzip
}
```

### 6.2 Build and Run

```bash
cd infra
docker-compose up -d --build
```

### 6.3 Pull Ollama Model

```bash
docker exec -it sachcheck-ollama ollama pull gemma4:e4b
```

## Step 7: Testing the System

### 7.1 Test Backend Health

```bash
curl http://localhost:8000/health
```

### 7.2 Test File Upload

1. Go to http://localhost:3000
2. Upload a test image/video
3. Check the analysis result

### 7.3 Test API Directly

```bash
curl -F "file=@test_image.jpg" \
  -F "device_id=test_device" \
  http://localhost:8000/api/scan
```

## Step 8: Production Deployment

### 8.1 Server Setup

1. Get a VPS (Oracle Cloud Free or Hetzner)
2. SSH into the server
3. Install Docker and Docker Compose
4. Clone the repository
5. Configure environment variables
6. Run: `docker-compose up -d --build`

### 8.2 Domain Setup

1. Buy a domain
2. Point DNS to your VPS IP
3. Update Caddyfile with your domain
4. Restart Caddy: `docker-compose restart caddy`

### 8.3 GitHub Actions Setup

1. Go to your repository Settings → Secrets
2. Add these secrets:
   - `VPS_HOST`: Your server IP/domain
   - `VPS_USER`: SSH username
   - `VPS_SSH_KEY`: Private SSH key
   - `API_URL`: Your API URL
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

## Troubleshooting

### Backend Issues

**Problem**: Module not found errors
**Solution**: Make sure virtual environment is activated and dependencies installed

**Problem**: Database connection errors
**Solution**: Check Supabase credentials in `.env` and ensure Supabase project is active

### Frontend Issues

**Problem**: API connection errors
**Solution**: Check `NEXT_PUBLIC_API_URL` in `.env.local` and ensure backend is running

**Problem**: Build errors
**Solution**: Delete `node_modules` and `.next` folders, run `npm install` again

### Mobile Issues

**Problem**: Expo won't start
**Solution**: Clear Expo cache: `npx expo start -c`

**Problem**: Share intent not working
**Solution**: Ensure app is built and installed on device (not in Expo Go)

### Docker Issues

**Problem**: Containers won't start
**Solution**: Check logs: `docker-compose logs`

**Problem**: SSL certificate errors
**Solution**: Ensure domain DNS is propagated and Caddyfile has correct domain

## Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Enable R2 lifecycle rule for 48-hour deletion
- [ ] Configure Supabase RLS policies
- [ ] Set up Sentry for error monitoring
- [ ] Enable HTTPS (Caddy handles this automatically)
- [ ] Configure rate limiting
- [ ] Set up backup for database
- [ ] Review and update privacy policy
- [ ] Test GDPR/DPDP compliance features

## Next Steps

1. Add demo test files to `demo_data/` directory
2. Test with real media files
3. Set up monitoring and alerts
4. Configure WhatsApp Cloud API (optional)
5. Deploy to production server
6. Set up CI/CD pipeline
7. Test with real users

## Support

If you encounter issues:

1. Check the logs in each service
2. Review the troubleshooting section
3. Check GitHub issues
4. Contact support@sachcheck.com

---

Remember: This is a production-grade system. Take time to properly configure each service before deploying to production.