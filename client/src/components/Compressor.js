import React, { useState } from 'react';
import axios from 'axios';
import DropZone from './DropZone';
import Spinner from './Spinner';

const Compressor = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  const handleDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile.size > 20 * 1024 * 1024) {
      setError('File too large (max 20MB)');
      return;
    }
    const ext = uploadedFile.name.split('.').pop().toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      setError('Invalid file type. Must be PDF, JPG, or PNG.');
      return;
    }
    setFile(uploadedFile);
    setOriginalSize(uploadedFile.size);
    setError('');
    setResult(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('/api/compress', formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setResult(url);
      setCompressedSize(response.data.size);
    } catch (err) {
      setError('Compression failed. Please try again.');
    }
    setLoading(false);
  };

  const saved = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-1">🗜️ File Compressor</h2>
      <p className="text-gray-400 text-sm mb-4">Compress PDF, JPG, or PNG files</p>
      <DropZone onDrop={handleDrop} />
      {file && (
        <p className="mt-2 text-sm text-gray-600">
          📎 {file.name} ({(originalSize / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      <button
        onClick={handleCompress}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading || !file}
      >
        Compress File
      </button>
      {loading && <Spinner />}
      {result && (
        <>
          <div className="mt-3 p-3 bg-green-50 rounded text-sm">
            <p>Original: <strong>{(originalSize / 1024 / 1024).toFixed(2)} MB</strong></p>
            <p>Compressed: <strong>{(compressedSize / 1024 / 1024).toFixed(2)} MB</strong></p>
            <p className="text-green-600 font-semibold">Saved: {saved}% 🎉</p>
          </div>
          <a
            href={result}
            download={`compressed_${file.name}`}
            className="mt-3 block text-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            ⬇️ Download Compressed File
          </a>
        </>
      )}
    </div>
  );
};

export default Compressor;
