'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (and Sentry if configured)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
      }}>
        {/* Error Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 59, 48, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>

        {/* Error Message */}
        <h1 style={{
          fontSize: '28px',
          marginBottom: '16px',
          fontWeight: '600',
        }}>
          Oops! Something went wrong
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#a8a8a8',
          marginBottom: '32px',
          lineHeight: '1.6',
        }}>
          We encountered an unexpected error. Don't worry, we've been notified and are working on it!
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: '#A47864',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#8B6854'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#A47864'}
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: 'transparent',
              color: '#A47864',
              border: '1px solid #A47864',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(164, 120, 100, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Go Home
          </button>
        </div>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details style={{
            marginTop: '32px',
            textAlign: 'left',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}>
            <summary style={{ cursor: 'pointer', marginBottom: '12px', color: '#A47864' }}>
              Error Details (Development Only)
            </summary>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#ff3b30',
            }}>
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

