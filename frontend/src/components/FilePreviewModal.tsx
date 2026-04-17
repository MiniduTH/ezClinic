"use client";

import { useState } from "react";

export default function FilePreviewModal({
  title,
  url,
  fileType,
  onClose,
}: {
  title: string;
  url: string;
  fileType: string;
  onClose: () => void;
}) {
  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";
  const [zoomed, setZoomed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h2>
          <button onClick={onClose} aria-label="Close preview" className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {isImage && (
            <div className="flex items-center justify-center">
              <img
                src={url}
                alt={title}
                onClick={() => setZoomed((z) => !z)}
                className={`object-contain rounded-xl border border-gray-100 dark:border-gray-700 transition-transform ${zoomed ? 'scale-150' : ''}`}
                style={{ maxHeight: zoomed ? '80vh' : '60vh', cursor: 'zoom-in' }}
              />
            </div>
          )}

          {isPdf && (
            <iframe src={url} title={title} className="w-full h-[70vh] rounded-xl border border-gray-100 dark:border-gray-700" />
          )}

          {!isImage && !isPdf && (
            <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/40 text-gray-400 dark:text-gray-500 text-sm">
              Preview not available for this file type
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Open in new tab</a>
            <button onClick={() => { if (isImage) setZoomed((z) => !z); }} className="rounded-xl bg-gray-100 px-4 py-2 text-sm">{isImage ? (zoomed ? 'Reset' : 'Zoom') : 'Toggle'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
