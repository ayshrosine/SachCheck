-- SachCheck Database Schema for Supabase Postgres

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Scans table
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),  -- null for anonymous device-only scans
  modality TEXT NOT NULL CHECK (modality in ('video','audio','image')),
  verdict TEXT NOT NULL CHECK (verdict in ('likely_real','suspicious','likely_fake','inconclusive')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reasons JSONB NOT NULL,
  modality_flags JSONB,
  object_key TEXT,               -- R2 key, nulled out once media is deleted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  was_verdict_correct BOOLEAN NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scans_device_id ON scans(device_id, created_at DESC);
CREATE INDEX idx_scans_user_id ON scans(user_id, created_at DESC);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX idx_feedback_scan_id ON feedback(scan_id);

-- Enable Row Level Security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scans
-- Users can only read their own scans (by device_id or user_id)
CREATE POLICY "Users can view own scans" ON scans
  FOR SELECT
  USING (
    device_id = current_setting('request.device_id', true) 
    OR user_id = auth.uid()
  );

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT
  WITH CHECK (
    device_id = current_setting('request.device_id', true) 
    OR user_id = auth.uid()
  );

-- RLS Policies for feedback
-- Users can insert feedback for their own scans
CREATE POLICY "Users can insert feedback for own scans" ON feedback
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans 
      WHERE scans.id = feedback.scan_id 
      AND (scans.device_id = current_setting('request.device_id', true) 
           OR scans.user_id = auth.uid())
    )
  );

-- Users can view feedback for their own scans
CREATE POLICY "Users can view feedback for own scans" ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scans 
      WHERE scans.id = feedback.scan_id 
      AND (scans.device_id = current_setting('request.device_id', true) 
           OR scans.user_id = auth.uid())
    )
  );

-- Function to handle device_id in RLS policies
CREATE OR REPLACE FUNCTION set_device_id()
RETURNS void AS $$
BEGIN
  PERFORM set_config('request.device_id', current_setting('request.headers.x-device-id', true), true);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON scans TO authenticated;
GRANT ALL ON feedback TO authenticated;
GRANT ALL ON scans TO anon;
GRANT ALL ON feedback TO anon;