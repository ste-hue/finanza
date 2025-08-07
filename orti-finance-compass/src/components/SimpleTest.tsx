import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test App - Funziona!</h1>
      <p>Se vedi questo messaggio, React sta funzionando correttamente.</p>
      <button 
        onClick={() => alert('Click funziona!')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Click
      </button>
    </div>
  );
};

export default SimpleTest;