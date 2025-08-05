document.addEventListener('DOMContentLoaded', () => {

    // --- THEME TOGGLE ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');
    const docElement = document.documentElement;

    /**
     * Applies the specified theme (light or dark) to the document
     * and updates the toggle button icon.
     * @param {string} theme - The theme to apply ('light' or 'dark').
     */
    const applyTheme = (theme) => {
        console.log(`Applying theme: ${theme}`);
        
        if (theme === 'light') {
            docElement.setAttribute('data-theme', 'light');
            if (sunIcon) {
                sunIcon.style.display = 'none';
                console.log('Sun icon hidden');
            }
            if (moonIcon) {
                moonIcon.style.display = 'inline-block';
                console.log('Moon icon shown');
            }
        } else {
            docElement.removeAttribute('data-theme');
            if (sunIcon) {
                sunIcon.style.display = 'inline-block';
                console.log('Sun icon shown');
            }
            if (moonIcon) {
                moonIcon.style.display = 'none';
                console.log('Moon icon hidden');
            }
        }
        
        // Ensure the correct icon is rendered by Lucide after its display property changes
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
            console.log('Lucide icons refreshed');
        } else {
            console.warn('Lucide not available for theme toggle icons');
        }
    };

    // Check for a saved theme in localStorage on page load
    // If no theme is saved, it defaults to the user's OS preference, otherwise 'dark'.
    const osPreference = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const savedTheme = localStorage.getItem('theme') || osPreference;
    applyTheme(savedTheme);

    // Add event listener for the toggle button
    if (themeToggleButton) {
        console.log('Theme toggle button found, adding event listener');
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = docElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            console.log(`Switching theme from ${currentTheme || 'dark'} to ${newTheme}`);
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    } else {
        console.error('Theme toggle button not found!');
    }


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
                // Dynamically get color from CSS variable
                this.color = getComputedStyle(document.documentElement).getPropertyValue('--particle-color').trim() || 'rgba(173, 216, 230, 0.7)';
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
            const particleColor = getComputedStyle(document.documentElement).getPropertyValue('--particle-color').trim() || 'rgba(173, 216, 230, 0.7)';
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const distance = Math.sqrt(
                        (particles[a].x - particles[b].x) ** 2 +
                        (particles[a].y - particles[b].y) ** 2
                    );
                    if (distance < 100) {
                        const opacityValue = 1 - distance / 100;
                        // Create a color string with the dynamic opacity
                        const lineColor = particleColor.replace(/[\d\.]+\)$/g, `${opacityValue * 0.5})`);
                        ctx.strokeStyle = lineColor;
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

        // Re-initialize particles on theme change to update colors
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', initParticles);
        }
    }

    // --- Joonify Title Scroll Animation ---
    const joonifyTitle = document.getElementById('joonify-title');
    const heroSection = document.querySelector('.hero-section');

    if (joonifyTitle && heroSection) {
        const handleScrollAnimation = () => {
            const rect = heroSection.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const animationStart = viewportHeight;
            const animationEnd = viewportHeight / 2;
            const progress = 1 - ((rect.top - animationEnd) / (animationStart - animationEnd));
            const clampedProgress = Math.max(0, Math.min(1, progress));
            const opacity = clampedProgress;
            const scale = 0.9 + (clampedProgress * 0.1);
            const rotationX = 45 - (clampedProgress * 45);

            requestAnimationFrame(() => {
                joonifyTitle.style.opacity = opacity;
                joonifyTitle.style.transform = `scale(${scale}) rotateX(${rotationX}deg)`;
            });
        };
        
        window.addEventListener('scroll', handleScrollAnimation, { passive: true });
        handleScrollAnimation();
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
        // Only connect if on the expected domain for security
        if (!window.location.hostname.includes('joonify.dev') && window.location.hostname !== 'localhost') {
            console.log("Stats connection disabled on this domain for security.");
            return;
        }

        const wsUrl = "wss://joonify-stats-worker.larsvlasveld11.workers.dev";
        let socket;
        
        try {
            socket = new WebSocket(wsUrl);
        } catch (error) {
            console.error("Failed to create WebSocket connection:", error);
            return;
        }

        socket.onopen = () => {
            console.log("Connected to Joonify real-time stats server.");
        };

        socket.onmessage = (event) => {
            try {
                const stats = JSON.parse(event.data);
                // Validate that stats is an object with expected properties
                if (typeof stats === 'object' && stats !== null) {
                    updateStatOnPage(stats);
                }
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
            if (socket) {
                socket.close();
            }
        };
    }

    function updateStatOnPage(stats) {
        // Whitelist of allowed stat keys for security
        const allowedKeys = ['visitors-count', 'projects-count', 'performance-score', 'countries-count'];
        
        for (const key in stats) {
            if (!allowedKeys.includes(key)) {
                continue; // Skip unauthorized keys
            }
            
            const element = document.getElementById(key);
            if (element && typeof stats[key] === 'number') {
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
    const initializeLucideIcons = () => {
        if (typeof lucide !== 'undefined') {
            try {
                lucide.createIcons();
                console.log('Lucide icons initialized successfully');
                
                // Double-check social media icons after a delay
                setTimeout(() => {
                    const socialLinks = document.querySelectorAll('.social-links a i[data-lucide]');
                    let iconsRendered = 0;
                    
                    socialLinks.forEach(icon => {
                        if (icon.innerHTML && icon.innerHTML.length > 2) {
                            iconsRendered++;
                        }
                    });
                    
                    console.log(`${iconsRendered}/${socialLinks.length} social media icons rendered`);
                    
                    if (iconsRendered === 0) {
                        console.warn('No social media icons rendered - using fallback text');
                    }
                }, 500);
                
            } catch (error) {
                console.error('Error initializing Lucide icons:', error);
            }
        } else {
            console.error('Lucide library not loaded - social media icons will show fallback text');
        }
    };

    // Try to initialize icons immediately
    initializeLucideIcons();
    
    // Also try after a delay in case the library loads late
    setTimeout(initializeLucideIcons, 1000);
});
