"use client"
import React from 'react'
import { useState } from 'react';
import DropZone from '@/components/DropZone';



const page = () => {
    const [files, setFiles] = useState([]);
    const [pdfCount, setPdfCount] = useState(2);
    const [loading, setLoading] = useState(false);
    const [mergePdf, setMergePdf] = useState(null);



    const handleFileChange = (index, file) => {
        const newFiles = [...files]; //copy
        newFiles[index] = file;
        setFiles(newFiles);
    }

    const handleMerge = async () => {
        if(files.filter(Boolean).length !== pdfCount){
            alert("Please select all the files")
            return;
        }

        setLoading(true);
        setMergePdf(null);

        const formData = new FormData(); // container
        files.forEach(file=>formData.append("pdfs",file));

        const response = await fetch("/api/merge-pdf",{
            method: "POST",
            body: formData,
        })

        const blob = await response.blob();
        setMergePdf(url);
        setLoading(false);
    }

    const handleReset = () => {
        setFiles([]);
        setPdfCount(2);
        setLoading(false);
        setMergePdf(null);
    }

    const handleDownload = () => {
        if(!mergePdf){
            alert("Please merge the PDFs first")
            return;
        }

        const url = URL.createObjectURL(mergePdf);
        const link = document.createElement("a");
        link.href = url;
        link.download = "merged.pdf";
        link.click();
        URL.revokeObjectURL(url);
    }
    return (
        <div>
            <div>
                <button onClick={() => setPdfCount(pdfCount + 1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
                    Add PDF
                </button>
                <button
                    onClick={() => setPdfCount(pdfCount - 1)}
                    disabled={pdfCount <= 2}
                    className={`px-4 py-2 bg-white/10 rounded-lg transition ${pdfCount <= 2 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}`}
                >
                    Remove PDF
                </button>
            </div>



            <div>
                {Array.from({ length: pdfCount }, (_, index) => (
                    <div key={index}>
                        <input type="file" accept=".pdf" onChange={(e) => handleFileChange(index, e.target.files[0])} />
                        {files[index] && <p>{files[index].name}</p>}

                    </div>
                ))}
            </div>
        </div>
    )
}

export default page