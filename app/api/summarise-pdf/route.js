import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {createClient} from "@supabase/supabase-js";

export async function POST(request) {
    try {
        // Dynamic import to avoid issues
        const pdf = (await import('pdf-parse-fork')).default;

        const formData = await request.formData();
        const file = formData.get('pdf');
        const tone = formData.get('tone');

        const userId = formData.get('user_id');
        const fileName = formData.get('file_name');

        

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
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        //lets get that tone
        
        console.log(tone);
        const toneInstruction = {
              professional: "Use a formal, professional tone. Be precise, structured, and use business language. Focus on facts and key metrics.",
              balanced: "Use a balanced, clear tone. Be informative yet approachable. Include key points without being too formal or too casual.",
              casual: "Use a friendly, conversational tone. Explain things simply as if talking to a friend. Make it easy to understand."
        };
            const prompt = `
         You are an expert document summarizer.
         ${toneInstruction[tone]}
        
        Summarize the following document:
        ${text}
        `;

        console.log(toneInstruction[tone]);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const summary = response.text();
             console.log(summary);
             console.log(result);
             

            if(userId){
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                );

            const {error} = await supabase.from('summaries').insert({
                user_id: userId,
                file_name: file.name,        // Use file.name, not formData
                summary_text: summary,       // Save the actual summary
                tone: tone
            });

            if(error){
                console.error('Error saving summary:', error);
            } else {
                console.log('Summary saved successfully');
            }
        }
             
             
            return NextResponse.json({
                text: text,
                summary: summary,
                pages: data.numpages,
                info: data.info
            });


            //save if user logged in okayyy
            


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