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

    // --- Contact Form Logic ---
    const contactForm = document.getElementById('contact-form');
    const statusDiv = document.getElementById('form-status');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerHTML;
            
            // 1. Loading State
            btn.disabled = true;
            btn.innerHTML = 'Sending...';
            statusDiv.textContent = '';
            statusDiv.className = 'form-status';

            // 2. Gather Data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };

            try {
                // 3. Send to Worker
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
                // 4. Reset Button
                btn.disabled = false;
                btn.innerHTML = originalText;
                if(window.lucide) window.lucide.createIcons(); // Re-render icon
            }
        });
    }
});

// --- Helper: Particle Animation ---
function initParticles(canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    
    class Particle {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `rgba(173, 216, 230, ${Math.random() * 0.5 + 0.2})`;
        }
        update() {
            this.x += this.speedX; this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
            }
        }
        draw() {
            ctx.fillStyle = this.color; ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
    }

    const init = () => {
        particles = [];
        const numberOfParticles = Math.floor((canvas.width * canvas.height) / 10000);
        for (let i = 0; i < numberOfParticles; i++) particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
    };

    const connect = () => {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const distance = Math.sqrt((particles[a].x - particles[b].x) ** 2 + (particles[a].y - particles[b].y) ** 2);
                if (distance < 100) {
                    ctx.strokeStyle = `rgba(173, 216, 230, ${ (1 - distance / 100) * 0.5 })`;
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
    
    // Note: Joonify title scroll animation removed since hero is now at top
}

// --- Helper: 3D Globe Logic ---
let world; 
function initGlobe() {
    const elem = document.getElementById('globe-viz');
    if(!elem) return;

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
}

function updateGlobeData(countryData) {
    if (!world) {
        console.warn('Globe not initialized yet');
        return;
    }
    
    if (!countryData) {
        console.warn('No country data received');
        return;
    }

    console.log('Received country data:', countryData);

    // Expanded mapping for more countries
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
        "ES": { lat: 40.46, lng: -3.74, name: "Spain" },
        "IT": { lat: 41.87, lng: 12.56, name: "Italy" },
        "MX": { lat: 23.63, lng: -102.55, name: "Mexico" },
        "AR": { lat: -38.41, lng: -63.61, name: "Argentina" },
        "ZA": { lat: -30.55, lng: 22.93, name: "South Africa" },
        "KR": { lat: 35.90, lng: 127.76, name: "South Korea" },
        "SE": { lat: 60.12, lng: 18.64, name: "Sweden" },
        "NO": { lat: 60.47, lng: 8.46, name: "Norway" },
        "PL": { lat: 51.91, lng: 19.14, name: "Poland" },
        "BE": { lat: 50.50, lng: 4.47, name: "Belgium" },
        "CH": { lat: 46.81, lng: 8.22, name: "Switzerland" },
        "AT": { lat: 47.51, lng: 14.55, name: "Austria" },
        "DK": { lat: 56.26, lng: 9.50, name: "Denmark" },
        "FI": { lat: 61.92, lng: 25.74, name: "Finland" },
        "IE": { lat: 53.41, lng: -8.24, name: "Ireland" },
        "PT": { lat: 39.39, lng: -8.22, name: "Portugal" },
        "GR": { lat: 39.07, lng: 21.82, name: "Greece" },
        "TR": { lat: 38.96, lng: 35.24, name: "Turkey" },
        "IL": { lat: 31.04, lng: 34.85, name: "Israel" },
        "SG": { lat: 1.35, lng: 103.81, name: "Singapore" },
        "TH": { lat: 15.87, lng: 100.99, name: "Thailand" },
        "ID": { lat: -0.78, lng: 113.92, name: "Indonesia" },
        "MY": { lat: 4.21, lng: 101.97, name: "Malaysia" },
        "PH": { lat: 12.87, lng: 121.77, name: "Philippines" },
        "VN": { lat: 14.05, lng: 108.27, name: "Vietnam" },
        "NZ": { lat: -40.90, lng: 174.88, name: "New Zealand" },
        "CL": { lat: -35.67, lng: -71.54, name: "Chile" },
        "CO": { lat: 4.57, lng: -74.29, name: "Colombia" },
        "PE": { lat: -9.18, lng: -75.01, name: "Peru" },
        "EG": { lat: 26.82, lng: 30.80, name: "Egypt" },
        "NG": { lat: 9.08, lng: 8.67, name: "Nigeria" },
        "KE": { lat: -0.02, lng: 37.90, name: "Kenya" },
        "AE": { lat: 23.42, lng: 53.84, name: "UAE" },
        "SA": { lat: 23.88, lng: 45.07, name: "Saudi Arabia" },
        "CZ": { lat: 49.81, lng: 15.47, name: "Czech Republic" },
        "RO": { lat: 45.94, lng: 24.96, name: "Romania" },
        "HU": { lat: 47.16, lng: 19.50, name: "Hungary" },
        "UA": { lat: 48.37, lng: 31.16, name: "Ukraine" }
    };

    const points = [];
    
    // Handle both array and object formats
    const dataArray = Array.isArray(countryData) ? countryData : Object.entries(countryData).map(([code, count]) => ({ code, count }));
    
    dataArray.forEach(item => {
        const code = item.code || item.country || item.countryCode;
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
        } else {
            console.log(`No coordinates found for country code: ${code}`);
        }
    });

    console.log(`Displaying ${points.length} points on globe`);
    world.pointsData(points);
}

// --- WebSocket Logic (Shared) ---
function connectToStats(isMapPage) {
    // REPLACE WITH YOUR WORKER URL
    const wsUrl = "wss://joonify-stats-worker.larsvlasveld11.workers.dev";
    
    // Simple reconnect logic
    const connect = () => {
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => console.log("Connected to Joonify stats.");
        
        socket.onmessage = (event) => {
            try {
                const stats = JSON.parse(event.data);
                console.log('Received stats:', stats);
                
                // 1. Update Homepage Stats
                if (!isMapPage) {
                    updateStatOnPage(stats);
                }
                
                // 2. Update Map Page Stats
                if (isMapPage) {
                    // Try multiple possible keys for map data
                    const mapData = stats['map-data'] || stats.mapData || stats.countries || stats.countryData;
                    
                    if (mapData) {
                        console.log('Found map data:', mapData);
                        updateGlobeData(mapData);
                    } else {
                        console.warn('No map data found in stats. Available keys:', Object.keys(stats));
                    }
                    
                    if (stats['visitors-count']) {
                        const countEl = document.getElementById('map-visitor-count');
                        if(countEl) countEl.textContent = `${stats['visitors-count'].toLocaleString()} Visitors`;
                    }
                }
            } catch (error) {
                console.error("Data error:", error);
            }
        };

        socket.onclose = () => setTimeout(connect, 5000);
        socket.onerror = (e) => socket.close();
    };

    connect();
}

function updateStatOnPage(stats) {
    for (const key in stats) {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = stats[key].toLocaleString();
        }
    }
}