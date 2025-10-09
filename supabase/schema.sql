-- =============================
-- PsicoStacks - Database Schema
-- =============================
-- Run this in your Supabase SQL editor

-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Credentials table
create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  candidate_email text not null,
  schema_id text not null,
  sbt_id text not null,
  commitment_hash text not null,
  summary jsonb not null,
  storage_key text not null,
  issued_at timestamptz not null default now(),
  expiry_at timestamptz not null,
  revoked boolean not null default false
);

-- Verify tokens table (one-time QR code tokens)
create table public.verify_tokens (
  token text primary key,
  credential_id uuid references public.credentials(id) on delete cascade,
  expires_at timestamptz not null,
  used boolean not null default false
);

-- View tokens table (short-lived tokens for viewing credentials)
create table public.view_tokens (
  token text primary key,
  credential_id uuid references public.credentials(id) on delete cascade,
  expires_at timestamptz not null
);

-- Access logs table (track who accessed credentials)
create table public.access_logs (
  id bigserial primary key,
  credential_id uuid references public.credentials(id) on delete cascade,
  employer text not null,
  accessed_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.credentials enable row level security;

-- RLS Policies
-- Owner (candidate) can read their own credentials
create policy "owner can read" on public.credentials for select using (
  auth.email() = candidate_email
);

-- Owner (candidate) can update their own credentials
create policy "owner can update" on public.credentials for update using (
  auth.email() = candidate_email
);

-- Note: API routes will use SERVICE_ROLE to bypass RLS when needed

-- Storage bucket for encrypted reports (create via Supabase dashboard)
-- Bucket name: reports
-- Settings: Private
