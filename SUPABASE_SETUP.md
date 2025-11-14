# Supabase Setup Instructions

Follow these steps to set up Supabase for your Hairfit App.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: hairfit-app (or your preferred name)
   - **Database Password**: Create a strong password (save this securely)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is sufficient to start
5. Click "Create new project"
6. Wait for the project to finish setting up (1-2 minutes)

## 2. Get Your API Credentials

1. In your project dashboard, click on the **Settings** icon (gear icon) in the sidebar
2. Navigate to **API** section
3. You'll find two important values:
   - **Project URL**: Copy this (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public key**: Copy this long string (starts with `eyJ...`)

## 3. Set Up Environment Variables

1. In your project root, create a file named `.env.local` (if it doesn't exist)
2. Add the following variables:

```
GEMINI_API_KEY=your_existing_gemini_key
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Replace the values with your actual credentials
4. Save the file

## 4. Run the Database Migrations

### Migration 1: Initial Schema (Required)
1. In your Supabase dashboard, click on the **SQL Editor** icon in the sidebar
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" or press `Cmd/Ctrl + Enter`
5. You should see a success message

### Migration 2: Rate Limiting (Required)
1. Click "New Query" again in the SQL Editor
2. Copy and paste the entire contents of `supabase/migrations/002_rate_limiting.sql`
3. Click "Run" or press `Cmd/Ctrl + Enter`
4. You should see a success message

**Note:** Both migrations are required for the app to work properly with rate limiting and DDoS protection.

## 5. Create the Storage Bucket

The migration script will attempt to create the storage bucket automatically. To verify:

1. Click on **Storage** icon in the sidebar
2. You should see a bucket named `hairstyle-images`
3. If it's not there, click "Create a new bucket":
   - **Name**: `hairstyle-images`
   - **Public bucket**: Yes (checked)
   - Click "Create bucket"

## 6. Verify Setup

To verify everything is working:

1. Go to **Table Editor** in the sidebar
2. You should see four tables:
   - `analysis_sessions` - Stores user photo analysis
   - `generated_hairstyles` - Stores generated hairstyle data
   - `rate_limits` - Tracks usage per IP (3 max)
   - `ddos_protection` - Prevents abuse with request throttling
3. Click on each table to verify the columns match the schema

## 7. Start Your Development Server

```bash
npm run dev
```

Your application should now be able to:
- Save user analysis sessions to Supabase
- Upload generated hairstyle images to Supabase Storage
- Retrieve and display saved data
- Enforce rate limiting (3 uses per IP)
- Protect against DDoS attacks (10 requests per minute per IP)

## Troubleshooting

### Error: "Invalid API key"
- Double-check your `SUPABASE_ANON_KEY` in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart your dev server after updating `.env.local`

### Error: "relation does not exist"
- Make sure you ran the migration SQL in the SQL Editor
- Check the Table Editor to verify tables were created

### Error: "Storage bucket not found"
- Create the `hairstyle-images` bucket manually (see step 5)
- Ensure the bucket is set to "Public"

## Security Notes

- The anonymous key is safe to use in client-side code
- Row Level Security (RLS) policies protect your data
- Never commit `.env.local` to version control (it's in `.gitignore`)
- Rate limiting protects against abuse (3 sessions per IP address)
- DDoS protection prevents request flooding (10 requests per minute per IP)
- For production, consider adding authentication and user-specific RLS policies

