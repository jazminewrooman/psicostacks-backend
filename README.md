# 🔧 PsicoStacks - Backend API

> REST API for credential management, AI processing, and blockchain integration

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Development](#development)

---

## 🎯 Overview

The **PsicoStacks Backend** is a RESTful API that handles:

- **AI-powered PDF processing** with OpenAI GPT-4
- **Credential management** with encryption
- **Token-based verification** system
- **Blockchain integration** tracking
- **Share link generation** with time-limited access

### Core Responsibilities

1. Process psychometric PDFs with AI
2. Store encrypted credential data
3. Generate share and view tokens
4. Track blockchain transactions
5. Manage credential lifecycle (create, share, revoke)

---

## ✨ Features

### AI Processing
- 📄 **PDF text extraction** (pdf-parse)
- 🤖 **OpenAI GPT-4 integration** for analysis
- 📊 **Structured data extraction** from assessments
- 🎯 **Band assignment** (A, B, C) based on performance

### Credential Management
- 🔐 **AES-256-GCM encryption** for sensitive data
- 💾 **Supabase PostgreSQL** database
- 🗂️ **Private storage** for encrypted reports
- ⛓️ **Blockchain ID tracking**

### Token System
- 🔗 **Share tokens** (2-hour expiry, unlimited use)
- 👁️ **View tokens** (60-second expiry, one-time use)
- 🔒 **Secure token generation** (crypto.randomUUID)
- ⏰ **Automatic expiration** handling

### Verification Flow
- 🔍 **Free preview** (summary only)
- 💳 **Payment validation** (blockchain tx verification)
- 📊 **Full report access** (time-limited)
- 📝 **Audit logging** (who verified when)

---

## 🏗️ Architecture

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Express    │
│  API Server │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────┐
│  Supabase   │  │  OpenAI  │
│  PostgreSQL │  │  GPT-4   │
└─────────────┘  └──────────┘
```

### Request Flow

**1. Create Credential:**
```
Upload PDF → Extract text → AI analysis → 
Generate summary → Store in DB → Return credential ID
```

**2. Share Credential:**
```
Request share → Generate token → Store in DB → 
Return share URL (valid 2 hours)
```

**3. Verify Credential:**
```
Use share token → Preview (free) → 
Pay on blockchain → Generate view token → 
Access full report (60s)
```

---

## 🛠️ Tech Stack

### Core
- **Runtime:** [Node.js 18+](https://nodejs.org/)
- **Framework:** [Express.js 4.18](https://expressjs.com/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)

### Database & Storage
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM:** Supabase Client
- **Encryption:** Node.js `crypto` (AES-256-GCM)

### AI & Processing
- **AI:** [OpenAI API](https://openai.com/) (GPT-4)
- **PDF Processing:** [pdf-parse](https://www.npmjs.com/package/pdf-parse)
- **File Upload:** [multer](https://www.npmjs.com/package/multer)

### Utilities
- **Environment:** [dotenv](https://www.npmjs.com/package/dotenv)
- **CORS:** [cors](https://www.npmjs.com/package/cors)
- **Validation:** Custom middleware
- **Logging:** Console (production: use Winston/Pino)

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.x
npm >= 9.x
Supabase account
OpenAI API key
```

### Installation

1. **Clone the repository:**
```bash
git clone <repo-url>
cd psicostacks-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env`:
```bash
# Server
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Encryption
CREDENTIALS_ENC_KEY=<generate-with-openssl>

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

4. **Generate encryption key:**
```bash
openssl rand -base64 32
```

Copy the output to `CREDENTIALS_ENC_KEY` in `.env`.

5. **Set up Supabase:**

Run the SQL schema:
```sql
-- See DATABASE_SCHEMA.md for full schema
CREATE TABLE credentials (...);
CREATE TABLE share_tokens (...);
CREATE TABLE view_tokens (...);
```

6. **Start the development server:**
```bash
npm run dev
```

Server runs on `http://localhost:3001`

---

## 📡 API Endpoints

### **POST /api/ai-interpret**

Process PDF with AI and extract psychometric data.

**Request (multipart/form-data):**
```typescript
{
  file: File (PDF),
  walletAddress: string
}
```

**Response:**
```json
{
  "summary": {
    "band": "A",
    "bullets": [
      "High analytical thinking (92nd percentile)",
      "Strong problem-solving skills",
      "Excellent attention to detail"
    ],
    "note": "Outstanding cognitive abilities"
  },
  "fullReport": {
    "assessmentType": "Cognitive Assessment",
    "scores": {
      "verbal": 85,
      "numerical": 90,
      "abstract": 88
    },
    "percentiles": {
      "verbal": 92,
      "numerical": 95,
      "abstract": 90
    },
    "insights": "Candidate shows exceptional..."
  }
}
```

---

### **POST /api/credentials**

Save credential to database after blockchain mint.

**Request:**
```json
{
  "walletAddress": "SP2J6Z...",
  "blockchainId": 22,
  "credentialData": {
    "summary": {...},
    "fullReport": {...}
  },
  "txId": "0xabc123..."
}
```

**Response:**
```json
{
  "credentialId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "createdAt": "2024-10-15T20:00:00Z"
}
```

---

### **GET /api/credentials?walletAddress=SP...**

Get all credentials for a wallet address.

**Response:**
```json
{
  "credentials": [
    {
      "id": "550e8400-...",
      "blockchain_id": 22,
      "wallet_address": "SP2J6Z...",
      "status": "active",
      "revoked": false,
      "created_at": "2024-10-15T20:00:00Z",
      "summary": {
        "band": "A",
        "bullets": [...]
      }
    }
  ]
}
```

---

### **POST /api/credentials/share**

Generate shareable link for credential.

**Request:**
```json
{
  "credentialId": "550e8400-..."
}
```

**Response:**
```json
{
  "shareToken": "share_abc123def456",
  "shareUrl": "http://localhost:3000/verify?token=share_abc123def456",
  "expiresAt": "2024-10-15T22:00:00Z"
}
```

---

### **POST /api/credentials/revoke**

Revoke a credential.

**Request:**
```json
{
  "credentialId": "550e8400-...",
  "blockchainId": 22
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credential revoked successfully"
}
```

---

### **POST /api/verify/preview**

Get credential preview (free, no payment required).

**Request:**
```json
{
  "token": "share_abc123def456"
}
```

**Response:**
```json
{
  "blockchain_id": 22,
  "wallet_address": "SP2J6Z...",
  "summary": {
    "band": "A",
    "bullets": ["High analytical thinking", "..."]
  },
  "note": "Outstanding cognitive abilities"
}
```

---

### **POST /api/verify/pay**

Generate view token after payment verification.

**Request:**
```json
{
  "shareToken": "share_abc123def456",
  "txId": "0xabc123...",
  "blockchainId": 22,
  "employerWallet": "SP3K8BC..."
}
```

**Response:**
```json
{
  "viewUrl": "http://localhost:3000/verify/view?token=view_xyz789",
  "expiresAt": "2024-10-15T20:01:00Z"
}
```

---

### **GET /api/verify/view?token=view_xyz789**

Get full credential report (60-second window).

**Response:**
```json
{
  "summary": {
    "band": "A",
    "bullets": [...]
  },
  "fullReport": {
    "assessmentType": "Cognitive Assessment",
    "scores": {...},
    "percentiles": {...},
    "insights": "..."
  },
  "metadata": {
    "verifiedAt": "2024-10-15T20:00:00Z",
    "expiresAt": "2024-10-15T20:01:00Z"
  }
}
```

---

## 🗄️ Database Schema

### **credentials**
```sql
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blockchain_id INTEGER UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  summary JSONB NOT NULL,
  status TEXT DEFAULT 'active',
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **share_tokens**
```sql
CREATE TABLE share_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID REFERENCES credentials(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_share_tokens_token ON share_tokens(token);
CREATE INDEX idx_share_tokens_expires ON share_tokens(expires_at);
```

### **view_tokens**
```sql
CREATE TABLE view_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID REFERENCES credentials(id),
  token TEXT UNIQUE NOT NULL,
  tx_id TEXT NOT NULL,
  employer_wallet TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_view_tokens_token ON view_tokens(token);
CREATE INDEX idx_view_tokens_expires ON view_tokens(expires_at);
```

---

## 🔐 Security

### Encryption

**Algorithm:** AES-256-GCM

```typescript
// Encrypt
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([
  cipher.update(JSON.stringify(data), 'utf8'),
  cipher.final()
]);
const authTag = cipher.getAuthTag();

// Decrypt
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(authTag);
const decrypted = Buffer.concat([
  decipher.update(encrypted),
  decipher.final()
]);
```

### Token Security

- **Share tokens:** 2-hour expiry, unlimited use
- **View tokens:** 60-second expiry, one-time use
- **Format:** `share_<uuid>` or `view_<uuid>`
- **Storage:** PostgreSQL with indexes for fast lookup

### Environment Variables

**Never commit:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `CREDENTIALS_ENC_KEY`

**Rotation:**
- Rotate keys every 90 days
- Use different keys for dev/prod

---

## 🔐 Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Encryption (32 bytes base64)
CREDENTIALS_ENC_KEY=<base64-encoded-32-bytes>

# CORS
FRONTEND_URL=http://localhost:3000

# Optional: Stacks API (for tx verification)
STACKS_API_URL=https://api.testnet.hiro.so
```

---

## 💻 Development

### Available Scripts

```bash
# Start development server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

### Project Structure

```
psicostacks-backend/
├── src/
│   ├── routes/
│   │   ├── ai-interpret.ts      # AI processing endpoint
│   │   ├── credentials.ts       # CRUD for credentials
│   │   ├── share.ts             # Share token generation
│   │   └── verify.ts            # Verification endpoints
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── openai.ts            # OpenAI client
│   │   ├── crypto.ts            # Encryption utilities
│   │   └── pdf.ts               # PDF processing
│   ├── middleware/
│   │   ├── auth.ts              # Authentication
│   │   ├── cors.ts              # CORS config
│   │   └── error.ts             # Error handling
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── index.ts                 # Server entry point
├── .env                         # Environment variables
├── .env.example                 # Example env vars
├── package.json
├── tsconfig.json
└── README.md
```

### Development Workflow

1. **Start Supabase** (or use cloud)
2. **Run migrations** (create tables)
3. **Start backend** (`npm run dev`)
4. **Test endpoints** (Postman/curl)

### Testing with curl

```bash
# Test AI interpretation
curl -X POST http://localhost:3001/api/ai-interpret \
  -F "file=@test.pdf" \
  -F "walletAddress=SP2J6Z..."

# Create credential
curl -X POST http://localhost:3001/api/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "SP2J6Z...",
    "blockchainId": 22,
    "credentialData": {...}
  }'

# Generate share token
curl -X POST http://localhost:3001/api/credentials/share \
  -H "Content-Type: application/json" \
  -d '{"credentialId": "550e8400-..."}'
```

---

## 🚀 Deployment

### Environment Setup

**Production environment variables:**
```bash
PORT=3001
NODE_ENV=production
SUPABASE_URL=<production-url>
SUPABASE_SERVICE_ROLE_KEY=<production-key>
OPENAI_API_KEY=<production-key>
CREDENTIALS_ENC_KEY=<production-key>
FRONTEND_URL=https://psicostacks.com
```

### Recommended Platforms

- **Railway:** Easy Node.js deployment
- **Render:** Free tier available
- **Fly.io:** Global edge deployment
- **AWS/GCP:** Full control

### Health Check

```bash
GET /health

Response: { "status": "ok", "timestamp": "2024-..." }
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Encryption key must be 32 bytes"**
```bash
# Generate new key:
openssl rand -base64 32
```

**2. "Supabase connection failed"**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify tables exist
- Check network connectivity

**3. "OpenAI API error"**
- Verify `OPENAI_API_KEY` is valid
- Check API quota/billing
- Try different model (gpt-3.5-turbo)

**4. "PDF parsing failed"**
- Ensure PDF is not encrypted
- Check PDF is valid (not corrupted)
- Try with different PDF

---

## 📚 Learn More

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [pdf-parse](https://www.npmjs.com/package/pdf-parse)

---

## 📄 License

This project was created for the Stacks Hackathon.

---

**Happy coding! 🚀**
