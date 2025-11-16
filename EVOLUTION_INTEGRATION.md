# Evolution System Integration Guide

## 🎯 How to Add Evolution to Your App

You now have a self-evolving generation system. Here's how to integrate it into your main app flow.

## 📦 What You Have

### Components
- `components/EvolutionVariations.tsx` - Grid display for 4 variations with pass/fail indicators

### API Routes
- `POST /api/generate-variations` - Generates 4 variations using different strategies
- `POST /api/record-selection` - Records user's favorite to update strategy scores

### Libraries
- `lib/generation-strategies.ts` - Core generation logic
- `lib/evaluator.ts` - Auto-evaluation (LLM-as-judge)

## 🔌 Integration Steps

### Step 1: Add to Your Flow

In your main `app/page.tsx`, add this state:

```typescript
// Add to existing state
const [evolutionVariations, setEvolutionVariations] = useState<EvolutionVariation[]>([]);
const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
const [showEvolutionGrid, setShowEvolutionGrid] = useState(false);
```

### Step 2: Replace Single Generation with Multi-Generation

Find where you currently call your hairstyle generation. Replace it with:

```typescript
async function generateWithEvolution(userPhoto: string, referencePhoto: string) {
  setIsGeneratingVariations(true);
  
  try {
    const formData = new FormData();
    formData.append('image', userPhoto.split(',')[1]); // base64 data
    formData.append('mimeType', 'image/jpeg');
    formData.append('referenceImage', referencePhoto.split(',')[1]);
    formData.append('referenceMimeType', 'image/jpeg');
    formData.append('count', '4');
    
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    const response = await fetch('/api/generate-variations', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Generation failed');
    }

    const result = await response.json();
    
    // Show the variations
    setEvolutionVariations(result.variations);
    setShowEvolutionGrid(true);
    
  } catch (error) {
    console.error('Error:', error);
    alert('Generation failed');
  } finally {
    setIsGeneratingVariations(false);
  }
}
```

### Step 3: Handle User Selection

```typescript
async function handleVariationSelection(variation: EvolutionVariation) {
  console.log('User selected:', variation.strategyName);
  
  // Record selection to update strategy scores
  if (variation.id && sessionId) {
    try {
      await fetch('/api/record-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: variation.id,
          sessionId: sessionId
        })
      });
    } catch (error) {
      console.error('Failed to record selection:', error);
    }
  }
  
  // Use the selected image in your app
  // For example, add to results
  setResults([{
    id: Date.now(),
    name: `Evolution: ${variation.strategyName}`,
    image: variation.image,
    success: true
  }]);
  
  // Hide the evolution grid
  setShowEvolutionGrid(false);
}
```

### Step 4: Render the Component

In your JSX, add:

```tsx
import { EvolutionVariations, EvolutionVariation } from '@/components/EvolutionVariations';

// In your render:
{showEvolutionGrid && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
    overflowY: 'auto',
    padding: '20px'
  }}>
    <EvolutionVariations
      variations={evolutionVariations}
      onSelect={handleVariationSelection}
      isLoading={isGeneratingVariations}
    />
    
    {/* Close button */}
    <button
      onClick={() => setShowEvolutionGrid(false)}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(255,255,255,0.2)',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        fontSize: '20px',
        color: '#ffffff',
        cursor: 'pointer'
      }}
    >
      ×
    </button>
  </div>
)}
```

## 🎨 UI Flow

```
User uploads photo + reference
         ↓
Click "Generate with Evolution"
         ↓
Loading screen (40-60s)
  "Generating 4 variations..."
         ↓
Grid shows 4 variations
  - Each shows pass/fail badge
  - Each shows confidence score
  - Each shows what changed
  - Each shows strategy name
         ↓
User clicks favorite
         ↓
Selection recorded
Strategy scores updated
Selected image used in app
```

## 📊 What Each Variation Shows

```
┌─────────────────────────────┐
│  [IMAGE]              ✓PASSED│
│                      ★SELECTED│
│                           #1  │
├─────────────────────────────┤
│ Explicit Description        │
│ ████████████░░░░ 75%        │
│ Color ✓ Texture ✓ Style ✓  │
│ [Show details ▼]            │
└─────────────────────────────┘
```

## 🔍 Evaluation Indicators

- **✓ PASSED** (green) - Meaningful transformation detected
- **✗ FAILED** (red) - Too similar to original
- **Confidence bar** - How sure the evaluator is
- **Change badges** - Which attributes changed (color, length, texture, style)
- **Strategy name** - Which prompt was used

## 💡 Simple Test

Before full integration, test the component standalone:

```bash
# Make sure dev server is running
npm run dev

# Run the test
node test-evolution-mvp.mjs
```

This will show you what the API returns without UI integration.

## 🚀 Quick Integration Example

If you want to add this as a button in your existing flow:

```tsx
{/* Add this button where you have your reference photo */}
<button
  onClick={() => generateWithEvolution(originalImage, referencePhoto)}
  disabled={!originalImage || !referencePhoto || isGeneratingVariations}
  style={{
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#A47864',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }}
>
  {isGeneratingVariations ? 'Generating...' : 'Generate 4 Variations'}
</button>
```

## 📈 Monitoring Evolution

Check strategy performance anytime:

```bash
curl http://localhost:3000/api/record-selection/stats
```

Shows:
- Which strategies are winning
- Success rates
- How many times each was selected
- Current scores

## 🎯 Best Practices

1. **Always show all 4 variations** - even failed ones
   - Users might like subtle changes
   - Helps understand what "failed" means
   
2. **Make selection obvious** - clear visual feedback

3. **Explain what's happening** - users should understand they're helping AI improve

4. **Save selected image** - don't lose the user's choice

5. **Optional: Let users try again** - "Generate 4 more variations"

## 🔄 Flow Options

### Option A: Replace Your Current Generation
Use evolution instead of single hairstyle generation

### Option B: Add as Alternative
Keep your existing flow, add "Try Evolution Mode" button

### Option C: A/B Test
Show 50% of users evolution, 50% current system

## ✅ Checklist

- [ ] Import `EvolutionVariations` component
- [ ] Add state for variations and loading
- [ ] Create `generateWithEvolution` function
- [ ] Create `handleVariationSelection` function
- [ ] Render component in JSX
- [ ] Test with example photos
- [ ] Deploy and monitor

## 🎉 What You Get

After integration:
- Users see 4 different results
- System learns which prompts work
- Quality control via auto-evaluation
- Visual feedback on transformations
- Strategy scores improve over time

The system will naturally evolve to use the best prompts!

