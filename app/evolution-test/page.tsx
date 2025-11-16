'use client';

import React, { useState } from 'react';
import { EvolutionVariations, EvolutionVariation } from '@/components/EvolutionVariations';

export default function EvolutionTestPage() {
  const [variations, setVariations] = useState<EvolutionVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId] = useState(`test-session-${Date.now()}`);
  const [error, setError] = useState<string | null>(null);

  async function testGeneration() {
    setIsGenerating(true);
    setError(null);
    setVariations([]);
    
    try {
      // Using the example images
      const userPhotoPath = '/api/test-images/og';
      const refPhotoPath = '/api/test-images/ref';
      
      // Fetch example images
      console.log('Loading example images...');
      const userImgResponse = await fetch(userPhotoPath);
      const refImgResponse = await fetch(refPhotoPath);
      
      if (!userImgResponse.ok || !refImgResponse.ok) {
        throw new Error('Failed to load example images');
      }
      
      const userBlob = await userImgResponse.blob();
      const refBlob = await refImgResponse.blob();
      
      // Convert to base64
      const userBase64 = await blobToBase64(userBlob);
      const refBase64 = await blobToBase64(refBlob);
      
      console.log('Starting streaming generation...');
      
      const formData = new FormData();
      formData.append('image', userBase64.split(',')[1]);
      formData.append('mimeType', 'image/jpeg');
      formData.append('referenceImage', refBase64.split(',')[1]);
      formData.append('referenceMimeType', 'image/jpeg');
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/generate-variations-stream', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete messages (lines starting with "data: " and ending with \n\n)
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete message in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'start') {
              console.log('Generation started:', data.message);
            } else if (data.type === 'complete') {
              console.log(`Variation ${data.index + 1} complete!`);
              // Add the new variation to the list
              setVariations(prev => {
                const newVariations = [...prev];
                newVariations[data.index] = data.variation;
                return newVariations;
              });
            } else if (data.type === 'error') {
              console.error(`Variation ${data.index + 1} error:`, data.error);
            } else if (data.type === 'done') {
              console.log('All variations complete!');
              setIsGenerating(false);
            }
          }
        }
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsGenerating(false);
    }
  }

  async function handleSelection(variation: EvolutionVariation) {
    console.log('User selected:', variation.strategyName);
    
    try {
      const response = await fetch('/api/record-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: variation.id,
          sessionId: sessionId
        })
      });
      
      if (response.ok) {
        console.log('✓ Selection recorded successfully');
      } else {
        console.warn('Failed to record selection (non-critical)');
      }
    } catch (err) {
      console.warn('Failed to record selection:', err);
    }
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '16px'
        }}>
          Evolution System Test
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#a8a8a8',
          marginBottom: '32px'
        }}>
          Generate 8 variations using the proven working approach
        </p>

        {/* Test Button */}
        <button
          onClick={testGeneration}
          disabled={isGenerating}
          style={{
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: '#A47864',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate 8 Variations'}
        </button>

        {/* Status Info */}
        {isGenerating && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: 'rgba(164, 120, 100, 0.2)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#a8a8a8'
          }}>
            <p>This will take 40-60 seconds...</p>
            <p style={{ marginTop: '8px' }}>
              Using example images from <code>lib/ref_example/</code>
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.5)'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Evolution Grid */}
      {(variations.length > 0 || isGenerating) && (
        <EvolutionVariations
          variations={variations}
          onSelect={handleSelection}
          isLoading={isGenerating}
        />
      )}

      {/* Instructions */}
      {variations.length === 0 && !isGenerating && !error && (
        <div style={{
          maxWidth: '600px',
          margin: '60px auto 0',
          padding: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          fontSize: '14px',
          color: '#a8a8a8',
          lineHeight: '1.8'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '12px'
          }}>
            How This Works:
          </h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Generates 8 variations using the simple proven prompt</li>
            <li>Each variation is auto-evaluated (passed/failed)</li>
            <li>Shows what changed (color, length, texture, style)</li>
            <li>You pick your favorite</li>
            <li>System learns which strategies work best</li>
          </ul>
          
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px'
          }}>
            <strong style={{ color: '#ffffff' }}>Note:</strong> First run will take longer. 
            Gemini may produce subtle changes - that's why we test 4 strategies!
          </div>
        </div>
      )}

      {/* Stats Link */}
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        textAlign: 'center'
      }}>
        <a
          href="/api/record-selection/stats"
          target="_blank"
          style={{
            color: '#A47864',
            textDecoration: 'underline',
            fontSize: '14px'
          }}
        >
          View Strategy Performance Stats →
        </a>
      </div>
    </div>
  );
}

