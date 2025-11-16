'use client';

import React, { useState } from 'react';

export interface EvolutionVariation {
  id: string;
  strategyName: string;
  strategyId: string;
  image: string;
  passed: boolean;
  confidence: number;
  reason: string;
  details: {
    hairColorChanged: boolean;
    hairLengthChanged: boolean;
    hairTextureChanged: boolean;
    hairStyleChanged: boolean;
    overallSimilarity: number;
  };
  generationTimeMs: number;
}

interface EvolutionVariationsProps {
  variations: EvolutionVariation[];
  onSelect: (variation: EvolutionVariation) => void;
  isLoading?: boolean;
}

export function EvolutionVariations({ variations, onSelect, isLoading }: EvolutionVariationsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (variation: EvolutionVariation) => {
    setSelectedId(variation.id);
    onSelect(variation);
  };

  // Show all variations plus loading placeholders if still generating
  const loadingPlaceholders = isLoading ? Array(8).fill(null) : [];

  return (
    <div style={{
      width: '100%'
    }}>
      {/* Grid of variations - Pure masonry style like Pinterest */}
      <div style={{
        columnCount: 4,
        columnGap: '16px',
      }}>
        {/* Show actual variations */}
        {variations.map((variation, index) => (
          <div
            key={variation.id}
            onClick={() => handleSelect(variation)}
            style={{
              position: 'relative',
              marginBottom: '16px',
              breakInside: 'avoid',
              cursor: 'pointer',
              borderRadius: '16px',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-block',
              width: '100%',
              boxShadow: selectedId === variation.id 
                ? '0 4px 20px rgba(164, 120, 100, 0.6)' 
                : '0 2px 8px rgba(0,0,0,0.1)',
              border: selectedId === variation.id ? '3px solid #A47864' : 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = selectedId === variation.id 
                ? '0 4px 20px rgba(164, 120, 100, 0.6)' 
                : '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            <img
              src={variation.image}
              alt="Generated hairstyle"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '16px',
              }}
            />
          </div>
        ))}
        
        {/* Show loading placeholders */}
        {loadingPlaceholders.map((_, index) => (
          <div
            key={`loading-${index}`}
            style={{
              position: 'relative',
              marginBottom: '16px',
              breakInside: 'avoid',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'inline-block',
              width: '100%',
              aspectRatio: '3/4',
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          >
            {/* Loading skeleton with shimmer */}
            <div style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
            }}>
              {/* Shimmer effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                animation: 'shimmer 2s infinite',
              }} />
              
              {/* Spinner in center */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-20px',
                marginLeft: '-20px',
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTop: '3px solid #A47864',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

