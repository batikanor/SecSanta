'use client';

import { useState, useEffect } from 'react';
import { Settings, Database } from 'lucide-react';

const DEBUG_MODE_KEY = 'secsanta-debug-mode';

export function DebugModeToggle() {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const stored = localStorage.getItem(DEBUG_MODE_KEY);
    if (stored !== null) {
      setIsDebugMode(stored === 'true');
    }
  }, []);

  const toggleDebugMode = () => {
    const newValue = !isDebugMode;
    setIsDebugMode(newValue);
    localStorage.setItem(DEBUG_MODE_KEY, String(newValue));
    // Reload page to apply changes
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Debug Settings
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Mock Data Mode</p>
                  <p className="text-xs text-gray-500">
                    {isDebugMode ? 'Using localStorage' : 'Using Vercel KV'}
                  </p>
                </div>
              </div>
              <div
                onClick={toggleDebugMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDebugMode ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDebugMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
            </label>

            {isDebugMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-xs text-yellow-800">
                  ⚠️ Debug mode active - data stored locally only
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105 ${
            isDebugMode
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-700 border-2 border-gray-300'
          }`}
          title="Debug Settings"
        >
          <Settings className="w-4 h-4" />
          {isDebugMode && <span className="text-xs font-medium">DEBUG</span>}
        </button>
      )}
    </div>
  );
}
