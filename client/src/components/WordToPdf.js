import React, { useState } from 'react';
import axios from 'axios';
import DropZone from './DropZone';
import Spinner from './Spinner';

const WordToPdf = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile.size > 20 * 1024 * 1024) {
      setError('File too large (max 20MB)');
      return;
    }
    if (!uploadedFile.name.endsWith('.docx')) {
      setError('Invalid file type. Must be DOCX.');
      return;
    }
    setFile(uploadedFile);
    setError('');
    setResult(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('/api/word-to-pdf', formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setResult(url);
    } catch (err) {
      setError('Conversion failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-1">📝 Word to PDF</h2>
      <p className="text-gray-400 text-sm mb-4">Upload a .docx file, get a PDF</p>
      <DropZone onDrop={handleDrop} />
      {file && <p className="mt-2 text-sm text-gray-600">📎 {file.name}</p>}
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      <button
        onClick={handleConvert}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading || !file}
      >
        Convert to PDF
      </button>
      {loading && <Spinner />}
      {result && (
        <a
          href={result}
          download={`${file.name.replace('.docx', '')}.pdf`}
          className="mt-4 block text-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          ⬇️ Download PDF
        </a>
      )}
    </div>
  );
};

export default WordToPdf;
