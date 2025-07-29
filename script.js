document.addEventListener('DOMContentLoaded', () => {

    // --- Particle Animation (Unchanged) ---
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = `rgba(173, 216, 230, ${Math.random() * 0.5 + 0.2})`;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
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

        const initParticles = () => {
            particles = [];
            const numberOfParticles = Math.floor((canvas.width * canvas.height) / 10000);
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
            }
        };

        const connectParticles = () => {
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const distance = Math.sqrt(
                        (particles[a].x - particles[b].x) ** 2 +
                        (particles[a].y - particles[b].y) ** 2
                    );
                    if (distance < 100) {
                        const opacityValue = 1 - distance / 100;
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

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            connectParticles();
            requestAnimationFrame(animate);
        };

        resizeCanvas();
        initParticles();
        animate();
        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });
    }

    // --- NEW: Joonify Title Scroll Animation ---
    const joonifyTitle = document.getElementById('joonify-title');
    const heroSection = document.querySelector('.hero-section');

    if (joonifyTitle && heroSection) {
        const handleScrollAnimation = () => {
            // Get the position of the hero section relative to the viewport
            const rect = heroSection.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Calculate when the animation should start and end.
            // Starts when the top of the hero section is at the bottom of the viewport.
            // Ends when the top of the hero section reaches the middle of the viewport.
            const animationStart = viewportHeight;
            const animationEnd = viewportHeight / 2;

            // Calculate the progress of the animation (from 0 to 1)
            const progress = 1 - ((rect.top - animationEnd) / (animationStart - animationEnd));
            
            // Clamp the progress value between 0 and 1
            const clampedProgress = Math.max(0, Math.min(1, progress));

            // Interpolate CSS properties based on scroll progress
            const opacity = clampedProgress;
            const scale = 0.9 + (clampedProgress * 0.1); // Animate from 0.9 to 1
            const rotationX = 45 - (clampedProgress * 45); // Animate from 45deg to 0deg

            // Apply the transform using requestAnimationFrame for performance
            requestAnimationFrame(() => {
                joonifyTitle.style.opacity = opacity;
                joonifyTitle.style.transform = `scale(${scale}) rotateX(${rotationX}deg)`;
            });
        };
        
        // Run the animation on scroll
        window.addEventListener('scroll', handleScrollAnimation, { passive: true });
        // Also run it on load in case the page is reloaded halfway down
        handleScrollAnimation();
    }


    // --- Scroll-based Fade-in Animations (Unchanged) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const animatedItemObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-mounted');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animated-item').forEach(item => {
        animatedItemObserver.observe(item);
    });

    // --- Real-time Stats Connection via WebSockets (Unchanged) ---
    function connectToStats() {
        const wsUrl = "wss://joonify-stats-worker.larsvlasveld11.workers.dev";
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("Connected to Joonify real-time stats server.");
        };

        socket.onmessage = (event) => {
            try {
                const stats = JSON.parse(event.data);
                updateStatOnPage(stats);
            } catch (error) {
                console.error("Error parsing stats data:", error);
            }
        };

        socket.onclose = () => {
            console.log("Stats connection closed. Reconnecting in 5 seconds...");
            setTimeout(connectToStats, 5000);
        };
        
        socket.onerror = (error) => {
            console.error("WebSocket Error:", error);
            socket.close();
        };
    }

    function updateStatOnPage(stats) {
        for (const key in stats) {
            const element = document.getElementById(key);
            if (element) {
                element.style.transition = 'none';
                element.style.opacity = '0.5';
                
                setTimeout(() => {
                    element.style.transition = 'opacity 0.5s ease';
                    element.textContent = stats[key].toLocaleString();
                    element.style.opacity = '1';
                }, 100);
            }
        }
    }

    // Start the connection when the page loads
    connectToStats();

    // --- Lucide Icon Rendering (Unchanged) ---
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
