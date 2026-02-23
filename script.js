/**
 * Joonify Premium Redesign Script (Optimized)
 * Particles (spatial grid), Scroll Observers, Typing Effect, Mobile Menu, Form.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Init Icons ---
    const initIcons = () => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            setTimeout(initIcons, 100);
        }
    };
    initIcons();

    // --- 2. Scroll Observers (Reveal Animations) ---
    const revealElements = document.querySelectorAll('.reveal-up');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealElements.forEach(el => revealObserver.observe(el));

    // --- 3. Navbar scroll effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 25, 31, 0.85)';
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
        } else {
            navbar.style.background = 'rgba(10, 25, 31, 0.6)';
            navbar.style.boxShadow = 'none';
        }
    });

    // --- 4. Scroll Indicator Auto-Hide ---
    const scrollIndicator = document.getElementById('scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '0.6';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        }, { passive: true });
    }

    // --- 5. Typing Effect (from data-text attribute, no flash) ---
    const subtitleEl = document.querySelector('.type-effect');
    if (subtitleEl) {
        const text = subtitleEl.getAttribute('data-text') || '';
        subtitleEl.innerText = ''; // Starts empty in HTML, no flash

        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                subtitleEl.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        setTimeout(typeWriter, 800);
    }

    // --- 6. Mobile Menu ---
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.classList.add('mobile-overlay');
        document.body.appendChild(overlay);

        const toggleMenu = () => {
            const isOpen = mobileMenu.classList.toggle('is-open');
            overlay.classList.toggle('is-open', isOpen);
            menuBtn.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        menuBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        // Close menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu.classList.contains('is-open')) {
                    toggleMenu();
                }
            });
        });
    }

    // --- 7. Contact Form Logic ---
    const contactForm = document.getElementById('contact-form');
    const statusDiv = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalHTML = btn.innerHTML;

            btn.disabled = true;
            btn.innerHTML = 'Sending... <i data-lucide="loader-2" class="ml-2 animate-spin"></i>';
            if (window.lucide) window.lucide.createIcons();

            statusDiv.textContent = '';
            statusDiv.className = 'form-status mt-3 text-center text-sm';

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value,
                token: document.querySelector('[name="cf-turnstile-response"]')?.value || ''
            };

            try {
                const response = await fetch('https://joonify-stats-worker.larsvlasveld11.workers.dev/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    statusDiv.textContent = "Message sent successfully. We'll be in touch.";
                    statusDiv.classList.add('success');
                    contactForm.reset();
                } else {
                    throw new Error(result.error || 'Failed to send');
                }
            } catch (error) {
                console.error(error);
                statusDiv.textContent = "Something went wrong. Please email directly.";
                statusDiv.classList.add('error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    // --- 8. Particle Background (Spatial Grid Optimized) ---
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        initParticles(canvas);
    }
});

// --- Particle Logic (Spatial Grid for O(n) connect) ---
function initParticles(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });

    const config = {
        color: 'rgba(134, 239, 172,',
        speedY_min: -0.15,
        speedY_max: 0.15,
        speedX_dev: 0.15,
        connectDistance: 120
    };

    let particles = [];
    let grid = {};
    const cellSize = config.connectDistance;

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedX = Math.random() * config.speedX_dev - (config.speedX_dev / 2);
            this.speedY = Math.random() * 0.3 - 0.15;
            this.color = `${config.color} ${Math.random() * 0.4 + 0.1})`;
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

    const init = () => {
        particles = [];
        const numberOfParticles = Math.floor((canvas.width * canvas.height) / 12000);
        for (let i = 0; i < numberOfParticles; i++) {
            particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
        }
    };

    // Build spatial hash grid for O(n) neighbor lookups
    const buildGrid = () => {
        grid = {};
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const cellX = Math.floor(p.x / cellSize);
            const cellY = Math.floor(p.y / cellSize);
            const key = `${cellX},${cellY}`;
            if (!grid[key]) grid[key] = [];
            grid[key].push(p);
        }
    };

    const connect = () => {
        buildGrid();
        const checked = new Set();

        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            const cellX = Math.floor(a.x / cellSize);
            const cellY = Math.floor(a.y / cellSize);

            // Check this cell and all 8 neighbors
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const key = `${cellX + dx},${cellY + dy}`;
                    const cell = grid[key];
                    if (!cell) continue;

                    for (let j = 0; j < cell.length; j++) {
                        const b = cell[j];
                        if (a === b) continue;

                        // Avoid duplicate pair checks
                        const pairKey = a.x < b.x ? `${i}-${j}` : `${j}-${i}`;
                        if (checked.has(pairKey)) continue;
                        checked.add(pairKey);

                        const ddx = a.x - b.x;
                        const ddy = a.y - b.y;
                        const distance = Math.sqrt(ddx * ddx + ddy * ddy);

                        if (distance < config.connectDistance) {
                            const opacity = (1 - (distance / config.connectDistance)) * 0.2;
                            ctx.strokeStyle = `${config.color} ${opacity})`;
                            ctx.lineWidth = 0.5;
                            ctx.beginPath();
                            ctx.moveTo(a.x, a.y);
                            ctx.lineTo(b.x, b.y);
                            ctx.stroke();
                        }
                    }
                }
            }
        }
    };

    const animate = () => {
        ctx.fillStyle = '#0a191f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => { p.update(); p.draw(); });
        connect();
        requestAnimationFrame(animate);
    };

    resizeCanvas(); init(); animate();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            init();
        }, 200);
    });
}