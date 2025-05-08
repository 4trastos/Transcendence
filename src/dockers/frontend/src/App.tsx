import React from 'react';

const App: React.FC = () => {
  return (    
    <div className="h-screen flex items-center justify-center bg-gray-600">
      <div className="space-x-4">
        <button className="px-6 py-3 bg-blue-500 rounded hover:bg-blue-600 font-jacquard">
          Jugar VS
        </button>
        <button className="px-6 py-3 bg-green-500 rounded hover:bg-green-600 font-jacquard">
          Jurgar Torneo
        </button>
      </div>
    </div>
  );
};

export default App;