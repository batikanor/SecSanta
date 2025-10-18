'use client';

import { useState } from 'react';
import { Download, Upload, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { DEBUG_MODE } from '@/lib/debug-data';
import { exportPools, importPools, downloadPoolsAsFile, copyPoolsToClipboard } from '@/lib/demo-sync';
import { useRouter } from 'next/navigation';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const router = useRouter();

  if (!DEBUG_MODE) return null;

  const handleCopy = async () => {
    const success = await copyPoolsToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImport = () => {
    setImportError('');
    const result = importPools(importText);

    if (result.success) {
      setImportText('');
      alert('Pools imported successfully! Refreshing...');
      window.location.reload();
    } else {
      setImportError(result.error || 'Import failed');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 z-40"
      >
        <ChevronUp className="w-4 h-4" />
        Debug Tools
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-yellow-500 rounded-lg shadow-xl p-4 z-40 w-96 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-yellow-800">Debug Tools</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Export Section */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-2">Share Pools Across Browsers</h4>
          <p className="text-xs text-gray-600 mb-3">
            Export pools from this browser and import in another browser to sync data.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy JSON
                </>
              )}
            </button>

            <button
              onClick={downloadPoolsAsFile}
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-2">Import Pools</h4>
          <p className="text-xs text-gray-600 mb-3">
            Paste exported JSON from another browser:
          </p>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"pools": [...], "counter": 1}'
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono mb-2 h-32 resize-none"
          />

          {importError && (
            <p className="text-xs text-red-600 mb-2">{importError}</p>
          )}

          <button
            onClick={handleImport}
            disabled={!importText}
            className="w-full px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Import & Reload
          </button>
        </div>

        {/* Instructions */}
        <div className="border-t pt-4 text-xs text-gray-600">
          <h4 className="font-semibold mb-2">How to sync across browsers:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click &quot;Copy JSON&quot; in Browser 1</li>
            <li>Open Browser 2 (Firefox, Safari, etc.)</li>
            <li>Open Debug Tools panel</li>
            <li>Paste JSON in &quot;Import Pools&quot; box</li>
            <li>Click &quot;Import & Reload&quot;</li>
            <li>Pools now synced! 🎉</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
