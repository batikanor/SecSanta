'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, Copy, Check, ChevronDown, ChevronUp, Settings, Database } from 'lucide-react';
import { exportPools, importPools, downloadPoolsAsFile, copyPoolsToClipboard } from '@/lib/demo-sync';
import { useRouter } from 'next/navigation';

const STORAGE_MODE_KEY = 'secsanta-storage-mode'; // 'local' or 'vercel-kv'
const BLOCKCHAIN_MODE_KEY = 'secsanta-blockchain-mode'; // 'mock' or 'real'

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [storageMode, setStorageMode] = useState<'local' | 'vercel-kv'>('vercel-kv');
  const [blockchainMode, setBlockchainMode] = useState<'mock' | 'real'>('mock');
  const router = useRouter();

  useEffect(() => {
    // Read current settings from localStorage
    const savedStorage = localStorage.getItem(STORAGE_MODE_KEY) as 'local' | 'vercel-kv';
    const savedBlockchain = localStorage.getItem(BLOCKCHAIN_MODE_KEY) as 'mock' | 'real';

    setStorageMode(savedStorage || 'vercel-kv');
    setBlockchainMode(savedBlockchain || 'mock');
  }, []);

  const toggleStorageMode = () => {
    const newValue = storageMode === 'local' ? 'vercel-kv' : 'local';
    setStorageMode(newValue);
    localStorage.setItem(STORAGE_MODE_KEY, newValue);
    window.location.reload();
  };

  const toggleBlockchainMode = () => {
    const newValue = blockchainMode === 'mock' ? 'real' : 'mock';
    setBlockchainMode(newValue);
    localStorage.setItem(BLOCKCHAIN_MODE_KEY, newValue);
    window.location.reload();
  };

  // Show export/import tools only when using local storage
  const showDataTools = storageMode === 'local';

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
    const isDevMode = storageMode === 'local' || blockchainMode === 'mock';
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105 flex items-center gap-2 z-50 ${
          isDevMode
            ? 'bg-yellow-500 text-white'
            : 'bg-white text-gray-700 border-2 border-gray-300'
        }`}
      >
        <Settings className="w-4 h-4" />
        {isDevMode ? (
          <span className="text-xs font-medium">
            {storageMode === 'local' ? 'LOCAL' : 'UPSTASH'} / {blockchainMode === 'mock' ? 'MOCK' : 'REAL'}
          </span>
        ) : (
          'Settings'
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Debug Settings
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Toggle 1: Data Storage */}
        <div className="pb-4 border-b">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Data Storage</p>
                <p className="text-xs text-gray-500">
                  {storageMode === 'local' ? 'localStorage (browser only)' : 'Upstash Redis (synced)'}
                </p>
              </div>
            </div>
            <div
              onClick={toggleStorageMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                storageMode === 'local' ? 'bg-orange-500' : 'bg-blue-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  storageMode === 'local' ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </div>
          </label>
          <div className="mt-2 text-xs text-gray-600 flex items-center justify-between px-1">
            <span className={storageMode === 'local' ? 'font-semibold text-orange-600' : 'text-gray-400'}>
              Local
            </span>
            <span className={storageMode === 'vercel-kv' ? 'font-semibold text-blue-600' : 'text-gray-400'}>
              Upstash
            </span>
          </div>
        </div>

        {/* Toggle 2: Blockchain Mode */}
        <div className="pb-4 border-b">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Blockchain</p>
                <p className="text-xs text-gray-500">
                  {blockchainMode === 'mock' ? 'Mock data (demo)' : 'Real blockchain'}
                </p>
              </div>
            </div>
            <div
              onClick={toggleBlockchainMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                blockchainMode === 'mock' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  blockchainMode === 'mock' ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </div>
          </label>
          <div className="mt-2 text-xs text-gray-600 flex items-center justify-between px-1">
            <span className={blockchainMode === 'mock' ? 'font-semibold text-yellow-600' : 'text-gray-400'}>
              Mock
            </span>
            <span className={blockchainMode === 'real' ? 'font-semibold text-green-600' : 'text-gray-400'}>
              Real
            </span>
          </div>
        </div>

        {/* Warning message */}
        {(storageMode === 'local' || blockchainMode === 'mock') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ Development Mode Active</p>
            <p className="text-xs text-yellow-700">
              {storageMode === 'local' && '• Data stored in browser localStorage only'}
              {storageMode === 'local' && blockchainMode === 'mock' && <br />}
              {blockchainMode === 'mock' && '• Using mock blockchain data'}
            </p>
          </div>
        )}

        {/* Only show panel tools when using local storage */}
        {showDataTools && (<div className="space-y-4">
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
        </div>)}
      </div>
    </div>
  );
}
