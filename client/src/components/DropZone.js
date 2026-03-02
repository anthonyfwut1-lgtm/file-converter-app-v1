import React from 'react';
import { useDropzone } from 'react-dropzone';

const DropZone = ({ onDrop }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-6 text-center cursor-pointer rounded-lg transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-gray-500 text-sm">
        {isDragActive ? '📂 Drop file here...' : '📁 Drag & drop a file, or click to select'}
      </p>
    </div>
  );
};

export default DropZone;
