-- Supabase Database Schema for Hairfit App
-- This migration creates tables and storage for anonymous user sessions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: analysis_sessions
-- Stores user photo analysis results (face shape, texture, density)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  face_shape TEXT NOT NULL CHECK (face_shape IN ('oval', 'round', 'square', 'heart', 'long', 'diamond')),
  texture TEXT NOT NULL CHECK (texture IN ('straight', 'wavy', 'curly', 'coily')),
  density TEXT NOT NULL CHECK (density IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by creation date
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_created_at ON analysis_sessions(created_at DESC);

-- ============================================================================
-- TABLE: generated_hairstyles
-- Stores generated hairstyle images and metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS generated_hairstyles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  hairstyle_id INTEGER NOT NULL,
  hairstyle_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by session
CREATE INDEX IF NOT EXISTS idx_generated_hairstyles_session_id ON generated_hairstyles(session_id);

-- Index for faster lookups by creation date
CREATE INDEX IF NOT EXISTS idx_generated_hairstyles_created_at ON generated_hairstyles(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable anonymous access for all operations
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_hairstyles ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT into analysis_sessions
CREATE POLICY "Allow anonymous insert on analysis_sessions"
  ON analysis_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to SELECT from analysis_sessions
CREATE POLICY "Allow anonymous select on analysis_sessions"
  ON analysis_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to INSERT into generated_hairstyles
CREATE POLICY "Allow anonymous insert on generated_hairstyles"
  ON generated_hairstyles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to SELECT from generated_hairstyles
CREATE POLICY "Allow anonymous select on generated_hairstyles"
  ON generated_hairstyles
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- STORAGE BUCKET SETUP
-- Create a public bucket for hairstyle images
-- ============================================================================

-- Insert storage bucket (this works in Supabase SQL editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hairstyle-images',
  'hairstyle-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow anonymous uploads
CREATE POLICY "Allow anonymous upload to hairstyle-images"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'hairstyle-images');

-- Storage policy: Allow public reads
CREATE POLICY "Allow public read from hairstyle-images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated, public
  USING (bucket_id = 'hairstyle-images');

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE analysis_sessions IS 'Stores anonymous user photo analysis results including face shape, hair texture, and hair density';
COMMENT ON TABLE generated_hairstyles IS 'Stores generated hairstyle images and metadata linked to analysis sessions';
COMMENT ON COLUMN analysis_sessions.face_shape IS 'Detected face shape: oval, round, square, heart, long, or diamond';
COMMENT ON COLUMN analysis_sessions.texture IS 'Detected hair texture: straight, wavy, curly, or coily';
COMMENT ON COLUMN analysis_sessions.density IS 'Detected hair density: low, medium, or high';
COMMENT ON COLUMN generated_hairstyles.session_id IS 'Foreign key to analysis_sessions table';
COMMENT ON COLUMN generated_hairstyles.hairstyle_id IS 'ID of the hairstyle from the HAIRSTYLES constant';
COMMENT ON COLUMN generated_hairstyles.image_url IS 'Public URL or path to the generated image in Supabase Storage';

