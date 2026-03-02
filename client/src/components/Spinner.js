import React from 'react';

const Spinner = () => (
  <div className="mt-4 flex justify-center items-center gap-2">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="text-gray-500 text-sm">Processing...</span>
  </div>
);

export default Spinner;
