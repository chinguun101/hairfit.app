# 🚀 Evolution System - 5 Session Trigger

## ✅ What's Been Set Up

Your system now **automatically evolves every 5 sessions**:

1. ✅ **6 New Prompt Strategies** created (ready to be activated)
2. ✅ **Auto-evolution** triggers after every 5 user selections
3. ✅ **Retirement system** removes strategies with score < 0.3
4. ✅ **Automatic replacement** activates new strategies
5. ✅ **Everything saves** to database

---

## 🎯 How It Works

### Sessions 1-5: Initial Testing

```
Session 1: 4 prompts shown → user picks #3
  → Strategy 3 score: 0.5 → 0.55
  → Others: 0.5 → 0.49

Session 2: 4 prompts shown → user picks #3 again
  → Strategy 3 score: 0.55 → 0.60
  → Others: 0.49 → 0.48

Session 3: 4 prompts shown → user picks #2
  → Strategy 2 score: 0.48 → 0.53
  → Others decrease slightly

Session 4: 4 prompts shown → user picks #3
  → Strategy 3 score: 0.60 → 0.65

Session 5: 4 prompts shown → user picks #1
  → Strategy 1 score: 0.47 → 0.52
  → Strategy 3 still leading at 0.64

🧬 EVOLUTION TRIGGERED!
```

### After Session 5: First Evolution

```
Current Scores:
┌────────────────────────────────────────┐
│ Strategy 3: aggressive-transform [0.64]│ 🏆 Keep
│ Strategy 1: explicit-description [0.52]│ ✓ Keep  
│ Strategy 2: step-by-step         [0.48]│ ✓ Keep
│ Strategy 4: photo-editor         [0.28]│ ❌ RETIRE
└────────────────────────────────────────┘

Evolution Actions:
1. Retire Strategy 4 (score < 0.3)
2. Activate NEW strategy: 'command-imperative'

New Lineup:
┌────────────────────────────────────────┐
│ Strategy 3: aggressive-transform [0.64]│ 🏆
│ Strategy 1: explicit-description [0.52]│
│ Strategy 2: step-by-step         [0.48]│
│ Strategy 5: command-imperative   [0.50]│ 🆕 NEW!
└────────────────────────────────────────┘
```

### Sessions 6-10: Testing New Strategy

```
Session 6-10: Same process
  → Users test the new strategy
  → Maybe it wins? Maybe it loses?
  → Scores adjust

🧬 EVOLUTION TRIGGERED AGAIN AT SESSION 10!
```

### After Session 10: Second Evolution

```
If new strategy performed well:
┌────────────────────────────────────────┐
│ Strategy 5: command-imperative   [0.75]│ 🥇 New champ!
│ Strategy 3: aggressive-transform [0.68]│ 🥈
│ Strategy 1: explicit-description [0.45]│ ✓
│ Strategy 2: step-by-step         [0.25]│ ❌ RETIRE
└────────────────────────────────────────┘

Retire step-by-step, activate 'visual-clone'
```

---

## 📋 New Prompt Strategies (Waiting to Be Activated)

### Ready to Deploy:

1. **command-imperative** - Military-style command format
   ```
   "COMMAND: Transfer hairstyle from Reference Image..."
   ```

2. **visual-clone** - Cloning terminology
   ```
   "Visual cloning task: Clone the hairstyle..."
   ```

3. **before-after** - Transformation language
   ```
   "Create a BEFORE → AFTER transformation..."
   ```

4. **hair-swap** - Swap operation metaphor
   ```
   "HAIR SWAP OPERATION: Person A has hair X..."
   ```

5. **ultra-dramatic** - Maximum emphasis
   ```
   "MAXIMUM TRANSFORMATION DIRECTIVE: Make this EXTREMELY obvious..."
   ```

6. **salon-preview** - Professional preview framing
   ```
   "You are creating a virtual salon preview..."
   ```

---

## 🔧 Setup Required

### Step 1: Run Migration 005

Go to your Supabase dashboard → SQL Editor → Run this:

```bash
# Copy the entire file:
supabase/migrations/005_new_strategies.sql
```

This will:
- ✅ Add 6 new strategies (inactive by default)
- ✅ Create `activate_next_strategy()` function
- ✅ Create `retire_poor_performers()` function
- ✅ Create `evolve_strategies()` function (triggers every 5 sessions)

### Step 2: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

New API route needs to be registered: `/api/evolve-strategies`

### Step 3: Test It!

```bash
# Open test page
http://localhost:3000/evolution-test

# Or check evolution status
http://localhost:3000/api/evolve-strategies
```

---

## 📊 Monitoring Evolution

### Check Current Status:

```bash
curl http://localhost:3000/api/evolve-strategies
```

Returns:
```json
{
  "configured": true,
  "totalAttempts": 12,
  "approximateSessions": 3,
  "nextEvolution": 5,
  "strategies": [
    {
      "name": "aggressive-transform",
      "score": 0.65,
      "active": true,
      "winRate": "60.0%"
    },
    {
      "name": "explicit-description",
      "score": 0.52,
      "active": true,
      "winRate": "25.0%"
    },
    // ...
  ]
}
```

### Watch Server Logs:

After Session 5, you'll see:
```
✅ Selection recorded successfully
   Strategy scores have been updated

🧬 EVOLUTION TRIGGERED!
   Retired: 1 strategies
   Activated: 1 new strategies
============================================================
```

---

## 🎯 Evolution Rules

### Scoring:
```javascript
Winner: +0.05 per selection
Losers: -0.01 per session
Max score: 1.0
Min score: 0.1
```

### Retirement:
```javascript
if (score < 0.3 && total_uses >= 5) {
  strategy.is_active = false
  // Activate a new one to replace it
}
```

### Activation:
```javascript
// When a strategy is retired
activate_next_strategy() // Picks next inactive strategy
```

### Evolution Trigger:
```javascript
// After every 5 user selections
if (total_selections % 5 === 0) {
  retire_poor_performers()
  activate_replacements()
}
```

---

## 📈 Expected Timeline

### Session 1-5: Initial Discovery
```
All 4 original strategies tested
Patterns emerge
First evolution at session 5
```

### Session 6-10: First Generation
```
1 new strategy introduced
Testing against 3 originals
Second evolution at session 10
```

### Session 11-15: Second Generation
```
Another new strategy
Best performers remain
Third evolution at session 15
```

### Session 16-20: Third Generation
```
By now, 2-3 strategies likely retired
2-3 new strategies tested
System learning user preferences
```

### Session 25+: Mature System
```
Only top performers remain
New experiments continuously tested
High success rate
```

---

## 🔍 What Gets Saved

Every session saves:

### `generation_attempts` table:
```sql
- id (UUID)
- strategy_id (which prompt was used)
- user_selected (TRUE for winner)
- evaluation_passed (auto-eval result)
- evaluation_confidence (0-1)
- generation_time_ms (how long it took)
- created_at (timestamp)
```

### `generation_strategies` table:
```sql
- id (UUID)
- name (strategy name)
- score (current score)
- success_count (times selected)
- total_generations (times used)
- is_active (TRUE/FALSE)
- updated_at (last score update)
```

---

## 🎉 What You Get

After 5 sessions:
- ✅ System starts evolving
- ✅ Poor performers retire
- ✅ New strategies activate
- ✅ Everything tracked in database
- ✅ Full lineage visible

After 20 sessions:
- ✅ Clear winner emerges
- ✅ Multiple generations tested
- ✅ System knows what works
- ✅ New strategies still being tried
- ✅ Continuous improvement

---

## 🚦 Quick Start

1. **Run migration 005** in Supabase
2. **Restart dev server** (`npm run dev`)
3. **Do 5 test sessions** at `/evolution-test`
4. **Watch for evolution** in server logs!
5. **Check stats** at `/api/evolve-strategies`

---

## 🐛 Troubleshooting

### "Evolution not triggered after 5 sessions"
- Check server logs for errors
- Verify migration 005 ran successfully
- Check if database is actually saving (look for error logs)

### "No new strategies appearing"
- Verify migration 005 created the new strategies
- Check `is_active` field in database (should be false initially)
- Check `activate_next_strategy()` function exists

### "Scores not updating"
- Verify migration 004 ran successfully
- Check `update_strategy_score()` function exists
- Look for database connection errors

### "Database not configured"
- Set `NEXT_PUBLIC_SUPABASE_URL` env var
- Set `SUPABASE_SERVICE_ROLE_KEY` env var
- Restart dev server after setting env vars

---

## 💡 Pro Tips

1. **Watch the logs** - They show exactly what's happening
2. **Check stats regularly** - See which strategies are winning
3. **Be patient** - 5 sessions minimum for first evolution
4. **Try different selections** - Don't always pick the same one
5. **Monitor scores** - See the learning happen in real-time

---

## 🎓 Summary

✅ **Automated evolution every 5 sessions**  
✅ **6 new experimental prompts ready**  
✅ **Poor performers auto-retired**  
✅ **New strategies auto-activated**  
✅ **Everything saved to database**  
✅ **Full tracking and monitoring**  

**Your AI is now self-evolving!** 🧬🚀

