import { NextResponse } from 'next/server';
import {}
export async function POST(request) {
  try {
    // Dynamic import to avoid issues
    const pdf = (await import('pdf-parse-fork')).default;
    
    const formData = await request.formData();
    const file = formData.get('pdf');

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    const data = await pdf(buffer);

    console.log(data);
    return NextResponse.json({
      text: data.text,
      pages: data.numpages,
      info: data.info
    });

  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from PDF: ' + error.message },
      { status: 500 }
    );
  }
}