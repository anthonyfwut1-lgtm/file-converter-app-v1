import React from 'react';
import PdfToWord from './components/PdfToWord';
import WordToPdf from './components/WordToPdf';
import Compressor from './components/Compressor';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-2">📄 File Converter & Compressor</h1>
      <p className="text-gray-500 mb-8">Convert and compress your files easily</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        <PdfToWord />
        <WordToPdf />
        <Compressor />
      </div>
    </div>
  );
}

export default App;
