"use client"
import React, { useState } from 'react';

const DropZone = ({ onFileSelect, acceptedType = 'application/pdf', maxSizeText = 'Max 20MB' }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === acceptedType) {
      onFileSelect(droppedFile);
    }
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === acceptedType) {
      onFileSelect(selectedFile);
    }
  };

  return (
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
          or click to browse • {maxSizeText}
        </p>
        <input
          type="file"
          onChange={handleFileInput}
          id="fileInput"
          accept={acceptedType}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default DropZone;