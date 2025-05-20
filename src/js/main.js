import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as TWEEN from '@tweenjs/tween.js';

// Global variables
let scene, camera, renderer, controls;
let stars, starsMaterial;
let planetObjects = [];
let isDarkMode = false;
let lastTime = 0;
const planetSpeed = 0.5;

// Initialize the scene
function initScene() {
    try {
        // Scene setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 1);
        
        const container = document.getElementById('container');
        if (!container) throw new Error('Container element not found');
        container.appendChild(renderer.domElement);
        
        // Initialize OrbitControls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 150;
        controls.maxPolarAngle = Math.PI / 1.5;
        
        return true;
    } catch (error) {
        console.error('Error initializing scene:', error);
        return false;
    }
}

// Create starfield
function createStarfield() {
    try {
        const starsGeometry = new THREE.BufferGeometry();
        starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        const starsVertices = [];
        for (let i = 0; i < 3000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);
        return true;
    } catch (error) {
        console.error('Error creating starfield:', error);
        return false;
    }
}

// Create planets
function createPlanets() {
    try {
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
        
        // Create sun
        const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: false
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);
        
        // Add sun light
        const sunLight = new THREE.PointLight(0xffffff, 1, 200);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x333333);
        scene.add(ambientLight);
        
        return true;
    } catch (error) {
        console.error('Error creating planets:', error);
        return false;
    }
}

// Animation loop
function animate(currentTime = 0) {
    requestAnimationFrame(animate);
    
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update animations
    TWEEN.update();
    
    // Rotate planets
    planetObjects.forEach(planet => {
        if (planet && planet.mesh) {
            // Rotate planet on its axis
            planet.mesh.rotation.y += (planet.rotationSpeed || 0.01) * deltaTime * 60;
            
            // Orbit around the sun
            const angle = (currentTime * 0.001 * (planet.speed || 0.01)) % (Math.PI * 2);
            planet.mesh.position.x = Math.cos(angle) * (planet.distance || 10);
            planet.mesh.position.z = Math.sin(angle) * (planet.distance || 10);
            
            // Slight vertical offset for natural look
            planet.mesh.position.y = Math.sin(currentTime * 0.001 * (planet.speed || 0.01) * 0.5) * 0.5;
        }
    });
    
    // Rotate starfield
    if (stars) {
        stars.rotation.y += 0.0001;
    }
    
    // Update controls
    if (controls) {
        controls.update();
    }
    
    // Render scene
    if (scene && camera) {
        renderer.render(scene, camera);
    }
}

// Handle window resize
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the application
function initApp() {
    const loadingElement = document.getElementById('loading');
    
    try {
        // Initialize scene
        if (!initScene()) throw new Error('Failed to initialize scene');
        
        // Create starfield
        if (!createStarfield()) console.warn('Failed to create starfield');
        
        // Create planets and sun
        if (!createPlanets()) throw new Error('Failed to create planets');
        
        // Position camera
        camera.position.z = 70;
        camera.position.y = 20; // Slight angle for better view
        
        // Add event listeners
        window.addEventListener('resize', onWindowResize, false);
        
        // Start animation loop
        requestAnimationFrame(animate);
        
        // Hide loading screen
        if (loadingElement) {
            loadingElement.style.opacity = '0';
            setTimeout(() => {
                loadingElement.style.display = 'none';
            }, 500);
        }
        
        console.log('Application initialized successfully');
        return true;
        
    } catch (error) {
        console.error('Error initializing application:', error);
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="color: red; text-align: center; margin-top: 20px;">
                    <h2>Error loading the 3D viewer</h2>
                    <p>${error.message}</p>
                    <p>Please try refreshing the page or check the console for more details.</p>
                </div>`;
        }
        return false;
    }
}

// Start the application when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
