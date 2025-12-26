document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Identify which page we are on ---
    const isMapPage = document.body.classList.contains('map-page');
    const particleCanvas = document.getElementById('particle-canvas');

    // --- 2. Run Homepage Logic (Particles & Scroll Animations) ---
    if (!isMapPage && particleCanvas) {
        initParticles(particleCanvas);
        initScrollAnimations();
    }

    // --- 3. Run Map Page Logic (Globe) ---
    if (isMapPage) {
        initGlobe();
    }

    // --- 4. Shared Logic (WebSocket & Icons) ---
    connectToStats(isMapPage);
    
    // Initialize Lucide icons with retry logic
    const initIcons = () => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            // Retry after a short delay if lucide isn't loaded yet
            setTimeout(initIcons, 100);
        }
    };
    initIcons();

    // --- 5. Contact Form Logic ---
    const contactForm = document.getElementById('contact-form');
    const statusDiv = document.getElementById('form-status');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerHTML;
            
            // Loading State
            btn.disabled = true;
            btn.innerHTML = 'Sending...';
            statusDiv.textContent = '';
            statusDiv.className = 'form-status';

            // Gather Data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value,
                // NEW: Grab the token from the hidden input Turnstile creates
                token: document.querySelector('[name="cf-turnstile-response"]').value
            };

            try {
                // Send to Worker
                const response = await fetch('https://joonify-stats-worker.larsvlasveld11.workers.dev/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    statusDiv.textContent = "Message sent successfully! I'll be in touch soon.";
                    statusDiv.classList.add('success');
                    contactForm.reset();
                } else {
                    throw new Error(result.error || 'Failed to send');
                }
            } catch (error) {
                console.error(error);
                statusDiv.textContent = "Something went wrong. Please try again or email me directly.";
                statusDiv.classList.add('error');
            } finally {
                // Reset Button
                btn.disabled = false;
                btn.innerHTML = originalText;
                if(window.lucide) window.lucide.createIcons();
            }
        });
    }
    // --- Privacy Banner Logic ---
    const privacyBanner = document.getElementById('privacy-banner');
    const privacyAcceptBtn = document.getElementById('privacy-accept');
    
    // Check if user has already accepted
    const hasAccepted = localStorage.getItem('joonify-privacy-accepted');

    if (!hasAccepted && privacyBanner) {
        // Show after a small delay (polite)
        setTimeout(() => {
            privacyBanner.classList.add('visible');
        }, 1500);
    }

    if (privacyAcceptBtn) {
        privacyAcceptBtn.addEventListener('click', () => {
            // Save preference
            localStorage.setItem('joonify-privacy-accepted', 'true');
            // Hide banner
            privacyBanner.classList.remove('visible');
        });
    }
});

// --- Helper: Particle Animation ---
function initParticles(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Check if we are on the 404 page
    const is404 = document.body.classList.contains('page-404');

    // CONFIGURATION
    const config = is404 ? {
        color: 'rgba(239, 68, 68,', // Red for Error
        speedY_min: 1,              // Falling down speed (min)
        speedY_max: 3,              // Falling down speed (max)
        speedX_dev: 0.5,            // Slight horizontal drift
        connect: false              // Don't draw lines (makes it look like rain/debris)
    } : {
        color: 'rgba(173, 216, 230,', // Blue/Cyan for Normal
        speedY_min: -0.25,
        speedY_max: 0.25,
        speedX_dev: 0.25,
        connect: true               // Draw connection lines
    };

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
            
            // Logic for 404 vs Normal movement
            this.speedX = Math.random() * config.speedX_dev - (config.speedX_dev / 2);
            
            if (is404) {
                // Falling Down
                this.speedY = Math.random() * (config.speedY_max - config.speedY_min) + config.speedY_min; 
            } else {
                // Floating Randomly
                this.speedY = Math.random() * 0.5 - 0.25;
            }
            
            this.color = `${config.color} ${Math.random() * 0.5 + 0.2})`;
        }
        update() {
            this.x += this.speedX; 
            this.y += this.speedY;

            // Reset logic
            if (is404) {
                // If fell off bottom, reset to top
                if (this.y > canvas.height) {
                    this.y = 0;
                    this.x = Math.random() * canvas.width;
                }
            } else {
                // Bounce/Reset for normal page
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    this.x = Math.random() * canvas.width; 
                    this.y = Math.random() * canvas.height;
                }
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
        const numberOfParticles = Math.floor((canvas.width * canvas.height) / 10000);
        for (let i = 0; i < numberOfParticles; i++) particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
    };

    const connect = () => {
        // Only run connection logic if enabled
        if (!config.connect) return; 

        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const distance = Math.sqrt((particles[a].x - particles[b].x) ** 2 + (particles[a].y - particles[b].y) ** 2);
                if (distance < 100) {
                    ctx.strokeStyle = `${config.color} ${ (1 - distance / 100) * 0.5 })`;
                    ctx.lineWidth = 0.5; ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke();
                }
            }
        }
    };

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        connect();
        requestAnimationFrame(animate);
    };

    resizeCanvas(); init(); animate();
    window.addEventListener('resize', () => { resizeCanvas(); init(); });
}

// --- Helper: Scroll Animations ---
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-mounted');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animated-item').forEach(item => observer.observe(item));
}

// --- Helper: 3D Globe Logic ---
let world; 
function initGlobe() {
    const elem = document.getElementById('globe-viz');
    if(!elem) return;

    // Use try-catch in case Globe library is missing
    try {
        world = Globe()
            (elem)
            .backgroundColor('#000000') // Pure black background
            .width(window.innerWidth)
            .height(window.innerHeight)
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
            .pointAltitude(0.01)
            .pointColor('color')
            .pointRadius('size')
            .pointLabel('label')
            .atmosphereColor('#86efac')
            .atmosphereAltitude(0.15);

        world.controls().autoRotate = true;
        world.controls().autoRotateSpeed = 0.6;
    } catch(e) {
        console.error("Globe init failed:", e);
    }
}

function updateGlobeData(countryData) {
    if (!world || !countryData) return;

    console.log('Updating globe with:', countryData);

    const countryCoords = {
        "US": { lat: 37.09, lng: -95.71, name: "USA" },
        "NL": { lat: 52.13, lng: 5.29, name: "Netherlands" },
        "DE": { lat: 51.16, lng: 10.45, name: "Germany" },
        "GB": { lat: 55.37, lng: -3.43, name: "UK" },
        "FR": { lat: 46.22, lng: 2.21, name: "France" },
        "IN": { lat: 20.59, lng: 78.96, name: "India" },
        "CN": { lat: 35.86, lng: 104.19, name: "China" },
        "JP": { lat: 36.20, lng: 138.25, name: "Japan" },
        "BR": { lat: -14.23, lng: -51.92, name: "Brazil" },
        "AU": { lat: -25.27, lng: 133.77, name: "Australia" },
        "CA": { lat: 56.13, lng: -106.34, name: "Canada" },
        "RU": { lat: 61.52, lng: 105.31, name: "Russia" },
        // ... add more as needed
    };

    const points = [];
    
    const dataArray = Array.isArray(countryData) ? countryData : Object.entries(countryData).map(([code, count]) => ({ code, count }));
    
    dataArray.forEach(item => {
        const code = item.code || item.country;
        const count = item.count || item.visitors || 1;
        const coords = countryCoords[code];
        
        if (coords) {
            points.push({
                lat: coords.lat,
                lng: coords.lng,
                size: Math.max(0.3, Math.log(count + 1) * 0.6),
                color: '#86efac',
                label: `${coords.name}: ${count} visitor${count !== 1 ? 's' : ''}`
            });
        }
    });

    world.pointsData(points);
}

// --- WebSocket Logic (Shared) ---
function connectToStats(isMapPage) {
    const wsUrl = "wss://joonify-stats-worker.larsvlasveld11.workers.dev";
    
    const connect = () => {
        try {
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => console.log("Connected to Joonify stats.");
            
            socket.onmessage = (event) => {
                try {
                    const stats = JSON.parse(event.data);
                    
                    if (!isMapPage) {
                        updateStatOnPage(stats);
                    }
                    
                    if (isMapPage) {
                        const mapData = stats['map-data'] || stats.mapData;
                        if (mapData) updateGlobeData(mapData);
                        
                        if (stats['visitors-count']) {
                            const countEl = document.getElementById('map-visitor-count');
                            if(countEl) countEl.textContent = `${Math.floor(stats['visitors-count']).toLocaleString()} Visitors`;
                        }
                    }
                } catch (error) {
                    console.error("Data error:", error);
                }
            };

            socket.onclose = () => setTimeout(connect, 5000);
            socket.onerror = (e) => socket.close();
        } catch (e) { console.error("WS Error:", e); }
    };

    connect();
}

function updateStatOnPage(stats) {
    for (const key in stats) {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = Math.floor(stats[key]).toLocaleString();
        }
    }
}