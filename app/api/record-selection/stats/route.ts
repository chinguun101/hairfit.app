import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If no Supabase, return mock data
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        message: 'Database not configured - showing mock data',
        strategies: [
          {
            name: 'explicit-description',
            score: 0.5,
            success_count: 0,
            total_generations: 0,
            selection_rate: 0,
            last_used: null
          },
          {
            name: 'step-by-step',
            score: 0.5,
            success_count: 0,
            total_generations: 0,
            selection_rate: 0,
            last_used: null
          },
          {
            name: 'aggressive-transform',
            score: 0.5,
            success_count: 0,
            total_generations: 0,
            selection_rate: 0,
            last_used: null
          },
          {
            name: 'photo-editor',
            score: 0.5,
            success_count: 0,
            total_generations: 0,
            selection_rate: 0,
            last_used: null
          }
        ]
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all strategies with their stats
    const { data: strategies, error } = await supabase
      .from('generation_strategies')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      console.error('Error fetching strategies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch strategy stats' },
        { status: 500 }
      );
    }

    // Calculate selection rates
    const strategiesWithRates = strategies?.map(strategy => ({
      ...strategy,
      selection_rate: strategy.total_generations > 0
        ? (strategy.success_count / strategy.total_generations * 100).toFixed(1)
        : 0
    })) || [];

    return NextResponse.json({
      strategies: strategiesWithRates,
      total_strategies: strategiesWithRates.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

