// LogoEditor.tsx
// 251013 - 1st version with Gemini on 251013

import React, { useState } from 'react';

const Editor: React.FC = () => {
  const [code, setCode] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ flex: 1, background: '#1e1e1e', color: 'white', border: 'none', padding: '10px' }}
        placeholder="Enter your LOGO code here..."
      />
    </div>
  );
};

export default Editor;
