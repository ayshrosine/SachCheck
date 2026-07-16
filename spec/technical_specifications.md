# SachCheck - Technical Specifications

## System Architecture

### High-Level Architecture
```
Client Layer (Web/Mobile/WhatsApp)
    ↓
API Gateway (Caddy + SSL)
    ↓
Backend Services (FastAPI)
    ↓
Model Layer (Gemma 4 + Ollama)
    ↓
Data Layer (Supabase + R2)
```

### Component Specifications

#### 1. Backend Service (FastAPI)

**Technology Stack**:
- Framework: FastAPI 0.115.0
- Server: Uvicorn 0.32.0
- Python: 3.11+
- Async Runtime: asyncio

**Key Features**:
- Async I/O for concurrent request handling
- Automatic OpenAPI documentation
- Pydantic validation
- Background task support
- Middleware for CORS, rate limiting

**API Endpoints**:

**Health Check**
- `GET /health`
- Response: JSON with status, version, timestamp
- Purpose: Service health monitoring

**Scan Operations**
- `POST /api/scan`
- Input: Multipart form data (file, device_id)
- Processing: Upload → Analyze → Store → Return verdict
- Rate Limit: 20 requests/hour per device
- File Size Limit: 50MB
- Supported Types: video/*, audio/*, image/*

- `GET /api/scans?device_id=xxx`
- Response: JSON array of scan records
- Purpose: Retrieve scan history
- RLS: Device-scoped access control

**Feedback System**
- `POST /api/feedback`
- Input: JSON (scan_id, was_verdict_correct, note)
- Purpose: Collect user feedback for model improvement
- Storage: Feedback table with scan reference

**Authentication**
- `POST /api/auth/magic-link`
- Purpose: Email-based authentication
- Integration: Supabase Auth (placeholder)

- `POST /api/auth/register`
- Purpose: Device/account registration
- Integration: Supabase Auth (placeholder)

- `GET /api/auth/status`
- Purpose: Check authentication status
- Response: Current auth state

**WhatsApp Integration**
- `POST /api/whatsapp/webhook`
- Purpose: Receive WhatsApp messages
- Processing: Download → Analyze → Reply
- Verification: Hub mode for webhook setup
- Integration: WhatsApp Cloud API (placeholder)

#### 2. Model Router (AI Integration)

**Primary Model**: Gemma 4 12B Unified
- Provider: Google AI Studio
- API: Generative Language API
- Context Window: 256K tokens
- Modalities: Text, Image, Video, Audio
- Architecture: Encoder-free (direct projection)

**Fallback Model**: Ollama gemma4:e4b
- Provider: Local Ollama
- Context Window: 128K tokens
- Modalities: Text, Image (Audio unstable)
- Purpose: Backup when cloud API fails

**Retry Logic**:
1. Primary API call with timeout
2. Single retry with exponential backoff
3. Fallback to Ollama (image/text only)
4. Graceful degradation if all fail

**Response Format**:
```json
{
  "verdict": "likely_real|suspicious|likely_fake|inconclusive",
  "confidence": 0-100,
  "reasons": ["reason1", "reason2"],
  "modality_flags": {
    "lip_sync_mismatch": true/false,
    "unnatural_blink_rate": true/false,
    "lighting_inconsistency": true/false,
    "tts_flatness": true/false,
    "urgency_language": true/false,
    "fake_authority": true/false,
    "payment_pressure": true/false
  },
  "model_used": "google_ai_studio|ollama_fallback|none",
  "processing_time_ms": integer
}
```

**Error Handling**:
- Enhanced error responses with structured error objects
- Development-specific debug information when ENVIRONMENT=development
- Graceful degradation when services are unavailable
- All configuration fields are optional for development mode

#### 3. Database Layer (Supabase)

**Database**: PostgreSQL 15+
**Connection**: asyncpg (async PostgreSQL driver)
**ORM**: SQLAlchemy 2.0 (async mode)

**Schema**:

**scans table**:
```sql
- id: UUID (primary key)
- device_id: TEXT (indexed)
- user_id: UUID (foreign key to auth.users, nullable)
- modality: TEXT (check: video|audio|image)
- verdict: TEXT (check: likely_real|suspicious|likely_fake|inconclusive)
- confidence: INTEGER (0-100)
- reasons: JSONB (array of strings)
- modality_flags: JSONB (object with boolean flags)
- object_key: TEXT (R2 storage key, nullable after deletion)
- created_at: TIMESTAMPTZ (indexed)
```

**feedback table**:
```sql
- id: UUID (primary key)
- scan_id: UUID (foreign key to scans, cascade delete)
- was_verdict_correct: BOOLEAN
- note: TEXT (nullable)
- created_at: TIMESTAMPTZ
```

**Indexes**:
- scans_device_id_created_at (device_id, created_at DESC)
- scans_user_id_created_at (user_id, created_at DESC)
- scans_created_at (created_at DESC)
- feedback_scan_id (scan_id)

**Row-Level Security**:
- Users can only read their own scans (by device_id or user_id)
- Users can only insert their own scans
- Users can only read/insert feedback for their own scans
- Device ID passed via request header for RLS

#### 4. Storage Layer (Cloudflare R2)

**Service**: Cloudflare R2 (S3-compatible)
**SDK**: boto3 (AWS S3 client)
**Bucket**: sachcheck-media

**Operations**:
- upload_file(local_path, modality) → object_key
- delete_file(object_key) → boolean
- get_file_url(object_key, expires_in) → presigned URL
- schedule_deletion(object_key, hours) → void

**File Organization**:
```
sachcheck-media/
├── video/
│   └── {uuid}.mp4
├── audio/
│   └── {uuid}.wav
└── image/
    └── {uuid}.jpg
```

**Lifecycle Rules**:
- Auto-delete objects after 48 hours
- Belt-and-suspenders: API deletion + lifecycle rule

**Cost Structure**:
- Storage: Free 10GB
- Operations: Free 1M writes, 10M reads/month
- Egress: Free (zero egress fees)

#### 5. Web Frontend (Next.js)

**Framework**: Next.js 15 (App Router)
**Rendering**: Server-Side Rendering + Client Components
**Styling**: Tailwind CSS
**State Management**: React hooks (useState, useEffect)
**HTTP Client**: Axios

**Page Structure**:
```
/app
├── layout.tsx (root layout)
├── page.tsx (home page)
├── globals.css (global styles)
├── privacy/
│   └── page.tsx (privacy policy)
└── terms/
    └── page.tsx (terms of service)
```

**Component Architecture**:
- **UploadCard**: File upload with drag-and-drop
- **VerdictCard**: Analysis results display
- **RecentScans**: Scan history dashboard
- **ConsentNotice**: Privacy consent banner

**State Management**:
- Device ID: localStorage persistence
- Current verdict: Component state
- Scan history: API-driven
- Consent state: localStorage

**Performance Optimizations**:
- Code splitting (automatic in Next.js)
- Image optimization (next/image)
- Lazy loading for components
- Efficient re-renders with React.memo

#### 6. Mobile App (React Native + Expo)

**Framework**: React Native 0.74 + Expo SDK 51
**Navigation**: Expo Router (file-based routing)
**Share Intent**: expo-share-intent
**Storage**: AsyncStorage
**HTTP Client**: Axios

**Screen Structure**:
```
/app
├── _layout.tsx (navigation layout)
├── index.tsx (home screen)
├── analyzing.tsx (analysis progress)
├── result.tsx (results display)
└── history.tsx (scan history)
```

**Key Features**:
- Native share intent for WhatsApp
- Background analysis with progress
- Local device ID persistence
- Offline queueing capability
- Push notification support

**Share Intent Configuration**:
```json
{
  "iosActivationRules": {
    "NSExtensionActivationSupportsMovieWithMaxCount": 1,
    "NSExtensionActivationSupportsImageWithMaxCount": 1,
    "NSExtensionActivationSupportsAudioWithMaxCount": 1
  },
  "androidIntentFilters": ["video/*", "image/*", "audio/*"]
}
```

#### 7. Infrastructure (Docker + Caddy)

**Docker Compose Services**:

**Caddy**:
- Image: caddy:2-alpine
- Ports: 80:80, 443:443
- Volumes: Caddyfile, data, config
- Purpose: Reverse proxy + SSL

**Backend**:
- Build: ../backend/Dockerfile
- Expose: 8000
- Env file: ../backend/.env
- Health check: curl -f http://localhost:8000/health
- Purpose: FastAPI backend

**Web**:
- Build: ../web/Dockerfile
- Expose: 3000
- Environment: NEXT_PUBLIC_API_URL
- Health check: curl -f http://localhost:3000
- Purpose: Next.js frontend

**Ollama**:
- Image: ollama/ollama
- Volumes: ollama_data
- Expose: 11434
- Purpose: Local AI model fallback

**Network**: sachcheck-network (bridge)
**Volumes**: caddy_data, caddy_config, ollama_data

**Caddy Configuration**:
```
sachcheck.yourdomain.com {
    reverse_proxy web:3000
    encode gzip
}

api.sachcheck.yourdomain.com {
    reverse_proxy backend:8000
    encode gzip
}
```

## Security Specifications

### Authentication & Authorization
- **Device-based**: Anonymous device ID for core functionality
- **Optional Auth**: Email magic link via Supabase Auth
- **RLS Policies**: Database-level access control
- **Rate Limiting**: 20 requests/hour per device

### Data Protection
- **Encryption in Transit**: TLS 1.3 via Caddy + Let's Encrypt
- **Encryption at Rest**: Supabase and R2 default encryption
- **Data Minimization**: 48-hour retention for media files
- **Purpose Limitation**: Analysis only, no training without consent

### Input Validation
- **File Type**: MIME type validation (video/*, audio/*, image/*)
- **File Size**: 50MB maximum
- **Content Type**: Strict validation against allowed types
- **Schema Validation**: Pydantic models for all inputs

### API Security
- **CORS**: Restricted to allowed origins
- **Rate Limiting**: Per-device IP-based limiting
- **Secrets Management**: Environment variables only
- **Error Handling**: No sensitive data in error messages

## Performance Specifications

### Response Time Targets
- **Health Check**: < 100ms
- **File Upload**: < 5s for 10MB file
- **Analysis**: < 10s for typical media
- **History Retrieval**: < 500ms for 20 records
- **API Documentation**: < 200ms

### Throughput Targets
- **Concurrent Users**: 100+ on free tier
- **Requests/Second**: 50+ on free tier
- **File Processing**: 10+ concurrent analyses
- **Database Queries**: 1000+ queries/second

### Resource Utilization
- **Backend Memory**: < 512MB per instance
- **Frontend Memory**: < 256MB per instance
- **Database Storage**: < 500MB for 10K scans
- **R2 Storage**: < 10GB with auto-deletion

## Monitoring & Logging

### Application Logging
- **Format**: Structured JSON
- **Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Destinations**: Console (Docker logs), Sentry (errors)
- **Retention**: 7 days for logs, 30 days for errors

### Health Monitoring
- **Endpoint**: /health
- **Checks**: Database connectivity, R2 access, model availability
- **Frequency**: Every 30 seconds (Docker health checks)
- **Alerting**: Sentry for errors, UptimeRobot for uptime

### Performance Monitoring
- **Metrics**: Response times, error rates, throughput
- **Tools**: Sentry performance monitoring
- **Dashboard**: Sentry dashboards
- **Alerting**: Error rate thresholds

## Compliance Specifications

### DPDP Act Compliance
- **Data Fiduciary**: Registered as data fiduciary
- **Consent Management**: Explicit consent before processing
- **Purpose Limitation**: Analysis only, no secondary purposes
- **Data Minimization**: Only collect necessary data
- **Retention Policy**: 48-hour media, indefinite metadata
- **User Rights**: Access, deletion, portability, grievance
- **Breach Notification**: documented breach response plan

### Privacy by Design
- **Default Settings**: Privacy-first defaults
- **Transparency**: Clear privacy policy
- **User Control**: Consent management, data deletion
- **Security**: Encryption, access controls, monitoring

## Development Specifications

### Code Standards
- **Python**: PEP 8, type hints, docstrings
- **TypeScript**: Strict mode, explicit types
- **React**: Functional components, hooks
- **File Naming**: kebab-case, PascalCase for components

### Git Workflow
- **Branching**: feature/* for new features
- **Commits**: Conventional commits format
- **PR Process**: Code review, CI checks
- **Deployment**: main branch triggers deployment

### Testing Strategy
- **Unit Tests**: pytest for backend
- **Integration Tests**: API endpoint tests
- **E2E Tests**: User workflow tests
- **Manual Tests**: UI/UX testing

## Deployment Specifications

### Development Environment
- **Local**: Docker Compose for full stack
- **Backend**: uvicorn with reload
- **Frontend**: Next.js dev server
- **Mobile**: Expo Go app

### Staging Environment
- **Infrastructure**: Same as production
- **Data**: Test database, test storage
- **Domain**: staging.sachcheck.com
- **Access**: Authenticated only

### Production Environment
- **Infrastructure**: Oracle Cloud Free or Hetzner
- **Database**: Supabase production
- **Storage**: R2 production bucket
- **Domain**: sachcheck.com
- **SSL**: Automatic via Caddy

### CI/CD Pipeline
- **Trigger**: Push to main branch
- **Steps**: Build → Test → Deploy → Verify
- **Rollback**: Manual via git revert
- **Monitoring**: Post-deployment health checks

## Scalability Specifications

### Horizontal Scaling
- **Backend**: Multiple instances behind load balancer
- **Frontend**: CDN + edge caching
- **Database**: Read replicas for scaling
- **Storage**: R2 automatically scales

### Vertical Scaling
- **Backend**: Upgrade to larger VPS instance
- **Database**: Supabase Pro tier
- **Storage**: R2 paid tier
- **Monitoring**: Enhanced monitoring tools

### Caching Strategy
- **API Response**: Redis for frequent queries
- **Static Assets**: CDN caching
- **Database Results**: Query result caching
- **Model Responses**: Cache similar analyses

## Backup & Recovery

### Database Backups
- **Frequency**: Daily automatic backups (Supabase)
- **Retention**: 7 days
- **Recovery**: Point-in-time recovery
- **Testing**: Monthly restore tests

### Configuration Backups
- **Frequency**: Git version control
- **Scope**: All configuration files
- **Recovery**: Git clone and deploy
- **Testing**: Configuration validation

### Disaster Recovery
- **RTO**: 4 hours (Recovery Time Objective)
- **RPO**: 24 hours (Recovery Point Objective)
- **Plan**: Documented DR procedures
- **Testing**: Quarterly DR drills

## Maintenance Specifications

### Regular Maintenance
- **Weekly**: Review logs and metrics
- **Monthly**: Security updates and patches
- **Quarterly**: Performance optimization review
- **Annually**: Architecture review and planning

### Update Management
- **Dependencies**: Regular security updates
- **Models**: Model evaluation and updates
- **Features**: User feedback-driven improvements
- **Documentation**: Keep docs updated with changes

### Support Process
- **Issues**: GitHub issue tracking
- **Priority**: Critical/High/Medium/Low
- **Response Time**: Based on priority
- **Escalation**: Documented escalation paths