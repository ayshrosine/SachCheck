# SachCheck API Specification

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://api.sachcheck.yourdomain.com`

## Authentication
- **Device-based**: Anonymous device ID in headers
- **Optional Auth**: Bearer token for authenticated users
- **Header**: `X-Device-ID: {device_id}` or `Authorization: Bearer {token}`

## Common Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File too large
- `415 Unsupported Media Type`: Invalid file type
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

## Endpoints

### 1. Health Check

#### GET /health
Check service health status.

**Request**:
```http
GET /health HTTP/1.1
Host: api.sachcheck.com
```

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-07-15T10:30:00.000Z",
  "environment": "production",
  "services": {
    "database": "connected",
    "storage": "configured",
    "model_router": "configured"
  }
}
```

**Status Codes**: 200

---

### 2. Scan Media

#### POST /api/scan
Upload and analyze media file for deepfake detection.

**Request**:
```http
POST /api/scan HTTP/1.1
Host: api.sachcheck.com
X-Device-ID: device_abc123
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="video.mp4"
Content-Type: video/mp4

<binary file data>
------WebKitFormBoundary
Content-Disposition: form-data; name="device_id"

device_abc123
------WebKitFormBoundary--
```

**Parameters**:
- `file` (required): Media file (video/*, audio/*, image/*)
- `device_id` (optional): Device identifier (auto-generated if not provided)

**File Constraints**:
- Maximum size: 50MB
- Supported types: video/*, audio/*, image/*
- Content validation: Strict MIME type checking

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "device_id": "device_abc123",
  "user_id": null,
  "modality": "video",
  "verdict": "likely_fake",
  "confidence": 85,
  "reasons": [
    "Lip movements do not match audio timing",
    "Unnatural blink rate (3 blinks in 60 seconds)",
    "Subtle flickering visible along jawline"
  ],
  "modality_flags": {
    "lip_sync_mismatch": true,
    "unnatural_blink_rate": true,
    "lighting_inconsistency": false,
    "tts_flatness": null,
    "urgency_language": null,
    "fake_authority": null,
    "payment_pressure": null
  },
  "object_key": "video/550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-07-15T10:30:00.000Z"
}
```

**Verdict Values**:
- `likely_real`: Content appears authentic
- `suspicious`: Some concerning elements detected
- `likely_fake`: High probability of manipulation
- `inconclusive`: Unable to determine with confidence

**Rate Limiting**: 20 requests per hour per device

**Status Codes**: 200, 400, 413, 415, 429, 500, 503

---

### 3. Get Scan History

#### GET /api/scans
Retrieve scan history for a device.

**Request**:
```http
GET /api/scans?device_id=device_abc123 HTTP/1.1
Host: api.sachcheck.com
X-Device-ID: device_abc123
```

**Parameters**:
- `device_id` (required): Device identifier
- `limit` (optional): Number of records to return (default: 20)

**Response**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "device_id": "device_abc123",
    "modality": "video",
    "verdict": "likely_fake",
    "confidence": 85,
    "reasons": ["Lip movements do not match audio timing"],
    "modality_flags": {
      "lip_sync_mismatch": true,
      "unnatural_blink_rate": true
    },
    "created_at": "2026-07-15T10:30:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "device_id": "device_abc123",
    "modality": "image",
    "verdict": "likely_real",
    "confidence": 92,
    "reasons": ["No manipulation indicators detected"],
    "modality_flags": {
      "urgency_language": false,
      "fake_authority": false
    },
    "created_at": "2026-07-15T09:15:00.000Z"
  }
]
```

**Status Codes**: 200, 400, 403, 404

---

### 4. Submit Feedback

#### POST /api/feedback
Submit user feedback on analysis accuracy.

**Request**:
```http
POST /api/feedback HTTP/1.1
Host: api.sachcheck.com
Content-Type: application/json

{
  "scan_id": "550e8400-e29b-41d4-a716-446655440000",
  "was_verdict_correct": true,
  "note": "Verdict was accurate, video was indeed manipulated"
}
```

**Parameters**:
- `scan_id` (required): UUID of the scan
- `was_verdict_correct` (required): Boolean indicating accuracy
- `note` (optional): Additional feedback text

**Response**:
```json
{
  "status": "success",
  "feedback": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "scan_id": "550e8400-e29b-41d4-a716-446655440000",
    "was_verdict_correct": true,
    "note": "Verdict was accurate, video was indeed manipulated",
    "created_at": "2026-07-15T10:35:00.000Z"
  }
}
```

**Status Codes**: 200, 400, 404, 500

---

### 5. Authentication

#### POST /api/auth/magic-link
Send magic link for email authentication.

**Request**:
```http
POST /api/auth/magic-link HTTP/1.1
Host: api.sachcheck.com
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Parameters**:
- `email` (required): User email address

**Response**:
```json
{
  "success": true,
  "message": "Magic link sent to email",
  "user_id": null,
  "access_token": null
}
```

**Status Codes**: 200, 400, 500

---

#### POST /api/auth/register
Register device with optional account.

**Request**:
```http
POST /api/auth/register HTTP/1.1
Host: api.sachcheck.com
Content-Type: application/json

{
  "email": "user@example.com",
  "device_id": "device_abc123"
}
```

**Parameters**:
- `email` (required): User email address
- `device_id` (required): Device identifier

**Response**:
```json
{
  "success": true,
  "message": "Device registered",
  "user_id": "user_uuid_here",
  "access_token": "jwt_token_here"
}
```

**Status Codes**: 200, 400, 409, 500

---

#### GET /api/auth/status
Check authentication status.

**Request**:
```http
GET /api/auth/status HTTP/1.1
Host: api.sachcheck.com
Authorization: Bearer jwt_token_here
```

**Response**:
```json
{
  "authenticated": true,
  "user_id": "user_uuid_here",
  "email": "user@example.com",
  "device_id": "device_abc123"
}
```

**Status Codes**: 200, 401

---

### 6. WhatsApp Webhook

#### POST /api/whatsapp/webhook
Receive and process WhatsApp messages.

**Webhook Verification**:
```http
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=challenge_code HTTP/1.1
Host: api.sachcheck.com
```

**Response**:
```json
{
  "status": "verified",
  "challenge": "challenge_code"
}
```

**Message Processing**:
```http
POST /api/whatsapp/webhook HTTP/1.1
Host: api.sachcheck.com
Content-Type: application/json

{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "1234567890",
                "type": "image",
                "image": {
                  "id": "media_id_here"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response**:
```json
{
  "status": "processed"
}
```

**Status Codes**: 200, 403, 500

---

## Data Models

### VerdictResponse
```typescript
{
  verdict: "likely_real" | "suspicious" | "likely_fake" | "inconclusive";
  confidence: number; // 0-100
  reasons: string[];
  modality_flags?: {
    lip_sync_mismatch?: boolean;
    unnatural_blink_rate?: boolean;
    lighting_inconsistency?: boolean;
    tts_flatness?: boolean;
    urgency_language?: boolean;
    fake_authority?: boolean;
    payment_pressure?: boolean;
  };
  model_used: string;
  processing_time_ms: number;
}
```

### ScanResponse
```typescript
{
  id: string; // UUID
  device_id: string;
  user_id?: string; // UUID
  modality: "video" | "audio" | "image";
  verdict: "likely_real" | "suspicious" | "likely_fake" | "inconclusive";
  confidence: number; // 0-100
  reasons: string[];
  modality_flags?: object;
  object_key?: string;
  created_at: string; // ISO 8601 timestamp
}
```

### FeedbackCreate
```typescript
{
  scan_id: string; // UUID
  was_verdict_correct: boolean;
  note?: string;
}
```

### HealthResponse
```typescript
{
  status: "healthy" | "unhealthy";
  version: string;
  timestamp: string; // ISO 8601 timestamp
  environment?: string;
  services?: {
    database: string;
    storage: string;
    model_router: string;
  };
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| INVALID_FILE_TYPE | Unsupported file type | 415 |
| FILE_TOO_LARGE | File exceeds size limit | 413 |
| RATE_LIMIT_EXCEEDED | Too many requests | 429 |
| INVALID_DEVICE_ID | Invalid device identifier | 400 |
| SCAN_NOT_FOUND | Scan record not found | 404 |
| AUTHENTICATION_FAILED | Authentication failed | 401 |
| AUTHORIZATION_FAILED | Authorization failed | 403 |
| MODEL_UNAVAILABLE | AI model unavailable | 503 |
| STORAGE_ERROR | Storage operation failed | 500 |
| DATABASE_ERROR | Database operation failed | 500 |

## Rate Limiting

### Limits
- **Anonymous**: 20 requests/hour per device
- **Authenticated**: 100 requests/hour per user
- **WhatsApp**: Unlimited (user-initiated conversations)

### Headers
Rate limit information is returned in headers:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1626330000
```

### Retry-After
When rate limited, the response includes:
```
Retry-After: 3600
```

## Webhooks

### WhatsApp Webhook
- **Endpoint**: `/api/whatsapp/webhook`
- **Method**: POST (for messages), GET (for verification)
- **Verification Token**: Configured in WhatsApp dashboard
- **Events**: Message received, message delivered, message read

## SDK Examples

### Python
```python
import requests

API_URL = "http://localhost:8000"
DEVICE_ID = "your_device_id"

# Upload and analyze
with open("video.mp4", "rb") as f:
    response = requests.post(
        f"{API_URL}/api/scan",
        files={"file": f},
        data={"device_id": DEVICE_ID},
        headers={"X-Device-ID": DEVICE_ID}
    )
    verdict = response.json()

# Get history
response = requests.get(
    f"{API_URL}/api/scans",
    params={"device_id": DEVICE_ID},
    headers={"X-Device-ID": DEVICE_ID}
)
history = response.json()
```

### JavaScript
```javascript
const API_URL = "http://localhost:8000";
const DEVICE_ID = "your_device_id";

// Upload and analyze
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("device_id", DEVICE_ID);

const response = await fetch(`${API_URL}/api/scan`, {
  method: "POST",
  headers: {
    "X-Device-ID": DEVICE_ID
  },
  body: formData
});
const verdict = await response.json();

// Get history
const historyResponse = await fetch(
  `${API_URL}/api/scans?device_id=${DEVICE_ID}`,
  {
    headers: {
      "X-Device-ID": DEVICE_ID
    }
  }
);
const history = await historyResponse.json();
```

### cURL
```bash
# Upload and analyze
curl -X POST http://localhost:8000/api/scan \
  -H "X-Device-ID: your_device_id" \
  -F "file=@video.mp4" \
  -F "device_id=your_device_id"

# Get history
curl http://localhost:8000/api/scans?device_id=your_device_id \
  -H "X-Device-ID: your_device_id"

# Health check
curl http://localhost:8000/health
```

## Testing

### Example Test Cases

#### Test 1: Valid Video Upload
```bash
curl -X POST http://localhost:8000/api/scan \
  -H "X-Device-ID: test_device" \
  -F "file=@test_video.mp4" \
  -F "device_id=test_device"
```

Expected: 200 OK with verdict response

#### Test 2: Invalid File Type
```bash
curl -X POST http://localhost:8000/api/scan \
  -H "X-Device-ID: test_device" \
  -F "file=@test.pdf" \
  -F "device_id=test_device"
```

Expected: 415 Unsupported Media Type

#### Test 3: File Too Large
```bash
curl -X POST http://localhost:8000/api/scan \
  -H "X-Device-ID: test_device" \
  -F "file=@large_video.mp4" \
  -F "device_id=test_device"
```

Expected: 413 Payload Too Large

#### Test 4: Rate Limiting
```bash
# Make 21 requests in quick succession
for i in {1..21}; do
  curl -X POST http://localhost:8000/api/scan \
    -H "X-Device-ID: test_device" \
    -F "file=@test_video.mp4"
done
```

Expected: 429 Too Many Requests on 21st request

## Versioning

### Current Version: 1.0.0

### Versioning Strategy
- **Major Version**: Breaking changes
- **Minor Version**: New features, backward compatible
- **Patch Version**: Bug fixes, backward compatible

### Deprecated Endpoints
None currently deprecated.

### Backward Compatibility
- Maintain backward compatibility for minor versions
- Provide migration guides for major versions
- Support previous versions for 6 months after deprecation