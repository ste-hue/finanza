import React, { useState, useEffect } from 'react';
import { apiService } from '@/lib/apiService';

// 🚀 DEMO: Real-time Entry Updates
const RealtimeEntryDemo = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newValue, setNewValue] = useState('');

  // ✅ Load initial data
  useEffect(() => {
    loadEntries();
  }, []);

  // 🔄 Simulate real-time polling (in real Supabase would be WebSocket subscription)
  useEffect(() => {
    const interval = setInterval(() => {
      // Poll for changes every 2 seconds
      loadEntries();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadEntries = async () => {
    try {
      setError(null);
      const response = await apiService.getEntries({ 
        year: 2024, 
        limit: 10 
      });
      
      if (response.success) {
        setEntries(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setNewValue(entry.value.toString());
  };

  const handleSave = async (entryId) => {
    try {
      const response = await apiService.updateEntry(entryId, {
        value: parseFloat(newValue)
      });

      if (response.success) {
        // ✅ Update local state immediately for better UX
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, value: parseFloat(newValue) }
            : entry
        ));
        
        setEditingId(null);
        setNewValue('');
        
        // 🔄 Refresh to get latest data (simulates real-time sync)
        setTimeout(() => loadEntries(), 500);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewValue('');
  };

  const handleCreate = async () => {
    try {
      if (!entries.length) return;
      
      const firstEntry = entries[0];
      const response = await apiService.createEntry({
        subcategory_id: firstEntry.subcategory_id,
        year: 2025,
        month: Math.floor(Math.random() * 12) + 1,
        value: Math.random() * 10000,
        is_projection: true,
        notes: 'Real-time demo entry'
      });

      if (response.success) {
        // Refresh data to show new entry
        loadEntries();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-blue-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            ⚡ Real-time CRUD Demo
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Live Sync
            </span>
          </h2>
          <p className="text-gray-600 mt-1">
            Modifica i valori e vedi le sincronizzazioni automatiche ogni 2 secondi
          </p>
        </div>
        
        <div className="space-x-2">
          <button
            onClick={loadEntries}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Create Test Entry
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">❌ Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
            <div>Category</div>
            <div>Year</div>
            <div>Month</div>
            <div>Value</div>
            <div>Type</div>
            <div>Actions</div>
          </div>
        </div>

        <div className="divide-y">
          {entries.map((entry) => (
            <div key={entry.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="text-sm text-gray-900">
                  {entry.subcategories?.categories?.name || 'Unknown'}
                </div>
                
                <div className="text-sm text-gray-600">
                  {entry.year}
                </div>
                
                <div className="text-sm text-gray-600">
                  {String(entry.month).padStart(2, '0')}
                </div>
                
                <div className="text-sm">
                  {editingId === entry.id ? (
                    <input
                      type="number"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(entry.id);
                        if (e.key === 'Escape') handleCancel();
                      }}
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="font-mono text-gray-900 cursor-pointer hover:bg-yellow-100 px-2 py-1 rounded"
                      onClick={() => handleEdit(entry)}
                    >
                      €{parseFloat(entry.value).toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="text-sm">
                  {entry.is_projection ? (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                      🔮 Previsionale
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      ✅ Consolidato
                    </span>
                  )}
                </div>
                
                <div className="text-sm space-x-2">
                  {editingId === entry.id ? (
                    <>
                      <button
                        onClick={() => handleSave(entry.id)}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        💾 Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ✖️ Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 text-lg">💡</div>
          <div>
            <p className="text-sm text-blue-800 font-medium">Come funziona:</p>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• <strong>Click su valore</strong> per editare</li>
              <li>• <strong>Enter</strong> per salvare, <strong>Escape</strong> per annullare</li>
              <li>• <strong>Auto-refresh ogni 2s</strong> simula real-time sync</li>
              <li>• <strong>Colori</strong>: Verde = Consolidato, Arancione = Previsionale</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        🔄 Last refreshed: {new Date().toLocaleTimeString()} • 
        Entries loaded: {entries.length} • 
        ⚡ Real-time simulation active
      </div>
    </div>
  );
};

export default RealtimeEntryDemo;