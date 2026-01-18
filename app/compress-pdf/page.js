"use client"
import React, {use, useState} from 'react'
import { useRouter } from 'next/navigation';


const page = () => {
  const router = useRouter();

  //State to store the uploaded file
  const [file, setFile] = useState(null);
  
  // State to track if user is dragging over the drop zone
  const [isDragging, setIsDragging] = useState(false);
  
  // State to track upload/compression progress (0-100)
  const [progress, setProgress] = useState(0);
  
  // State to check if upload is in progress
  const [isUploading, setIsUploading] = useState(false);
  
  // State to check if upload is complete
  const [isComplete, setIsComplete] = useState(false);


//  State to store the compressed PDF blob
  const [compressedFile, setCompressedFile] = useState(null);

//   State to store compression statistics
  const [stats, setStats] = useState(null);

//   State for errors
  const [error, setError] = useState(null);

  const [quality, setQuality] = useState('ebook')

  // Prevent default behavior when dragging over
  //it tell browser that let react handle this 
  // it runs continiously while draggin over drop zone
  const handleDragOver = (e) => {
    e.preventDefault(); // Important: allows drop to happen
    setIsDragging(true);
  };

  // Reset dragging state when drag leaves
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault(); // Prevent browser from opening the file
    setIsDragging(false);
    
    // Get the first dropped file
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if(droppedFile.type == 'application/pdf'){
        processFile(droppedFile);
      }else{
        setError('Please upload a PDF file only');
      }
    }
  };

  // Handle file selection via input
  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
       if (selectedFile.type === 'application/pdf') {
        processFile(selectedFile);
      } else {
        setError('Please upload a PDF file only');
      }
    }
  };

  // Process the file (simulate compression with progress)
  const processFile = async (selectedFile) => {
    setFile(selectedFile);//storing the file
    setIsUploading(true);//show processing ui
    setProgress(0);//reset the progress
    setIsComplete(false);//not done

    setError(null)
    setCompressedFile(null)
    setStats(null)


    try{
        //create formdata and add pdf file
        const formData = new FormData();
        formData.append('pdf',selectedFile);


        formData.append('quality', quality);
        //show initial progress {(file is being uploaded)}
        setProgress(10);

        //call backend api
        console.log(quality);
        
        console.log('Sending PDF to backend...');
        const response = await fetch('/api/compress-pdf',{
            method: 'POST',
            body: formData,
        });

        //update progress, upload complete processing the file
        setProgress(50);

        //chk if response is a sucess
        if(!response.ok){
            //if error
            const errorData = await response.json();
            throw new Error(errorData.error || 'Compression failed');
        }
        //get the compression states from response headers
        const originalSize = parseInt(response.headers.get('X-Original-Size'));
        const compressedSize = parseInt(response.headers.get('X-Compressed-Size'));
        const compressionRatio = response.headers.get('X-Compression-Ratio');
        

        console.log('Compression stats:',{originalSize, compressedSize, compressionRatio});

        //almost done
        setProgress(80);

        //get compressed pdf as a binary data(blob)
        const blob = await response.blob();
        setCompressedFile(blob);

        //store stats
        setStats({
            originalSize,
            compressedSize,
            compressionRatio,
            savedBytes: originalSize - compressedSize
        });

        //complete
        setProgress(100);
        setIsUploading(false);
        setIsComplete(true);

        console.log('compression complete!!!');

    }catch(err){
        //show err
        console.error('Compression err:',err);
        setError(err.message || 'Failed to compress PDF');
        setIsUploading(false);
        setProgress(0);
    }
    };


    // DUMMY PROGRESS BAR - simulates compression
//     let currentProgress = 0;
//     const interval = setInterval(() => {
//       currentProgress += 10; // Increment by 10%
//       setProgress(currentProgress);
      
//       if (currentProgress >= 100) {//when it hit 100 %
//         clearInterval(interval);//stop timer
//         setIsUploading(false);//hide uploading ui
//         setIsComplete(true);//tell its completed show completed ui
//       }
//     }, 300); // Update every 300ms
//   };

  // Download the file
  const handleDownload = () => {
    if (compressedFile) {
      // Create a temporary URL for the file
      const url = URL.createObjectURL(compressedFile);

      const nameWithoutExt = file.name.replace('.pdf','');
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
       a.download = `${nameWithoutExt}-${quality}-compressed.pdf`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Reset everything
  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setIsUploading(false);
    setIsComplete(false);
    setCompressedFile(null);
    setStats(null);
    setError(null);
  };


//refreshing data --- sending back to dashboard
  const handleBackToDashboard = () =>{
    router.push('/dashboard');
    router.refresh();
  }


//   Helper function to format bytes nicely
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };




  return (
    <>
    <div style={{ padding: '20px' }}>
      <h1>File Upload with Progress</h1>
      

    {/* Handling back to Dashboard */}
    <button onClick={handleBackToDashboard}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            ← Back to Dashboard
          </button>


    {/* err display */}
         {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} style={{ float: 'right' }}>✕</button>
        </div>
      )}



 {/*ADD THIS - Quality Selector */}
{!file && (
  <div style={{ marginBottom: '20px' }}>
    <h3>Choose Compression Quality:</h3>
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      
      <button
        onClick={() => setQuality('screen')}
        style={{
          padding: '12px 20px',
          backgroundColor: quality === 'screen' ? '#007bff' : '#e0e0e0',
          color: quality === 'screen' ? 'white' : 'black',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: quality === 'screen' ? 'bold' : 'normal'
        }}
      >
        📱 Screen (72 DPI)
        <br />
        <small>Smallest file, web viewing</small>
      </button>

      <button
        onClick={() => setQuality('ebook')}
        style={{
          padding: '12px 20px',
          backgroundColor: quality === 'ebook' ? '#007bff' : '#e0e0e0',
          color: quality === 'ebook' ? 'white' : 'black',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: quality === 'ebook' ? 'bold' : 'normal'
        }}
      >
        📖 eBook (150 DPI)
        <br />
        <small>Balanced, recommended</small>
      </button>

      <button
        onClick={() => setQuality('printer')}
        style={{
          padding: '12px 20px',
          backgroundColor: quality === 'printer' ? '#007bff' : '#e0e0e0',
          color: quality === 'printer' ? 'white' : 'black',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: quality === 'printer' ? 'bold' : 'normal'
        }}
      >
        🖨️ Printer (300 DPI)
        <br />
        <small>High quality</small>
      </button>

      <button
        onClick={() => setQuality('prepress')}
        style={{
          padding: '12px 20px',
          backgroundColor: quality === 'prepress' ? '#007bff' : '#e0e0e0',
          color: quality === 'prepress' ? 'white' : 'black',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: quality === 'prepress' ? 'bold' : 'normal'
        }}
      >
        📄 Prepress (300 DPI)
        <br />
        <small>Print-ready</small>
      </button>

    </div>
    <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
      Current selection: <strong>{quality}</strong>
    </p>
  </div>
)}



      {/* Show drop zone only when no file is uploaded */}
      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px solid blue' : '2px dashed gray',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: isDragging ? '#f0f0f0' : 'white'//if is dragging true use blue otherwise white
          }}
        >
          <input
            type="file"
            onChange={handleFileInput}
            id="fileInput"
            // accept only pdf
            accept='application/pdf'
            // style={{display:'none'}}
          />
          <p>Drag and drop a file here or select using input above</p>
          <p>isDragging: {isDragging ? 'Yes' : 'No'}</p>
        </div>
      )}

      {/* Show file info and progress when file is selected */}
      {file && (
        <div style={{ border: '1px solid black', padding: '20px' }}>
          <h2>File Information</h2>
          <p><strong>Name:</strong> {file.name}</p>
          <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
          <p><strong>Type:</strong> {file.type}</p>
          
          <button onClick={handleReset}>Reset / Upload New File</button>
          
          <hr />
          
          {/* Show progress bar while uploading */}
          {isUploading && (
            <div>
              <h3>Processing: {progress}%</h3>
              <div style={{ width: '100%', backgroundColor: '#ddd', height: '20px' }}>
                <div style={{
                  width: `${progress}%`,
                  backgroundColor: 'green',
                  height: '20px',
                  transition: 'width 0.3s'
                }}>
                </div>
              </div>
            </div>
          )}
          

          {/* How it works
-Outer div = gray background (full width)
- Inner div = green bar with width = `progress%`
- As `progress` changes from 0→100, the bar grows
- `transition: 'width 0.3s'` makes it smooth
 */}
          {/* Show success message and download button when complete */}
          {isComplete && (
            <div>
              <h3>✓ Upload Complete!</h3>
              <button onClick={handleDownload}>Download File</button>
            </div>
          )}
        </div>
      )}
      
      <hr />
      
      {/* Debug information */}
      <div style={{ marginTop: '20px', backgroundColor: '#f5f5f5', padding: '10px' }}>
        <h3>Debug Info (State Values):</h3>
        <p>file: {file ? file.name : 'null'}</p>
        <p>isDragging: {isDragging.toString()}</p>
        <p>progress: {progress}%</p>
        <p>isUploading: {isUploading.toString()}</p>
        <p>isComplete: {isComplete.toString()}</p>
      </div>
    </div>
    </>
  );
}

export default page