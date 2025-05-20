import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
            alpha: true
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 1);
        
        const container = document.getElementById('container');
        container.appendChild(renderer.domElement);

        // Add a simple starfield background
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true
        });
        
        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);
        
        // Add a sun
        const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: false
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);
        
        // Add a planet
        const planetGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const planetMaterial = new THREE.MeshPhongMaterial({
            color: 0x3498db,
            shininess: 5,
            wireframe: false
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.set(5, 0, 0);
        scene.add(planet);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x333333);
        scene.add(ambientLight);
        
        // Add directional light (sun)
        const sunLight = new THREE.PointLight(0xffffff, 1, 100);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);
        
        // Position camera
        camera.position.z = 10;
        
        // Add OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 3;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI / 2;
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);
        
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        // Animation variables
        let lastTime = 0;
        const planetSpeed = 0.5;
        
        // Animation loop
        function animate(currentTime) {
            requestAnimationFrame(animate);
            
            const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
            lastTime = currentTime;
            
            // Rotate the planet around the sun
            if (planet) {
                planet.rotation.y += 0.01;
                const angle = (currentTime * 0.001 * planetSpeed) % (Math.PI * 2);
                planet.position.x = Math.cos(angle) * 5;
                planet.position.z = Math.sin(angle) * 5;
            }
            
            // Rotate the starfield slightly
            if (stars) {
                stars.rotation.y += 0.0001;
            }
            
            // Update controls
            controls.update();
            
            // Render the scene
            renderer.render(scene, camera);
        }
        
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
