import { NextResponse } from 'next/server';

export async function POST(request) {
    console.log("TERMINAL: Connection received at /api/summarise-pdf");

    try {
        const formData = await request.formData();
        const file = formData.get('pdf');

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        console.log(`TERMINAL: File received: ${file.name}, Size: ${file.size}`);

        // 1. Buffer Conversion
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);


        //import 
        const fs = require('fs');
        const path = require('path');
        const pdf = require('pdf-parse');

        const extractTextFromPDF = async (buffer) => {
            try {
                const data = await pdf(buffer);
                return data.text;
            } catch (error) {
                console.error("PDF Parse Error:", error);
                throw new Error("Failed to parse PDF text. File might be an image/scan.");
            }
        };
        // // 2. Extract Text (Clean & Easy now!)
        // const text = await extractTextFromPDF(buffer);

        // console.log(`✅ Extracted Text: ${text.substring(0, 100)}...`);

        // 3. Return Success
        return NextResponse.json({
            message: "PDF Processed",
            textPreview: text.substring(0, 500) // First 500 chars 
        });

    } catch (error) {
        console.error("TERMINAL: Error processing request:", error);
        return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
    }
}