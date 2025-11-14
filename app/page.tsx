'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HAIRSTYLES, pickTopHairstyles, UserHairProfile } from '@/lib/hairstyles';

interface GeneratedResult {
  id: number;
  name: string;
  image?: string;
  error?: string;
  success: boolean;
}

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserHairProfile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedHairstyles, setSelectedHairstyles] = useState<typeof HAIRSTYLES>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [slideOffset, setSlideOffset] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [remainingUses, setRemainingUses] = useState<number | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fun loading messages
  const loadingMessages = [
    "Teaching AI what a good hair day looks like...",
    "Consulting with virtual hairstylists...",
    "Mixing pixels with some hair magic...",
    "Asking the AI if it's ever had a bad hair day...",
    "Generating looks that'll make heads turn...",
    "Calculating the perfect hair-to-face ratio...",
    "Summoning the spirits of legendary stylists...",
    "Teaching computers about the law of bangs...",
    "Converting caffeine into hairstyles...",
    "Braiding some 1s and 0s together...",
    "Asking the AI if curtain bangs are still cool...",
    "Instructing pixels to behave like hair...",
    "Applying digital hair spray...",
    "Generating styles faster than you can say 'bob'...",
    "Making sure the AI didn't skip beauty school...",
    "Consulting the ancient texts of hair fashion...",
    "Channeling main character energy...",
    "Convincing the AI that mullets can be cool...",
    "Doing the hair math... carry the highlights...",
    "Manifesting your dream hair into existence..."
  ];

  // Rotate loading messages
  useEffect(() => {
    if (isAnalyzing || isGenerating) {
      const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      setLoadingMessage(randomMessage);
      
      const interval = setInterval(() => {
        const newMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        setLoadingMessage(newMessage);
      }, 3000); // Change message every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [isAnalyzing, isGenerating]);

  // Minimum swipe distance (in px) for a swipe to register
  const minSwipeDistance = 50;

  // Get all images including original
  const allImages = [
    originalImage ? { image: originalImage, isOriginal: true, id: 0 } : null,
    ...results.filter(r => r.success && r.image).map(r => ({ image: r.image!, isOriginal: false, id: r.id }))
  ].filter(Boolean) as Array<{ image: string; isOriginal: boolean; id: number }>;

  // Total expected images (1 original + 10 generated)
  const totalExpectedImages = originalImage ? 11 : 0;

  // Auto-advance to newly generated images - show rolling effect
  React.useEffect(() => {
    if (isGenerating && allImages.length > 0) {
      // Automatically advance to the latest image as they're generated
      setCurrentImageIndex(allImages.length - 1);
    }
  }, [allImages.length, isGenerating]);

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : prev));
  };

  // Touch handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    if (touchStart !== null) {
      const distance = touchStart - currentTouch;
      // Apply resistance at edges
      if ((currentImageIndex === 0 && distance < 0) || 
          (currentImageIndex === allImages.length - 1 && distance > 0)) {
        setSlideOffset(distance * 0.3); // Reduced movement at edges
      } else {
        setSlideOffset(distance);
      }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSlideOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentImageIndex < allImages.length - 1) {
      goToNext();
    } else if (isRightSwipe && currentImageIndex > 0) {
      goToPrevious();
    }
    
    setSlideOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const processFile = async (file: File) => {
    if (!file) return;
    
    // Check if it's an image file (including HEIC)
    const isImage = file.type.startsWith('image/') || 
                    file.name.toLowerCase().endsWith('.heic') || 
                    file.name.toLowerCase().endsWith('.heif');
    
    if (!isImage) {
      alert('Please upload an image file');
      return;
    }

    let processedFile = file;
    
    // Convert HEIC to JPEG if needed
    if (file.type === 'image/heic' || file.type === 'image/heif' || 
        file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      try {
        console.log('Converting HEIC image to JPEG...');
        // Dynamically import heic2any only when needed (client-side only)
        const heic2any = (await import('heic2any')).default;
        
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        });
        
        // heic2any can return an array of blobs, handle both cases
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { 
          type: 'image/jpeg' 
        });
        console.log('HEIC conversion successful');
      } catch (error) {
        console.error('Error converting HEIC:', error);
        alert('Failed to convert HEIC image. Please try a different format.');
        return;
      }
    }

    // Display original image
    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string);
    };
    reader.readAsDataURL(processedFile);

    // Reset state
    setResults([]);
    setUserProfile(null);
    setSessionId(null);
    setSelectedHairstyles([]);
    setRateLimitError(null);
    setRemainingUses(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(processedFile);
      const base64Data = base64.split(',')[1]; // Remove data URL prefix
      const mimeType = processedFile.type;

      // Step 1: Analyze the photo
      setIsAnalyzing(true);
      console.log('Analyzing photo...');
      
      const analyzeFormData = new FormData();
      analyzeFormData.append('image', base64Data);
      analyzeFormData.append('mimeType', mimeType);

      const analyzeResponse = await fetch('/api/analyze-photo', {
        method: 'POST',
        body: analyzeFormData,
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        
        // Check if it's a rate limit error (429)
        if (analyzeResponse.status === 429) {
          setRateLimitError(errorData.error || 'You have reached your usage limit. More credits coming soon!');
          setIsAnalyzing(false);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to analyze photo');
      }

      const { profile, sessionId: newSessionId, remaining } = await analyzeResponse.json();
      setUserProfile(profile);
      setSessionId(newSessionId);
      setRemainingUses(remaining);
      console.log('User profile:', profile);
      console.log('Session ID:', newSessionId);
      console.log('Remaining uses:', remaining);
      
      setIsAnalyzing(false);

      // Step 2: Pick the top 10 hairstyles based on profile
      const topHairstyles = pickTopHairstyles(profile, 10);
      setSelectedHairstyles(topHairstyles);
      console.log('Selected top 10 hairstyles:', topHairstyles.map(h => h.name));

      // Step 3: Generate the selected hairstyles one by one
      setIsGenerating(true);
      
      for (const hairstyle of topHairstyles) {
        try {
          const formData = new FormData();
          formData.append('image', base64Data);
          formData.append('mimeType', mimeType);
          formData.append('hairstyleId', hairstyle.id.toString());
          if (newSessionId) {
            formData.append('sessionId', newSessionId);
          }

          const response = await fetch('/api/generate-hairstyles', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to generate hairstyle');
          }

          const result = await response.json();
          
          // Add result immediately to show it in real-time
          setResults(prev => [...prev, result]);
        } catch (error) {
          console.error(`Error generating hairstyle ${hairstyle.id}:`, error);
          // Add error result
          setResults(prev => [...prev, {
            id: hairstyle.id,
            name: hairstyle.name,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          }]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing photo: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const downloadImage = (e: React.MouseEvent, dataUrl: string, filename: string) => {
    e.stopPropagation(); // Prevent triggering the lightbox
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Instagram-style Header */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000000',
        zIndex: 100,
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '400',
          fontFamily: 'sans-serif',
          letterSpacing: '0px',
        }}>
          hairfit
        </div>
        {allImages.length > 0 && (
          <button
            onClick={() => {
              setOriginalImage(null);
              setResults([]);
              setUserProfile(null);
              setSessionId(null);
              setSelectedHairstyles([]);
              setCurrentImageIndex(0);
              setRateLimitError(null);
              setRemainingUses(null);
            }}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: 'transparent',
              color: '#A47864',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Upload New
          </button>
        )}
      </header>

      <main style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Rate Limit Error Screen */}
        {rateLimitError && (
          <div style={{
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
          }}>
            {/* Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 59, 48, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>

            {/* Error Message */}
            <h2 style={{
              fontSize: '22px',
              marginBottom: '12px',
              fontWeight: '600',
              color: '#ffffff',
            }}>
              Out of Credits
            </h2>
            <p style={{
              fontSize: '15px',
              color: '#a8a8a8',
              marginBottom: '32px',
              lineHeight: '1.5',
              maxWidth: '380px',
            }}>
              {rateLimitError}
            </p>

            {/* Action Button */}
            <button
              onClick={() => {
                setRateLimitError(null);
                setOriginalImage(null);
              }}
              style={{
                padding: '12px 32px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: '#0095f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1877f2'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0095f6'}
            >
              Go Back
            </button>

            {/* Info Text */}
            <p style={{
              fontSize: '13px',
              color: '#666',
              marginTop: '24px',
            }}>
              Updates coming soon with more features!
            </p>
          </div>
        )}

        {/* Upload Screen - Instagram Style */}
        {!originalImage && !isAnalyzing && !isGenerating && !rateLimitError && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              maxWidth: '600px',
              margin: '0 auto',
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              cursor: 'pointer',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            
            {/* Upload Icon */}
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              border: isDragging ? '3px solid #A47864' : '2px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px',
              transition: 'all 0.3s ease',
              backgroundColor: isDragging ? 'rgba(0,149,246,0.1)' : 'transparent',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>

            <h2 style={{
              fontSize: '22px',
              marginBottom: '12px',
              fontWeight: '300',
              color: '#ffffff',
              textAlign: 'center',
            }}>
              {isDragging ? 'Drop your photo here' : 'Upload a photo'}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#a8a8a8',
              marginBottom: '8px',
              textAlign: 'center',
              maxWidth: '400px',
            }}>
              AI will analyze your features and generate 10 personalized hairstyles
            </p>
            
            {remainingUses !== null && (
              <p style={{
                fontSize: '13px',
                color: '#0095f6',
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                {remainingUses} {remainingUses === 1 ? 'use' : 'uses'} remaining
              </p>
            )}
            
            <button
              style={{
                padding: '12px 32px',
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
              Select from device
            </button>
          </div>
        )}

        {/* Loading Screen - During analysis and initial generation */}
        {(isAnalyzing || (isGenerating && allImages.length <= 1)) && (
          <div style={{
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              border: '3px solid rgba(255,255,255,0.1)',
              borderTop: '3px solid #A47864',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 24px'
            }}></div>
            <p style={{
              fontSize: '16px',
              color: '#ffffff',
              marginBottom: '12px',
              fontWeight: '400',
            }}>
              {isAnalyzing ? 'Analyzing your photo...' : 'Generating hairstyles...'}
            </p>
            
            {/* Fun loading message */}
            <p style={{
              fontSize: '14px',
              color: '#A47864',
              marginBottom: '8px',
              fontWeight: '400',
              fontStyle: 'italic',
              minHeight: '20px',
              textAlign: 'center',
              maxWidth: '340px',
              transition: 'opacity 0.3s ease',
            }}>
              {loadingMessage}
            </p>
            
            {isGenerating && (
              <p style={{
                color: '#a8a8a8',
                fontSize: '14px',
                fontWeight: '400',
              }}>
                {results.length} of {selectedHairstyles.length}
              </p>
            )}
          </div>
        )}

        {/* Instagram Story-Style Viewer - Show during and after generation */}
        {allImages.length > 0 && (
          <div style={{
            width: '100%',
            maxWidth: '600px',
            height: '100%',
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Progress Bars - Instagram Style */}
            <div style={{
              display: 'flex',
              gap: '4px',
              padding: '12px 12px 8px',
              flexShrink: 0,
            }}>
              {allImages.map((_, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    height: '100%',
                    backgroundColor: '#ffffff',
                    width: index < currentImageIndex ? '100%' : index === currentImageIndex ? '100%' : '0%',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              ))}
            </div>

            {/* Main Image Container with Swipe Support */}
            <div 
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 0',
                overflow: 'hidden',
                minHeight: 0,
              }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Tap Areas for Navigation */}
              <div
                onClick={goToPrevious}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '30%',
                  cursor: currentImageIndex > 0 ? 'pointer' : 'default',
                  zIndex: 5,
                }}
              />
              <div
                onClick={goToNext}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '30%',
                  cursor: currentImageIndex < allImages.length - 1 ? 'pointer' : 'default',
                  zIndex: 5,
                }}
              />

              {/* Instagram-style Sliding Container - All Images in a Row */}
              <div 
                style={{
                  display: 'flex',
                  height: '100%',
                  width: '100%',
                  transform: `translateX(calc(-${currentImageIndex * 100}% + ${-slideOffset}px))`,
                  transition: slideOffset === 0 ? 'transform 0.35s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
                  willChange: 'transform',
                }}
              >
                {allImages.map((imageData, index) => (
                  <div
                    key={index}
                    onClick={() => setLightboxImage(imageData.image)}
                    style={{
                      minWidth: '100%',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={imageData.image}
                      alt={imageData.isOriginal ? 'Original' : `Hairstyle ${imageData.id}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        borderRadius: '8px',
                        objectFit: 'contain',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail Preview Strip - Instagram Style */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingBottom: '4px',
              }}>
                {Array.from({ length: totalExpectedImages }).map((_, index) => {
                  const imageData = allImages[index];
                  const isActive = index === currentImageIndex;
                  const hasImage = !!imageData;
                  
                  return (
                    <div
                      key={index}
                      onClick={() => hasImage && setCurrentImageIndex(index)}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        cursor: hasImage ? 'pointer' : 'default',
                        border: isActive ? '2px solid #A47864' : '2px solid transparent',
                        opacity: isActive ? 1 : hasImage ? 0.6 : 0.3,
                        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                        backgroundColor: hasImage ? 'transparent' : 'rgba(255,255,255,0.1)',
                        position: 'relative',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {hasImage ? (
                        <img
                          src={imageData.image}
                          alt={`Thumbnail ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(255,255,255,0.3)',
                        }}>
                          {isGenerating && index === allImages.length ? (
                            <div style={{
                              width: '20px',
                              height: '20px',
                              border: '2px solid rgba(255,255,255,0.2)',
                              borderTop: '2px solid #A47864',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }} />
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Bar - Instagram Style */}
            <div style={{
              padding: '16px 20px',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))', // iOS safe area
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0,
              backgroundColor: '#000000',
              minHeight: '60px',
            }}>
              <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
              }}>
                {/* Download Button - Show for all images */}
                <button
                  onClick={(e) => {
                    const filename = allImages[currentImageIndex]?.isOriginal 
                      ? 'original-photo.png' 
                      : `hairstyle-${allImages[currentImageIndex]?.id}.png`;
                    downloadImage(e, allImages[currentImageIndex]?.image!, filename);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                    minWidth: '44px', // iOS minimum touch target
                    minHeight: '44px',
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
              
              {/* Status Indicator */}
              {isGenerating && (
                <div style={{ 
                  width: '14px', 
                  height: '14px', 
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTop: '2px solid #A47864',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}></div>
              )}
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(10px)',
              padding: '20px',
            }}
          >
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImage(null);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: '300',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
            >
              ×
            </button>
            
            {/* Lightbox Image */}
            <img
              src={lightboxImage}
              alt="Full size"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          </div>
        )}

      </main>

      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: fixed;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
          box-sizing: border-box;
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        *::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

