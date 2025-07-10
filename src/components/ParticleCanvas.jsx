import React, { useEffect, useRef } from 'react';

// --- Particle Animation Component ---
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    // ... (rest of the ParticleCanvas logic from your original file) ...
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();

    class Particle {
        // ... (Particle class implementation) ...
    }
    
    const init = () => {
        // ... (init implementation) ...
    };
    
    const animate = () => {
        // ... (animate implementation) ...
    };

    const connect = () => {
        // ... (connect implementation) ...
    };

    init();
    animate();

    const handleResize = () => {
      resizeCanvas();
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0"></canvas>;
};

export default ParticleCanvas;