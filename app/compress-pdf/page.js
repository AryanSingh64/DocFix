"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

const page = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [compressedFile, setCompressedFile] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [quality, setQuality] = useState('ebook');
  const [isPremium, setIsPremium] = useState(false);
  const [loadingPremium, setLoadingPremium] = useState(true);

  //Fetch premium status on mount
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setLoadingPremium(false);
        return;
      }

      try {
        //check premium status from subscriptions table
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

  // Helper function to format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Quality button styles helper
  const getQualityButtonClass = (isSelected, isLocked) => {
    const base = "p-4 rounded-xl cursor-pointer transition-all duration-300 text-center relative";
    if (isSelected) {
      return `${base} bg-gradient-to-br from-violet-600 to-cyan-400 border-none`;
    }
    if (isLocked) {
      return `${base} bg-white/[0.03] border border-dashed border-white/20 opacity-70`;
    }
    return `${base} bg-white/[0.08] border border-white/15`;
  };

  return (
    <div className="bg-[#0F0F0F] min-h-screen text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">

        {/* Error Display */}
        {error && (
          <div className="bg-gradient-to-br from-red-500/20 to-red-500/10 border border-red-500/50 rounded-xl p-5 mb-6">
            <button
              onClick={() => setError(null)}
              className="bg-transparent border-none text-white/50 cursor-pointer text-lg float-right"
            >
              ✕
            </button>
            <div className="text-red-500 text-base font-semibold mb-2 flex items-center gap-2">
              ⚠️ {error.type === 'file_too_large'
                ? 'File Too Large'
                : error.type === 'premium_feature'
                  ? 'Premium Feature'
                  : 'Compression Failed'}
            </div>
            <div className="text-white/80 text-sm mb-4">
              {error.type === 'file_too_large'
                ? 'Free users can only upload files up to 20MB. Upgrade to Premium for unlimited file sizes!'
                : error.type === 'premium_feature'
                  ? 'This feature is only available for Premium users. Upgrade to unlock all compression options!'
                  : error.message
              }
            </div>
            {(error.type === 'file_too_large' || error.type === 'premium_feature') && (
              <button
                onClick={() => router.push('/upgrade')}
                className="py-3 px-6 bg-gradient-to-br from-amber-500 to-red-500 text-white border-none rounded-lg cursor-pointer text-sm font-semibold inline-flex items-center gap-2"
              >
                ⭐ Upgrade to Premium
              </button>
            )}
          </div>
        )}

        {/* Quality Selector */}
        {!file && (
          <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2.5">
              🎚️ Compression Quality
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
              {/* Screen - LOCKED for non-premium */}
              <button
                onClick={() => handleQualitySelect('screen')}
                className={getQualityButtonClass(quality === 'screen', !isPremium)}
              >
                {!isPremium && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-500 to-red-500 text-white text-[10px] font-bold py-1 px-2 rounded-xl flex items-center gap-1">
                    🔒 PRO
                  </span>
                )}
                <div className={`text-sm font-semibold mb-1 ${quality === 'screen' ? 'text-white' : 'text-gray-200'}`}>
                  📱 Screen
                </div>
                <div className={`text-xs ${quality === 'screen' ? 'text-white/80' : 'text-white/50'}`}>
                  72 DPI • Smallest
                </div>
              </button>

              {/* eBook - Available to all */}
              <button
                onClick={() => handleQualitySelect('ebook')}
                className={getQualityButtonClass(quality === 'ebook', false)}
              >
                <div className={`text-sm font-semibold mb-1 ${quality === 'ebook' ? 'text-white' : 'text-gray-200'}`}>
                  📖 eBook
                </div>
                <div className={`text-xs ${quality === 'ebook' ? 'text-white/80' : 'text-white/50'}`}>
                  150 DPI • Balanced
                </div>
              </button>

              {/* Printer - Available to all */}
              <button
                onClick={() => handleQualitySelect('printer')}
                className={getQualityButtonClass(quality === 'printer', false)}
              >
                <div className={`text-sm font-semibold mb-1 ${quality === 'printer' ? 'text-white' : 'text-gray-200'}`}>
                  🖨️ Printer
                </div>
                <div className={`text-xs ${quality === 'printer' ? 'text-white/80' : 'text-white/50'}`}>
                  300 DPI • High
                </div>
              </button>

              {/* Prepress - Available to all */}
              <button
                onClick={() => handleQualitySelect('prepress')}
                className={getQualityButtonClass(quality === 'prepress', false)}
              >
                <div className={`text-sm font-semibold mb-1 ${quality === 'prepress' ? 'text-white' : 'text-gray-200'}`}>
                  📄 Prepress
                </div>
                <div className={`text-xs ${quality === 'prepress' ? 'text-white/80' : 'text-white/50'}`}>
                  300 DPI • Print-ready
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        {!file && (
          <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10 backdrop-blur-xl">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
              className={`rounded-2xl py-16 px-10 text-center cursor-pointer transition-all duration-300
                ${isDragging
                  ? 'border-2 border-solid border-cyan-400 bg-cyan-400/10'
                  : 'border-2 border-dashed border-white/30 bg-white/[0.02]'
                }`}
            >
              <div className="text-5xl mb-4">📄</div>
              <p className="text-lg text-white/70 mb-4">
                Drag & drop your PDF here
              </p>
              <p className="text-sm text-white/40">
                or click to browse • {isPremium ? 'Unlimited file size' : 'Max 20MB for free users'}
              </p>
              <input
                type="file"
                onChange={handleFileInput}
                id="fileInput"
                accept='application/pdf'
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Processing / Results */}
        {file && (
          <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10 backdrop-blur-xl">
            {isUploading && (
              <div className="mt-5">
                <div className="h-2 bg-white/10 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-600 rounded transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-white/70 text-sm mt-2 text-center">
                  {progress < 50 ? '📤 Uploading...' : '⚙️ Compressing...'} {progress}%
                </p>
              </div>
            )}

            {isComplete && stats && (
              <div className="bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/50 rounded-xl p-6 text-center">
                <div className="text-green-500 text-xl font-semibold mb-4">
                  ✅ Compression Complete!
                </div>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="text-center">
                    <div className="text-white text-lg font-semibold">
                      {formatBytes(stats.originalSize)}
                    </div>
                    <div className="text-white/50 text-xs mt-1">Original</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white text-lg font-semibold">
                      {formatBytes(stats.compressedSize)}
                    </div>
                    <div className="text-white/50 text-xs mt-1">Compressed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white text-lg font-semibold">
                      {stats.compressionRatio}%
                    </div>
                    <div className="text-white/50 text-xs mt-1">Saved</div>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="py-3.5 px-8 bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-lg cursor-pointer text-base font-semibold mr-3"
                >
                  ⬇️ Download Compressed PDF
                </button>
                <button
                  onClick={handleReset}
                  className="py-3.5 px-8 bg-white/10 text-white border border-white/20 rounded-lg cursor-pointer text-base"
                >
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