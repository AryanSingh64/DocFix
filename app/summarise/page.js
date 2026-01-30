"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import DropZone from '@/components/DropZone';

const page = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [copied, setCopied] = useState(false);

  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState('balanced');
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
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




  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }


  // Process the file
  const processFile = async (selectedFile) => {
    const FREE_FILE_SIZE_LIMIT = 20 * 1024 * 1024; // 20MB

    if (!isPremium && selectedFile.size > FREE_FILE_SIZE_LIMIT) {
      setError({
        type: 'file_too_large',
        message: `File size: ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB. Limit: 20MB`,
        hint: 'Upgrade to Premium for unlimited file sizes'
      });
      return; // Don't try to upload
    }

    setFile(selectedFile);
    setIsUploading(true);
    setProgress(0);
    setIsComplete(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('tone', tone); //sending to backend

      if (user?.id) {
        formData.append('user_id', user.id);
      }

      setProgress(10);
      console.log('Sending PDF to backend...');


      setLoading(true);
      setError(null);


      const response = await fetch('/api/summarise-pdf', {
        method: 'POST',
        body: formData, //pdf data
      });

      setProgress(50);

      const data = await response.json();

      if (!response.ok) {
        console.log('Backend error:', response.status, data);

        setFile(null);
        setIsUploading(false);
        setProgress(0);
        setLoading(false);


        // Handle different error codes
        if (response.status === 413) {
          setError({
            type: 'file_too_large',
            message: data.error || 'File exceeds 20MB limit',
            hint: data.hint
          });
        } else {
          setError({
            type: 'generic',
            message: data.error || 'Failed to generate summary'
          });
        }
        return;
      }

      setProgress(80);

      setSummary(data.summary);
      setLoading(false);

      setProgress(100);
      setIsUploading(false);
      setIsComplete(true);

    } catch (err) {
      console.error('Summary error:', err);
      // Reset file state so UI shows quality selector and drop zone again
      setFile(null);
      setError({ type: 'generic', message: err.message || 'Failed to generate summary. Please try again.' });
      setIsUploading(false);
      setProgress(0);
    }
  };

  // Reset everything
  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setIsUploading(false);
    setIsComplete(false);
    setError(null);
    setSummary(null);
  };


  const colorMap = {
    professional: "bg-red-500 text-white",
    balanced: "bg-green-500 text-white",
    casual: "bg-blue-500 text-white"
  };


  return (
    <div className="bg-[#0F0F0F] min-h-screen text-white flex flex-col">
      <Navbar />

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center">

        {/* Tone Selector */}
        <div className="flex gap-3 justify-center">
          {['professional', 'balanced', 'casual'].map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-4 py-2 rounded-lg capitalize       transition-all 
              ${tone === t
                  ? colorMap[t]
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
            >
              {t === 'professional' ? 'Professional' :
                t === 'balanced' ? 'Balanced' : 'Casual'}
            </button>
          ))}
        </div>






        {summary && (
          <div className="bg-white/10 p-6 rounded-xl mt-6">
            <h3 className="text-xl font-bold mb-4">Summary</h3>
            <div className="prose prose-invert">
              <p className="whitespace-pre-wrap">{summary}</p>
            </div>




            <div className="flex gap-3 mt-4 justify-center ">
              <button onClick={handleCopy} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>

              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
              >
                Summarize Another
              </button>
            </div>
          </div>
        )}
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
                    : 'Summary Failed'}
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


          {/* Drop Zone */}
          {!file && (
            <DropZone
              onFileSelect={processFile}
              maxSizeText={isPremium ? 'Unlimited file size' : 'Max 20MB for free users'}

            />
          )}

          {/* Loader */}
          {(loading || isUploading) && (
            <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10 text-center">
              <div className="flex flex-col items-center gap-4">

                {/* Progress bar */}
                <div className="w-full h-2 bg-white/10 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <p className="text-white/70">
                  {progress < 50 ? 'Uploading...' : '✨ Generating summary...'} {progress}%
                </p>
              </div>
            </div>
          )}



        </div>
      </div>
    </div>
  );
}

export default page