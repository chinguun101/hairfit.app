import { NextRequest, NextResponse } from 'next/server';
import { recordUserSelection } from '@/lib/generation-strategies';

/**
 * POST /api/record-selection
 * 
 * Record user's selection of their favorite generation
 * This is the key feedback signal for the evolution system
 * 
 * Body (JSON):
 * {
 *   attemptId: "uuid-of-selected-attempt",
 *   sessionId: "uuid-of-session"
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   message: "Selection recorded and scores updated"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { attemptId, sessionId } = body;

    // Validate inputs
    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`👤 User Selection Recorded`);
    console.log(`   Session: ${sessionId}`);
    console.log(`   Selected: ${attemptId}`);
    console.log(`${'='.repeat(60)}\n`);

    // Record selection and update strategy scores
    const success = await recordUserSelection(attemptId, sessionId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record selection' },
        { status: 500 }
      );
    }

    console.log(`✅ Selection recorded successfully`);
    console.log(`   Strategy scores have been updated`);

    // Check if evolution should occur (every ~5 sessions)
    try {
      const evolutionResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/evolve-strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (evolutionResponse.ok) {
        const evolutionData = await evolutionResponse.json();
        if (evolutionData.evolved) {
          console.log(`\n🧬 EVOLUTION TRIGGERED!`);
          console.log(`   Retired: ${evolutionData.retired_count} strategies`);
          console.log(`   Activated: ${evolutionData.activated_count} new strategies`);
        }
      }
    } catch (evolutionError) {
      // Non-critical - just log it
      console.warn('Evolution check failed (non-critical):', evolutionError);
    }

    console.log(`${'='.repeat(60)}\n`);

    return NextResponse.json({
      success: true,
      message: 'Selection recorded and scores updated'
    });

  } catch (error) {
    console.error('Error in record-selection API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/record-selection/stats
 * 
 * Get current strategy performance stats
 * Useful for monitoring the evolution system
 */
export async function GET() {
  try {
    const { isSupabaseConfigured, supabase } = await import('@/lib/supabase');

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured',
        stats: null
      });
    }

    // Get all strategies with their scores
    const { data: strategies, error } = await supabase
      .from('generation_strategies')
      .select('name, model, score, success_count, total_generations, is_active')
      .order('score', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate overall stats
    const totalGenerations = strategies?.reduce((sum, s) => sum + s.total_generations, 0) || 0;
    const totalSelections = strategies?.reduce((sum, s) => sum + s.success_count, 0) || 0;
    const activeStrategies = strategies?.filter(s => s.is_active).length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalGenerations,
        totalSelections,
        activeStrategies,
        strategies: strategies?.map(s => ({
          name: s.name,
          score: s.score,
          successRate: s.total_generations > 0 
            ? (s.success_count / s.total_generations * 100).toFixed(1) + '%'
            : '0%',
          totalUses: s.total_generations,
          timesSelected: s.success_count,
          isActive: s.is_active
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


