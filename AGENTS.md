# SachCheck - Development Guide

This document contains important information for developers working on SachCheck.

## Project Overview

SachCheck is an AI-powered deepfake detection system using Gemma 4 12B Unified model. The system analyzes videos, audio, and images to detect potential manipulation or scam content.

## Technology Stack

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: Next.js 15 (React 18)
- **Mobile**: React Native + Expo SDK 51
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2
- **AI Model**: Gemma 4 12B Unified (Google AI Studio + Ollama fallback)
- **Infrastructure**: Docker + Caddy

## Development Workflow

### Local Development

1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Mac/Linux
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd web
   npm install
   npm run dev
   ```

3. **Mobile**:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

### Code Style

- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Use strict mode, follow existing patterns
- **React**: Use functional components, hooks
- **File Naming**: kebab-case for files, PascalCase for components

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit
3. Push and create pull request
4. Code review and merge to main

## Key Files and Their Purposes

### Backend

- `backend/app/main.py` - FastAPI application entry point
- `backend/app/model_router.py` - AI model integration with fallback logic
- `backend/app/storage.py` - Cloudflare R2 integration
- `backend/app/db.py` - Supabase database operations
- `backend/app/schemas.py` - Pydantic models for validation
- `backend/app/routers/` - API endpoint definitions

### Frontend

- `web/app/page.tsx` - Main home page
- `web/components/UploadCard.tsx` - File upload component
- `web/components/VerdictCard.tsx` - Results display component
- `web/components/RecentScans.tsx` - Scan history component

### Mobile

- `mobile/app/index.tsx` - Home screen with share intent
- `mobile/app/analyzing.tsx` - Analysis progress screen
- `mobile/app/result.tsx` - Results display screen
- `mobile/app/history.tsx` - Scan history screen

### Infrastructure

- `infra/docker-compose.yml` - Docker service orchestration
- `infra/Caddyfile` - Reverse proxy and SSL configuration
- `infra/schema.sql` - Database schema

## Environment Variables

### Required Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# AI Model (Optional - runs in degraded mode without)
GOOGLE_AI_STUDIO_API_KEY=your_key_here
GEMMA_MODEL_ID=gemma-4-12b-unified

# Database (Optional - runs in database-less mode without)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage (Optional - runs in storage-less mode without)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key
R2_BUCKET=sachcheck-media
```

### Optional Variables

```env
# Monitoring
SENTRY_DSN=your_sentry_dsn

# Environment
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

**Note**: All configuration fields are now optional. The application will run in degraded mode when credentials are missing:
- Without Google AI Studio: Uses Ollama fallback or returns mock responses
- Without Supabase: Runs in database-less mode with mock storage
- Without R2: Runs in storage-less mode with mock file handling

## Testing

### Backend Testing

```bash
cd backend
pytest tests/
```

### API Testing

```bash
# Health check
curl http://localhost:8000/health

# Test scan
curl -F "file=@test.jpg" -F "device_id=test" http://localhost:8000/api/scan
```

### Frontend Testing

```bash
cd web
npm run dev
# Visit http://localhost:3000
```

## Deployment

### Docker Deployment

```bash
cd infra
docker-compose up -d --build
```

### Manual Deployment

```bash
# Backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd web
npm run build
npm start
```

## Common Issues and Solutions

### Database Connection Issues

- Check Supabase project is active
- Verify credentials in `.env`
- Ensure network allows connections

### Model API Issues

- Verify Google AI Studio API key
- Check rate limits
- Test fallback to Ollama

### Storage Issues

- Verify R2 credentials
- Check bucket exists
- Ensure lifecycle rules are set

## Performance Optimization

### Backend

- Use async/await for I/O operations
- Implement proper caching
- Optimize database queries
- Use connection pooling

### Frontend

- Implement lazy loading
- Optimize images
- Use React.memo for expensive components
- Implement proper error boundaries

### Mobile

- Optimize app size
- Implement proper state management
- Use native modules when needed
- Test on real devices

## Security Considerations

- Never commit `.env` files
- Use environment variables for secrets
- Implement proper rate limiting
- Validate all user inputs
- Use HTTPS in production
- Implement proper authentication
- Follow OWASP guidelines

## Monitoring and Logging

- Sentry is configured for error tracking
- Health checks available at `/health`
- Docker logs: `docker-compose logs`
- Application logs are structured JSON

## Contributing Guidelines

1. Follow existing code style
2. Write tests for new features
3. Update documentation
4. Use descriptive commit messages
5. Ensure all tests pass before PR

## Feature Requests

Before implementing new features:

1. Check existing issues
2. Discuss with team
3. Consider impact on performance
4. Plan testing approach
5. Update documentation

## Code Review Checklist

- [ ] Code follows project style
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] No hardcoded secrets
- [ ] Error handling is proper
- [ ] Performance is considered
- [ ] Security is maintained

## Useful Commands

```bash
# Backend
cd backend && python -m uvicorn app.main:app --reload

# Frontend
cd web && npm run dev

# Mobile
cd mobile && npx expo start

# Docker
cd infra && docker-compose up -d

# Database
psql -h $SUPABASE_HOST -U postgres -d postgres

# Logs
docker-compose logs -f backend
docker-compose logs -f web
```

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Gemma 4 Documentation](https://ai.google.dev/gemma4)

## Contact

For development questions:
- GitHub Issues
- Email: dev@sachcheck.com

---

Remember: This is a production system handling sensitive user data. Always prioritize security, privacy, and proper testing.