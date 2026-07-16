# SachCheck - Deepfake Detection System

**AI-powered deepfake and scam detection for videos, audio, and images using Gemma 4 12B Unified model.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-enabled-blue.svg)](https://www.docker.com/)

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Complete Requirements](#complete-requirements)
- [Quick Start Guide](#quick-start-guide)
- [Detailed Setup Instructions](#detailed-setup-instructions)
- [Configuration Guide](#configuration-guide)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## 🎯 Project Overview

SachCheck is a production-grade deepfake detection system that analyzes media files (videos, audio, images) to identify potential manipulation, deepfakes, or scam content. Built for the Gemma 4 Hackathon by Team Monaco_Gem, this system uses Google's Gemma 4 12B Unified model for multimodal analysis.

### Key Capabilities

- **Video Analysis**: Detects lip-sync mismatches, unnatural blink rates, lighting inconsistencies
- **Audio Analysis**: Identifies voice clones, TTS artifacts, unnatural pacing
- **Image Analysis**: Screenshots for scam text, urgency language, fake authority symbols
- **Cross-Modal Reasoning**: Checks audio-video consistency using Gemma 4's encoder-free architecture
- **Explainable AI**: Provides detailed reasons for each verdict in plain language
- **Multilingual Support**: Native support for 140+ languages including Hindi and Marathi

### Target Use Cases

- **Personal Safety**: Help elderly and non-tech-savvy users verify suspicious content
- **Scam Prevention**: Detect financial scams and fraudulent schemes
- **Media Verification**: Check authenticity of viral content
- **Family Protection**: Shield families from misinformation and deepfakes

---

## ✨ Features

### Core Features

- 🔍 **AI-Powered Analysis**: Uses Gemma 4 12B Unified model for accurate detection
- 🎥 **Video Deepfake Detection**: Lip-sync, blink rate, and lighting analysis
- 🎵 **Voice Clone Detection**: Audio analysis for TTS artifacts and manipulation
- 🖼️ **Screenshot Analysis**: Scam text and fake authority detection
- 📱 **Mobile Share Intent**: Direct sharing from WhatsApp on Android/iOS
- 💬 **WhatsApp Bot**: Optional WhatsApp integration for easy access
- 🌐 **Web Interface**: Responsive web application for all devices
- 📊 **Scan History**: Track previous analyses with detailed results
- 🌍 **Multilingual**: Support for 140+ languages
- 🔒 **Privacy-First**: Auto-deletion of media after 48 hours

### Production Features

- ⚡ **Fallback System**: Google AI Studio API + Ollama local model
- 🛡️ **Security**: Rate limiting, encryption, RLS policies
- 📈 **Monitoring**: Sentry error tracking, health checks
- 🔄 **CI/CD**: Automated deployment via GitHub Actions
- 🐳 **Docker**: Containerized deployment with Docker Compose
- 🔐 **SSL/HTTPS**: Automatic SSL with Caddy and Let's Encrypt
- 📝 **Feedback Loop**: User feedback system for model improvement
- 🎯 **DPDP Compliant**: India's Digital Personal Data Protection Act compliance

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Web App    │   Mobile App   │   WhatsApp Bot              │
│ (Next.js)   │  (React Native) │   (Cloud API)               │
└─────────────┴────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Caddy)                       │
│              SSL Termination + Load Balancing                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Scan API    │  │  Auth API    │  │  WhatsApp    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                  │
│                   ┌───────▼────────┐                         │
│                   │  Model Router  │                         │
│                   └───────┬────────┘                         │
└───────────────────────────┼────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Google AI    │   │   Ollama      │   │  Supabase     │
│   Studio API  │   │  (Fallback)   │   │  (PostgreSQL) │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │  Cloudflare R2 │
                   │  (Media Storage)│
                   └────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Model** | Gemma 4 12B Unified | Primary analysis model |
| **Model API** | Google AI Studio | Cloud model access (free tier) |
| **Fallback** | Ollama | Local model fallback |
| **Backend** | FastAPI + Uvicorn | Async API framework |
| **Database** | Supabase (PostgreSQL) | Data storage + Auth |
| **Storage** | Cloudflare R2 | Media file storage |
| **Web** | Next.js 15 (App Router) | React web framework |
| **Mobile** | React Native + Expo | Cross-platform mobile |
| **Proxy** | Caddy | Reverse proxy + SSL |
| **Containers** | Docker + Compose | Container orchestration |
| **CI/CD** | GitHub Actions | Automated deployment |
| **Monitoring** | Sentry | Error tracking |

---

## 📦 Complete Requirements

### Software Requirements

#### Essential Software

1. **Python 3.11 or higher**
   - Download: [python.org](https://www.python.org/downloads/)
   - During installation: ✅ Check "Add Python to PATH"
   - Verify: `python --version`

2. **Node.js 18 or higher**
   - Download: [nodejs.org](https://nodejs.org/)
   - Choose LTS version for stability
   - Verify: `node --version` and `npm --version`

3. **Git**
   - Download: [git-scm.com](https://git-scm.com/downloads)
   - Verify: `git --version`

4. **Docker Desktop** (for production deployment)
   - Download: [docker.com](https://www.docker.com/products/docker-desktop)
   - Verify: `docker --version` and `docker-compose --version`

#### Optional Software

5. **PostgreSQL Client** (for direct database access)
   - Download: [postgresql.org](https://www.postgresql.org/download/)
   - Or use Supabase web interface

6. **Expo CLI** (for mobile development)
   - Install: `npm install -g expo-cli`
   - Or use Expo Go app on mobile

### Account Requirements

#### Required Accounts

1. **Google AI Studio Account** (Free)
   - URL: [ai.google.dev](https://ai.google.dev)
   - Purpose: Gemma 4 API access
   - Cost: Free (rate-limited)
   - Setup time: 5 minutes

2. **Supabase Account** (Free)
   - URL: [supabase.com](https://supabase.com)
   - Purpose: Database + Authentication
   - Cost: Free (500MB DB, 50K MAU)
   - Setup time: 10 minutes

3. **Cloudflare Account** (Free)
   - URL: [cloudflare.com](https://cloudflare.com)
   - Purpose: R2 media storage
   - Cost: Free (10GB storage, zero egress)
   - Setup time: 10 minutes

#### Optional Accounts

4. **GitHub Account** (Free)
   - URL: [github.com](https://github.com)
   - Purpose: CI/CD, code hosting
   - Cost: Free for public repos
   - Setup time: 5 minutes

5. **Sentry Account** (Free tier)
   - URL: [sentry.io](https://sentry.io)
   - Purpose: Error monitoring
   - Cost: Free (5K events/month)
   - Setup time: 10 minutes

6. **Domain Name** (Paid)
   - Cost: ~₹700-900/year
   - Purpose: Custom domain for production
   - Setup time: Varies

### Hardware Requirements

#### Minimum Requirements (Development)

- **CPU**: Dual-core processor
- **RAM**: 8GB RAM
- **Storage**: 20GB free space
- **Network**: Stable internet connection

#### Recommended Requirements (Production)

- **CPU**: Quad-core processor
- **RAM**: 16GB RAM
- **Storage**: 50GB free space
- **Network**: Stable internet connection

#### VPS Requirements (Production Deployment)

- **Oracle Cloud Always Free**: 2 OCPU, 12GB RAM, 200GB storage
- **Hetzner CX22**: 2 vCPU, 4GB RAM, 40GB storage (~₹380-420/month)

### Operating System Support

- **Windows**: 10/11 (tested)
- **macOS**: 10.15+ (tested)
- **Linux**: Ubuntu 20.04+, Debian 11+ (tested)

---

## 🚀 Quick Start Guide

### For Immediate Testing (Clone & Run)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/sachcheck.git
cd sachcheck

# 2. Set up backend
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials

# 3. Set up frontend
cd ../web
npm install
cp .env.example .env.local
# Edit .env.local with your API URL

# 4. Run backend (in backend directory)
cd ../backend
python -m uvicorn app.main:app --reload

# 5. Run frontend (in web directory)
cd ../web
npm run dev

# 6. Access the application
# Web: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## 📝 Detailed Setup Instructions

### Step 1: Clone the Repository

#### Option A: HTTPS Clone

```bash
git clone https://github.com/yourusername/sachcheck.git
cd sachcheck
```

#### Option B: SSH Clone (if you have SSH keys set up)

```bash
git clone git@github.com:yourusername/sachcheck.git
cd sachcheck
```

#### Option C: Download ZIP

1. Go to the repository on GitHub
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file
4. Navigate to the extracted directory

### Step 2: Set Up Service Accounts

#### 2.1 Google AI Studio Setup

1. **Create Account**
   - Go to [ai.google.dev](https://ai.google.dev)
   - Sign in with your Google account
   - Accept the terms of service

2. **Generate API Key**
   - Click "Get API Key" or "Create API Key"
   - Name your key (e.g., "SachCheck Production")
   - Copy the API key (starts with `AIza...`)

3. **Configure Project**
   - Go to Google Cloud Console
   - Create a new project for SachCheck
   - Enable the Generative Language API
   - Note: No billing required for free tier

#### 2.2 Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign up or log in
   - Click "New Project"

2. **Project Configuration**
   - **Name**: sachcheck
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose the region closest to you
   - **Pricing Plan**: Free tier

3. **Wait for Project Creation**
   - Takes 2-3 minutes
   - You'll receive an email when ready

4. **Get API Credentials**
   - Go to Settings → API
   - Copy these values:
     - **Project URL**: `https://xxx.supabase.co`
     - **anon public key**: `eyJ...`
     - **service_role key**: `eyJ...` (keep this secret!)

5. **Set Up Database Schema**
   - Go to SQL Editor in Supabase
   - Click "New Query"
   - Copy the contents of `infra/schema.sql`
   - Paste and click "Run"
   - Verify tables were created successfully

#### 2.3 Cloudflare R2 Setup

1. **Create Account**
   - Go to [cloudflare.com](https://cloudflare.com)
   - Sign up for free account
   - Verify your email address

2. **Create R2 Bucket**
   - Go to R2 → Overview
   - Click "Create Bucket"
   - **Bucket Name**: sachcheck-media
   - **Region**: Choose nearest region
   - Click "Create Bucket"

3. **Get API Credentials**
   - Go to R2 → Manage R2 API Tokens
   - Click "Create API Token"
   - **Permissions**: 
     - Object Read & Write
     - Admin Read
   - **TTL**: Unlimited or set expiry
   - Copy:
     - **Access Key ID**
     - **Secret Access Key**
     - **Account ID** (from dashboard URL)

4. **Configure Lifecycle Rule**
   - Go to your bucket settings
   - Click "Lifecycle Rules"
   - Create rule:
     - **Name**: Auto-delete after 48 hours
     - **Apply to**: All objects in bucket
     - **Action**: Delete
     - **Delete after**: 2 days
   - Save the rule

### Step 3: Backend Setup

#### 3.1 Create Virtual Environment

```bash
cd backend
python -m venv venv
```

#### 3.2 Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

#### 3.3 Install Dependencies

```bash
pip install -r requirements.txt
```

#### 3.4 Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your credentials
```

**Windows:** Use Notepad or VS Code
**Mac/Linux:** Use nano, vim, or VS Code

Edit `.env` with your actual credentials:

```env
# Google AI Studio API
GOOGLE_AI_STUDIO_API_KEY=AIzaSy... (your actual key)
GEMMA_MODEL_ID=gemma-4-12b-unified

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY=your_access_key_here
R2_SECRET_KEY=your_secret_key_here
R2_BUCKET=sachcheck-media

# Ollama Configuration (optional, for local fallback)
OLLAMA_BASE_URL=http://localhost:11434

# Sentry Configuration (optional)
SENTRY_DSN=your_sentry_dsn_here

# Environment Settings
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

#### 3.5 Test Backend Installation

```bash
python -m uvicorn app.main:app --reload
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Test the API:
- Open browser: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Step 4: Web Frontend Setup

#### 4.1 Install Dependencies

```bash
cd web
npm install
```

#### 4.2 Configure Environment Variables

Create `.env.local` file:

```bash
# For development
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production
# NEXT_PUBLIC_API_URL=https://api.sachcheck.yourdomain.com
```

#### 4.3 Test Frontend Installation

```bash
npm run dev
```

Expected output:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Test the web app:
- Open browser: http://localhost:3000
- Should see the SachCheck interface

### Step 5: Mobile App Setup

#### 5.1 Install Dependencies

```bash
cd mobile
npm install
```

#### 5.2 Configure Environment Variables

Create `.env` file:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

#### 5.3 Run Mobile App

```bash
npx expo start
```

Expected output:
```
Starting development server...
Tunnel ready: https://xxx.exp.direct
```

Test the mobile app:
- Install Expo Go app on your phone
- Scan the QR code shown in terminal
- Or press 'w' to open in web browser

### Step 6: Database Verification

#### 6.1 Verify Tables Created

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Verify these tables exist:
   - `scans`
   - `feedback`

#### 6.2 Test Database Connection

```bash
# From backend directory
python -c "from app.db import db; import asyncio; asyncio.run(db.connect())"
```

### Step 7: Storage Verification

#### 7.1 Test R2 Connection

```bash
# From backend directory
python -c "from app.storage import storage; print('R2 configured')"
```

#### 7.2 Verify Bucket

1. Go to Cloudflare Dashboard
2. Navigate to R2 → sachcheck-media
3. Verify bucket is empty (ready for uploads)

---

## ⚙️ Configuration Guide

### Backend Configuration

#### Environment Variables Explained

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_AI_STUDIO_API_KEY` | No | Google AI API key (runs in degraded mode without) | `AIzaSy...` |
| `GEMMA_MODEL_ID` | No | Model identifier | `gemma-4-12b-unified` |
| `SUPABASE_URL` | No | Supabase project URL (runs in database-less mode without) | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | No | Supabase anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service key | `eyJ...` |
| `R2_ACCOUNT_ID` | No | Cloudflare account ID (runs in storage-less mode without) | `abc123...` |
| `R2_ACCESS_KEY` | No | R2 access key | `access_key...` |
| `R2_SECRET_KEY` | No | R2 secret key | `secret_key...` |
| `R2_BUCKET` | No | R2 bucket name | `sachcheck-media` |
| `OLLAMA_BASE_URL` | No | Ollama server URL | `http://localhost:11434` |
| `SENTRY_DSN` | No | Sentry DSN for error tracking | `https://...` |
| `ENVIRONMENT` | No | Environment name | `development` |
| `ALLOWED_ORIGINS` | No | CORS allowed origins | `http://localhost:3000` |

**Note**: All variables are now optional. The application will run in degraded mode without credentials:
- Without Google AI Studio: Uses Ollama fallback or returns mock responses
- Without Supabase: Runs in database-less mode with mock storage
- Without R2: Runs in storage-less mode with mock file handling

### Frontend Configuration

#### Next.js Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

### Mobile Configuration

#### Expo Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

---

## 🏃 Running the Project

### Development Mode

#### Option A: Run All Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
python -m uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
```

**Terminal 3 - Mobile (Optional):**
```bash
cd mobile
npx expo start
```

#### Option B: Run with Docker (Recommended for Production)

```bash
cd infra
docker-compose up -d --build
```

This will start:
- Backend API on port 8000
- Web frontend on port 3000
- Caddy reverse proxy on ports 80/443
- Ollama fallback model

### Production Mode

#### Using Docker Compose

```bash
cd infra
docker-compose up -d --build
```

#### Pull Ollama Model

```bash
docker exec -it sachcheck-ollama ollama pull gemma4:e4b
```

#### Check Service Status

```bash
docker-compose ps
docker-compose logs -f backend
docker-compose logs -f web
```

### Access Points

Once running, access the services at:

- **Web Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Mobile**: Via Expo Go app (scan QR code)

---

## 🧪 Testing

### Backend Testing

#### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-07-15T10:30:00.000Z"
}
```

#### API Endpoint Testing

```bash
# Test scan endpoint with a sample file
curl -X POST http://localhost:8000/api/scan \
  -F "file=@sample_image.jpg" \
  -F "device_id=test_device_123"
```

#### Database Connection Test

```bash
cd backend
python -c "
import asyncio
from app.db import db
async def test():
    await db.connect()
    print('Database connected successfully!')
    await db.disconnect()
asyncio.run(test())
"
```

### Frontend Testing

#### Manual Testing

1. Open http://localhost:3000
2. Upload a test image/video
3. Verify analysis result appears
4. Check scan history updates
5. Test feedback submission

#### Automated Testing (Optional)

```bash
cd web
npm test
```

### Mobile Testing

#### Expo Go Testing

1. Install Expo Go app on your phone
2. Run `npx expo start` in mobile directory
3. Scan QR code with Expo Go
4. Test all screens and features

#### Share Intent Testing

1. Build the app: `eas build --platform android --profile preview`
2. Install the APK on your phone
3. Open WhatsApp and share a media file
4. Verify SachCheck appears in share sheet

---

## 🚢 Deployment

### Deployment Options

#### Option A: Manual VPS Deployment

1. **Get a VPS**
   - Oracle Cloud Always Free (recommended)
   - Hetzner CX22 (~₹380-420/month)

2. **SSH into VPS**
   ```bash
   ssh user@your-vps-ip
   ```

3. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

4. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/sachcheck.git
   cd sachcheck
   ```

5. **Configure Environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with production credentials
   ```

6. **Update Caddyfile**
   ```bash
   cd ../infra
   nano Caddyfile
   # Replace domain names with your actual domain
   ```

7. **Deploy**
   ```bash
   docker-compose up -d --build
   docker exec -it sachcheck-ollama ollama pull gemma4:e4b
   ```

#### Option B: GitHub Actions CI/CD

1. **Configure GitHub Secrets**
   - Go to repository Settings → Secrets
   - Add these secrets:
     - `VPS_HOST`: Your VPS IP/hostname
     - `VPS_USER`: SSH username
     - `VPS_SSH_KEY`: Private SSH key
     - `VPS_PORT`: SSH port (default 22)
     - `API_URL`: Your production API URL
     - `SUPABASE_URL`: Supabase project URL
     - `SUPABASE_ANON_KEY`: Supabase anon key

2. **Push to Main Branch**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

3. **Monitor Deployment**
   - Go to Actions tab in GitHub
   - Watch the deployment workflow
   - Check logs for any errors

#### Option C: Cloud Platform Deployment

**Deploy to Oracle Cloud:**

1. Create Oracle Cloud account
2. Create Always Free ARM instance
3. Follow Manual VPS Deployment steps above

**Deploy to Hetzner:**

1. Create Hetzner account
2. Create CX22 server
3. Follow Manual VPS Deployment steps above

### Domain Configuration

1. **Buy Domain**
   - Go to Namecheap, GoDaddy, or similar
   - Purchase your domain

2. **Configure DNS**
   - Point A record to your VPS IP
   - Wait for DNS propagation (1-48 hours)

3. **Update Caddyfile**
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

4. **Restart Caddy**
   ```bash
   docker-compose restart caddy
   ```

5. **SSL Certificate**
   - Caddy automatically handles SSL
   - Certificate will be auto-generated by Let's Encrypt

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Backend Issues

**Problem: Module not found errors**
```bash
Solution: Ensure virtual environment is activated
Windows: venv\Scripts\activate
Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

**Problem: Database connection errors**
```bash
Solution: 
1. Check Supabase project is active (not paused)
2. Verify credentials in .env file
3. Check network connectivity
4. Ensure Supabase allows connections from your IP
```

**Problem: Google AI API errors**
```bash
Solution:
1. Verify API key is correct
2. Check API key has proper permissions
3. Ensure you haven't exceeded rate limits
4. Try the fallback Ollama model
```

**Problem: Port already in use**
```bash
Solution:
# Find process using port 8000
netstat -ano | findstr :8000  # Windows
lsof -i :8000  # Mac/Linux

# Kill the process or use different port
python -m uvicorn app.main:app --port 8001
```

#### Frontend Issues

**Problem: Next.js build errors**
```bash
Solution:
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

**Problem: API connection errors**
```bash
Solution:
1. Check NEXT_PUBLIC_API_URL in .env.local
2. Ensure backend is running
3. Check CORS configuration
4. Verify browser console for specific errors
```

**Problem: Docker build fails**
```bash
Solution:
# Clear Docker cache
docker system prune -a
docker-compose build --no-cache
```

#### Mobile Issues

**Problem: Expo won't start**
```bash
Solution:
# Clear Expo cache
npx expo start -c
# Or
rm -rf .expo
npx expo start
```

**Problem: Share intent not working**
```bash
Solution:
1. Share intent only works in production builds
2. Build the app: eas build --platform android
3. Install APK on device (not Expo Go)
4. Test with real WhatsApp share
```

#### Database Issues

**Problem: Supabase project paused**
```bash
Solution:
1. Go to Supabase dashboard
2. Resume the project
3. Set up keepalive workflow in GitHub Actions
```

**Problem: RLS policy errors**
```bash
Solution:
1. Check RLS policies in Supabase
2. Ensure policies allow device_id access
3. Review schema.sql for correct policy setup
```

**Problem: Database connection errors**
```bash
Solution:
1. The application now runs in database-less mode if credentials are missing
2. Check Supabase credentials in .env file
3. Verify Supabase project is active (not paused)
4. Check network connectivity
5. Ensure Supabase allows connections from your IP
```

#### Storage Issues

**Problem: R2 upload failures**
```bash
Solution:
1. The application now runs in storage-less mode if credentials are missing
2. Verify R2 credentials are correct
3. Check bucket exists and is accessible
4. Ensure bucket lifecycle rules are set
5. Check file size doesn't exceed limits
```

#### Recent Debugging Fixes

**Configuration Handling Improvements**:
- All configuration fields are now optional to handle missing credentials gracefully
- Application runs in degraded mode when services are not configured
- Better error messages with structured error responses

**Enhanced Error Responses**:
- Structured error objects with error codes, messages, and suggestions
- Development-specific debug information in error responses
- Better rate limit exceeded responses with retry_after information

**Schema Fixes**:
- Fixed Pydantic warnings about "model_" namespace conflicts
- Added `model_config = {"protected_namespaces": ()}` to affected schemas
- Enhanced response models with model_used and processing_time_ms fields

**Graceful Degradation**:
- Database-less mode when Supabase credentials are missing
- Storage-less mode when R2 credentials are missing
- Model router handles missing Google AI Studio API key
- All services provide mock responses when unavailable

### Getting Help

1. **Check Logs**
   ```bash
   # Docker logs
   docker-compose logs -f backend
   docker-compose logs -f web
   
   # Application logs
   # Check terminal output for each service
   ```

2. **Health Checks**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:3000
   ```

3. **Documentation**
   - Read `SETUP.md` for detailed setup guide
   - Read `AGENTS.md` for development guide
   - Check inline code comments

4. **Community Support**
   - GitHub Issues: Report bugs and ask questions
   - Email: support@sachcheck.com

---

## 📁 Project Structure

```
sachcheck/
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application entry point
│   │   ├── config.py                # Configuration management
│   │   ├── schemas.py               # Pydantic models for validation
│   │   ├── db.py                    # Supabase database operations
│   │   ├── storage.py               # Cloudflare R2 integration
│   │   ├── model_router.py          # Gemma 4 AI model integration
│   │   ├── rate_limit.py            # Rate limiting middleware
│   │   ├── routers/                 # API endpoint definitions
│   │   │   ├── __init__.py
│   │   │   ├── scan.py              # Scan endpoints
│   │   │   ├── auth.py              # Authentication endpoints
│   │   │   └── whatsapp.py          # WhatsApp webhook
│   │   └── prompts/                 # AI prompts
│   │       └── system_prompt.txt    # Main system prompt
│   ├── tests/                       # Backend tests
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile                   # Backend container definition
│   └── .env.example                 # Environment variables template
├── web/                             # Next.js Frontend
│   ├── app/                         # App Router pages
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Home page
│   │   ├── globals.css              # Global styles
│   │   ├── privacy/                 # Privacy policy page
│   │   │   └── page.tsx
│   │   └── terms/                   # Terms of service page
│   │       └── page.tsx
│   ├── components/                  # React components
│   │   ├── UploadCard.tsx           # File upload component
│   │   ├── VerdictCard.tsx          # Results display component
│   │   ├── RecentScans.tsx          # Scan history component
│   │   └── ConsentNotice.tsx        # Privacy consent component
│   ├── package.json                 # Node.js dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.ts           # Tailwind CSS configuration
│   ├── next.config.js               # Next.js configuration
│   ├── postcss.config.js            # PostCSS configuration
│   └── Dockerfile                   # Frontend container definition
├── mobile/                          # React Native Mobile App
│   ├── app/                         # Expo Router screens
│   │   ├── _layout.tsx              # Root layout
│   │   ├── index.tsx                # Home screen
│   │   ├── analyzing.tsx            # Analysis progress screen
│   │   ├── result.tsx               # Results display screen
│   │   └── history.tsx              # Scan history screen
│   ├── assets/                      # Mobile assets (icons, images)
│   ├── package.json                 # Node.js dependencies
│   ├── app.json                     # Expo configuration
│   └── README.md                    # Mobile-specific readme
├── infra/                           # Infrastructure Configuration
│   ├── docker-compose.yml           # Docker orchestration
│   ├── Caddyfile                   # Reverse proxy configuration
│   ├── schema.sql                  # Database schema
│   └── github-actions/              # CI/CD workflows
│       ├── deploy.yml              # Deployment workflow
│       └── keepalive.yml           # Supabase keepalive
├── demo_data/                       # Test media files
├── .github/                         # GitHub Configuration
│   └── workflows/                   # GitHub Actions workflows
│       ├── deploy.yml              # Deployment workflow
│       └── keepalive.yml           # Keepalive workflow
├── .gitignore                       # Git ignore rules
├── README.md                        # This file
├── SETUP.md                         # Detailed setup guide
├── AGENTS.md                        # Development guide
└── agent.md                         # Original production guide
```

---

## 🔒 Security Features

### Data Protection

- **Encryption in Transit**: All data transmitted over HTTPS
- **Encryption at Rest**: Database and storage encrypted by default
- **Data Minimization**: Media files auto-deleted after 48 hours
- **No Training Data**: Uploaded media never used for AI training without consent

### Access Control

- **Row-Level Security**: Database access restricted per device/user
- **Rate Limiting**: 20 requests/hour per device to prevent abuse
- **Input Validation**: File type and size limits enforced
- **CORS Protection**: Cross-origin requests restricted to allowed domains

### Compliance

- **DPDP Compliant**: Follows India's Digital Personal Data Protection Act
- **Privacy Policy**: Clear, accessible privacy policy
- **Consent Management**: User consent before data processing
- **Data Portability**: Users can request their data
- **Right to Deletion**: Users can request data deletion

---

## 📊 Monitoring & Maintenance

### Health Monitoring

- **Health Endpoints**: `/health` for service status
- **Sentry Integration**: Error tracking and alerting
- **Docker Health Checks**: Container health monitoring
- **Uptime Monitoring**: Optional UptimeRobot integration

### Log Management

- **Application Logs**: Structured JSON logging
- **Docker Logs**: Container logs via `docker-compose logs`
- **Error Tracking**: Sentry for production errors
- **Access Logs**: Caddy access logs for API monitoring

### Backup Strategy

- **Database Backups**: Supabase automatic backups
- **Configuration Backups**: Version control for all config
- **Media Storage**: R2 durability (99.999999999%)
- **Disaster Recovery**: Documentation for recovery procedures

---

## 💰 Cost Breakdown

### Monthly Recurring Costs (MVP Scale)

| Service | Cost | Notes |
|---------|------|-------|
| Oracle Cloud Always Free | ₹0 | 2 OCPU, 12GB RAM, 200GB storage |
| Google AI Studio API | ₹0 | Rate-limited free tier |
| Supabase (PostgreSQL) | ₹0 | 500MB DB, 50K MAU free tier |
| Cloudflare R2 | ₹0 | 10GB storage, zero egress fees |
| Domain Name | ~₹60-75/month | Amortized yearly cost |
| Hetzner (backup option) | ~₹380-420/month | If Oracle unavailable |

**Total Monthly Cost: ₹0–420/month**

### One-Time Costs

| Service | Cost | Notes |
|---------|------|-------|
| Google Play Console | $25 one-time | Required for Android publishing |
| Apple Developer | $99/year | Optional (can defer iOS) |

---

## 🤝 Contributing

We welcome contributions to SachCheck! Here's how to get started:

### Contribution Guidelines

1. **Fork the Repository**
   ```bash
   https://github.com/yourusername/sachcheck/fork
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation
   - Ensure all tests pass

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

5. **Push to Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Describe your changes
   - Reference related issues
   - Ensure CI checks pass

### Code Style Guidelines

- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Use strict mode, follow existing patterns
- **React**: Use functional components, hooks
- **File Naming**: kebab-case for files, PascalCase for components

### Reporting Issues

- Use GitHub Issues for bug reports
- Provide detailed reproduction steps
- Include environment details
- Add relevant logs/error messages

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

```
MIT License

Copyright (c) 2026 Team Monaco_Gem

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🆘 Support

### Getting Help

1. **Documentation**
   - Read this README thoroughly
   - Check `SETUP.md` for detailed setup instructions
   - Review `AGENTS.md` for development guidance

2. **Community**
   - GitHub Issues: Report bugs and ask questions
   - Discussions: Join community discussions

3. **Direct Support**
   - Email: support@sachcheck.com
   - Response time: Within 48 hours

### Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Gemma 4 Documentation](https://ai.google.dev/gemma4)

---

## 🔮 Future Enhancements

### Planned Features

- **Video KYC Fraud Prevention**: For banks and NBFCs
- **Real-time Telecom Integration**: Flag suspicious calls in real-time
- **Digital Literacy Partnerships**: NGO collaborations for education
- **Advanced Language Support**: Enhanced regional language support
- **Browser Extension**: Chrome/Firefox extension for web scanning
- **API for Developers**: Public API for third-party integration
- **Enterprise Features**: Team management, advanced analytics
- **Mobile SDK**: Integration kit for other apps

### Research Areas

- **Improved Detection Accuracy**: Fine-tuning with user feedback
- **Faster Processing**: Optimized model inference
- **Better Privacy**: On-device processing options
- **Scalability**: Multi-region deployment

---

## 📈 Performance Metrics

### Target Performance

- **Analysis Time**: < 10 seconds for typical media files
- **API Response Time**: < 200ms for health checks
- **Uptime**: > 99.5% availability
- **Accuracy**: > 85% on test dataset

### Monitoring

- Real-time performance monitoring via Sentry
- Regular accuracy testing with demo dataset
- User feedback integration for continuous improvement

---

## 🎯 Success Metrics

### User Engagement

- Number of scans performed
- User retention rate
- Feedback submission rate
- Mobile app adoption

### Impact

- Scams prevented
- Users educated about deepfakes
- Media literacy improvement
- Community trust built

---

## 🙏 Acknowledgments

- **Google DeepMind**: For Gemma 4 model
- **Supabase**: For generous free tier
- **Cloudflare**: For R2 free storage
- **Expo Team**: For excellent React Native tooling
- **Open Source Community**: For amazing tools and libraries

---

## 📞 Contact

### Team Monaco_Gem

- **Project**: SachCheck
- **Hackathon**: Gemma 4 Hackathon 2026
- **Email**: team@monaco-gem.com
- **GitHub**: https://github.com/monaco-gem

### Business Inquiries

- **Partnerships**: partnerships@sachcheck.com
- **Press**: press@sachcheck.com
- **Support**: support@sachcheck.com

---

## 🗺️ Roadmap

### Phase 1: MVP (Current)
- ✅ Core deepfake detection
- ✅ Web interface
- ✅ Mobile app with share intent
- ✅ Basic security features

### Phase 2: Enhancement
- 🔄 WhatsApp bot integration
- 🔄 Advanced analytics
- 🔄 User accounts
- 🔄 Feedback system

### Phase 3: Scale
- 📋 Enterprise features
- 📋 API platform
- 📋 Multi-region deployment
- 📋 Advanced privacy features

---

**Built with ❤️ by Team Monaco_Gem for Gemma 4 Hackathon**

*Last Updated: July 15, 2026*