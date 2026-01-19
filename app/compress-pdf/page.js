"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';


const page = () => {
  const router = useRouter();
  const { user } = useAuth();

  // State to store the uploaded file
  const [file, setFile] = useState(null);

  // State to track if user is dragging over the drop zone
  const [isDragging, setIsDragging] = useState(false);

  // State to track upload/compression progress (0-100)
  const [progress, setProgress] = useState(0);

  // State to check if upload is in progress
  const [isUploading, setIsUploading] = useState(false);

  // State to check if upload is complete
  const [isComplete, setIsComplete] = useState(false);

  // State to store the compressed PDF blob
  const [compressedFile, setCompressedFile] = useState(null);

  // State to store compression statistics
  const [stats, setStats] = useState(null);

  // State for errors
  const [error, setError] = useState(null);

  // State for selected quality
  const [quality, setQuality] = useState('ebook');

  // NEW: State for premium status
  const [isPremium, setIsPremium] = useState(false);
  const [loadingPremium, setLoadingPremium] = useState(true);

  // NEW: Fetch premium status on mount
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setLoadingPremium(false);
        return;
      }

      try {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_type')
          .eq('user_id', user.id)
          .maybeSingle();

        setIsPremium(subscription?.plan_type === 'pro');
      } catch (err) {
        console.error('Error checking premium status:', err);
        setIsPremium(false);
      } finally {
        setLoadingPremium(false);
      }
    };

    checkPremiumStatus();
  }, [user]);

  // Handle quality selection - redirect to upgrade if locked
  const handleQualitySelect = (selectedQuality) => {
    // Screen quality is locked for non-premium users
    if (selectedQuality === 'screen' && !isPremium) {
      router.push('/upgrade');
      return;
    }
    setQuality(selectedQuality);
  };

  // Prevent default behavior when dragging over
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Reset dragging state when drag leaves
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type == 'application/pdf') {
        processFile(droppedFile);
      } else {
        setError('Please upload a PDF file only');
      }
    }
  };

  // Handle file selection via input
  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        processFile(selectedFile);
      } else {
        setError('Please upload a PDF file only');
      }
    }
  };

  // Process the file
  const processFile = async (selectedFile) => {
    // ========== CLIENT-SIDE FILE SIZE CHECK ==========
    // Check file size BEFORE uploading to avoid server parsing errors
    const FREE_FILE_SIZE_LIMIT = 20 * 1024 * 1024; // 20MB

    if (!isPremium && selectedFile.size > FREE_FILE_SIZE_LIMIT) {
      setError({
        type: 'file_too_large',
        message: `File size: ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB. Limit: 20MB`,
        hint: 'Upgrade to Premium for unlimited file sizes'
      });
      return; // Don't try to upload
    }
    // ========== END FILE SIZE CHECK ==========

    setFile(selectedFile);
    setIsUploading(true);
    setProgress(0);
    setIsComplete(false);
    setError(null);
    setCompressedFile(null);
    setStats(null);

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('quality', quality);

      if (user?.id) {
        formData.append('user_id', user.id);
      }

      setProgress(10);
      console.log('Sending PDF to backend...');

      const response = await fetch('/api/compress-pdf', {
        method: 'POST',
        body: formData,
      });

      setProgress(50);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Server error', details: 'Failed to process request' };
        }

        console.log('Backend error:', response.status, errorData);

        // Reset file state so UI shows quality selector and drop zone again
        setFile(null);
        setIsUploading(false);
        setProgress(0);

        // Handle different error codes
        if (response.status === 413) {
          setError({
            type: 'file_too_large',
            message: errorData.details || 'File exceeds 20MB limit',
            hint: errorData.hint
          });
        } else if (response.status === 403) {
          setError({
            type: 'premium_feature',
            message: errorData.details || 'This is a premium feature',
            hint: errorData.hint
          });
        } else {
          setError({
            type: 'generic',
            message: errorData.details || errorData.error || 'Compression failed'
          });
        }
        return;
      }

      const originalSize = parseInt(response.headers.get('X-Original-Size'));
      const compressedSize = parseInt(response.headers.get('X-Compressed-Size'));
      const compressionRatio = response.headers.get('X-Compression-Ratio');

      setProgress(80);

      const blob = await response.blob();
      setCompressedFile(blob);

      setStats({
        originalSize,
        compressedSize,
        compressionRatio,
        savedBytes: originalSize - compressedSize
      });

      setProgress(100);
      setIsUploading(false);
      setIsComplete(true);

    } catch (err) {
      console.error('Compression error:', err);
      // Reset file state so UI shows quality selector and drop zone again
      setFile(null);
      setError({ type: 'generic', message: err.message || 'Failed to compress PDF. Please try again.' });
      setIsUploading(false);
      setProgress(0);
    }
  };

  // Download the file
  const handleDownload = () => {
    if (compressedFile) {
      const url = URL.createObjectURL(compressedFile);
      const nameWithoutExt = file.name.replace('.pdf', '');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nameWithoutExt}-${quality}-compressed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Reset everything
  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setIsUploading(false);
    setIsComplete(false);
    setCompressedFile(null);
    setStats(null);
    setError(null);
  };

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    router.push('/dashboard');
    router.refresh();
  };

  // Helper function to format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // ========== STYLES ==========
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '40px 20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    innerContainer: {
      maxWidth: '800px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#ffffff',
      margin: 0,
      background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    backButton: {
      padding: '10px 20px',
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
    },
    card: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '30px',
      marginBottom: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    qualityGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '12px',
    },
    qualityButton: (isSelected, isLocked) => ({
      padding: '16px',
      background: isSelected
        ? 'linear-gradient(135deg, #7c3aed 0%, #00d4ff 100%)'
        : isLocked
          ? 'rgba(255, 255, 255, 0.03)'
          : 'rgba(255, 255, 255, 0.08)',
      border: isSelected
        ? 'none'
        : isLocked
          ? '1px dashed rgba(255, 255, 255, 0.2)'
          : '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center',
      position: 'relative',
      opacity: isLocked ? 0.7 : 1,
    }),
    qualityLabel: (isSelected) => ({
      fontSize: '14px',
      fontWeight: '600',
      color: isSelected ? '#ffffff' : '#e0e0e0',
      marginBottom: '4px',
    }),
    qualityDesc: (isSelected) => ({
      fontSize: '12px',
      color: isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
    }),
    lockBadge: {
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      color: '#ffffff',
      fontSize: '10px',
      fontWeight: '700',
      padding: '4px 8px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    dropZone: (isDragging) => ({
      border: isDragging ? '2px solid #00d4ff' : '2px dashed rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      padding: '60px 40px',
      textAlign: 'center',
      background: isDragging ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    }),
    dropZoneText: {
      fontSize: '18px',
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '16px',
    },
    dropZoneHint: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.4)',
    },
    fileInput: {
      display: 'none',
    },
    browseButton: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #7c3aed 0%, #00d4ff 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      marginTop: '16px',
    },
    errorBox: {
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
      border: '1px solid rgba(239, 68, 68, 0.5)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
    },
    errorTitle: {
      color: '#ef4444',
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    errorMessage: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '14px',
      marginBottom: '16px',
    },
    upgradeButton: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.5)',
      cursor: 'pointer',
      fontSize: '18px',
      float: 'right',
    },
    progressContainer: {
      marginTop: '20px',
    },
    progressBar: {
      height: '8px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    progressFill: (progress) => ({
      height: '100%',
      width: `${progress}%`,
      background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
      transition: 'width 0.3s ease',
      borderRadius: '4px',
    }),
    progressText: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '14px',
      marginTop: '8px',
      textAlign: 'center',
    },
    successBox: {
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
      border: '1px solid rgba(34, 197, 94, 0.5)',
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
    },
    successTitle: {
      color: '#22c55e',
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '16px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '20px',
    },
    statItem: {
      textAlign: 'center',
    },
    statValue: {
      color: '#ffffff',
      fontSize: '18px',
      fontWeight: '600',
    },
    statLabel: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '12px',
      marginTop: '4px',
    },
    downloadButton: {
      padding: '14px 32px',
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      marginRight: '12px',
    },
    resetButton: {
      padding: '14px 32px',
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
    },
    premiumBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: '600',
      padding: '4px 12px',
      borderRadius: '20px',
      marginLeft: '12px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            🗜️ PDF Compressor
            {isPremium && <span style={styles.premiumBadge}>⭐ PRO</span>}
          </h1>
          <button onClick={handleBackToDashboard} style={styles.backButton}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            <button onClick={() => setError(null)} style={styles.closeButton}>✕</button>
            <div style={styles.errorTitle}>
              ⚠️ {error.type === 'file_too_large'
                ? 'File Too Large'
                : error.type === 'premium_feature'
                  ? 'Premium Feature'
                  : 'Compression Failed'}
            </div>
            <div style={styles.errorMessage}>
              {error.type === 'file_too_large'
                ? 'Free users can only upload files up to 20MB. Upgrade to Premium for unlimited file sizes!'
                : error.type === 'premium_feature'
                  ? 'This feature is only available for Premium users. Upgrade to unlock all compression options!'
                  : error.message
              }
            </div>
            {(error.type === 'file_too_large' || error.type === 'premium_feature') && (
              <button onClick={() => router.push('/upgrade')} style={styles.upgradeButton}>
                ⭐ Upgrade to Premium
              </button>
            )}
          </div>
        )}

        {/* Quality Selector */}
        {!file && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>
              🎚️ Compression Quality
            </h3>
            <div style={styles.qualityGrid}>
              {/* Screen - LOCKED for non-premium */}
              <button
                onClick={() => handleQualitySelect('screen')}
                style={styles.qualityButton(quality === 'screen', !isPremium)}
              >
                {!isPremium && (
                  <span style={styles.lockBadge}>🔒 PRO</span>
                )}
                <div style={styles.qualityLabel(quality === 'screen')}>📱 Screen</div>
                <div style={styles.qualityDesc(quality === 'screen')}>72 DPI • Smallest</div>
              </button>

              {/* eBook - Available to all */}
              <button
                onClick={() => handleQualitySelect('ebook')}
                style={styles.qualityButton(quality === 'ebook', false)}
              >
                <div style={styles.qualityLabel(quality === 'ebook')}>📖 eBook</div>
                <div style={styles.qualityDesc(quality === 'ebook')}>150 DPI • Balanced</div>
              </button>

              {/* Printer - Available to all */}
              <button
                onClick={() => handleQualitySelect('printer')}
                style={styles.qualityButton(quality === 'printer', false)}
              >
                <div style={styles.qualityLabel(quality === 'printer')}>🖨️ Printer</div>
                <div style={styles.qualityDesc(quality === 'printer')}>300 DPI • High</div>
              </button>

              {/* Prepress - Available to all */}
              <button
                onClick={() => handleQualitySelect('prepress')}
                style={styles.qualityButton(quality === 'prepress', false)}
              >
                <div style={styles.qualityLabel(quality === 'prepress')}>📄 Prepress</div>
                <div style={styles.qualityDesc(quality === 'prepress')}>300 DPI • Print-ready</div>
              </button>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        {!file && (
          <div style={styles.card}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
              style={styles.dropZone(isDragging)}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <p style={styles.dropZoneText}>
                Drag & drop your PDF here
              </p>
              <p style={styles.dropZoneHint}>
                or click to browse • {isPremium ? 'Unlimited file size' : 'Max 20MB for free users'}
              </p>
              <input
                type="file"
                onChange={handleFileInput}
                id="fileInput"
                accept='application/pdf'
                style={styles.fileInput}
              />
            </div>
          </div>
        )}

        {/* Processing / Results */}
        {file && (
          <div style={styles.card}>
            {isUploading && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill(progress)}></div>
                </div>
                <p style={styles.progressText}>
                  {progress < 50 ? '📤 Uploading...' : '⚙️ Compressing...'} {progress}%
                </p>
              </div>
            )}

            {isComplete && stats && (
              <div style={styles.successBox}>
                <div style={styles.successTitle}>✅ Compression Complete!</div>
                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <div style={styles.statValue}>{formatBytes(stats.originalSize)}</div>
                    <div style={styles.statLabel}>Original</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statValue}>{formatBytes(stats.compressedSize)}</div>
                    <div style={styles.statLabel}>Compressed</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statValue}>{stats.compressionRatio}%</div>
                    <div style={styles.statLabel}>Saved</div>
                  </div>
                </div>
                <button onClick={handleDownload} style={styles.downloadButton}>
                  ⬇️ Download Compressed PDF
                </button>
                <button onClick={handleReset} style={styles.resetButton}>
                  🔄 Compress Another
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default page