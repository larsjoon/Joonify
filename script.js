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
    if (typeof lucide !== 'undefined') lucide.createIcons();
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
    if (!world || !countryData) return;

    // Mapping for major countries - You can expand this list
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
        "RU": { lat: 61.52, lng: 105.31, name: "Russia" }
    };

    const points = [];
    countryData.forEach(item => {
        const coords = countryCoords[item.code];
        if (coords) {
            points.push({
                lat: coords.lat,
                lng: coords.lng,
                size: Math.max(0.2, Math.log(item.count + 1) * 0.5),
                color: '#86efac',
                label: `${coords.name}: ${item.count}`
            });
        }
    });

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
                
                // 1. Update Homepage Stats
                if (!isMapPage) {
                    updateStatOnPage(stats);
                }
                
                // 2. Update Map Page Stats
                if (isMapPage) {
                    if (stats['map-data']) updateGlobeData(stats['map-data']);
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