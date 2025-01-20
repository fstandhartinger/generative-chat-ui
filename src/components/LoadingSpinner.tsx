import React from "react";

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      <p className="text-gray-400 text-sm">thinking...</p>
    </div>
  );
};