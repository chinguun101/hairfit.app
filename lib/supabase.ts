import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Database features will be disabled.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable session persistence for anonymous usage
    autoRefreshToken: false,
  },
});

// Database types based on our schema
export interface AnalysisSession {
  id: string;
  face_shape: 'oval' | 'round' | 'square' | 'heart' | 'long' | 'diamond';
  texture: 'straight' | 'wavy' | 'curly' | 'coily';
  density: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface GeneratedHairstyle {
  id: string;
  session_id: string;
  hairstyle_id: number;
  hairstyle_name: string;
  image_url: string;
  created_at: string;
}

// Helper function to create a new analysis session
export async function createAnalysisSession(
  faceShape: AnalysisSession['face_shape'],
  texture: AnalysisSession['texture'],
  density: AnalysisSession['density']
): Promise<{ data: AnalysisSession | null; error: any }> {
  const { data, error } = await supabase
    .from('analysis_sessions')
    .insert({
      face_shape: faceShape,
      texture: texture,
      density: density,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating analysis session:', error);
  }

  return { data, error };
}

// Helper function to save a generated hairstyle
export async function saveGeneratedHairstyle(
  sessionId: string,
  hairstyleId: number,
  hairstyleName: string,
  imageUrl: string
): Promise<{ data: GeneratedHairstyle | null; error: any }> {
  const { data, error } = await supabase
    .from('generated_hairstyles')
    .insert({
      session_id: sessionId,
      hairstyle_id: hairstyleId,
      hairstyle_name: hairstyleName,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving generated hairstyle:', error);
  }

  return { data, error };
}

// Helper function to upload image to Supabase Storage
export async function uploadHairstyleImage(
  sessionId: string,
  hairstyleId: number,
  base64Image: string
): Promise<{ url: string | null; error: any }> {
  try {
    // Convert base64 to blob
    const base64Data = base64Image.split(',')[1] || base64Image;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${sessionId}/${hairstyleId}-${timestamp}.png`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('hairstyle-images')
      .upload(filename, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return { url: null, error };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('hairstyle-images')
      .getPublicUrl(filename);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error processing image upload:', error);
    return { url: null, error };
  }
}

// Helper function to get all hairstyles for a session
export async function getHairstylesBySession(
  sessionId: string
): Promise<{ data: GeneratedHairstyle[] | null; error: any }> {
  const { data, error } = await supabase
    .from('generated_hairstyles')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching hairstyles:', error);
  }

  return { data, error };
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

