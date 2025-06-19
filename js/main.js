import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL SETUP ---
    const body = document.body;
    const isMobile = window.innerWidth < 768;

    // --- 1. STABLE FLUID CURSOR EFFECT ---
    const canvas = document.getElementById('fluid-canvas');
    if (canvas && !isMobile) {
        const ctx = canvas.getContext('2d');
        let mouse = { x: -999, y: -999, vx: 0, vy: 0 };
        let particles = [];
        let hue = 0;

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        window.addEventListener('resize', resize);
        resize();

        window.addEventListener('mousemove', e => {
            mouse.vx = e.clientX - mouse.x;
            mouse.vy = e.clientY - mouse.y;
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(e.clientX, e.clientY, hue));
            }
        });

        function Particle(x, y, baseHue) {
            this.x = x; this.y = y;
            this.life = 0; this.maxLife = Math.random() * 60 + 40;
            this.vx = (Math.random() - 0.5) * 5 + mouse.vx * 0.2;
            this.vy = (Math.random() - 0.5) * 5 + mouse.vy * 0.2;
            this.radius = Math.random() * 15 + 10;
            this.color = `hsl(${baseHue + (Math.random() * 60 - 30)}, 100%, 70%)`;
        }

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hue = (hue + 1) % 360;
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy; p.life++;
                p.vx *= 0.96; p.vy *= 0.96;
                if (p.life >= p.maxLife) {
                    particles.splice(i, 1);
                } else {
                    const alpha = 1 - (p.life / p.maxLife);
                    ctx.beginPath();
                    ctx.fillStyle = p.color.replace(')', `, ${alpha * 0.6})`).replace('hsl', 'hsla');
                    ctx.arc(p.x, p.y, p.radius * (1 - p.life / p.maxLife), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            requestAnimationFrame(loop);
        }
        loop();
    }

    // --- 2. LOADER & THEME TOGGLE ---
    const loader = document.querySelector('.loader');
    if (loader) {
        const shapeWrapper = loader.querySelector('.loader-shape-wrapper');
        const shape = loader.querySelector('.loader-shape');
        const tl = gsap.timeline({
            paused: true,
            onComplete: () => {
                gsap.to(loader, { opacity: 0, duration: 0.5, onComplete: () => loader.style.display = 'none' });
                gsap.to(".main-header", { y: 0, opacity: 1, duration: 1, ease: 'power2.out' });
                body.classList.add('is-ready');
            }
        });
        tl.to(shape, { scaleX: 0.1, duration: 0.4, ease: 'power2.inOut' })
          .to(shape, { scaleX: 1, duration: 0.4, ease: 'power2.inOut' })
          .to(shapeWrapper, { duration: 0.6, ease: 'power2.inOut', rotate: 90 })
          .to(shape, { duration: 0.6, ease: 'power2.inOut', backgroundColor: 'var(--c-primary)', height: '100vh' }, "-=0.6")
          .to(shape, { duration: 0.8, ease: 'power2.in', width: '100vw' });
        window.addEventListener('load', () => tl.play());
    } else {
        body.classList.add('is-ready');
    }
    document.querySelector('.theme-switcher').addEventListener('click', () => { body.classList.toggle('light-mode'); body.classList.toggle('dark-mode'); });

    // --- 3. PARALLAX HERO ---
    gsap.timeline({
        scrollTrigger: { trigger: ".parallax-hero-section", start: "top top", end: "bottom top", scrub: true, pin: ".hero-sticky-content" }
    })
    .to(".hero-text-content", { opacity: 0, y: -50, ease: 'power1.in' })
    .to(".parallax-card", {
        x: (i, target) => (window.innerWidth / 2.5) * parseFloat(target.dataset.speedX),
        y: (i, target) => (-window.innerHeight / 2) * parseFloat(target.dataset.speedY),
        scale: 0.5, opacity: 0, ease: 'power1.in'
    }, 0);

    // --- 4. CAPABILITIES TABS ---
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
        const triggers = tabsContainer.querySelectorAll('.tab-trigger');
        const panes = tabsContainer.querySelectorAll('.tab-pane');
        const indicator = tabsContainer.querySelector('.tab-indicator');
        
        function moveIndicator(trigger) {
            gsap.to(indicator, { x: trigger.offsetLeft, width: trigger.offsetWidth, duration: 0.4, ease: 'power2.out' });
        }
        
        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const target = e.currentTarget;
                if (target.classList.contains('active')) return;

                const tabId = target.dataset.tab;
                const activePane = tabsContainer.querySelector('.tab-pane.active');
                const targetPane = tabsContainer.querySelector(`.tab-pane[data-tab="${tabId}"]`);

                triggers.forEach(t => t.classList.remove('active'));
                target.classList.add('active');
                
                const tl = gsap.timeline();
                tl.to(activePane, { x: '-=20px', opacity: 0, duration: 0.3, onComplete: () => activePane.classList.remove('active') })
                  .fromTo(targetPane, { x: '+=20px', opacity: 0 }, { x: '0px', opacity: 1, duration: 0.3, onStart: () => targetPane.classList.add('active') });
                  
                moveIndicator(target);
            });
        });
        moveIndicator(tabsContainer.querySelector('.tab-trigger.active'));
    }

    // --- 5. 3D INTERACTIVE GRID ---
    const threeContainer = document.getElementById('three-canvas-container');
    if (threeContainer && !isMobile) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        threeContainer.appendChild(renderer.domElement);

        const objects = [];
        const geometry = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2, metalness: 0.9 });
        
        for (let i = 0; i < 40; i++) {
            const mesh = new THREE.Mesh(geometry, material.clone());
            mesh.originalPosition = new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
            mesh.position.copy(mesh.originalPosition);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            objects.push(mesh);
            scene.add(mesh);
        }

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);
        camera.position.z = 12;
        
        const mouse = new THREE.Vector2(-99, -99);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const mousePoint = new THREE.Vector3();

        window.addEventListener('mousemove', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        function animate() {
            requestAnimationFrame(animate);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, mousePoint);
            
            objects.forEach(obj => {
                obj.rotation.y += 0.001;
                const dist = obj.position.distanceTo(mousePoint);
                const force = Math.max(0, 1 - dist / 5);
                const direction = new THREE.Vector3().subVectors(obj.position, mousePoint).normalize();
                const targetPosition = new THREE.Vector3().copy(obj.originalPosition).add(direction.multiplyScalar(force * 2));
                gsap.to(obj.position, { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z, duration: 1, ease: 'power2.out' });
            });
            renderer.render(scene, camera);
        }
        animate();
    }

    // --- 6. WORK SECTION ---
    const workSection = document.querySelector('.work-section');
    if (workSection && !isMobile) {
        const horizontalContainer = workSection.querySelector('.work-horizontal-container');
        const slides = gsap.utils.toArray(".work-slide");
        const counter = workSection.querySelector('.project-counter');
        
        let scrollTween = gsap.to(horizontalContainer, {
            x: () => -(horizontalContainer.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: { trigger: workSection, pin: '.work-sticky-wrapper', scrub: 1, end: () => "+=" + (horizontalContainer.scrollWidth - window.innerWidth) }
        });
        
        slides.forEach((slide, i) => {
            const wipe = slide.closest('.work-sticky-wrapper').querySelector('.diagonal-wipe');
            ScrollTrigger.create({
                trigger: slide, containerAnimation: scrollTween, start: "left center", end: "right center", onToggle: self => self.isActive && updateWorkSection(i)
            });
            
            if (i < slides.length - 1) {
                const nextSlide = slides[i+1];
                ScrollTrigger.create({
                    trigger: slide, containerAnimation: scrollTween, start: 'center left', end: 'right left', scrub: true,
                    onUpdate: self => {
                        const isDark = body.classList.contains('dark-mode');
                        const nextBgColor = isDark ? nextSlide.dataset.bgColorDark : nextSlide.dataset.bgColorLight;
                        if(wipe) wipe.style.backgroundColor = nextBgColor;
                        let p = self.progress * 150;
                        if(wipe) wipe.style.clipPath = `polygon(${p - 50}% 0, ${p}% 0, ${p - 100}% 100%, ${p - 150}% 100%)`;
                    }
                });
            }
        });
        
        function updateWorkSection(index) {
            const slide = slides[index];
            const isDark = body.classList.contains('dark-mode');
            const newBg = isDark ? slide.dataset.bgColorDark : slide.dataset.bgColorLight;
            gsap.to(counter, { 
                y: '-100%', opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: () => {
                    counter.textContent = `0${index + 1}`;
                    gsap.fromTo(counter, { y: '100%', opacity: 0 }, { y: '0%', opacity: 1, duration: 0.4, ease: 'power2.out' });
                }
            });
            gsap.to(workSection, { backgroundColor: newBg, duration: 0.8, ease: 'none' });
        }

        document.querySelectorAll('.oribe-hover').forEach(c => {
            const v = c.querySelector('video');
            if(v) { c.addEventListener('mouseenter', () => v.play().catch(()=>{})); c.addEventListener('mouseleave', () => v.pause()); }
        });
    }

    // --- 7. 3D TESTIMONIALS ---
    const testimonialGroup = document.querySelector('.testimonial-group');
    if (testimonialGroup && !isMobile) {
        testimonialGroup.parentElement.addEventListener('mousemove', (e) => {
            let x = (e.clientX / window.innerWidth - 0.5) * 2;
            let y = (e.clientY / window.innerHeight - 0.5) * 2;
            gsap.to(testimonialGroup, { duration: 1, rotateY: x * 5, rotateX: -y * 5, ease: 'power2.out' });
        });
    }
});