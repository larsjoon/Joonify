import React, { useState, useEffect } from 'react';
import { Mail, Linkedin, Twitter, Gitlab } from 'lucide-react';
import ParticleCanvas from './components/ParticleCanvas'; // Import the component

// --- Main App Component ---
export default function App() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="bg-[#0a191f] text-gray-200 font-sans antialiased min-h-screen flex flex-col">
      <div className="relative flex-grow flex flex-col justify-center items-center overflow-hidden">
        
        <ParticleCanvas />

        {/* Main Content Container */}
        <main className="container mx-auto px-6 py-12 flex-grow flex items-center z-10">
          {/* ... (rest of the main content JSX) ... */}
        </main>

        {/* Footer */}
        <footer className={`w-full p-6 z-10 transition-opacity duration-1000 delay-500 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
          {/* ... (rest of the footer JSX) ... */}
        </footer>
      </div>
    </div>
  );
}