# SachCheck Free Deployment Guide

Complete guide to deploy SachCheck on free tiers and low-cost infrastructure. This guide covers every step from zero to production with minimal costs.

## Table of Contents

1. [Overview of Free Tiers](#overview-of-free-tiers)
2. [Prerequisites](#prerequisites)
3. [Service Setup Guide](#service-setup-guide)
4. [Local Development Setup](#local-development-setup)
5. [Production Deployment](#production-deployment)
6. [Cost Optimization](#cost-optimization)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview of Free Tiers

### Cost Breakdown (Monthly)

| Service | Free Tier | Cost After Free Tier | Notes |
|---------|-----------|---------------------|-------|
| **Google AI Studio API** | Free (rate-limited) | Pay per use | Primary AI model access |
| **Supabase Database** | 500MB storage | $25/month | Postgres + Auth + RLS |
| **Cloudflare R2** | 10GB storage + zero egress | $0.015/GB after 10GB | Media storage |
| **Oracle Cloud Free Tier** | 2 OCPU + 12GB RAM ARM VM | $4-8/month | Backend hosting |
| **Sentry** | 5K events/month | $26/month | Error monitoring |
| **GitHub Actions** | 2,000 minutes/month | $0.008/minute | CI/CD |
| **WhatsApp Cloud API** | Free for user-initiated | Pay per message | Optional channel |

**Total Monthly Cost**: ₹0–400/month (~$0–5/month) for MVP scale

---

## Prerequisites

### Required Accounts

1. **Google Account** (for AI Studio)
2. **Cloudflare Account** (for R2 storage)
3. **Supabase Account** (for database)
4. **Oracle Cloud Account** (for free VPS)
5. **GitHub Account** (for code hosting)
6. **Sentry Account** (optional, for monitoring)

### Required Software

- **Git**: Version control
- **Docker**: Containerization
- **Python 3.11+**: Backend development
- **Node.js 18+**: Frontend development
- **VS Code** or similar IDE

---

## Service Setup Guide

### 1. Google AI Studio Setup (Free)

**Purpose**: Primary AI model access for deepfake detection

**Steps**:

1. Go to [ai.google.dev](https://ai.google.dev)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new project or use existing
5. Copy the API key

**Configuration**:
```env
GOOGLE_AI_STUDIO_API_KEY=your_api_key_here
GEMMA_MODEL_ID=gemma-4-12b-unified
```

**Free Tier Limits**:
- Rate-limited requests per minute/hour
- Suitable for MVP and testing
- No credit card required

**Important**: Create a separate Google Cloud project if you plan to enable billing later. Once billing is enabled, free tier disappears for that project.

---

### 2. Cloudflare R2 Setup (Free)

**Purpose**: Media storage with zero egress fees

**Steps**:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **Create Bucket**
3. Bucket name: `sachcheck-media` (or your preferred name)
4. Select a region closest to your users
5. Click "Create Bucket"

**Get API Credentials**:

1. Go to **R2** → **Manage R2 API Tokens**
2. Click "Create API Token"
3. Permissions: **Object Read & Write**
4. TTL: Use default or set to your preference
5. Copy the following:
   - Access Key ID
   - Secret Access Key
   - Account ID (from URL: `https://dash.cloudflare.com/{account_id}/r2`)

**Configuration**:
```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key
R2_BUCKET=sachcheck-media
```

**Free Tier Limits**:
- 10GB storage
- 1M Class A operations/month
- 10M Class B operations/month
- Zero egress fees (major cost saver)

**Lifecycle Rules** (Privacy):

1. Go to your bucket → **Settings** → **Lifecycle Rules**
2. Add rule:
   - Name: `Auto-delete after 48 hours`
   - Age: 2 days
   - Action: Delete
3. Save

---

### 3. Supabase Setup (Free)

**Purpose**: PostgreSQL database + authentication

**Steps**:

1. Go to [Supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create new project:
   - Name: `sachcheck`
   - Database password: Generate strong password
   - Region: Choose closest to your VPS
   - Pricing plan: Free

**Get API Credentials**:

1. Go to **Project Settings** → **API**
2. Copy:
   - Project URL
   - anon/public key
   - service_role key (keep secret!)

**Configuration**:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Setup Database Schema**:

1. Go to **SQL Editor** in Supabase dashboard
2. Run the schema from `infra/schema.sql`:

```sql
-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    modality TEXT NOT NULL CHECK (modality IN ('video', 'audio', 'image')),
    verdict TEXT NOT NULL CHECK (verdict IN ('likely_real', 'suspicious', 'likely_fake', 'inconclusive')),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reasons JSONB NOT NULL DEFAULT '[]',
    modality_flags JSONB,
    object_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    was_verdict_correct BOOLEAN NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS scans_device_id_created_at ON scans(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS scans_user_id_created_at ON scans(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_scan_id ON feedback(scan_id);

-- Enable Row Level Security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own scans" ON scans
    FOR SELECT USING (device_id = current_setting('app.device_id')::text);

CREATE POLICY "Users can insert own scans" ON scans
    FOR INSERT WITH CHECK (device_id = current_setting('app.device_id')::text);

CREATE POLICY "Users can view feedback on own scans" ON feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scans 
            WHERE scans.id = feedback.scan_id 
            AND scans.device_id = current_setting('app.device_id')::text
        )
    );

CREATE POLICY "Users can insert feedback on own scans" ON feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM scans 
            WHERE scans.id = feedback.scan_id 
            AND scans.device_id = current_setting('app.device_id')::text
        )
    );
```

**Free Tier Limits**:
- 500MB database storage
- 1GB bandwidth
- 2 concurrent connections
- Suitable for MVP and testing

---

### 4. Oracle Cloud Free Tier Setup

**Purpose**: Free VPS for hosting backend and services

**Steps**:

1. Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
2. Sign up with email or existing Oracle account
3. Add credit card (required for verification, not charged)
4. Create account and wait for approval (usually instant)

**Create Free VPS**:

1. Go to **Compute** → **Instances**
2. Click "Create Instance"
3. Configure:
   - Name: `sachcheck-backend`
   - Compartment: Your compartment
   - Shape: `VM.Standard.E2.Flex` (Always Free)
   - OCPU: 2 (Always Free limit)
   - Memory: 12GB (Always Free limit)
   - Operating System: **Oracle Linux** or **Ubuntu**
   - SSH Key: Upload your public SSH key
4. Click "Create"

**Note**: Oracle Cloud Always Free includes:
- 2 AMD-based VMs with up to 4 OCPUs and 24GB memory
- OR 4 ARM-based Ampere A1 cores with 24GB memory
- 200GB total block volume storage

**Alternative**: If Oracle Cloud is not available in your region, use:
- **Hetzner CX22**: ~₹380–420/month (€4-5/month)
- **DigitalOcean Droplet**: $4/month
- **Linode**: $5/month

---

### 5. Sentry Setup (Optional, Free)

**Purpose**: Error tracking and monitoring

**Steps**:

1. Go to [Sentry.io](https://sentry.io)
2. Sign up with GitHub or email
3. Create new project:
   - Platform: Python
   - Project name: `sachcheck-backend`
4. Copy the DSN (Data Source Name)

**Configuration**:
```env
SENTRY_DSN=https://your_dsn@sentry.io/project_id
```

**Free Tier Limits**:
- 5K events/month
- Suitable for development and small production

---

## Local Development Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env with your credentials
# Use the values from service setup above

# Run development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

### Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Run Expo
npx expo start

# For Android: Press 'a'
# For iOS: Press 'i' (Mac only)
```

---

## Production Deployment

### Option 1: Docker Deployment (Recommended)

**Prerequisites**: VPS with Docker installed

**Install Docker on VPS**:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER

# Re-login to apply group changes
```

**Deploy with Docker Compose**:

```bash
# Clone repository
git clone https://github.com/yourusername/sachcheck.git
cd sachcheck

# Copy environment file
cd backend
cp .env.example .env
# Edit .env with production credentials

# Go to infra directory
cd ../infra

# Start services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check services status
docker-compose ps
```

**Docker Compose Services**:

- **Caddy**: Reverse proxy with automatic HTTPS
- **Backend**: FastAPI application
- **Web**: Next.js frontend
- **Ollama**: Local AI model fallback

### Option 2: Manual Deployment

**Backend**:

```bash
# On VPS
sudo apt update
sudo apt install python3-pip python3-venv nginx -y

# Clone repository
git clone https://github.com/yourusername/sachcheck.git
cd sachcheck/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit with production credentials

# Install and configure systemd service
sudo tee /etc/systemd/system/sachcheck.service > /dev/null <<EOF
[Unit]
Description=SachCheck Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/sachcheck/backend
Environment="PATH=/path/to/sachcheck/backend/venv/bin"
ExecStart=/path/to/sachcheck/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl start sachcheck
sudo systemctl enable sachcheck
```

**Frontend**:

```bash
# On VPS
cd /path/to/sachcheck/web

# Install dependencies
npm install

# Build for production
npm run build

# Install and configure systemd service
sudo tee /etc/systemd/system/sachcheck-web.service > /dev/null <<EOF
[Unit]
Description=SachCheck Web
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/sachcheck/web
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl start sachcheck-web
sudo systemctl enable sachcheck-web
```

**Nginx Configuration**:

```bash
sudo tee /etc/nginx/sites-available/sachcheck > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/sachcheck /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## Cost Optimization

### 1. Media Storage Optimization

- **Enable R2 lifecycle rules**: Auto-delete after 48 hours
- **Compress images**: Use WebP format before upload
- **Limit file sizes**: Enforce 50MB max upload
- **Use CDN**: Cloudflare CDN is free with R2

### 2. Database Optimization

- **Use connection pooling**: Already configured in backend
- **Implement data retention**: Delete old scan records
- **Use indexes**: Already configured in schema
- **Monitor storage**: Check Supabase dashboard regularly

### 3. API Cost Optimization

- **Implement caching**: Cache frequent results
- **Use rate limiting**: Already configured (20/hour)
- **Fallback to local**: Use Ollama when possible
- **Batch requests**: Process multiple files when possible

### 4. Infrastructure Optimization

- **Use Oracle Cloud Free Tier**: Maximum free resources
- **Monitor usage**: Check Oracle Cloud dashboard
- **Scale horizontally**: Add more free-tier VMs if needed
- **Use efficient algorithms**: Optimize code for resource usage

---

## Monitoring and Maintenance

### 1. Health Checks

**Backend Health**:
```bash
curl https://your-domain.com/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-07-16T10:30:00.000Z",
  "environment": "production",
  "services": {
    "database": "connected",
    "storage": "configured",
    "model_router": "configured"
  }
}
```

### 2. Log Monitoring

**Docker Logs**:
```bash
docker-compose logs -f backend
docker-compose logs -f web
```

**Systemd Logs**:
```bash
sudo journalctl -u sachcheck -f
sudo journalctl -u sachcheck-web -f
```

### 3. Error Monitoring

- **Sentry Dashboard**: Check for errors and performance issues
- **Set up alerts**: Configure email alerts for critical errors
- **Review weekly**: Check error trends and fix issues

### 4. Resource Monitoring

**Oracle Cloud Dashboard**:
- Monitor CPU usage
- Monitor memory usage
- Monitor storage usage
- Monitor network bandwidth

**Commands**:
```bash
# CPU and memory
htop

# Disk usage
df -h

# Network usage
iftop
```

### 5. Backup Strategy

**Database Backup**:
```bash
# Using Supabase dashboard
# Go to Database → Backups → Create backup

# Or use pg_dump
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

**Code Backup**:
- Git repository is your backup
- Push regularly to GitHub
- Use branches for features

---

## Troubleshooting

### 1. Database Connection Issues

**Problem**: Backend can't connect to Supabase

**Solutions**:
- Check SUPABASE_URL in .env
- Verify network connectivity
- Check Supabase project status
- Review Supabase logs

**Test Connection**:
```bash
psql -h db.xxx.supabase.co -U postgres -d postgres
```

### 2. Storage Upload Issues

**Problem**: Files can't be uploaded to R2

**Solutions**:
- Verify R2 credentials
- Check bucket exists
- Verify bucket permissions
- Check network connectivity

**Test Connection**:
```bash
aws s3 ls --endpoint-url https://your_account_id.r2.cloudflarestorage.com
```

### 3. Model API Issues

**Problem**: AI model returns errors

**Solutions**:
- Verify Google AI Studio API key
- Check rate limits
- Test fallback to Ollama
- Review error logs

**Test API**:
```bash
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemma-4-12b-unified:generateContent?key=YOUR_KEY"
```

### 4. Memory Issues on VPS

**Problem**: VPS runs out of memory

**Solutions**:
- Use swap space
- Limit Docker container memory
- Optimize application memory usage
- Scale to larger instance if needed

**Add Swap**:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 5. SSL Certificate Issues

**Problem**: SSL certificate not renewing

**Solutions**:
- Check domain DNS configuration
- Verify port 80 is accessible
- Manually renew: `sudo certbot renew`
- Check Nginx configuration

---

## Scaling Strategy

### When to Scale Up

**Signs you need to scale**:
- Consistent 80%+ CPU usage
- Frequent rate limit errors
- Database connection limits
- Storage limits approaching

### Scaling Options

**Database**:
- Upgrade to Supabase Pro ($25/month)
- Implement read replicas
- Add caching layer

**Storage**:
- Continue with R2 paid tier ($0.015/GB)
- Implement CDN caching
- Use multiple buckets

**Compute**:
- Add more VPS instances
- Use load balancer
- Consider managed services

**AI Model**:
- Upgrade to Vertex AI (higher limits)
- Implement request queuing
- Use dedicated GPU instances

---

## Security Checklist

- [ ] All API keys in environment variables
- [ ] SSL/TLS enabled on all endpoints
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Database row-level security enabled
- [ ] File upload size limits enforced
- [ ] File type validation implemented
- [ ] Regular security updates applied
- [ ] Firewall rules configured
- [ ] SSH key authentication only
- [ ] Regular backups automated
- [ ] Error monitoring configured
- [ ] Log rotation configured

---

## Next Steps

1. **Complete service setup** following this guide
2. **Test locally** before deploying
3. **Deploy to production** using Docker or manual method
4. **Configure monitoring** and alerts
5. **Set up regular backups**
6. **Test all functionality** end-to-end
7. **Monitor usage** and optimize as needed
8. **Plan for scaling** as user base grows

---

## Support and Resources

- **Documentation**: Check `/spec` folder for detailed specs
- **GitHub Issues**: Report bugs and feature requests
- **Community**: Join discussions in GitHub Discussions
- **Email**: dev@sachcheck.com

---

**Last Updated**: July 16, 2026
**Version**: 1.0.0
**Status**: Production Ready