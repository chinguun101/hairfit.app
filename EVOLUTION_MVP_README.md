# Self-Evolving Agent - Phase 1 MVP

## 🎯 What This Is

A **survival of the fittest** hairstyle generation system that:
1. Generates **multiple variations** using different AI strategies
2. **Auto-evaluates** each result to filter failures
3. Lets **users pick** their favorite
4. **Evolves** by updating strategy scores based on selections

## 📂 What Was Built

### Database (Supabase)
- `supabase/migrations/004_evolution_system.sql`
  - `generation_strategies` table - stores competing strategies
  - `generation_attempts` table - tracks every generation
  - `update_strategy_score()` function - ELO-like scoring
  - 4 initial strategies seeded

### Core Libraries
- `lib/generation-strategies.ts`
  - Multi-prompt generation logic
  - Strategy selection
  - Score updates
  - Database integration

- `lib/evaluator.ts`
  - LLM-as-judge evaluation
  - Detects if transformation succeeded
  - Confidence scoring

### API Routes
- `POST /api/generate-variations`
  - Generates 4 variations in parallel
  - Auto-evaluates each
  - Returns filtered results

- `POST /api/record-selection`
  - Records user's favorite
  - Updates strategy scores
  - Drives evolution

- `GET /api/record-selection/stats`
  - Shows current strategy performance
  - Useful for monitoring

### Test Script
- `test-evolution-mvp.mjs`
  - End-to-end test
  - Uses example photos
  - Simulates complete flow
  - Displays results beautifully

## 🚀 How to Test

### 1. Run Database Migration

If using Supabase, run the migration in SQL Editor:
```sql
-- Copy contents of supabase/migrations/004_evolution_system.sql
```

### 2. Start Dev Server

```bash
npm run dev
```

### 3. Run Test Script

```bash
export GEMINI_API_KEY=$(grep GEMINI_API_KEY .env.local | cut -d '=' -f 2 | tr -d '"' | tr -d "'")
node test-evolution-mvp.mjs
```

Expected output:
- 4 variations generated (~40-60 seconds)
- Each evaluated for quality
- Best one "selected" automatically
- Strategy scores updated
- Performance stats displayed

## 📊 How It Works

### Generation Flow

```
User Photo + Reference Photo
         ↓
   [Generate 4 variations]
    Strategy 1 → Image 1
    Strategy 2 → Image 2
    Strategy 3 → Image 3
    Strategy 4 → Image 4
         ↓
   [Auto-Evaluate Each]
    Image 1: PASSED ✓
    Image 2: FAILED ✗
    Image 3: PASSED ✓
    Image 4: PASSED ✓
         ↓
   [Show 3 passing images to user]
         ↓
   [User selects favorite]
         ↓
   [Update scores]
    Winner: +0.05 score
    Losers: -0.01 score
```

### Strategy Evolution

Each strategy has a **score** (0-1):
- Starts at 0.5
- Increases when user selects it (+0.05)
- Decreases when user doesn't select it (-0.01)
- Scores cap at 1.0, floor at 0.1

Over time, better strategies rise to the top!

## 🎨 The 4 Initial Strategies

1. **explicit-description** - Detailed instructions with reference
2. **step-by-step** - Numbered steps approach
3. **aggressive-transform** - Demanding dramatic changes
4. **photo-editor** - Professional editor framing

All use `gemini-2.5-flash-image` model.

## 📈 Monitoring

Check strategy performance anytime:

```bash
curl http://localhost:3000/api/record-selection/stats
```

Shows:
- Total generations
- Success rates
- Current scores
- Which strategies are winning

## 🔄 Evolution in Action

Run the test multiple times:

```bash
# Run 5 tests
for i in {1..5}; do
  echo "Test $i"
  node test-evolution-mvp.mjs
  sleep 2
done
```

Watch the scores evolve!

## 🎯 Phase 1 MVP Complete ✓

**What's Working:**
- ✅ Multi-strategy generation
- ✅ Auto-evaluation (LLM-as-judge)
- ✅ User selection tracking
- ✅ Score updates
- ✅ Database integration
- ✅ Performance monitoring

**What's Next (Phase 2):**
- Add more AI models (Stable Diffusion, etc.)
- Weighted strategy selection (favor winners)
- Automatic prompt evolution
- Per-user personalization
- A/B testing framework

## 💡 Key Insights

1. **Gemini 2.5 Flash Image limitations confirmed**
   - Reference images don't work well
   - Text prompts are better
   - Some prompts trigger safety filters

2. **Evolution works!**
   - System learns from user feedback
   - Bad strategies get weeded out
   - Good strategies rise to top

3. **Auto-eval is crucial**
   - Filters obvious failures
   - Saves user time
   - Only shows quality results

## 🎉 Ready for Integration

The system is production-ready for Phase 1:
- Robust error handling
- Graceful degradation
- Well-documented
- Easy to extend

Next: Integrate into main app UI!


