import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as TWEEN from '@tweenjs/tween.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get the loading element
    const loadingElement = document.getElementById('loading');
    
    try {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0xf0f0f0, 1); // Warna background lebih terang
        
        const container = document.getElementById('container');
        container.appendChild(renderer.domElement);
        
        // Initialize OrbitControls early to avoid reference errors
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 150;
        controls.maxPolarAngle = Math.PI / 1.5;

        // Add a simple starfield background with darker stars
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0x555555,  // Darker stars for better contrast
            size: 0.15,       // Slightly larger stars
            transparent: true,
            opacity: 0.8
        });
        
        const starsVertices = [];
        for (let i = 0; i < 5000; i++) {  // Fewer stars for a cleaner look
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);
        
        // Animation variables
        let lastTime = 0;
        const planetSpeed = 0.5;
        let isDarkMode = false;
        
        // Planet objects
        const planetObjects = [];
        
        // Dark mode toggle button
        const darkModeToggle = document.createElement('button');
        darkModeToggle.textContent = '🌙 Dark Mode';
        darkModeToggle.style.position = 'fixed';
        darkModeToggle.style.top = '20px';
        darkModeToggle.style.right = '20px';
        darkModeToggle.style.padding = '10px 15px';
        darkModeToggle.style.border = 'none';
        darkModeToggle.style.borderRadius = '20px';
        darkModeToggle.style.background = '#333';
        darkModeToggle.style.color = '#fff';
        darkModeToggle.style.cursor = 'pointer';
        darkModeToggle.style.zIndex = '1000';
        darkModeToggle.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        document.body.appendChild(darkModeToggle);
        
        // Toggle dark mode function
        function toggleDarkMode() {
            isDarkMode = !isDarkMode;
            
            if (isDarkMode) {
                // Switch to dark mode
                document.body.style.backgroundColor = '#000';
                document.body.style.color = '#fff';
                renderer.setClearColor(0x000000, 1);
                darkModeToggle.textContent = '☀️ Light Mode';
                darkModeToggle.style.background = '#fff';
                darkModeToggle.style.color = '#333';
                
                // Update star visibility
                starsMaterial.color.set(0xffffff);
                starsMaterial.opacity = 0.8;
            } else {
                // Switch to light mode
                document.body.style.backgroundColor = '#f0f0f0';
                document.body.style.color = '#333';
                renderer.setClearColor(0xf0f0f0, 1);
                darkModeToggle.textContent = '🌙 Dark Mode';
                darkModeToggle.style.background = '#333';
                darkModeToggle.style.color = '#fff';
                
                // Update star visibility
                starsMaterial.color.set(0x555555);
                starsMaterial.opacity = 0.5;
            }
        }
        
        // Add event listener for dark mode toggle
        darkModeToggle.addEventListener('click', toggleDarkMode);
        
        // Add a sun
        const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: false
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);
        
        // Planet data
        const planetData = [
            { name: 'mercury', radius: 0.4, distance: 7, color: 0xA0522D, speed: 0.02, rotationSpeed: 0.01 },
            { name: 'venus', radius: 0.6, distance: 10, color: 0xDEB887, speed: 0.015, rotationSpeed: 0.008 },
            { name: 'earth', radius: 0.6, distance: 15, color: 0x1E90FF, speed: 0.01, rotationSpeed: 0.01 },
            { name: 'mars', radius: 0.4, distance: 20, color: 0xFF4500, speed: 0.008, rotationSpeed: 0.009 },
            { name: 'jupiter', radius: 1.2, distance: 30, color: 0xDAA520, speed: 0.004, rotationSpeed: 0.02 },
            { name: 'saturn', radius: 1.0, distance: 40, color: 0xF4A460, speed: 0.003, rotationSpeed: 0.015, hasRings: true },
            { name: 'uranus', radius: 0.8, distance: 50, color: 0x87CEEB, speed: 0.002, rotationSpeed: 0.008 },
            { name: 'neptune', radius: 0.8, distance: 60, color: 0x4169E1, speed: 0.001, rotationSpeed: 0.007 }
        ];
        
        // Create planets
        planetData.forEach(planetInfo => {
            // Create planet
            const geometry = new THREE.SphereGeometry(planetInfo.radius, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: planetInfo.color,
                shininess: 5,
                wireframe: false
            });
            
            const planet = new THREE.Mesh(geometry, material);
            
            // Add rings for Saturn
            if (planetInfo.hasRings) {
                const ringGeometry = new THREE.RingGeometry(
                    planetInfo.radius * 1.5,
                    planetInfo.radius * 2.2,
                    32
                );
                const ringMaterial = new THREE.MeshPhongMaterial({
                    color: 0xDAA520,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                planet.add(ring);
            }
            
            // Position planet in orbit
            const angle = Math.random() * Math.PI * 2;
            planet.position.x = Math.cos(angle) * planetInfo.distance;
            planet.position.z = Math.sin(angle) * planetInfo.distance;
            
            scene.add(planet);
            planetObjects.push({
                mesh: planet,
                speed: planetInfo.speed,
                distance: planetInfo.distance,
                rotationSpeed: planetInfo.rotationSpeed
            });
            
            // Add orbit line
            const orbitGeometry = new THREE.BufferGeometry();
            const orbitPoints = [];
            const segments = 64;
            
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                orbitPoints.push(
                    new THREE.Vector3(
                        Math.cos(theta) * planetInfo.distance,
                        0,
                        Math.sin(theta) * planetInfo.distance
                    )
                );
            }
            
            orbitGeometry.setFromPoints(orbitPoints);
            const orbitMaterial = new THREE.LineBasicMaterial({
                color: 0x555555,
                transparent: true,
                opacity: 0.3
            });
            
            const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
            scene.add(orbit);
        });
        
        // Add a rocket
        const rocketGeometry = new THREE.ConeGeometry(0.1, 0.5, 32);
        const rocketMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 5,
            wireframe: false
        });
        const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
        const rocketGroup = new THREE.Group();
        rocketGroup.add(rocket);
        scene.add(rocketGroup);
        let rocketAngle = 0;
        const rocketSpeed = 0.01;
        const rocketOrbitRadius = 15;
        
        // Add an asteroid belt
        const asteroidGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        const asteroidMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
            shininess: 5,
            wireframe: false
        });
        const asteroidCount = 100;
        for (let i = 0; i < asteroidCount; i++) {
            const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
            asteroid.position.set(Math.random() * 10 - 5, Math.random() * 2 - 1, Math.random() * 10 - 5);
            scene.add(asteroid);
        }
        
        // Animation loop
        function animate(currentTime) {
            requestAnimationFrame(animate);
            
            const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
            lastTime = currentTime;
            
            // Animate planets
            planetObjects.forEach(planet => {
                // Rotate planet on its axis
                if (planet.rotationSpeed) {
                    planet.mesh.rotation.y += planet.rotationSpeed;
                }
                
                // Orbit around the sun
                const angle = (currentTime * 0.001 * planet.speed) % (Math.PI * 2);
                planet.mesh.position.x = Math.cos(angle) * planet.distance;
                planet.mesh.position.z = Math.sin(angle) * planet.distance;
                
                // Slight vertical offset for more natural look
                planet.mesh.position.y = Math.sin(currentTime * 0.001 * planet.speed * 0.5) * 0.5;
            });
            
            // Rotate the starfield slightly
            if (stars) {
                stars.rotation.y += 0.0001;
            }
            
            // Animate rocket
            rocketAngle += rocketSpeed;
            rocketGroup.position.x = Math.cos(rocketAngle) * rocketOrbitRadius;
            rocketGroup.position.z = Math.sin(rocketAngle) * rocketOrbitRadius;
            rocketGroup.lookAt(0, 0, 0);
            rocketGroup.rotateY(Math.PI);
            
            // Update controls
            controls.update();
            
            // Render the scene
            renderer.render(scene, camera);
        }
        
        // OrbitControls already declared at the top
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x333333);
        scene.add(ambientLight);
        
        // Add directional light (sun)
        const sunLight = new THREE.PointLight(0xffffff, 1, 200);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);
        
        // Position camera
        camera.position.z = 70;
        camera.position.y = 20; // Slight angle for better view
        
        // Handle window resize
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        // Add event listener for window resize
        window.addEventListener('resize', onWindowResize, false);
        
        // Start animation loop
        requestAnimationFrame(animate);
        
        // Hide loading screen after a short delay to ensure everything is loaded
        setTimeout(() => {
            if (loadingElement) {
                loadingElement.style.opacity = '0';
                setTimeout(() => {
                    loadingElement.style.display = 'none';
                }, 500);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error initializing 3D scene:', error);
        if (loadingElement) {
            loadingElement.innerHTML = '<p style="color: red;">Error loading the 3D viewer. Please try refreshing the page.</p>';
        }
    }
});
