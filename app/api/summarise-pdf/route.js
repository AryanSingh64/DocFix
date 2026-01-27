import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
        const text = data.text;

        // --- Gemini Summarization ---
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
        You are an expert document summarizer. 
        Please provide a concise and structured summary of the following text.
        Highlight the key points and main takeaways.
        
        Text to summarize:
        ${text}
        `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const summary = response.text();
             console.log(summary);
             console.log(result);
             
             
            return NextResponse.json({
                text: text,
                summary: summary,
                pages: data.numpages,
                info: data.info
            });
        } else {
            console.warn("GEMINI_API_KEY not found in environment variables.");
            return NextResponse.json({
                text: text,
                summary: "API Key missing. Please set GEMINI_API_KEY in .env.local to generate summaries.",
                pages: data.numpages,
                info: data.info
            });
        }

    } catch (error) {
        console.error('PDF extraction error:', error);
        return NextResponse.json(
            { error: 'Failed to extract text from PDF: ' + error.message },
            { status: 500 }
        );
    }
}