import React from 'react';

const DebugPanel = () => {
  const last = typeof window !== 'undefined' ? (window as any).__LAST_PROXY_RESPONSE : null;
  const series = typeof window !== 'undefined' ? (window as any).__LAST_PARSED_SERIES : null;

  return (
    <div style={{ position: 'fixed', right: 10, bottom: 10, zIndex: 9999, width: 420, maxHeight: '60vh', overflow: 'auto', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: 12, borderRadius: 8 }}>
      <h4 style={{ margin: 0, marginBottom: 8 }}>Debug Panel</h4>
      <div style={{ fontSize: 12 }}>
        <strong>Last proxy JSON:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(last, null, 2)}</pre>
        <strong>Last parsed series (first 10):</strong>
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(series?.slice(0,10) || null, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DebugPanel;
