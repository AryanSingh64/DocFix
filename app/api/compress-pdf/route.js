// Save this file as: app/api/compress-pdf/route.js (App Router)

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import os from 'os';


import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers';

// Note: Body size limit configured in next.config.mjs (50MB)
// Our backend enforces 20MB limit for non-premium users

const execPromise = promisify(exec); // Convert exec to use async/await

// NEW: Get Ghostscript executable path
function getGhostscriptPath() {
  const isWindows = process.platform === 'win32';

  if (!isWindows) {
    return 'gs'; // Mac/Linux use gs from PATH
  }

  // Common Windows installation paths
  const possiblePaths = [
    'gswin64c', // Try PATH first
    'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe', // Your version!
    'C:\\Program Files\\gs\\gs10.05.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.02.0\\bin\\gswin64c.exe',
    'C:\\Program Files (x86)\\gs\\gs10.06.0\\bin\\gswin32c.exe',
    'C:\\Program Files (x86)\\gs\\gs10.05.0\\bin\\gswin32c.exe',
  ];

  return possiblePaths;
}

// NEW: Check if Ghostscript is installed
async function isGhostscriptAvailable() {
  const paths = Array.isArray(getGhostscriptPath()) ? getGhostscriptPath() : [getGhostscriptPath()];

  for (const gsPath of paths) {
    try {
      await execPromise(`"${gsPath}" --version`);
      console.log(`✓ Ghostscript found at: ${gsPath}`);
      return gsPath;
    } catch (error) {
      // Try next path
      continue;
    }
  }

  console.log('✗ Ghostscript not found in common locations');
  return null;
}








// For App Router (Next.js 13+)
export async function POST(request) {
  try {
    // Debug: Log the request
    console.log('Received POST request to /api/compress-pdf');
    console.log('Content-Type:', request.headers.get('content-type'));

    let formData;

    formData = await request.formData();

    console.log('FormData parsed successfully');

    const quality = formData.get('quality') || 'ebook';
    const fallbackUserId = formData.get('user_id'); // Get user_id from client

    console.log(quality);
    console.log('Fallback user ID from client:', fallbackUserId);


    const file = formData.get('pdf');

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Convert file to buffer FIRST (needed for size check)
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('Original PDF size:', buffer.length, 'bytes');

    // ========== FILE SIZE RESTRICTION (Backend Enforced) ==========
    // Constants for file size limits
    const FREE_FILE_SIZE_LIMIT = 20 * 1024 * 1024; // 20MB in bytes
    const fileSize = buffer.length;

    // Create Supabase client for session check (uses anon key with cookies)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Not setting cookies here
          }
        },
      }
    );

    // Get current session (may be null for anonymous users)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session check result:', session?.user?.id || 'No session');

    // Check if user is premium - use session OR fallback user ID
    let isPremium = false;
    const userIdToCheck = session?.user?.id || fallbackUserId;

    if (userIdToCheck) {
      console.log('Checking subscription for user:', userIdToCheck);

      // Use service role key to bypass RLS for subscription check
      // Import createClient dynamically to avoid issues
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key bypasses RLS
      );

      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', userIdToCheck)
        .maybeSingle();

      console.log('Subscription result:', JSON.stringify(subscription, null, 2));

      if (subError) {
        console.error('Subscription check error:', subError);
      } else if (subscription) {
        isPremium = subscription.plan_type === 'pro';
        console.log('Premium status:', { plan_type: subscription.plan_type, isPremium });
      } else {
        console.log('No subscription record found for user');
      }
    } else {
      console.log('Anonymous user - no user ID available, applying free tier limits');
    }

    // Enforce 20MB limit for non-premium users
    if (!isPremium && fileSize > FREE_FILE_SIZE_LIMIT) {
      console.log(`File too large: ${fileSize} bytes (limit: ${FREE_FILE_SIZE_LIMIT})`);
      return NextResponse.json({
        error: 'File too large',
        details: 'Free users can only upload files up to 20MB',
        hint: 'Upgrade to Premium for unlimited file sizes',
        currentSize: fileSize,
        maxSize: FREE_FILE_SIZE_LIMIT
      }, { status: 413 });
    }
    // ========== END FILE SIZE RESTRICTION ==========

    // ========== SCREEN QUALITY RESTRICTION (Premium Only) ==========
    if (!isPremium && quality === 'screen') {
      console.log('Non-premium user attempted to use screen quality');
      return NextResponse.json({
        error: 'Premium feature',
        details: 'Screen quality (72 DPI) is a premium-only feature',
        hint: 'Upgrade to Premium to access the smallest file compression',
      }, { status: 403 });
    }
    // ========== END SCREEN QUALITY RESTRICTION ==========

    // Check if Ghostscript is available
    const gsPath = await isGhostscriptAvailable();

    if (gsPath) {
      // Use Ghostscript for compression
      console.log('Using Ghostscript for compression...');
      return await compressWithGhostscript(buffer, file.name, gsPath, quality, request, fallbackUserId);
    } else {
      // If Ghostscript not available, return helpful error
      console.log('Ghostscript not available');
      return NextResponse.json(
        {
          error: 'Ghostscript not installed',
          details: 'Please install Ghostscript to compress PDFs',
          hint: 'Download from: https://www.ghostscript.com/download/gsdnld.html'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('PDF compression error:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to compress PDF',
        details: error.message,
        hint: 'Install Ghostscript from: https://www.ghostscript.com/download/gsdnld.html'
      },
      { status: 500 }
    );
  }
}

// Compress using Ghostscript
async function compressWithGhostscript(buffer, fileName, gsPath, quality, request, fallbackUserId) {
  let inputPath = null;
  let outputPath = null;

  try {


    console.log('=== COMPRESSION DETAILS ===');
    console.log('Quality received in function:', quality);
    console.log('===========================');

    // Using os.tmpdir() instead of /tmp folder for all OS
    const tempDir = os.tmpdir();
    console.log('Using temp directory:', tempDir);

    // Create unique temp file paths
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);

    inputPath = path.join(tempDir, `input-${timestamp}-${randomId}.pdf`);
    outputPath = path.join(tempDir, `output-${timestamp}-${randomId}.pdf`);

    // Save buffer to disk
    await writeFile(inputPath, buffer);

    // Use the Ghostscript path we found
    const command = `"${gsPath}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${quality} -dNOPAUSE -dQUIET -dBATCH -dDownsampleColorImages=true -dColorImageResolution=150 -dColorImageDownsampleType=/Bicubic -sOutputFile="${outputPath}" "${inputPath}"`;

    // Quality settings explained:
    // /screen = 72 DPI (smallest, web viewing)
    // /ebook = 150 DPI (good balance) ← RECOMMENDED
    // /printer = 300 DPI (high quality)
    // /prepress = 300 DPI (print-ready)

    console.log('Running Ghostscript compression...');


    console.log('Full command:', command);
    console.log('Quality setting being used:', quality);


    // Execute Ghostscript command
    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stderr.includes('*** WARNING ***')) {
      console.error('Ghostscript stderr:', stderr);
    }

    // Read the compressed PDF
    const compressedBuffer = await readFile(outputPath);

    console.log('Compressed PDF size:', compressedBuffer.length, 'bytes');

    // Calculate compression statistics
    const originalSize = buffer.length;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

    console.log(`Compression ratio: ${compressionRatio}% reduction`);

    // Cleanup temp files
    await unlink(inputPath);
    await unlink(outputPath);

    // Return the compressed PDF with stats in headers

    // NEW: Save usage to Supabase
    let dbSaveSuccess = false;
    let dbErrorMessage = '';
    let actualUserId = null;

    try {
      console.log('=== DEBUGGING COOKIES ===');
      console.log('All request cookies:', request.cookies.getAll());

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              // We're not setting cookies here
            }
          },
        }
      );

      // Get current user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('Session data:', session);
      console.log('Session error:', sessionError);

      // Use session user if available, otherwise use fallback
      if (session?.user) {
        actualUserId = session.user.id;
        console.log('Using user ID from session:', actualUserId);
      } else if (fallbackUserId) {
        actualUserId = fallbackUserId;
        console.log('Using fallback user ID from client:', actualUserId);
      }

      if (actualUserId) {
        console.log('Saving usage for user:', actualUserId);

        const { error: dbError } = await supabase
          .from('compression_usage')
          .insert({
            user_id: actualUserId,
            file_name: fileName,
            original_size: originalSize,
            compressed_size: compressedSize,
            quality: quality,
            compressed_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('Error saving usage to DB:', dbError);
          dbErrorMessage = dbError.message;
        } else {
          console.log('Usage saved successfully');
          dbSaveSuccess = true;
        }
      } else {
        console.warn('No user session and no fallback user ID found, skipping usage tracking');
        dbErrorMessage = 'No user session found';
      }
    } catch (dbErr) {
      console.error('Unexpected error saving usage:', dbErr);
      dbErrorMessage = dbErr.message;
    }

    return new NextResponse(compressedBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compressed-${fileName}"`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Compression-Ratio': compressionRatio,
        'X-Compression-Method': 'ghostscript',
        'X-DB-Save-Success': dbSaveSuccess.toString(),
        'X-DB-Error': dbErrorMessage || 'None'
      },
    });
  } catch (error) {
    console.error('Ghostscript compression error:', error);

    // Cleanup temp files if they exist
    try {
      if (inputPath) await unlink(inputPath);
      if (outputPath) await unlink(outputPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    throw error;
  }
}