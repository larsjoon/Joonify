import React, { useState, useEffect, useRef } from 'react';
import { Mail, Linkedin, Twitter, Gitlab } from 'lucide-react';

// --- Particle Animation Component ---
// This component creates a subtle, generative background animation
// representing the 'essence' or 'soul' of the brand.
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    // Set canvas size based on its container
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();

    // Particle class
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.color = `rgba(173, 216, 230, ${Math.random() * 0.5 + 0.2})`; // Light blue with opacity
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Reset particle if it goes off-screen
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    const init = () => {
      particles = [];
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 10000);
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    // Connect particles with lines
    const connect = () => {
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const distance = Math.sqrt(
            (particles[a].x - particles[b].x) ** 2 +
            (particles[a].y - particles[b].y) ** 2
          );

          if (distance < 100) {
            opacityValue = 1 - distance / 100;
            ctx.strokeStyle = `rgba(173, 216, 230, ${opacityValue * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    init();
    animate();

    // Handle window resize
    const handleResize = () => {
      resizeCanvas();
      init();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0"></canvas>;
};


// --- Main App Component ---
export default function App() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger animations on mount
    setIsMounted(true);
  }, []);

  return (
    <div className="bg-[#0a191f] text-gray-200 font-sans antialiased min-h-screen flex flex-col">
      <div className="relative flex-grow flex flex-col justify-center items-center overflow-hidden">
        
        {/* Particle Animation Background */}
        <ParticleCanvas />

        {/* Main Content Container */}
        <main className="container mx-auto px-6 py-12 flex-grow flex items-center z-10">
          <div className="w-full flex flex-col lg:flex-row items-center justify-between">
            
            {/* Golden Ratio Layout: Left side (approx 61.8%) */}
            <div className={`w-full lg:w-[61.8%] transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <div className="text-center lg:text-left">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                  Joonify
                </h1>
                <p className="mt-4 text-xl md:text-2xl text-green-300">
                  The Soul of Intelligent Software.
                </p>
              </div>
            </div>

            {/* Golden Ratio Layout: Right side (approx 38.2%) */}
            <div className={`w-full lg:w-[38.2%] mt-12 lg:mt-0 transition-all duration-1000 delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <div className="bg-green-900 bg-opacity-20 backdrop-blur-sm p-8 rounded-lg border border-green-500 border-opacity-20 shadow-2xl">
                    <h2 className="text-2xl font-semibold text-green-200 mb-4">Our Philosophy</h2>
                    <p className="text-gray-300 leading-relaxed">
                        The name <span className="font-semibold text-green-300">Joon</span>, from the Farsi word for 'soul' or 'life', is the core of our identity. We believe technology should be an extension of human potential, not a replacement. At Joonify, we build AI solutions that are innovative, simple, and performant—always with a human-centered essence.
                    </p>
                </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={`w-full p-6 z-10 transition-opacity duration-1000 delay-500 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="container mx-auto text-center">
            <div className="flex justify-center items-center space-x-6">
                <a href="mailto:lars@joonify.dev" className="text-gray-400 hover:text-green-300 transition-colors duration-300">
                    <Mail size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-300 transition-colors duration-300">
                    <Linkedin size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-300 transition-colors duration-300">
                    <Twitter size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-300 transition-colors duration-300">
                    <Gitlab size={24} />
                </a>
            </div>
            <div className="mt-6 text-gray-400 space-y-2 text-sm">
                <p>
                    <a href="mailto:lars@joonify.dev" className="hover:text-green-300 transition-colors duration-300">lars@joonify.dev</a>
                </p>
                 <p>KVK: [Your KVK Number Here]</p>
            </div>
            <p className="text-center text-gray-500 text-xs mt-4">© 2025 Joonify. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

