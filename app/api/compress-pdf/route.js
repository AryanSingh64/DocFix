import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, stat } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import os from 'os';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

const execPromise = promisify(exec);

// ─── Ghostscript path resolution ────────────────────────────────────────────

function getGhostscriptPath() {
  if (process.platform !== 'win32') {
    return ['gs']; // Mac/Linux: gs is on PATH
  }
  // Windows: try PATH alias first, then common install locations
  return [
    'gswin64c',
    'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.05.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.02.0\\bin\\gswin64c.exe',
    'C:\\Program Files (x86)\\gs\\gs10.06.0\\bin\\gswin32c.exe',
    'C:\\Program Files (x86)\\gs\\gs10.05.0\\bin\\gswin32c.exe',
  ];
}

async function findGhostscript() {
  for (const gsPath of getGhostscriptPath()) {
    try {
      await execPromise(`"${gsPath}" --version`, { timeout: 5000 });
      console.log(`✓ Ghostscript found: ${gsPath}`);
      return gsPath;
    } catch {
      // try next
    }
  }
  console.warn('✗ Ghostscript not found');
  return null;
}

// ─── Valid quality values (whitelist — prevents command injection) ────────────

const VALID_QUALITIES = new Set(['screen', 'ebook', 'printer', 'prepress']);

// ─── Main POST handler ───────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const formData = await request.formData();

    const rawQuality = formData.get('quality') || 'ebook';
    const quality = VALID_QUALITIES.has(rawQuality) ? rawQuality : 'ebook';
    const fallbackUserId = formData.get('user_id') || null;

    const file = formData.get('pdf');
    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileSize = buffer.length;
    console.log(`Original PDF: "${file.name}" — ${fileSize} bytes, quality: ${quality}`);

    // ── Auth / subscription check ─────────────────────────────────────────
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => { },
        },
      }
    );

    const { data: { session } } = await supabaseUser.auth.getSession();
    const userIdToCheck = session?.user?.id || fallbackUserId;

    let isPremium = false;
    if (userIdToCheck) {
      const { createClient } = await import('@supabase/supabase-js');
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: sub } = await admin
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', userIdToCheck)
        .maybeSingle();
      isPremium = sub?.plan_type === 'pro';
    }

    // ── File size gate ────────────────────────────────────────────────────
    const FREE_LIMIT = 20 * 1024 * 1024; // 20 MB
    if (!isPremium && fileSize > FREE_LIMIT) {
      return NextResponse.json({
        error: 'File too large',
        details: 'Free users can only upload files up to 20MB',
        hint: 'Upgrade to Premium for unlimited file sizes',
        currentSize: fileSize,
        maxSize: FREE_LIMIT,
      }, { status: 413 });
    }

    // ── Screen quality gate ───────────────────────────────────────────────
    if (!isPremium && quality === 'screen') {
      return NextResponse.json({
        error: 'Premium feature',
        details: 'Screen quality (72 DPI) is a premium-only feature',
        hint: 'Upgrade to Premium to access the smallest file compression',
      }, { status: 403 });
    }

    // ── Run compression ───────────────────────────────────────────────────
    const gsPath = await findGhostscript();
    if (!gsPath) {
      return NextResponse.json({
        error: 'Ghostscript not installed',
        details: 'The server is missing Ghostscript — contact support.',
      }, { status: 500 });
    }

    return await compressWithGhostscript({
      buffer,
      fileName: file.name,
      gsPath,
      quality,
      request,
      fallbackUserId,
      isPremium,
    });

  } catch (err) {
    console.error('Compress-PDF handler error:', err);
    return NextResponse.json({
      error: 'Failed to compress PDF',
      details: err.message,
    }, { status: 500 });
  }
}

// ─── Ghostscript compression ─────────────────────────────────────────────────

async function compressWithGhostscript({ buffer, fileName, gsPath, quality, request, fallbackUserId }) {
  const tempDir = os.tmpdir();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inputPath = path.join(tempDir, `docfix-in-${id}.pdf`);
  const outputPath = path.join(tempDir, `docfix-out-${id}.pdf`);

  try {
    await writeFile(inputPath, buffer);

    // Build the GS command
    // All flags are validated — quality is whitelisted above
    const cmd = [
      `"${gsPath}"`,
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=/${quality}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      // Image downsampling
      '-dDownsampleColorImages=true',
      '-dDownsampleGrayImages=true',
      '-dDownsampleMonoImages=true',
      '-dColorImageDownsampleType=/Bicubic',
      '-dGrayImageDownsampleType=/Bicubic',
      // Remove metadata bloat
      '-dCompressFonts=true',
      '-dEmbedAllFonts=true',
      `-sOutputFile="${outputPath}"`,
      `"${inputPath}"`,
    ].join(' ');

    console.log('Running GS command…');

    // Timeout: 2 min for large files
    const { stderr } = await execPromise(cmd, { timeout: 120_000 });

    // Ghostscript routinely prints startup banners & warnings to stderr.
    // Only log if it looks like a real error.
    if (stderr) {
      const lines = stderr.split('\n').filter(l =>
        l.trim() &&
        !l.startsWith('GPL Ghostscript') &&
        !l.includes('***') &&
        !l.includes('Loading') &&
        !l.toLowerCase().includes('warning')
      );
      if (lines.length) console.warn('GS stderr:', lines.join('\n'));
    }

    // Verify output file actually exists and is readable
    await stat(outputPath); // throws if missing
    const compressedBuffer = await readFile(outputPath);

    const originalSize = buffer.length;
    const compressedSize = compressedBuffer.length;

    // ── Guard: if GS made the file BIGGER, return the original ──────────
    // This happens on already-optimised PDFs (scans, image-heavy files).
    let finalBuffer = compressedBuffer;
    let finalSize = compressedSize;
    let usedOriginal = false;

    if (compressedSize >= originalSize) {
      console.warn(
        `GS output (${compressedSize}B) ≥ original (${originalSize}B) — returning original file instead`
      );
      finalBuffer = buffer;
      finalSize = originalSize;
      usedOriginal = true;
    }

    // compressionRatio: positive = saved space, negative = got bigger (clamped to 0 when returning original)
    const rawRatio = ((1 - compressedSize / originalSize) * 100);
    const compressionRatio = usedOriginal ? 0 : Math.max(0, rawRatio);
    const savedBytes = usedOriginal ? 0 : Math.max(0, originalSize - compressedSize);

    console.log(
      `Done. ${originalSize}B → ${finalSize}B ` +
      `(${compressionRatio.toFixed(1)}% saved)` +
      (usedOriginal ? ' [returned original — already optimal]' : '')
    );

    // ── Track usage in Supabase ──────────────────────────────────────────
    await trackUsage({ request, fallbackUserId, fileName, originalSize, compressedSize: finalSize, quality });

    // ── Clean up temp files ──────────────────────────────────────────────
    await cleanup(inputPath, outputPath);

    // ── Return stats in BOTH headers AND a JSON wrapper ─────────────────
    // Reason: browsers/proxies sometimes strip custom X-* headers.
    // The frontend should prefer the JSON body stats over the headers.
    const safeFileName = fileName.replace(/[^\w\s.-]/g, '_');

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compressed-${safeFileName}"`,
        // Stats in headers (may be stripped by some proxies/CDNs)
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': finalSize.toString(),
        'X-Compression-Ratio': compressionRatio.toFixed(2),
        'X-Saved-Bytes': savedBytes.toString(),
        'X-Used-Original': usedOriginal.toString(),
        'X-Compression-Method': 'ghostscript',
        // Expose to browser JS (required by CORS spec for custom headers)
        'Access-Control-Expose-Headers': [
          'X-Original-Size',
          'X-Compressed-Size',
          'X-Compression-Ratio',
          'X-Saved-Bytes',
          'X-Used-Original',
          'X-Compression-Method',
        ].join(', '),
      },
    });

  } catch (err) {
    await cleanup(inputPath, outputPath);
    console.error('GS compression failed:', err);

    // Surface a friendly message for timeout
    if (err.killed || err.signal === 'SIGTERM' || err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      return NextResponse.json({
        error: 'Compression timed out',
        details: 'The PDF is too large or complex to compress in time. Try a smaller file.',
      }, { status: 504 });
    }

    throw err; // re-throw — caught by outer handler
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function cleanup(...paths) {
  for (const p of paths) {
    try { await unlink(p); } catch { /* ignore */ }
  }
}

async function trackUsage({ request, fallbackUserId, fileName, originalSize, compressedSize, quality }) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => { },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || fallbackUserId;

    if (!userId) {
      console.log('No user ID — skipping usage tracking');
      return;
    }

    const { error } = await supabase.from('compression_usage').insert({
      user_id: userId,
      file_name: fileName,
      original_size: originalSize,
      compressed_size: compressedSize,
      quality,
      compressed_at: new Date().toISOString(),
    });

    if (error) console.error('Usage tracking error:', error.message);
    else console.log('Usage tracked for user:', userId);

  } catch (err) {
    console.error('Usage tracking threw:', err.message);
    // Non-fatal — never block the response
  }
}