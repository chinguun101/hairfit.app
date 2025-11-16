import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint to trigger strategy evolution
 * Checks if it's time to evolve (every ~5 sessions)
 * Retires poor performers and activates new strategies
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: 'Database not configured - evolution disabled'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('\n🧬 Checking if evolution should occur...');

    // Call the evolution function
    const { data, error } = await supabase.rpc('evolve_strategies');

    if (error) {
      console.error('Evolution error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('Evolution result:', data);

    if (data.evolved) {
      console.log(`\n🎉 EVOLUTION OCCURRED!`);
      console.log(`   Retired: ${data.retired_count} strategies`);
      console.log(`   Activated: ${data.activated_count} new strategies`);
      console.log(`   Total attempts: ${data.total_attempts}`);
    } else {
      console.log(`   No evolution yet: ${data.reason}`);
    }

    return NextResponse.json({
      success: true,
      ...data
    });

  } catch (error) {
    console.error('Error in evolve-strategies API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check evolution status without triggering
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        configured: false,
        message: 'Database not configured'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current strategy status
    const { data: strategies, error: stratError } = await supabase
      .from('generation_strategies')
      .select('name, score, is_active, success_count, total_generations')
      .order('score', { ascending: false });

    if (stratError) {
      throw stratError;
    }

    // Get total attempts
    const { count: totalAttempts } = await supabase
      .from('generation_attempts')
      .select('*', { count: 'exact', head: true });

    // Calculate approximate sessions (4 attempts per session)
    const approximateSessions = Math.floor((totalAttempts || 0) / 4);

    return NextResponse.json({
      configured: true,
      totalAttempts: totalAttempts || 0,
      approximateSessions,
      nextEvolution: Math.ceil(approximateSessions / 5) * 5,
      strategies: strategies?.map(s => ({
        name: s.name,
        score: s.score,
        active: s.is_active,
        winRate: s.total_generations > 0 
          ? ((s.success_count / s.total_generations) * 100).toFixed(1) + '%'
          : 'N/A'
      }))
    });

  } catch (error) {
    console.error('Error checking evolution status:', error);
    return NextResponse.json(
      { 
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

