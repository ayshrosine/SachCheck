# SachCheck — Full Production Build Guide
### From zero to a real, deployed, end-to-end product (not a hackathon demo)

Built for: Team Monaco_Gem | Core model: Gemma 4 (Google DeepMind, released June 2026)
Guide last verified against live pricing/docs: July 15, 2026 — infra pricing and free tiers change; re-check before committing budget.

> **Read this first.** This guide assumes zero prior experience deploying an AI product. Every section tells you *what* to install, *why*, and *exactly how*. Where the ecosystem is genuinely unstable (this happens with a model that's 6 weeks old), I say so instead of pretending it's solved.

---

## Table of contents

0. [TL;DR — your stack at a glance](#0-tldr)
1. [Architecture overview](#1-architecture)
2. [Complete tech stack](#2-tech-stack)
3. [The model layer — Gemma 4 in production](#3-model-layer)
4. [Repository structure](#4-repo-structure)
5. [Backend (FastAPI)](#5-backend)
6. [Data & storage (Supabase + Cloudflare R2)](#6-data-storage)
7. [Frontend web (Next.js)](#7-frontend-web)
8. [Mobile app (React Native + Expo)](#8-mobile-app)
9. [Full feature list + implementation map](#9-features)
10. [Security, privacy & legal (DPDP)](#10-security-legal)
11. [Infrastructure & deployment](#11-deployment)
12. [Cost breakdown](#12-costs)
13. [Build roadmap](#13-roadmap)
14. [Post-launch: scaling & what comes next](#14-post-launch)
15. [Quick command reference](#15-commands)

---

<a id="0-tldr"></a>
## 0. TL;DR — your stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Core model | **Gemma 4 12B Unified** (encoder-free, native audio+video+image) | Only Gemma 4 size that natively handles all three of your modalities in one forward pass |
| Model hosting (primary) | **Google AI Studio API** (free, rate-limited) | Zero infra, zero GPU needed, reliable for all modalities today |
| Model hosting (fallback) | **Ollama**, self-hosted, official `gemma4`/`gemma4:e4b` | Free, image+text reliable today; audio is not yet stable there — see §3.3 |
| Backend | **FastAPI** (Python) | Async I/O for media + calls, auto-generated OpenAPI (mobile team reuses it), huge ecosystem |
| Database + Auth | **Supabase** (Postgres, free tier) | Real relational DB + built-in auth + row-level security, $0 to start |
| Media storage | **Cloudflare R2** (free 10GB, zero egress) | You're storing/serving video & audio — egress fees would otherwise eat your budget alive |
| Web frontend | **Next.js**, self-hosted on your own VPS via Docker + Caddy (Netlify as a $0 alternative) | Avoids Vercel's Hobby-tier "no commercial use" restriction — see §7 |
| Mobile | **React Native + Expo**, `expo-share-intent` for the WhatsApp share flow | Single codebase for Android + iOS; native OS share-sheet integration is the actual product |
| Backend hosting | **Oracle Cloud Always Free** (2 OCPU/12GB ARM VM, $0) with **Hetzner CX22** (~₹380–420/mo) as backup | Fits your ₹500 ceiling with room to spare |
| Bonus channel | **WhatsApp Cloud API** direct from Meta | User-initiated "service conversations" are free, unlimited — matches your exact use case (someone forwards you something) |

**Total recurring cost at MVP scale: ₹0–400/month.** One-time/annual costs outside that budget: Google Play Store $25 *one-time*, Apple Developer $99/*year* (you can ship Android + web first and defer Apple — see §12).

---

<a id="1-architecture"></a>
## 1. Architecture overview

The diagram above shows the shape of it. In words, here's what happens when someone forwards a suspicious video:

1. **Client** (web page, mobile app via native share-sheet, or a WhatsApp message to your bot number) sends the media file to your backend.
2. **Backend API** (FastAPI) receives it, validates file type/size, uploads the raw file to **Cloudflare R2**, and kicks off analysis.
3. **Model router** tries the **cloud Gemma 4 12B API** (Google AI Studio) first. If that call fails, times out, or is rate-limited, it automatically retries once, then falls back to the **local Gemma model** (Ollama) running on your own server — for image/text modalities today; see §3.3 for the audio caveat.
4. The model returns **strict JSON**: verdict, confidence, reasons, per-modality flags.
5. Backend writes the scan record (verdict, confidence, reasons — never the raw file itself) to **Supabase Postgres**, sets a **deletion timer** on the R2 object (privacy — see §10), and returns the verdict to the client.
6. Client renders the **verdict card** in under ~10 seconds. If it came in via WhatsApp, the bot replies in the same chat thread.

This is the same conceptual flow as your hackathon doc — the difference for production is: real fallback logic instead of a single API call, real persistent storage instead of SQLite, real deletion/retention instead of "keep everything," and three entry points (web, mobile, WhatsApp) instead of one web form.

---

<a id="2-tech-stack"></a>
## 2. Complete tech stack

| Concern | Technology | Cost | Alternative if you outgrow it |
|---|---|---|---|
| AI model | Gemma 4 12B Unified (+ E4B fallback) | Free (open weights, Apache 2.0) | Gemma 4 26B MoE for higher accuracy |
| Model API (primary) | Google AI Studio | Free, rate-limited | Vertex AI (paid, higher limits) |
| Model hosting (fallback) | Ollama on your VPS | Free | Dedicated GPU VPS (Hetzner GPU, Lambda) |
| Backend framework | FastAPI + Uvicorn/Gunicorn | Free | — |
| Background jobs | FastAPI `BackgroundTasks` → Celery + Redis once you have real concurrency | Free | AWS SQS + Lambda |
| Database | Postgres via Supabase | Free tier (500MB) | Supabase Pro ($25/mo) |
| Auth | Supabase Auth (email magic link → phone OTP later) | Free (SMS costs extra later) | Auth0, Clerk |
| Object storage | Cloudflare R2 | Free (10GB) | R2 paid ($0.015/GB) |
| Web frontend | Next.js 15 (App Router) | Free | — |
| Web hosting | Self-hosted (Docker+Caddy) or Netlify free | Free | Vercel Pro ($20/user/mo) once you need it |
| Mobile framework | React Native + Expo (SDK 54+) | Free | — |
| Mobile build/release | EAS Build (Expo's free tier) | Free (limited builds/month) | EAS paid plan |
| Reverse proxy / TLS | Caddy (automatic HTTPS) | Free | Nginx + Certbot |
| Containers | Docker + Docker Compose | Free | Kubernetes (not yet — see §11) |
| Server | Oracle Cloud Always Free ARM VM | Free | Hetzner CX22 (~₹380–420/mo) |
| Monitoring/errors | Sentry free tier | Free (5K events/mo) | Sentry paid |
| Uptime checks | UptimeRobot free | Free | — |
| CI/CD | GitHub Actions | Free (public repo) / 2,000 min free (private) | — |
| Bonus channel | WhatsApp Cloud API (direct, no BSP middleman) | Free for user-initiated replies | 360dialog/Twilio if you need marketing templates later |

---

<a id="3-model-layer"></a>
## 3. The model layer — Gemma 4 in production

### 3.1 Gemma 4 family cheat-sheet

Gemma 4 (Google DeepMind, launched June 2026) ships in five sizes. This matters because your choice determines both quality and what hardware can run it:

| Model | Params | Multimodal input | Context | Where it runs | Use it for |
|---|---|---|---|---|---|
| **E2B** | 2.3B effective | Text, image, **audio** (native) | 128K | Phones, Raspberry Pi 5 | Ultra-light fallback, on-device experiments |
| **E4B** | 4B effective | Text, image, **audio** (native) | 128K | Any modern phone/laptop, cheap VPS | Your self-hosted fallback (image/text reliable; audio — see 3.3) |
| **12B Unified** | 12B, encoder-free | Text, image, video, **audio** (native) | 256K | 16GB VRAM or unified memory (e.g. a decent laptop/Mac) | **Your primary model** — this is the one your docs specced, and it's the right call |
| **26B A4B** | 25.2B total / 3.8B active (MoE) | Text, image (video/audio not native) | 256K | Consumer GPU | Higher reasoning quality if you need it later |
| **31B Dense** | 31B | Text, image | 256K | ~20GB VRAM (4-bit) / H100 for full precision | Not needed for this project |

The **12B Unified** variant is the one that matters for you: it's Google's first medium-sized model with an *encoder-free* architecture — image and audio are projected directly into the language model instead of going through separate vision/audio encoders first. That's exactly the "does the lip movement match the audio" cross-modal reasoning your pitch is built on, and it's not a marketing claim — it's a real architectural difference from Gemma 3 and most other multimodal models.

### 3.2 Primary path: Google AI Studio (do this first)

This is your main model access — free, no GPU, no infra, works today for all three modalities.

1. Go to **[ai.google.dev](https://ai.google.dev)** → sign in with any Google account → generate an API key. No credit card needed for the free tier.
2. In the model picker, confirm the exact API model ID string for Gemma 4 12B (naming has varied slightly across Google's docs during rollout — verify it live rather than trusting a hardcoded string from any guide, including this one).
3. **Create a separate Google Cloud project for anything you might later put billing on.** This is a real gotcha: the moment you enable billing on a project (to raise rate limits), that project's free tier disappears entirely — every call becomes billable from token one, even ones that would've fit inside the free quota. Keep a billing-free project for development/low-volume production, and only spin up a billed project when you've outgrown the free tier and know it.
4. Install the SDK:
```bash
pip install google-generativeai --break-system-packages
```
5. Minimal working call:
```python
import google.generativeai as genai

genai.configure(api_key="YOUR_API_KEY")
model = genai.GenerativeModel("gemma-4-12b-it")  # confirm exact ID in AI Studio

response = model.generate_content(
    ["Analyze this media for signs of deepfake manipulation. Return JSON only."],
    generation_config={"temperature": 0.2}
)
print(response.text)
```
6. **Rate limits**: free tier is genuinely usable for MVP-scale traffic (rate-limited per minute/day, not a fixed monthly cap), but it is a prototyping/low-volume-production tier, not an infinite budget. Build retry/backoff (below) from day one so a 429 never crashes a user's request.

### 3.3 Fallback path: Ollama — and an honest caveat about audio

Ollama is your free, self-hosted safety net for when the cloud API is down, rate-limited, or you want to control cost at scale.

**Setup:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull gemma4          # 12B-class, if your box has the RAM/VRAM
ollama pull gemma4:e4b       # lighter edge variant — recommended default for a budget VPS
ollama serve                 # runs on localhost:11434 by default
```

Quick test:
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4:e4b",
  "messages": [{"role": "user", "content": "Say hello in one sentence."}]
}'
```

**The honest caveat (please read this before you build around it):** as of this model's first few weeks in the wild, Ollama's official Gemma 4 builds handle **text and image reliably**. **Audio input is not yet stable on Ollama** — there's an open, acknowledged bug where Gemma 4 E4B audio requests crash the model server. Community GGUF quantizations note the same thing: image works on Ollama today, audio currently only works through raw `llama.cpp` with a special combined vision+audio projector file, which got a fix in early June and is improving fast but is not a one-command install.

**What this means practically:**
- Use the **Ollama fallback for screenshot/scam-text and image analysis** — this works today, no caveats.
- For **video and voice-clone detection** (your flagship feature), treat the **cloud API as required**, not optional, until the self-hosted ecosystem stabilizes. If the cloud API is down and someone forwards a voice note, show "temporarily unavailable, please try again shortly" rather than silently falling back to a model that may crash or hallucinate a transcription.
- If you want a fully offline audio path anyway (e.g. for a demo without internet), the current (fast-moving) route is: build `llama.cpp` from source with the latest Gemma 4 Unified conversion fix, download the combined `mmproj` file, and run `llama-server` directly rather than through Ollama. Re-check `ollama.com/library/gemma4` before you build this — this is exactly the kind of thing that gets fixed in weeks, not months, and by the time you read this it may already just work.

### 3.4 LM Studio (for local development/testing, not production)

LM Studio gives you a GUI to test prompts against Gemma 4 on your own laptop before wiring anything into code — genuinely useful for the "does my prompt actually produce calibrated, well-formed JSON" iteration loop.

1. Download from **lmstudio.ai**, install, open the model search, download **Gemma 4 12B** or **E4B** (GGUF format).
2. Load the model, open the **Local Server** tab, start the server (OpenAI-compatible API on `localhost:1234` by default).
3. Test the same way you'd call OpenAI's API:
```python
import requests
resp = requests.post("http://localhost:1234/v1/chat/completions", json={
    "model": "gemma-4-12b",
    "messages": [{"role": "user", "content": "Hello"}]
})
print(resp.json())
```
As with Ollama, treat audio support here as "test it yourself before relying on it" — the whole self-hosted ecosystem is catching up to Gemma 4's audio capability at the same time you're building.

### 3.5 The model router (this is the actual production upgrade over the hackathon code)

Instead of one function per modality calling one API, production needs a router that tries cloud first, falls back locally, retries sanely, and always returns your fixed schema:

```python
# backend/app/model_router.py
import base64, json, logging, time
import google.generativeai as genai
import requests
from app.config import settings
from app.schemas import Verdict

log = logging.getLogger("model_router")
genai.configure(api_key=settings.GOOGLE_API_KEY)

SYSTEM_PROMPT = open("app/prompts/system_prompt.txt").read()

def analyze(file_path: str, modality: str, mime_type: str) -> Verdict:
    """modality: 'video' | 'audio' | 'image'"""
    try:
        return _call_cloud(file_path, modality, mime_type)
    except Exception as e:
        log.warning("cloud model failed (%s), falling back to local", e)
        if modality == "audio":
            # Known limitation as of writing — see §3.3. Don't silently
            # serve a possibly-broken local audio result; fail loudly instead.
            raise RuntimeError("analysis temporarily unavailable — please retry") from e
        return _call_local(file_path, modality, mime_type)

def _call_cloud(file_path, modality, mime_type, retries=2):
    with open(file_path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    model = genai.GenerativeModel(settings.GOOGLE_MODEL, system_instruction=SYSTEM_PROMPT)
    for attempt in range(retries + 1):
        try:
            resp = model.generate_content(
                [{"mime_type": mime_type, "data": data}, "Analyze this media. Return STRICT JSON only."],
                generation_config={"temperature": 0.2, "response_mime_type": "application/json"},
            )
            return Verdict.model_validate_json(resp.text)
        except Exception:
            if attempt == retries:
                raise
            time.sleep(2 ** attempt)  # exponential backoff: 1s, 2s

def _call_local(file_path, modality, mime_type):
    with open(file_path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    resp = requests.post(
        f"{settings.OLLAMA_URL}/api/chat",
        json={
            "model": settings.OLLAMA_MODEL,  # e.g. "gemma4:e4b"
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": "Analyze this media. Return STRICT JSON only.", "images": [data]},
            ],
            "format": "json",
            "stream": False,
        },
        timeout=60,
    )
    return Verdict.model_validate_json(resp.json()["message"]["content"])
```

### 3.6 Prompt & schema design

Your hackathon doc's prompt principles were already good practice — production just makes them stricter and enforced in code, not just in the prompt text:

```python
# backend/app/schemas.py
from pydantic import BaseModel, Field
from typing import Literal, Optional

class ModalityFlags(BaseModel):
    visual: Optional[str] = None
    audio: Optional[str] = None
    text: Optional[str] = None

class Verdict(BaseModel):
    verdict: Literal["Likely Fake", "Suspicious", "Likely Real", "Inconclusive"]
    confidence: int = Field(ge=0, le=100)
    reasons: list[str]
    modality_flags: ModalityFlags
```

Using Pydantic to validate the model's JSON output (rather than just `json.loads` and hoping) means a malformed response fails loudly and triggers your retry logic — instead of a broken card silently rendering in front of someone's grandmother.

**System prompt skeleton** (`app/prompts/system_prompt.txt`):
```text
You are a media forensics assistant for SachCheck, a tool that helps ordinary
people evaluate whether forwarded media might be an AI deepfake or part of a
scam. You are not a court of law — you flag risk, you do not issue verdicts
of fact about real people.

Rules:
- Express calibrated uncertainty. Never claim certainty you don't have.
- Cite specific, observable artifacts (lip-sync mismatch, unnatural blink
  rate, inconsistent lighting, TTS-like flatness, urgency/payment-pressure
  language) — never a vague "this seems suspicious."
- If the media doesn't contain enough signal to judge, return "Inconclusive"
  rather than guessing.
- Output STRICT JSON matching the given schema. No markdown, no preamble,
  no text before or after the JSON object.

Few-shot anchors:
[one short labeled real example, one short labeled fake example — keep both
under ~150 words combined so they don't eat your context budget on every call]
```

Gemma 4's native multilingual support (140+ languages) is what makes the "explain this to my parent in Hindi/Marathi" feature genuinely easy: you don't need a separate translation step, you just change one line of the prompt (`Respond in Hindi, in plain conversational language a non-technical adult would use`) and re-call the same model.

---

<a id="4-repo-structure"></a>
## 4. Repository structure

A monorepo keeps the shared schema (the `Verdict` shape) consistent across backend, web, and mobile:

```
sachcheck/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, route registration
│   │   ├── routers/
│   │   │   ├── scan.py          # POST /scan, GET /scans
│   │   │   ├── auth.py
│   │   │   └── whatsapp.py      # webhook for the WhatsApp bot channel
│   │   ├── model_router.py      # §3.5
│   │   ├── prompts/
│   │   │   └── system_prompt.txt
│   │   ├── schemas.py           # Pydantic models (Verdict, etc.)
│   │   ├── db.py                # Supabase/Postgres connection
│   │   ├── storage.py           # Cloudflare R2 client
│   │   ├── config.py            # env var loading (pydantic-settings)
│   │   └── rate_limit.py
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── web/                          # Next.js app
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── Dockerfile
├── mobile/                       # React Native + Expo app
│   ├── app/                      # Expo Router screens
│   ├── app.json
│   └── package.json
├── infra/
│   ├── docker-compose.yml
│   ├── Caddyfile
│   └── github-actions/
├── demo_data/                    # your existing curated test set — keep it, it's still valuable for regression testing
└── README.md
```

---

<a id="5-backend"></a>
## 5. Backend (FastAPI)

### 5.1 Setup

```bash
mkdir -p sachcheck/backend/app
cd sachcheck/backend
python -m venv venv && source venv/bin/activate
pip install fastapi "uvicorn[standard]" python-multipart pydantic pydantic-settings \
            sqlalchemy asyncpg google-generativeai boto3 slowapi python-dotenv --break-system-packages
pip freeze > requirements.txt
```

`boto3` is used for R2 (S3-compatible API); `slowapi` gives you rate limiting; `asyncpg`/`sqlalchemy` talk to Supabase Postgres.

### 5.2 Core endpoints

```python
# backend/app/routers/scan.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.model_router import analyze
from app.storage import upload_to_r2, schedule_deletion
from app.db import save_scan, get_recent_scans
from app.rate_limit import limiter

router = APIRouter()

@router.post("/scan")
@limiter.limit("20/hour")  # per device/IP — protects your free-tier quota from abuse
async def create_scan(request, file: UploadFile = File(...), device_id: str = None):
    modality = _detect_modality(file.content_type)
    if modality is None:
        raise HTTPException(415, "Unsupported file type")
    if file.size and file.size > 50 * 1024 * 1024:
        raise HTTPException(413, "File too large (50MB max)")

    local_path = await _save_temp(file)
    try:
        verdict = analyze(local_path, modality, file.content_type)
    except RuntimeError as e:
        raise HTTPException(503, str(e))

    object_key = upload_to_r2(local_path, modality)
    schedule_deletion(object_key, hours=48)  # privacy: auto-delete raw media — see §10
    scan = save_scan(device_id=device_id, modality=modality, verdict=verdict, object_key=object_key)
    return scan

@router.get("/scans")
async def list_scans(device_id: str):
    return get_recent_scans(device_id)
```

### 5.3 Why device-scoped, not account-gated

Your own docs are right that this product lives or dies on frictionlessness — "the panic gap" section says it plainly. So: **don't put a login wall in front of the core check.** Generate an anonymous `device_id` on first launch (stored locally on the client), tie scan history to that, and rate-limit by it. Offer an *optional* account (email magic link, free — see §6.2) only for people who want cross-device history. This is both the better product decision and the cheaper one: no SMS OTP costs, no signup drop-off between "someone is panicking on a scam call" and "getting an answer."

### 5.4 Retry/backoff and error handling to build in from day one

- Gemma API timeout or 429 → retry once with backoff, then fall back (§3.5) or return a graceful "analysis inconclusive, try again shortly" — never hang the UI.
- Unsupported file type / oversized file → clear 4xx error, not a crash.
- Malformed model JSON → Pydantic validation catches it, triggers retry with a stricter "return ONLY JSON" reminder appended to the prompt.
- Wrap all of this in structured logging (see §11.5) so you can see *which* failure mode is happening in production, not just that something failed.

---

<a id="6-data-storage"></a>
## 6. Data & storage

### 6.1 Supabase (Postgres + Auth)

1. Create a free project at **supabase.com**.
2. Free tier gives you: 500MB Postgres, 1GB file storage (you won't use this — media goes to R2), 50,000 monthly active users on auth, unlimited API requests within the above. Plenty of headroom for scan metadata (text + JSON, not the media itself) — 500MB holds a *lot* of scan records.
3. **The one gotcha**: free projects pause after 7 days with zero API traffic. Fix it with a scheduled GitHub Actions workflow that pings your health endpoint every few days (free, ~20 minutes to set up):
```yaml
# .github/workflows/keepalive.yml
on:
  schedule:
    - cron: '0 0 */3 * *'   # every 3 days
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -sf https://your-supabase-project.supabase.co/rest/v1/ -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

**Schema:**
```sql
create table scans (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  user_id uuid references auth.users(id),  -- null for anonymous device-only scans
  modality text not null check (modality in ('video','audio','image')),
  verdict text not null,
  confidence int not null,
  reasons jsonb not null,
  modality_flags jsonb,
  object_key text,               -- R2 key, nulled out once media is deleted
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references scans(id),
  was_verdict_correct boolean,   -- the "was this right?" loop — your future fine-tuning data
  note text,
  created_at timestamptz default now()
);

create index on scans (device_id, created_at desc);
alter table scans enable row level security;
-- policy: a device/user can only read its own scans
create policy "own scans only" on scans for select using (device_id = current_setting('request.device_id', true) or user_id = auth.uid());
```

### 6.2 Auth (add this once you need cross-device history)

Supabase Auth's **email magic link** is genuinely free (no SMS cost) and is the right default for MVP. **Phone OTP** is more natural for your actual target users (elderly, first-time smartphone owners often don't check email) but requires configuring a paid SMS provider (Twilio/MSG91) behind Supabase — budget for this as a fast-follow once you have any revenue or grant funding, not as a day-one requirement.

### 6.3 Cloudflare R2 (media storage)

1. Create a free Cloudflare account → R2 → create a bucket.
2. Free tier: 10GB storage, 1M write operations, 10M read operations per month, **zero egress fees** — this last point matters enormously for you specifically, since you're storing/serving video and audio, and R2 is the one major object storage provider that doesn't charge to serve that data back out.
3. It's S3-compatible, so standard tooling works:
```python
# backend/app/storage.py
import boto3, uuid
from app.config import settings

r2 = boto3.client(
    "s3",
    endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=settings.R2_ACCESS_KEY,
    aws_secret_access_key=settings.R2_SECRET_KEY,
)

def upload_to_r2(local_path: str, modality: str) -> str:
    key = f"{modality}/{uuid.uuid4()}"
    r2.upload_file(local_path, settings.R2_BUCKET, key)
    return key

def schedule_deletion(key: str, hours: int = 48):
    # simplest approach: a scheduled job (cron/GitHub Actions) that deletes
    # objects older than N hours. R2 also supports lifecycle rules natively —
    # set one in the dashboard so this works even if your job ever fails.
    ...
```
4. **Set a bucket lifecycle rule to auto-expire objects after 48 hours** (or whatever window you land on) directly in the Cloudflare dashboard — belt-and-suspenders alongside your own deletion job. This is your single most important privacy control: you analyze the media, you keep the *verdict*, you do not keep grandma's WhatsApp video sitting in a bucket indefinitely.


---

<a id="7-frontend-web"></a>
## 7. Frontend web (Next.js)

### 7.1 Setup

```bash
cd sachcheck
npx create-next-app@latest web --typescript --tailwind --app
cd web
npm install axios
```

### 7.2 Pages/components

1. **Upload screen** — drag-and-drop or file picker, accepts video/audio/image, shows a loading state ("Analyzing frames and audio...") since Gemma calls take a few seconds.
2. **Verdict card** — the centerpiece. Big color-coded badge (green = Likely Real, amber = Suspicious, red = Likely Fake, gray = Inconclusive), confidence meter, bulleted "why" reasons rendered prominently (this is your explainability differentiator — don't bury it below the fold).
3. **Recent scans dashboard** — pulls from `GET /scans`, keyed by the local `device_id`.
4. **"Explain simply" button** — re-requests the same scan's reasons with the prompt's language/complexity instruction changed (Hindi/Marathi/plain-language). Because Gemma 4 handles 140+ languages natively, this is a re-prompt, not a new pipeline.

### 7.3 Where to host it — and the gotcha to avoid

**Do not default to Vercel's free Hobby tier for this.** Vercel's terms of service explicitly restrict Hobby to non-commercial, personal use — "any Deployment used for the purpose of financial gain of anyone involved" counts as commercial, and enforcement, while inconsistent, is real. SachCheck is a real product, even pre-revenue.

Two free-and-legitimate options instead:
- **Netlify's free Starter tier** explicitly permits commercial use, with similar limits to Vercel Hobby (100GB bandwidth, ~125K function invocations/month). Closest drop-in replacement; some advanced Next.js features (on-demand ISR) behave slightly differently there — fine for a mostly form-and-dashboard app like this one.
- **Self-host it** on the same VPS as your backend, via Docker + Caddy (see §11). Since you're already paying $0–₹400/month for that box regardless, this adds no extra cost and keeps everything under one roof, one bill, one place to check logs.

This guide's Docker Compose (§11.3) does the self-hosted version by default; swap in Netlify if you'd rather not manage the frontend container yourself.

---

<a id="8-mobile-app"></a>
## 8. Mobile app (React Native + Expo)

This section matters more than it looks. Your own problem statement says it plainly: nobody opens a separate app in the 30 seconds they're deciding whether to forward a video. **The single feature that makes SachCheck actually usable in that moment is receiving the file directly from WhatsApp's native "Share" sheet** — not "open SachCheck, then upload." Get this right and the rest of the mobile app is a fairly ordinary CRUD screen.

### 8.1 Setup

```bash
cd sachcheck
npx create-expo-app mobile --template
cd mobile
npx expo install expo-router expo-notifications
npm install expo-share-intent
```

### 8.2 Receiving a shared file from WhatsApp (the core feature)

`expo-share-intent` registers your app as a share target on both Android and iOS from a single codebase — someone hits "Share" on a WhatsApp video and your app appears in the sheet.

```jsonc
// app.json — register the share extension
{
  "expo": {
    "plugins": [
      ["expo-share-intent", {
        "iosActivationRules": { "NSExtensionActivationSupportsMovieWithMaxCount": 1, "NSExtensionActivationSupportsImageWithMaxCount": 1 },
        "androidIntentFilters": ["video/*", "image/*", "audio/*"]
      }]
    ]
  }
}
```

```tsx
// app/index.tsx — handling the incoming share
import { useShareIntent } from "expo-share-intent";
import { useEffect } from "react";
import { router } from "expo-router";

export default function Home() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    if (hasShareIntent && shareIntent?.files?.length) {
      // user shared a video/image/audio file straight from WhatsApp
      router.push({ pathname: "/analyzing", params: { uri: shareIntent.files[0].path } });
      resetShareIntent();
    }
  }, [hasShareIntent]);

  return <HomeScreen />;
}
```

That `/analyzing` screen uploads the file to your existing `POST /scan` endpoint — same backend, same model router, no special mobile-only logic needed server-side.

### 8.3 Push notifications

For cases where analysis takes longer than a user wants to wait around for (e.g. queued during a traffic spike): `expo-notifications` (free, via Expo's push service) to alert "Your scan is ready" and deep-link back into the verdict card.

### 8.4 Offline queueing (a real tier-2/3-India concern, not a nice-to-have)

Your target users are disproportionately on patchy connectivity. Queue uploads locally (e.g. with a small SQLite table via `expo-sqlite`) and retry when connectivity returns, rather than failing silently on a dropped connection mid-upload.

### 8.5 Building and releasing

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # internal testing APK
eas build --platform android --profile production # AAB for Play Store
```
EAS's free tier includes a limited number of builds per month — plenty for a solo/small team's release cadence. **Google Play Console is a $25 one-time fee** (not recurring). **Apple Developer Program is $99/year** — given Android dominates in tier-2/3 India (your stated primary audience), it's a completely reasonable choice to ship Android + web first and defer the iOS build until you have traction or funding to justify the annual fee.

### 8.6 Bonus channel: a WhatsApp bot number (genuinely worth prioritizing early)

This deserves more attention than "future stretch goal." Here's why: when someone forwards a suspicious video *to your WhatsApp Business number* instead of opening a separate app, that's a **user-initiated conversation** — and under Meta's current pricing, free-form replies inside that 24-hour customer-service window are **free and unlimited**, regardless of volume. Since SachCheck's entire interaction pattern (user sends something, you reply once) fits neatly inside that window, this channel should cost you close to nothing to run, while removing the single biggest adoption barrier for your stated audience: installing yet another app.

Rough setup:
1. Get a dedicated phone number (not currently tied to a personal WhatsApp/WhatsApp Business app account).
2. Register for the **WhatsApp Cloud API** directly through Meta's developer platform (business verification required — budget a few days to a couple weeks for approval, it can be slow).
3. Build a webhook endpoint (`backend/app/routers/whatsapp.py`) that receives incoming media messages, runs them through the same `model_router.analyze()`, and replies in the same thread with the verdict.
4. Keep your bot strictly reactive (reply only within the free service window) — the moment you want to *proactively* message someone (a "utility" or "marketing" template), that's billed per-message, so avoid it unless there's a real product reason.

This is a strong Phase 2 addition once your core web+mobile flow is solid (see §13) — build the analysis engine once, expose it through three doors.

---

<a id="9-features"></a>
## 9. Full feature list + implementation map

Your original feature table, plus everything a *production* system needs that a hackathon demo can skip.

### Core features (from your original doc)

| Feature | What it does | How it's built | New in production |
|---|---|---|---|
| Video deepfake analysis | Lip-sync mismatch, blink rate, lighting inconsistency | Gemma 4 12B, video sampled at key frames | Real retry/fallback logic, not a single try/except |
| Voice-clone detection | Unnatural pacing, breath pattern, TTS flatness | Gemma 4 12B, native audio input | Cloud-only for now (§3.3) — flagged to the user honestly if temporarily unavailable |
| Screenshot/scam-text analysis | Urgency language, fake authority, payment pressure | Gemma 4 12B/E4B, image input | Works on both cloud and local fallback |
| Explainable verdicts | Plain-language reasons, not a black box | Structured JSON schema, Pydantic-validated | Schema is enforced in code, not just prompted for |
| Cross-modal reasoning | Checks audio vs. video consistency | Single Gemma call across both modalities | Unchanged — this is Gemma 4's actual differentiator |
| Recent scans dashboard | History of past checks | `GET /scans`, device-scoped | Backed by real Postgres, not SQLite |
| Vernacular explanation mode | Re-explains in Hindi/Marathi | Re-prompt with language instruction | Trivial due to Gemma 4's 140+ language support |

### Production-necessary additions (not in the hackathon scope, but real requirements)

| Feature | Why it's needed | How it's built |
|---|---|---|
| Native share-intent (mobile) | *The* adoption feature — see §8.2 | `expo-share-intent` |
| WhatsApp bot channel | Removes app-install friction entirely; near-$0 to run | Meta Cloud API webhook, §8.6 |
| Device-scoped anonymous use | Frictionless core flow per your own "panic gap" analysis | Local device ID, no login wall — §5.3 |
| Optional account + cross-device history | For users who want it, without gating the core flow | Supabase Auth, email magic link |
| Rate limiting / abuse prevention | Protects your free-tier model quota from being drained | `slowapi`, per-device/IP limits |
| Feedback loop ("was this right?") | Real accuracy data, future fine-tuning signal, honesty about model limits | `feedback` table, one-tap thumbs up/down on the verdict card |
| Low-confidence escalation | Calibrated humility instead of false certainty at the edges | "Inconclusive" verdict path + a visible "verify manually" prompt for low-confidence results |
| Media auto-deletion | Core privacy commitment — see §10 | R2 lifecycle rule + scheduled deletion job |
| Structured logging & error monitoring | You can't fix what you can't see once this isn't running on your laptop | Sentry free tier |
| CI/CD | Confidence to ship changes without babysitting a deploy | GitHub Actions → your VPS |
| Consent notice + privacy policy | Legal requirement, not optional — see §10 | Shown before first upload, plain language |

---

<a id="10-security-legal"></a>
## 10. Security, privacy & legal

This is not a section to skip "for now." You're processing photos, videos, and voice recordings of real families — get the basics right from day one, because retrofitting privacy after you have real users is much harder than building it in.

### 10.1 Technical baseline

- **Encrypt in transit**: HTTPS everywhere (Caddy gives you this automatically — see §11).
- **Encrypt at rest**: R2 and Supabase both encrypt storage by default; don't disable it.
- **Minimize what you keep**: store the *verdict*, not the media, past your retention window (§6.3). This is your single strongest privacy story, and it's also just good engineering — smaller blast radius if anything ever goes wrong.
- **Never use uploaded media to train or fine-tune a model without separate, explicit, opt-in consent.** The purpose someone uploaded for (checking a video) is not the same purpose as "help train SachCheck's next model" — conflating the two is exactly the kind of thing that erodes trust in a product whose entire value proposition *is* trust.
- **Access control**: Row-level security in Supabase (§6.1) so a scan is only ever readable by the device/account that created it.

### 10.2 India's DPDP Act — what actually applies to you

India's Digital Personal Data Protection Act (2023) and its Rules were notified in November 2025, with a phased rollout: the Data Protection Board is already operating, the Consent Manager framework becomes mandatory in November 2026, and full substantive compliance is enforceable from **May 13, 2027**. Because SachCheck processes personal data (photos, voice, video, messages) of people in India, you are a "Data Fiduciary" under this law — this applies to you as a small team the same as it applies to a large company, though enforcement intensity naturally differs.

Practical, buildable-now basics (not a substitute for real legal advice — I'm not a lawyer, and you should get one before you have real users, especially before you handle anyone's voice/biometric-adjacent data at scale):

- A **clear, separate consent notice** before first upload — plain language, not buried in a wall-of-text ToS: what you collect, why, how long you keep it, and how to ask for deletion.
- **Purpose limitation**: only use uploaded media for the stated analysis purpose.
- **A documented retention schedule** (your R2 lifecycle rule *is* this, in technical form — keep a written version too).
- **A grievance/support contact** — required by the Act, and just good practice for a trust-and-safety product.
- **Breach readiness**: know who you'd notify and how, before you ever need to.

Treat 2026 as your "build it right" year — the compliance bar rises steadily through 2027, and starting now costs far less than retrofitting later.

### 10.3 Honest positioning (carry this through to your pitch, not just your code)

Your own doc already gets this right: position SachCheck as a **risk-flagging assistant that empowers a human decision**, not an infallible detector. That's not just more honest — for a product handling family trust and financial risk, honest and calibrated is the more *defensible* engineering choice, too.

---

<a id="11-deployment"></a>
## 11. Infrastructure & deployment

### 11.1 Oracle Cloud Always Free (your $0 primary option)

1. Sign up at **cloud.oracle.com/free**. A credit card is required for identity verification only — you are not charged as long as you stay within Always Free limits.
2. Oracle's Always Free ARM tier currently gives you **2 OCPUs and 12GB RAM** (this was recently reduced from 4 OCPU/24GB — Oracle can and does change this, so re-verify the current allocation when you sign up), 200GB block storage, and up to 10TB/month outbound transfer. That's genuinely enough to run your FastAPI backend, Postgres-adjacent workloads, and a lightweight Ollama fallback model together.
3. **A known friction point**: Oracle's account approval can be inconsistent — some signups get flagged or delayed. If that happens to you, don't burn days fighting it — fall back immediately to Hetzner (next section). Don't let infra signup block your actual build.
4. Launch an Ampere A1 (ARM) Ubuntu instance, open ports 80/443 in the security list, SSH in, and proceed to Docker setup below.

### 11.2 Backup option: Hetzner CX22

If Oracle approval is slow or unreliable for you, **Hetzner's CX22** (2 vCPU, 4GB RAM, 40GB NVMe, 20TB traffic) runs about **€4–4.60/month (~₹380–420)** — comfortably inside your ₹500 ceiling, with none of Oracle's approval uncertainty. Slightly less RAM than Oracle's free tier, so lean harder on the cloud API and less on local Ollama fallback if you end up here.

### 11.3 Docker Compose (runs everything on one box)

```yaml
# infra/docker-compose.yml
services:
  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on: [backend, web]

  backend:
    build: ../backend
    env_file: ../backend/.env
    expose: ["8000"]
    restart: unless-stopped

  web:
    build: ../web
    expose: ["3000"]
    restart: unless-stopped

  ollama:
    image: ollama/ollama
    volumes: ["ollama_data:/root/.ollama"]
    expose: ["11434"]
    restart: unless-stopped

volumes:
  caddy_data:
  ollama_data:
```

```caddyfile
# infra/Caddyfile — automatic HTTPS via Let's Encrypt, zero config
sachcheck.yourdomain.com {
    reverse_proxy web:3000
}
api.sachcheck.yourdomain.com {
    reverse_proxy backend:8000
}
```

```bash
docker compose -f infra/docker-compose.yml up -d --build
docker exec -it $(docker ps -qf name=ollama) ollama pull gemma4:e4b
```

### 11.4 CI/CD (GitHub Actions → your VPS)

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd sachcheck && git pull && docker compose -f infra/docker-compose.yml up -d --build
```

### 11.5 Monitoring (free tier is enough at your scale)

- **Sentry** (free, 5K events/month): `pip install --upgrade sentry-sdk --break-system-packages`, add `sentry_sdk.init(dsn=...)` in `main.py`. Now you see *actual* production errors, not just "a user said it didn't work."
- **UptimeRobot** (free): a 5-minute ping against `/health`, alerts you by email/SMS if the API goes down.

---

<a id="12-costs"></a>
## 12. Cost breakdown

| Item | Monthly cost | Notes |
|---|---|---|
| Backend + web hosting (Oracle Free) | ₹0 | Or Hetzner CX22 (~₹380–420) as backup |
| Gemma 4 API (Google AI Studio) | ₹0 | Rate-limited free tier; upgrade only once you know you need to |
| Ollama fallback | ₹0 | Runs on the same box |
| Supabase (Postgres + Auth) | ₹0 | Until 500MB DB / 50K MAU, far off at MVP scale |
| Cloudflare R2 (media storage) | ₹0 | Until 10GB stored at once — auto-deletion keeps you well under this |
| Domain name | ~₹700–900/**year** (~₹60–75/mo amortized) | The only genuinely unavoidable recurring cost |
| Monitoring (Sentry + UptimeRobot) | ₹0 | Free tiers |
| WhatsApp Cloud API | ₹0 | For reactive, user-initiated replies only |
| **Total recurring** | **₹0–420/month** | Comfortably inside your ₹500 target |

**One-time / annual, outside the monthly budget:**
| Item | Cost | Can you defer it? |
|---|---|---|
| Google Play Console | $25 (one-time) | No — needed to publish on Android |
| Apple Developer Program | $99/**year** | Yes — ship Android + web first, add iOS once you have traction |

---

<a id="13-roadmap"></a>
## 13. Build roadmap

Your hackathon doc's phases were hour-denominated (30–36 hour build). A real product is week-denominated. This assumes a small team working part-time; compress if you're full-time.

| Phase | Duration | Goal |
|---|---|---|
| 0. Foundations | Week 1 | Google AI Studio key working, Oracle/Hetzner box provisioned, repo scaffolded, Docker Compose running a "hello world" on all three services |
| 1. Model layer | Week 1–2 | `model_router.py` working end-to-end against your curated demo set; JSON schema validated; retry/fallback tested by deliberately breaking the cloud call |
| 2. Backend core | Week 2–3 | `/scan` and `/scans` live against real Postgres; rate limiting; R2 upload + deletion lifecycle confirmed working (don't just assume the lifecycle rule fired — check the bucket) |
| 3. Web frontend | Week 3–4 | Upload flow, verdict card, dashboard; deployed (self-hosted or Netlify) behind HTTPS |
| 4. Mobile core | Week 4–6 | React Native app with the share-intent flow working on a real device (test with a real WhatsApp forward, not just a simulator) |
| 5. Security & privacy pass | Week 5–6, parallel | Consent notice, retention policy live (not just documented), RLS policies tested, structured logging in place |
| 6. Beta with real (consenting) users | Week 6–8 | Small group — ideally including at least one older/less tech-fluent user, since that's your actual target demographic, not just your dev team |
| 7. WhatsApp bot channel | Week 8–10 | Meta business verification takes time — start this application early, even before you need it live |
| 8. Public launch | Week 10+ | Play Store submission, monitoring dashboards live, feedback loop collecting real accuracy data |

---

<a id="14-post-launch"></a>
## 14. Post-launch: scaling & what comes next

**When to upgrade off free tiers** (signals, not calendar dates):
- Google AI Studio rate limits start rejecting real user requests → move to a paid tier or add Vertex AI as a second cloud path.
- Supabase free DB approaches 500MB or you're seeing pause-related downtime → Supabase Pro ($25/mo).
- R2 storage creeping toward 10GB despite auto-deletion → check your lifecycle rule is actually firing before assuming you need to pay.
- Oracle/Hetzner CPU pinned during traffic spikes → this is when the extra RAM of a paid Hetzner tier (CX32) earns its keep.

**Where this goes next** (your own doc already scoped this well):
- **Video KYC fraud prevention for banks/NBFCs** — the same multimodal core, different customer. RBI's own MuleHunter.AI initiative shows regulators are already thinking about this exact problem space.
- **Telecom integration** to flag suspected voice-clone calls in real time, closer to the moment of harm.
- **Digital-literacy NGO partnerships** — your explainability feature is, structurally, a literacy tool as much as a detection tool; that's a distinct distribution channel from consumer app growth.

---

<a id="15-commands"></a>
## 15. Quick command reference

```bash
# Backend (local dev)
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Web (local dev)
cd web && npm run dev

# Mobile (local dev)
cd mobile && npx expo start

# Full stack, self-hosted
docker compose -f infra/docker-compose.yml up -d --build

# Pull/test Ollama fallback model
ollama pull gemma4:e4b
ollama run gemma4:e4b "test prompt"

# Quick API test
curl -F "file=@demo_data/videos/fake_deepfake_1.mp4" https://api.sachcheck.yourdomain.com/scan

# Mobile build
cd mobile && eas build --platform android --profile preview
```

---

Good luck, Team Monaco_Gem. The hackathon version proved the idea works. This version is about making it survive contact with your actual users — patchy connectivity, panicked phone calls, grandparents who've never installed an app before. Build the model layer first, get the share-intent flow working on a real phone early (it's the part most likely to surprise you), and don't skip the privacy basics just because they're not visible in a demo.
