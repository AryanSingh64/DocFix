// Save this file as: app/api/compress-pdf/route.js (App Router)

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import os from 'os';


import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';


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
    
    // Check if the body has already been consumed
    // if (request.bodyUsed) {
    //   console.error('Request body already consumed!');
    //   return NextResponse.json(
    //     { error: 'Request body already consumed' },
    //     { status: 400 }
    //   );
    // }
    
    // Get the uploaded file from FormData
    let formData;

    formData = await request.formData();

      console.log('FormData parsed successfully');
    
    const quality = formData.get('quality') || 'ebook';

    console.log(quality);
    
    
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

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('Original PDF size:', buffer.length, 'bytes');

    // Check if Ghostscript is available
    const gsPath = await isGhostscriptAvailable();
    
    if (gsPath) {
      // Use Ghostscript for compression
      console.log('Using Ghostscript for compression...');
      return await compressWithGhostscript(buffer, file.name, gsPath, quality);
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
async function compressWithGhostscript(buffer, fileName, gsPath, quality) {
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
    return new NextResponse(compressedBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compressed-${fileName}"`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Compression-Ratio': compressionRatio,
        'X-Compression-Method': 'ghostscript',
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