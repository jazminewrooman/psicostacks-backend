# PsicoStacks Backend

A Next.js 14 backend application with App Router for managing verifiable credentials with encryption and blockchain integration.

## Features

- **AES-256-GCM Encryption**: Off-chain encryption for sensitive credential data
- **Supabase Integration**: PostgreSQL database and private storage for encrypted blobs
- **API Routes**: 
  - `/api/ai-interpret` - AI-powered credential interpretation
  - `/api/credentials` - Create new credentials
  - `/api/share` - Generate one-time QR code tokens
  - `/api/verify/pay` - Exchange verify token for view token
  - `/api/verify/view` - Serve decrypted credential data
- **Token Management**: One-time verify tokens and short-lived view tokens (60s)
- **Blockchain Ready**: Schema designed for Stacks blockchain SBT integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- OpenSSL (for generating encryption keys)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Generate an encryption key:

```bash
openssl rand -base64 32
```

Fill in `.env.local` with your Supabase credentials and the generated key.

3. **Set up Supabase:**

- Create a new Supabase project at [supabase.com](https://supabase.com)
- Go to SQL Editor and run the schema from `supabase/schema.sql`
- Create a storage bucket named `reports` with private access:
  - Go to Storage → Create bucket
  - Name: `reports`
  - Public: OFF (private)

4. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## API Endpoints

### POST /api/credentials

Create a new credential with encrypted report.

**Request:**
```json
{
  "email": "candidate@example.com",
  "schemaId": "psicostacks:v1",
  "reportJson": { "scores": {...}, "data": {...} },
  "summary": { "band": "A", "bullets": ["..."] }
}
```

**Response:**
```json
{
  "credentialId": "uuid",
  "sbtId": "sbt_...",
  "commitmentHash": "sha256...",
  "expiryAt": "2024-..."
}
```

### POST /api/share

Generate a one-time verification token with QR code URL.

**Request:**
```json
{
  "credentialId": "uuid",
  "ttlSec": 120
}
```

**Response:**
```json
{
  "token": "v_...",
  "expiresAt": "2024-...",
  "url": "http://localhost:3000/verify?token=v_..."
}
```

### POST /api/verify/pay

Exchange a verify token for a short-lived view token (employer pays/verifies).

**Request:**
```json
{
  "token": "v_...",
  "employer": "Company Name"
}
```

**Response:**
```json
{
  "viewUrl": "http://localhost:3000/api/verify/view?token=view_...",
  "expiresAt": "2024-..." 
}
```

### GET /api/verify/view?token=view_...

Retrieve decrypted credential data (60-second window).

**Response:**
```json
{
  "summary": { "band": "A", "bullets": ["..."] },
  "report": { "scores": {...}, "data": {...} }
}
```

### POST /api/ai-interpret

Simple AI interpretation stub (returns grade band and bullets).

**Request:**
```json
{
  "scores": { "accuracy": 85, "speed": 70 },
  "hints": ["detail-oriented", "fast-paced"]
}
```

**Response:**
```json
{
  "band": "A",
  "bullets": [
    "Strong overall performance on short tasks",
    "Reaction speed: 70 ms",
    "Role signals: detail-oriented, fast-paced"
  ]
}
```

## Project Structure

```
psicostacks-backend/
├── app/
│   └── api/
│       ├── ai-interpret/
│       │   └── route.ts
│       ├── credentials/
│       │   └── route.ts
│       ├── share/
│       │   └── route.ts
│       └── verify/
│           ├── pay/
│           │   └── route.ts
│           └── view/
│               └── route.ts
├── lib/
│   ├── supabaseAdmin.ts
│   ├── crypto.ts
│   └── id.ts
├── supabase/
│   └── schema.sql
├── .env.example
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Security Notes

- **Never commit `.env.local`** - it contains sensitive keys
- The `CREDENTIALS_ENC_KEY` must be exactly 32 bytes (base64 encoded)
- Use `SUPABASE_SERVICE_ROLE` only in server-side API routes
- View tokens expire after 60 seconds
- Verify tokens are one-time use only

## Blockchain Integration (Coming Soon)

Replace the simulated `sbtId` in `/api/credentials` with:
- Real Clarity transaction for minting SBT
- Store transaction ID or token ID as `sbt_id`
- Include explorer link in UI responses

## Development

```bash
# Run development server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
