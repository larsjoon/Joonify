document.addEventListener('DOMContentLoaded', () => {

    // --- Particle Animation ---
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

    // --- Scroll-based Fade-in Animations ---
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

// --- Real-time Stats Connection via WebSockets ---
function connectToStats() {
    // Use the real URL from your deployment
    const wsUrl = "wss://joonify-stats-worker.larsvlasveld11.workers.dev";
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log("Connected to Joonify real-time stats server.");
    };

    socket.onmessage = (event) => {
        try {
            const stats = JSON.parse(event.data);
            console.log("Received stats update:", stats);
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
            // Add a subtle animation on update
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

    // --- Lucide Icon Rendering ---
    // This function finds all elements with `data-lucide` and replaces them with SVG icons.
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

});