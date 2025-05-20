import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import * as CANNON from 'cannon-es';
import TWEEN from '@tweenjs/tween.js';
import { audioManager } from './audio.js';

// Camera tracking variables
let followingTarget = false;
let currentTarget = null;
let previousCameraPosition = null; // For velocity calculation

// Initialize loaders and managers
// Global flags to track loading and animation state
let assetsLoaded = false;
let appInitialized = false;
let animationLoopActive = false; // Flag to prevent multiple animation loops

// Initialize clock for animations and time-based effects
const clock = new THREE.Clock();

// Ensure loading screen is visible first
const loadingScreenInit = document.querySelector('.loading-screen');
if (loadingScreenInit) {
  loadingScreenInit.style.display = 'flex';
  loadingScreenInit.classList.remove('hidden');
  console.log('Loading screen initialized and visible');
}

const loadingManager = new THREE.LoadingManager(
  // onLoad
  () => {
    console.log('THREE.js LoadingManager: All assets loaded!');
    assetsLoaded = true;
    startMainExperience();
  },
  // onProgress
  (url, itemsLoaded, itemsTotal) => {
    console.log(`Loading file: ${url}. ${itemsLoaded}/${itemsTotal} files.`);
    const loadingText = document.querySelector('.loading-screen p');
    if (loadingText) {
      loadingText.textContent = `Loading Galaxy Explorer: ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
    }
  },
  // onError
  (url) => {
    console.error(`Error loading ${url}`);
    // Continue anyway after errors
    if (appInitialized) {
      hideLoadingScreen();
    }
  }
);

const textureLoader = new THREE.TextureLoader(loadingManager);
const fontLoader = new FontLoader(loadingManager);

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e); // Darker blue-black

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 80, 200); // Set initial camera position

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Define logScenePopulation for debugging scene population
function logScenePopulation(label) {
  console.log(`Scene Population Log: ${label}`);
}

// Renderer setup
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: 'high-performance',
  alpha: true,
  canvas: document.createElement('canvas')
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Append renderer to container or directly to body if container not found
const container = document.getElementById('container');
if (container) {
  container.appendChild(renderer.domElement);
} else {
  document.body.appendChild(renderer.domElement);
  console.warn('Container element not found, appending to body');
}

// Define hideLoadingScreen function for use throughout the app
const hideLoadingScreen = () => {
  console.log('Hiding loading screen');
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500); // Match this with CSS transition duration
  }
};

let mainExperienceHasStarted = false;
let initialLoadingTimeout = null; // Renamed from loadingTimeout to avoid conflict with the one inside startMainExperience

function startMainExperience() {
  if (mainExperienceHasStarted) {
    console.log('Main experience already started, skipping.');
    return;
  }
  mainExperienceHasStarted = true;
  console.log('Starting main experience...');

  hideLoadingScreen();

  // Initialize and start audio
  if (!audioManager.isInitialized) { // Safety check
    console.log('Initializing audio system (startMainExperience)');
    audioManager.init();
  }
  if (!audioManager.isMuted) {
    console.log('Starting ambient music (startMainExperience)');
    audioManager.startAmbient();
  }

  // Ensure camera is focused
  resetCameraView(0);

  // Start animation loop will be triggered later after initialization completes to ensure all objects (e.g., planets) are defined before animate() runs.
  console.log('Animation loop will start after full initialization.');

  // Clear the initial loading timeout if it's still pending
  if (initialLoadingTimeout) {
    clearTimeout(initialLoadingTimeout);
    initialLoadingTimeout = null; 
    console.log('Initial loadingTimeout cleared by startMainExperience.');
  }
}

// Initialize audio system properly
audioManager.init();

// Set maximum loading time - reduced as requested to make loading faster
const maxLoadingTime = 5000; // 5 seconds max loading time
initialLoadingTimeout = setTimeout(() => { 
  console.log('Safety timeout reached. Starting main experience regardless.');
  startMainExperience();
}, maxLoadingTime);

// Initialize audio early
audioManager.init();

// Enhanced Performance monitoring with modern UI
const stats = new Stats();
stats.dom.style.position = 'absolute';
stats.dom.style.top = '10px';
stats.dom.style.left = '10px';
stats.dom.style.zIndex = '1900';
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

// Get the canvas from stats and scale it up for better visibility
const statsCanvas = stats.dom.querySelector('canvas');
if (statsCanvas) {
  statsCanvas.style.width = '100px';
  statsCanvas.style.height = '50px';
}

// Create custom container for stats with futuristic styling
const statsContainer = document.createElement('div');
statsContainer.className = 'stats-container';
statsContainer.style.position = 'absolute';
statsContainer.style.top = '10px';
statsContainer.style.left = '10px';
statsContainer.style.padding = '5px';
statsContainer.style.backgroundColor = 'rgba(0, 20, 40, 0.75)';
statsContainer.style.backdropFilter = 'blur(8px)';
statsContainer.style.borderRadius = '10px';
statsContainer.style.border = '1px solid rgba(0, 150, 255, 0.5)';
statsContainer.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.6)';
statsContainer.style.zIndex = '1900';
statsContainer.style.overflow = 'hidden';
statsContainer.style.transition = 'all 0.3s ease';
statsContainer.style.width = '100px';
statsContainer.style.height = '60px';
statsContainer.style.display = 'flex';
statsContainer.style.flexDirection = 'column';
statsContainer.style.justifyContent = 'center';
statsContainer.style.alignItems = 'center';

// Add the stats into the custom container
statsContainer.appendChild(stats.dom);
document.body.appendChild(statsContainer);

// Create FPS label
const fpsLabel = document.createElement('div');
fpsLabel.className = 'fps-label';
fpsLabel.innerText = 'FPS';
fpsLabel.style.position = 'absolute';
fpsLabel.style.top = '5px';
fpsLabel.style.right = '10px';
fpsLabel.style.color = '#00ccff';
fpsLabel.style.fontSize = '14px';
fpsLabel.style.fontWeight = 'bold';
fpsLabel.style.fontFamily = "'Orbitron', sans-serif";
fpsLabel.style.textShadow = '0 0 5px rgba(0, 204, 255, 0.8)';
statsContainer.appendChild(fpsLabel);

// Camera controls with enhanced options
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.8;
controls.panSpeed = 0.5;
controls.enablePan = true; // Allow panning
controls.enableKeys = true; // Enable keyboard controls
controls.keyPanSpeed = 10; // Speed of keyboard panning
controls.maxDistance = 2500; // Increase max zoom out for better exploration
controls.minDistance = 5; // Limit zoom in
controls.target.set(0, 0, 0); // Initially target the sun

// Current planet index for navigation
let currentPlanetIndex = -1; // -1 means focus on sun, 0-7 for planets

// Variable to track which planet camera should follow
let targetPlanetToFollow = null;

// Create navigation controls for planet cycling
function createNavigationControls() {
  // Base navigation controls div - for essential controls only
  const navigationDiv = document.createElement('div');
  navigationDiv.className = 'navigation-controls';
  navigationDiv.style.position = 'fixed';
  navigationDiv.style.bottom = '20px';
  navigationDiv.style.right = '20px';
  navigationDiv.style.display = 'flex';
  navigationDiv.style.flexDirection = 'column';
  navigationDiv.style.gap = '10px';
  navigationDiv.style.zIndex = '1000';
  navigationDiv.style.maxHeight = '70vh';
  navigationDiv.style.overflowY = 'auto';
  
  // Initially hide all buttons and only show essential controls
  document.querySelectorAll('.space-control-button').forEach(button => {
    button.remove();
  });
  
  // Navigation and control buttons container
  // Create a burger menu button
  const burgerButton = document.createElement('button');
  burgerButton.innerHTML = '☰';
  burgerButton.className = 'burger-menu-button';
  burgerButton.style.width = '40px';
  burgerButton.style.height = '40px';
  burgerButton.style.fontSize = '20px';
  burgerButton.style.cursor = 'pointer';
  burgerButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  burgerButton.style.color = 'white';
  burgerButton.style.border = '1px solid rgba(255, 255, 255, 0.3)';
  burgerButton.style.borderRadius = '50%';
  burgerButton.style.position = 'absolute';
  burgerButton.style.top = '10px';
  burgerButton.style.right = '10px';
  burgerButton.style.zIndex = '2000';
  burgerButton.style.boxShadow = '0 0 10px rgba(0, 150, 255, 0.5)';
  burgerButton.title = 'Toggle Navigation Menu';

  // Create menu container
  const menuContainer = document.createElement('div');
  menuContainer.className = 'menu-container';
  menuContainer.style.position = 'fixed';
  menuContainer.style.top = '60px';
  menuContainer.style.right = '10px';
  menuContainer.style.backgroundColor = 'rgba(0, 10, 30, 0.85)';
  menuContainer.style.backdropFilter = 'blur(10px)';
  menuContainer.style.padding = '10px';
  menuContainer.style.borderRadius = '10px';
  menuContainer.style.boxShadow = '0 0 20px rgba(0, 150, 255, 0.3)';
  menuContainer.style.zIndex = '1999';
  menuContainer.style.display = 'none';
  menuContainer.style.flexDirection = 'column';
  menuContainer.style.gap = '10px';
  menuContainer.style.maxHeight = '80vh';
  menuContainer.style.overflowY = 'auto';
  menuContainer.style.border = '1px solid rgba(0, 150, 255, 0.3)';
  
  // Initially hide menu container
  menuContainer.style.display = 'none';
  
  // Toggle menu visibility with notification
  burgerButton.addEventListener('click', () => {
    const isVisible = menuContainer.style.display === 'flex';
    menuContainer.style.display = isVisible ? 'none' : 'flex';
    
    // Show notification based on menu state
    if (!isVisible) {
      showNotification('Categories menu opened', 'info');
    } else {
      showNotification('Categories menu closed', 'info');
    }
    
    audioManager.playSound('click');
  });
  
  // Create category containers
  const createCategoryContainer = (title) => {
    const container = document.createElement('div');
    container.className = 'category-container';
    container.style.marginBottom = '15px';
    
    const categoryTitle = document.createElement('div');
    categoryTitle.innerHTML = title;
    categoryTitle.style.color = '#00ccff';
    categoryTitle.style.fontWeight = 'bold';
    categoryTitle.style.borderBottom = '1px solid rgba(0, 150, 255, 0.5)';
    categoryTitle.style.paddingBottom = '5px';
    categoryTitle.style.marginBottom = '8px';
    categoryTitle.style.fontSize = '14px';
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexWrap = 'wrap';
    buttonsContainer.style.gap = '5px';
    
    container.appendChild(categoryTitle);
    container.appendChild(buttonsContainer);
    
    return { container, buttonsContainer };
  };

  // Create category containers
  const planetCategory = createCategoryContainer('PLANETS & SUN');
  const spaceObjectsCategory = createCategoryContainer('SPACE OBJECTS');
  const controlsCategory = createCategoryContainer('CONTROLS & NAVIGATION');
  
  menuContainer.appendChild(planetCategory.container);
  menuContainer.appendChild(spaceObjectsCategory.container);
  menuContainer.appendChild(controlsCategory.container);
  
  // Direction buttons for cycling through planets 
  const directions = [
    // Essential Navigation Controls (in main navigation bar)
    { name: 'prev-planet', symbol: '🪐⬅️', action: 'prev-planet', category: 'controls', title: 'Previous Planet' },
    { name: 'next-planet', symbol: '🪐➡️', action: 'next-planet', category: 'controls', title: 'Next Planet' },
    { name: 'reset-camera', symbol: '🔄', action: 'reset-camera', category: 'controls', title: 'Reset View' },
    { name: 'reload-sim', symbol: '⟳', action: 'reload-simulation', category: 'controls', title: 'Reload Simulation' },
    { name: 'free-camera', symbol: '🎥', action: 'free-camera', category: 'controls', title: 'Toggle Free Camera' },
    { name: 'left', symbol: '⬅️', action: 'rotate-left', category: 'controls', title: 'Rotate Left' }, 
    { name: 'right', symbol: '➡️', action: 'rotate-right', category: 'controls', title: 'Rotate Right' },
    { name: 'zoom-in', symbol: '🔍+', action: 'zoom-in', category: 'controls', title: 'Zoom In' }, 
    { name: 'zoom-out', symbol: '🔍-', action: 'zoom-out', category: 'controls', title: 'Zoom Out' },
    
    // Planets (in PLANETS category)
    { name: 'sun-focus', symbol: '☀️', action: 'focus-sun', category: 'planets', title: 'Focus on Sun' },
    { name: 'mercury-focus', symbol: '☿', action: 'focus-mercury', category: 'planets', title: 'Focus on Mercury' },
    { name: 'venus-focus', symbol: '♀️', action: 'focus-venus', category: 'planets', title: 'Focus on Venus' },
    { name: 'earth-focus', symbol: '🌍', action: 'focus-earth', category: 'planets', title: 'Focus on Earth' },
    { name: 'mars-focus', symbol: '♂️', action: 'focus-mars', category: 'planets', title: 'Focus on Mars' },
    { name: 'jupiter-focus', symbol: '♃', action: 'focus-jupiter', category: 'planets', title: 'Focus on Jupiter' },
    { name: 'saturn-focus', symbol: '♄', action: 'focus-saturn', category: 'planets', title: 'Focus on Saturn' },
    { name: 'uranus-focus', symbol: '♅', action: 'focus-uranus', category: 'planets', title: 'Focus on Uranus' },
    { name: 'neptune-focus', symbol: '♆', action: 'focus-neptune', category: 'planets', title: 'Focus on Neptune' },
    { name: 'pluto-focus', symbol: '🧊', action: 'focus-pluto', category: 'planets', title: 'Focus on Pluto' },
    
    // Space Objects (in SPACE OBJECTS category)
    { name: 'asteroids-focus', symbol: '💫', action: 'focus-asteroids', category: 'space-objects', title: 'Focus on Asteroid Belt' },
    { name: 'iss-focus', symbol: '🛰️', action: 'focus-iss', category: 'space-objects', title: 'Focus on ISS' },
    { name: 'comet-focus', symbol: '☄️', action: 'focus-comet', category: 'space-objects', title: 'Focus on Comet' },
    { name: 'satellite-focus', symbol: '📡', action: 'focus-satellite', category: 'space-objects', title: 'Focus on Satellite' },
    { name: 'ufo-focus', symbol: '🛸', action: 'focus-ufo', category: 'space-objects', title: 'Focus on UFO' },
    { name: 'rocket-focus', symbol: '🚀', action: 'focus-rocket', category: 'space-objects', title: 'Focus on Rocket' },
    { name: 'starship-focus', symbol: '🚀✨', action: 'focus-starship', category: 'space-objects', title: 'Focus on Starship' },
    { name: 'moon-focus', symbol: '🌙', action: 'focus-moon', category: 'space-objects', title: 'Focus on Moon' }
  ];
  
  // Append burger button and menu container to document
  document.body.appendChild(burgerButton);
  document.body.appendChild(menuContainer);
  
  // Create function to show notification with futuristic design
  const showNotification = (message, type = 'info') => {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.space-notification');
    existingNotifications.forEach(notif => {
      notif.remove();
    });
    
    // Create new notification with advanced styling
    const notification = document.createElement('div');
    notification.className = 'space-notification';
    
    // Add icon based on notification type
    let icon = '';
    if (type === 'success') {
      icon = '✅';
    } else if (type === 'error') {
      icon = '❌';
    } else if (type === 'focus') {
      icon = '🔭';
    } else if (type === 'reload') {
      icon = '🔄';
    } else {
      icon = '💫';
    }
    
    notification.innerHTML = `<span style="margin-right: 8px; font-size: 16px;">${icon}</span>${message}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '12px 24px';
    notification.style.borderRadius = '40px';
    notification.style.boxShadow = '0 0 25px rgba(0, 150, 255, 0.6), inset 0 0 10px rgba(0, 200, 255, 0.2)';
    notification.style.zIndex = '3000';
    notification.style.minWidth = '250px';
    notification.style.textAlign = 'center';
    notification.style.fontWeight = 'bold';
    notification.style.fontSize = '15px';
    notification.style.backdropFilter = 'blur(12px)';
    notification.style.border = '1px solid rgba(0, 150, 255, 0.5)';
    
    // Add glowing effect
    notification.style.animation = 'pulse 2s infinite';
    
    // Add CSS for the pulse animation if it doesn't exist
    if (!document.querySelector('#notification-style')) {
      const style = document.createElement('style');
      style.id = 'notification-style';
      style.textContent = `
        @keyframes pulse {
          0% { box-shadow: 0 0 25px rgba(0, 150, 255, 0.6), inset 0 0 10px rgba(0, 200, 255, 0.2); }
          50% { box-shadow: 0 0 30px rgba(0, 150, 255, 0.8), inset 0 0 15px rgba(0, 200, 255, 0.3); }
          100% { box-shadow: 0 0 25px rgba(0, 150, 255, 0.6), inset 0 0 10px rgba(0, 200, 255, 0.2); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Color based on notification type
    if (type === 'success') {
      notification.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
      notification.style.color = 'white';
      notification.style.border = '1px solid rgba(0, 200, 0, 0.6)';
    } else if (type === 'error') {
      notification.style.backgroundColor = 'rgba(180, 0, 0, 0.8)';
      notification.style.color = 'white';
      notification.style.border = '1px solid rgba(255, 50, 50, 0.6)';
    } else {
      notification.style.background = 'linear-gradient(135deg, rgba(0, 30, 60, 0.85), rgba(0, 50, 100, 0.85))';
      notification.style.color = '#00ccff';
    }
    
    document.body.appendChild(notification);
    
    // Add futuristic entrance animation
    notification.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-30px) scale(0.9)';
    
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    }, 10);
    
    // Remove with smooth exit animation after 4 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(-30px) scale(0.8)';
      
      setTimeout(() => {
        if (notification && notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 4000);
  };
  
  // Enhanced credit signature with animated space theme
  const addCredit = () => {
    // Create main credit container with advanced styling
    const creditContainer = document.createElement('div');
    creditContainer.className = 'creator-credit';
    creditContainer.style.position = 'fixed';
    creditContainer.style.bottom = '15px';
    creditContainer.style.left = '15px';
    creditContainer.style.padding = '8px 15px';
    creditContainer.style.background = 'linear-gradient(135deg, rgba(0, 20, 40, 0.85), rgba(0, 40, 80, 0.85))';
    creditContainer.style.backdropFilter = 'blur(8px)';
    creditContainer.style.color = '#00ccff';
    creditContainer.style.borderRadius = '30px';
    creditContainer.style.fontSize = '14px';
    creditContainer.style.fontWeight = 'bold';
    creditContainer.style.fontFamily = "'Orbitron', sans-serif";
    creditContainer.style.cursor = 'pointer';
    creditContainer.style.zIndex = '2000';
    creditContainer.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    creditContainer.style.userSelect = 'none';
    creditContainer.style.border = '1px solid rgba(0, 150, 255, 0.5)';
    creditContainer.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.4)';
    
    // Add animated elements and styled text
    creditContainer.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span style="margin-right: 8px; font-size: 18px; animation: pulse 2s infinite;">✨</span>
        <span style="background: linear-gradient(to right, #00ccff, #80ffff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 5px rgba(0, 150, 255, 0.5);">Created by Pangaribowo</span>
        <span style="margin-left: 8px; font-size: 18px; animation: pulse 2s infinite alternate;">🚀</span>
      </div>
    `;
    
    // Add CSS animation for the stars
    if (!document.querySelector('#credit-style')) {
      const style = document.createElement('style');
      style.id = 'credit-style';
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
    }
    
    creditContainer.addEventListener('mouseenter', () => {
      creditContainer.style.background = 'linear-gradient(135deg, rgba(0, 40, 80, 0.9), rgba(0, 60, 120, 0.9))';
      creditContainer.style.boxShadow = '0 0 25px rgba(0, 150, 255, 0.7)';
      creditContainer.style.transform = 'scale(1.05)';
    });
    
    creditContainer.addEventListener('mouseleave', () => {
      creditContainer.style.background = 'linear-gradient(135deg, rgba(0, 20, 40, 0.85), rgba(0, 40, 80, 0.85))';
      creditContainer.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.4)';
      creditContainer.style.transform = 'scale(1)';
    });
    
    creditContainer.addEventListener('click', () => {
      showNotification('Milkyway Explorer by Pangaribowo', 'success');
    });
    
    document.body.appendChild(creditContainer);
  };
  
  // Add creator credit to the scene
  addCredit();
  
  directions.forEach(direction => {
    const button = document.createElement('button');
    button.innerHTML = direction.symbol;
    button.className = `nav-button nav-${direction.name}`;
    button.title = direction.title || direction.name;
    
    // Modern button styling
    button.style.width = '40px';
    button.style.height = '40px';
    button.style.fontSize = '18px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = 'rgba(0, 20, 40, 0.7)';
    button.style.color = 'white';
    button.style.border = '1px solid rgba(0, 150, 255, 0.3)';
    button.style.borderRadius = '8px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.margin = '2px';
    button.style.boxShadow = '0 0 5px rgba(0, 150, 255, 0.2)';
    button.style.transition = 'all 0.2s ease';
    
    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(0, 60, 120, 0.8)';
      button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'rgba(0, 20, 40, 0.7)';
      button.style.transform = 'scale(1)';
    });
    
    // Add active/pressed effect
    button.addEventListener('mousedown', () => {
      button.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1)';
    });
    
    // Filter which buttons go to main navigation vs. categorized menu
    // Only essential navigation controls go directly to main navigation
    const essentialControls = ['prev-planet', 'next-planet', 'reset-camera', 'reload-simulation', 'free-camera', 'zoom-in', 'zoom-out'];
    
    // Add to appropriate category container or main navigation
    if (essentialControls.includes(direction.action)) {
      // Essential controls go to main navigation bar
      navigationDiv.appendChild(button);
    } else {
      // Everything else goes to appropriate category in menu
      let categoryContainer;
      if (direction.category === 'planets') {
        categoryContainer = planetCategory.buttonsContainer;
      } else if (direction.category === 'space-objects') {
        categoryContainer = spaceObjectsCategory.buttonsContainer;
      } else {
        categoryContainer = controlsCategory.buttonsContainer;
      }
      
      if (categoryContainer) {
        categoryContainer.appendChild(button);
      }
    }
    
    // Button-specific functionality
    if (direction.action === 'next-planet') {
      button.addEventListener('click', () => {
        navigateToNextPlanet(1); // Move forward in planet array
        showNotification('Moving to next planet', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'prev-planet') {
      button.addEventListener('click', () => {
        navigateToNextPlanet(-1); // Move backward in planet array
        showNotification('Moving to previous planet', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-sun') {
      button.addEventListener('click', () => {
        // Focus on the sun at the center
        focusOnObject(sun);
        currentPlanetIndex = -1; // Reset planet index to sun
        showNotification('Viewing the Sun', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-earth') {
      button.addEventListener('click', () => {
        // Find Earth (index 2 in planets array) and focus on it
        currentPlanetIndex = 2; // Earth is index 2 (0=Mercury, 1=Venus, 2=Earth...)
        focusOnObject(planets[currentPlanetIndex].group);
        showNotification('Viewing Earth', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'reset-camera') {
      button.addEventListener('click', () => {
        // Reset camera position to initial overview
        new TWEEN.Tween(camera.position)
          .to({
            x: 0,
            y: 80,
            z: 200
          }, 1000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .start();

        // Reset controls target to sun (center)
        new TWEEN.Tween(controls.target)
          .to({ x: 0, y: 0, z: 0 }, 1000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .start();
          
        // Reset other view parameters
        targetPlanetToFollow = null;
        currentFocusTarget = null;
        currentPlanetIndex = -1; // Sun/center view
        
        // Disable auto-rotation but allow manual rotation
        controls.autoRotate = false;
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.enablePan = true;
        
        // Reset camera controls and update
        controls.update();
        
        // Show notification
        showNotification('View reset to solar system overview', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'free-camera') {
      let isAutoRotating = false;
      
      button.addEventListener('click', () => {
        // Toggle auto-rotation state
        isAutoRotating = !isAutoRotating;
        
        if (isAutoRotating) {
          // Visual feedback that free camera is active
          button.style.backgroundColor = 'rgba(0, 128, 255, 0.6)';
          
          // When viewing a planet up close, rotate around it
          if (currentFocusTarget) {
            // Keep current focus target and enable 360° rotation around it
            controls.autoRotate = true;
            controls.autoRotateSpeed = 2.5; // Faster rotation for better effect
            
            // Make sure we have a proper target
            if (currentPlanetIndex >= 0 && currentPlanetIndex < planets.length) {
              controls.target.copy(planets[currentPlanetIndex].group.position);
              showNotification(`360° mode: rotating around ${planets[currentPlanetIndex].name || 'planet'}`, 'success');
            } else if (currentPlanetIndex === -1) {
              // Sun is the focus
              controls.target.set(0, 0, 0);
              showNotification('360° mode: rotating around Sun', 'success');
            }
          } else {
            // When in solar system view, rotate around the sun
            // Set target to sun (center)
            controls.target.set(0, 0, 0);
            
            // Enable auto-rotation for 360° view of the solar system
            controls.autoRotate = true;
            controls.autoRotateSpeed = 1.0; // Slower rotation for solar system overview
            
            showNotification('360° mode: rotating around solar system', 'success');
          }
        } else {
          // Visual feedback that free camera is inactive
          button.style.backgroundColor = 'rgba(0, 20, 40, 0.7)';
          
          // Stop auto-rotation but keep other camera controls enabled
          controls.autoRotate = false;
          
          showNotification('360° rotation disabled', 'info');
        }
        
        // Ensure other controls remain usable
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.enablePan = true;
        
        // Update controls
        controls.update();
        
        // Play click sound
        audioManager.playSound('click');
      });
    } else if (direction.action === 'reload-simulation') {
      button.addEventListener('click', () => {
        showNotification('Reloading Simulation...', 'info');
        audioManager.playSound('click');
        
        // Short delay before reload for sound to play and notification to show
        setTimeout(() => {
          window.location.reload();
        }, 800);
      });
    } else if (direction.action === 'focus-mercury') {
      button.addEventListener('click', () => {
        currentPlanetIndex = 0; // Mercury is index 0
        focusOnObject(planets[currentPlanetIndex].group);
        showNotification('Viewing Mercury', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-venus') {
      button.addEventListener('click', () => {
        currentPlanetIndex = 1; // Venus is index 1
        focusOnObject(planets[currentPlanetIndex].group);
        showNotification('Viewing Venus', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-mars') {
      button.addEventListener('click', () => {
        currentPlanetIndex = 3; // Mars is index 3
        focusOnObject(planets[currentPlanetIndex].group);
        showNotification('Viewing Mars', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-jupiter') {
      button.addEventListener('click', () => {
        currentPlanetIndex = 4; // Jupiter is index 4
        focusOnObject(planets[currentPlanetIndex].group);
        showNotification('Viewing Jupiter', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-saturn') {
      button.addEventListener('click', () => {
        currentPlanetIndex = 5; // Saturn is index 5
        focusOnObject(planets[currentPlanetIndex].group);
        showNotification('Viewing Saturn', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-uranus') {
      button.addEventListener('click', () => {
        currentPlanetIndex = 6; // Uranus is index 6
        focusOnObject(planets[currentPlanetIndex].group);
        showNotification('Viewing Uranus', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-neptune') {
      button.addEventListener('click', () => {
        currentPlanetIndex = 7; // Neptune is index 7
        focusOnObject(planets[currentPlanetIndex].group);
        showNotification('Viewing Neptune', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-asteroids') {
      button.addEventListener('click', () => {
        // Focus on asteroid belt
        currentPlanetIndex = -1; // Not a planet
        focusOnObject(asteroidBelt);
        showNotification('Viewing Asteroid Belt', 'info');
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-iss') {
      button.addEventListener('click', () => {
        // Focus on ISS
        currentPlanetIndex = -1; // Not a planet
        if (spaceStation) {
          focusOnObject(spaceStation.group);
          showNotification('Viewing International Space Station', 'info');
        } else {
          showNotification('Space Station not available', 'error');
        }
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-comet') {
      button.addEventListener('click', () => {
        // Focus on comet
        currentPlanetIndex = -1; // Not a planet
        if (comet) {
          focusOnObject(comet.group);
          showNotification('Viewing Comet', 'info');
        } else {
          showNotification('Comet not available', 'error');
        }
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-satellite') {
      button.addEventListener('click', () => {
        // Focus on first satellite
        currentPlanetIndex = -1; // Not a planet
        if (satellites && satellites.length > 0) {
          focusOnObject(satellites[0].group);
          showNotification('Viewing Satellite', 'info');
        } else {
          showNotification('Satellite not available', 'error');
        }
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-ufo') {
      button.addEventListener('click', () => {
        // Focus on UFO
        currentPlanetIndex = -1; // Not a planet
        if (ufo) {
          focusOnObject(ufo);
          showNotification('Viewing UFO', 'info');
        } else {
          showNotification('UFO not available', 'error');
        }
        audioManager.playSound('click');
      });
    } else if (direction.action === 'focus-rocket') {
      button.addEventListener('click', () => {
        // Focus on rocket
        currentPlanetIndex = -1; // Not a planet
        if (rocket) {
          focusOnObject(rocket);
          showNotification('Viewing Rocket', 'info');
        } else {
          showNotification('Rocket not available', 'error');
        }
        audioManager.playSound('click');
      });
    } else if (direction.action === 'rotate-left') {
      button.addEventListener('click', () => {
        // Manually rotate the camera around the Y axis (proper way instead of rotateLeft)
        const rotationAngle = Math.PI / 12; // 15 degrees
        // Get current camera position
        const cameraPosition = camera.position.clone();
        // Create rotation matrix around Y axis
        const rotationMatrix = new THREE.Matrix4().makeRotationY(rotationAngle);
        // Apply rotation to camera position
        cameraPosition.applyMatrix4(rotationMatrix);
        // Update camera position
        camera.position.copy(cameraPosition);
        // Update camera to look at the current target
        camera.lookAt(controls.target);
        // Update controls
        controls.update();
        audioManager.playSound('click');
      });
    } else if (direction.action === 'rotate-right') {
      button.addEventListener('click', () => {
        // Manually rotate the camera around the Y axis in the opposite direction
        const rotationAngle = -Math.PI / 12; // -15 degrees
        // Get current camera position
        const cameraPosition = camera.position.clone();
        // Create rotation matrix around Y axis
        const rotationMatrix = new THREE.Matrix4().makeRotationY(rotationAngle);
        // Apply rotation to camera position
        cameraPosition.applyMatrix4(rotationMatrix);
        // Update camera position
        camera.position.copy(cameraPosition);
        // Update camera to look at the current target
        camera.lookAt(controls.target);
        // Update controls
        controls.update();
        audioManager.playSound('click');
      });
    } else if (direction.action === 'zoom-in') {
      button.addEventListener('click', () => {
        camera.position.lerp(controls.target, 0.2); // Move 20% closer to target
        audioManager.playSound('click');
      });
    } else if (direction.action === 'zoom-out') {
      button.addEventListener('click', () => {
        // Move away from target
        const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
        camera.position.add(direction.multiplyScalar(20));
        audioManager.playSound('click');
      });
    }
    
    navigationDiv.appendChild(button);
  });
  
  // Reset view button
  const resetButton = document.createElement('button');
  resetButton.innerHTML = '🔄';
  resetButton.className = 'nav-button nav-reset';
  resetButton.title = 'Reset view to default position';
  resetButton.style.width = '40px';
  resetButton.style.height = '40px';
  resetButton.style.fontSize = '20px';
  resetButton.style.cursor = 'pointer';
  resetButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  resetButton.style.color = 'white';
  resetButton.style.border = '1px solid white';
  resetButton.style.borderRadius = '5px';
  
  resetButton.addEventListener('click', () => {
    // Reset camera to initial position - showing the solar system overview
    camera.position.set(0, 300, 700);
    controls.target.set(0, 0, 0); // Target the sun at the center
    
    // Enable free zooming in/out with mouse wheel
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;
    
    // Disable automatic orbiting
    controls.autoRotate = false;
    
    // Enable smooth damping
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    
    // Update controls
    controls.update();
    
    // Reset planet focus
    currentPlanetIndex = -1;
    targetPlanetToFollow = null;
    currentFocusTarget = null;
    
    console.log('View reset to initial solar system overview');
    audioManager.playSound('click');
  });
  
  navigationDiv.appendChild(resetButton);
  document.body.appendChild(navigationDiv);
}

// Function to navigate to next or previous planet with proper looping behavior
function navigateToNextPlanet(direction) {
  // If we're on the sun, any direction takes us to the first or last planet
  if (currentPlanetIndex === -1) {
    currentPlanetIndex = direction > 0 ? 0 : planets.length - 1;
  } else {
    // Update index with direction and handle wrap-around
    currentPlanetIndex = (currentPlanetIndex + direction + planets.length) % planets.length;
  }
  
  console.log(`Navigating to planet index: ${currentPlanetIndex}`);
  
  // Cancel any existing TWEEN animations
  TWEEN.removeAll();
  
  // Focus on the selected planet with animation
  if (currentPlanetIndex >= 0 && currentPlanetIndex < planets.length) {
    // Store the current camera position for smoother transition
    const startPosition = camera.position.clone();
    const targetPosition = planets[currentPlanetIndex].group.position.clone();
    
    // Setup animation for camera transition
    new TWEEN.Tween(startPosition)
      .to(targetPosition.clone().add(new THREE.Vector3(30, 20, 30)), 1000) // 1 second transition
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        // Update camera position during the tween
        camera.position.copy(startPosition);
      })
      .onComplete(() => {
        // Focus on object after animation completes
        focusOnObject(planets[currentPlanetIndex].group);
      })
      .start();
      
    // Also animate the controls target for a smoother look
    new TWEEN.Tween(controls.target)
      .to(targetPosition, 800) // Slightly faster than camera
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
    
    // Store this planet as the target to follow in orbit
    targetPlanetToFollow = planets[currentPlanetIndex];
    
    // Play navigation sound
    audioManager.playSound('click');
  }
}

// Store current focus target for the camera
let currentFocusTarget = null;

// Call to create navigation controls
createNavigationControls();

// Physics world
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, 0, 0)
});

// Create sun
function createSun() {
  const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
  // Sun should use MeshBasicMaterial with bright white color as seen from space
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    emissive: 0xffffff,
    emissiveIntensity: 1.0
  });
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  
  // Sun light - make it stronger
  const pointLight = new THREE.PointLight(0xffffff, 3.5, 3000, 1.0); // Even brighter for better planet lighting
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  pointLight.shadow.camera.near = 0.5;
  pointLight.shadow.camera.far = 500;
  sunMesh.add(pointLight);
  
  // Add enhanced glow effect with brighter white outer glow
  const glowGeometry = new THREE.SphereGeometry(15, 64, 64); // Increased size
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      intensity: { value: 0.9 } // Increased intensity
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float intensity;
      varying vec3 vNormal;
      void main() {
        float edge = 0.7 * abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
        edge = pow(edge, 3.0);
        // Use white color with a hint of yellow for a brighter, more intense glow
        vec3 glow = vec3(1.0, 1.0, 0.95) * intensity / (1.1 * edge + 0.1);
        gl_FragColor = vec4(glow, 1.0 - edge);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });
  const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
  sunGlow.scale.set(1.5, 1.5, 1.5); // Larger scale
  sunMesh.add(sunGlow);
  
  scene.add(sunMesh);
  logScenePopulation('sun');
  return sunMesh;

  // Note: Main ambient light is already added to the scene earlier
}

// Create planet
function createPlanet(radius, color, position, orbitRadius, orbitSpeed, rotationSpeed, tilt = 0, hasRings = false, ringColor = 0xffffff, texturePath = null, name = 'Planet', description = 'A celestial body.') {
  const planetGroup = new THREE.Group();
  planetGroup.position.copy(position); // Initial position for orbit calculation, mesh itself at (0,0,0) relative to group
  
  // Create the main planet sphere with improved material
  const planetGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const planetMaterial = new THREE.MeshPhongMaterial({ 
    color,
    shininess: 20,
    specular: 0x333333,
    // Add subtle emissive glow with original color to simulate atmospheric scattering
    emissive: new THREE.Color(color).multiplyScalar(0.15),
    emissiveIntensity: 0.2
  });
  
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  planet.castShadow = true;
  planet.receiveShadow = true;
  planet.position.set(0, 0, 0); // Reset position relative to group
  planetGroup.add(planet);
  
  // Add planet name for identification
  planet.name = name;

  // Planet group to handle tilt
  planetGroup.rotation.x = tilt; // Axial tilt

  // Add rings if specified with improved material
  if (hasRings) {
    const ringGeometry = new THREE.RingGeometry(radius * 1.5, radius * 2.5, 128);
    const ringMaterial = new THREE.MeshPhongMaterial({ 
      color: ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      shininess: 30,
      specular: 0x333333,
      emissive: new THREE.Color(ringColor).multiplyScalar(0.1),
      emissiveIntensity: 0.2
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2; // Align with horizontal plane
    rings.castShadow = true;
    rings.receiveShadow = true;
    planet.add(rings);
    
    // Add vertex displacement to rings for more realistic appearance
    const positionAttribute = ringGeometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    for(let i = 0; i < positionAttribute.count; i++){
      vertex.fromBufferAttribute(positionAttribute, i);
      // Add subtle height variation to rings
      vertex.z += (Math.random() - 0.5) * 0.2;
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    positionAttribute.needsUpdate = true;
  }

  // Orbit
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitPoints = [];
  const segments = 256;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    orbitPoints.push(
      Math.cos(theta) * orbitRadius,
      0,
      Math.sin(theta) * orbitRadius
    );
  }
  orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.3 });
  const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
  scene.add(orbit);

  // Physics body
  const planetShape = new CANNON.Sphere(radius);
  const planetBody = new CANNON.Body({
    mass: radius * 100,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    shape: planetShape
  });
  world.addBody(planetBody);

  return { mesh: planet, group: planetGroup, body: planetBody, orbit: { radius: orbitRadius, speed: orbitSpeed } };
}

// Create UFO
function createUFO() {
  const ufoGroup = new THREE.Group();

  // UFO body
  const bodyGeometry = new THREE.CapsuleGeometry(2, 1, 32, 32);
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x666666, metalness: 0.8 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.z = Math.PI / 2;
  ufoGroup.add(body);

  // UFO cockpit
  const cockpitGeometry = new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cockpitMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x44ff44,
    transparent: true,
    opacity: 0.6
  });
  const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
  cockpit.position.y = 0.5;
  ufoGroup.add(cockpit);

  // UFO lights
  for (let i = 0; i < 8; i++) {
    const light = new THREE.PointLight(0x44ff44, 0.5, 3);
    light.position.set(
      Math.cos(i / 8 * Math.PI * 2) * 2,
      -0.5,
      Math.sin(i / 8 * Math.PI * 2) * 2
    );
    ufoGroup.add(light);
  }

  scene.add(ufoGroup);
  logScenePopulation('UFO');
  return ufoGroup;
}

// Create info panel
function createInfoPanel(text, position) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;

  context.fillStyle = 'rgba(0, 0, 0, 0.8)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  context.font = '16px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(10, 5, 1);

  return sprite;
}

// Create objects
const sun = createSun();

// Add stars to background
function createStars() {
  // Create multiple star layers for depth effect
  const starsGroup = new THREE.Group();
  
  // First layer - distant stars (more numerous, smaller)
  const distantStarsGeometry = new THREE.BufferGeometry();
  const distantStarPositions = [];
  const distantStarColors = [];
  const distantStarCount = 15000; // Increased from 5000 to 15000

  for (let i = 0; i < distantStarCount; i++) {
    const r = 2000; // Increased radius from 1500 to 2000
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    distantStarPositions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    
    // More varied star colors with occasional colored stars
    let r_val, g_val, b_val;
    const starType = Math.random();
    
    if (starType > 0.97) { // Red giants (3%)
      r_val = 0.8 + Math.random() * 0.2;
      g_val = 0.2 + Math.random() * 0.3;
      b_val = 0.2 + Math.random() * 0.2;
    } else if (starType > 0.94) { // Blue giants (3%)
      r_val = 0.2 + Math.random() * 0.2;
      g_val = 0.5 + Math.random() * 0.3;
      b_val = 0.8 + Math.random() * 0.2;
    } else if (starType > 0.91) { // Yellow stars (3%)
      r_val = 0.8 + Math.random() * 0.2;
      g_val = 0.8 + Math.random() * 0.2;
      b_val = 0.4 + Math.random() * 0.2;
    } else { // White/blue-white stars (91%)
      const intensity = 0.4 + Math.random() * 0.6;
      r_val = intensity;
      g_val = intensity;
      b_val = intensity * (1 + Math.random() * 0.2); // Slightly bluer
    }
    
    distantStarColors.push(r_val, g_val, b_val);
  }

  distantStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(distantStarPositions, 3));
  distantStarsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(distantStarColors, 3));

  const distantStarsMaterial = new THREE.PointsMaterial({
    size: 1,
    vertexColors: true,
    transparent: true,
    opacity: 0.7
  });

  const distantStars = new THREE.Points(distantStarsGeometry, distantStarsMaterial);
  starsGroup.add(distantStars);
  
  // Second layer - mid-distance stars
  const midStarsGeometry = new THREE.BufferGeometry();
  const midStarPositions = [];
  const midStarColors = [];
  const midStarCount = 3000;

  for (let i = 0; i < midStarCount; i++) {
    const r = 1000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    midStarPositions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    
    const intensity = 0.5 + Math.random() * 0.5;
    midStarColors.push(intensity, intensity, intensity);
  }

  midStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(midStarPositions, 3));
  midStarsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(midStarColors, 3));

  const midStarsMaterial = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });

  const midStars = new THREE.Points(midStarsGeometry, midStarsMaterial);
  starsGroup.add(midStars);
  
  // Third layer - closer, brighter stars
  const brightStarsGeometry = new THREE.BufferGeometry();
  const brightStarPositions = [];
  const brightStarColors = [];
  const brightStarCount = 1000;

  for (let i = 0; i < brightStarCount; i++) {
    const r = 800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    brightStarPositions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    
    // Add some color variety with slight blue/yellow tints
    const baseIntensity = 0.6 + Math.random() * 0.4;
    const colorVariety = Math.random();
    if (colorVariety > 0.7) {
      // Slightly blue
      brightStarColors.push(baseIntensity * 0.9, baseIntensity * 0.95, baseIntensity);
    } else if (colorVariety < 0.3) {
      // Slightly yellow/orange
      brightStarColors.push(baseIntensity, baseIntensity * 0.95, baseIntensity * 0.8);
    } else {
      // White
      brightStarColors.push(baseIntensity, baseIntensity, baseIntensity);
    }
  }

  brightStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(brightStarPositions, 3));
  brightStarsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(brightStarColors, 3));

  const brightStarsMaterial = new THREE.PointsMaterial({
    size: 2.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.9
  });

  const brightStars = new THREE.Points(brightStarsGeometry, brightStarsMaterial);
  starsGroup.add(brightStars);
  
  return starsGroup;
}

const stars = createStars();
scene.add(stars);
logScenePopulation('stars');

const planets = [
  // Mercury - Greatly increased orbital distance & accurate color (gray/brown)
  createPlanet(1.5, 0x8a8a8a, new THREE.Vector3(120, 0, 0), 120, 0.0004, 0.01, 0, false, 0xffffff, null, 'Mercury', 'The smallest and innermost planet with extreme temperature variations. Distance from Sun: 0.39 AU (58 million km)'),
  
  // Venus - Greatly increased orbital distance & accurate color (yellowish-white)
  createPlanet(3.5, 0xffe6c2, new THREE.Vector3(220, 0, 0), 220, 0.0003, 0.005, 0, false, 0xffffff, null, 'Venus', 'Second planet from the Sun with a thick toxic atmosphere. Distance from Sun: 0.72 AU (108 million km)'),
  
  // Earth - Greatly increased orbital distance & accurate blue-green color
  createPlanet(4, 0x2f6a69, new THREE.Vector3(320, 0, 0), 320, 0.0002, 0.41, 0, false, 0xffffff, null, 'Earth', 'Our home planet with liquid water and life. Distance from Sun: 1 AU (150 million km)'),
  
  // Mars - Greatly increased orbital distance & accurate rust-red color
  createPlanet(2.1, 0xc1440e, new THREE.Vector3(440, 0, 0), 440, 0.00015, 0.44, 0, false, 0xffffff, null, 'Mars', 'The Red Planet with polar ice caps and evidence of ancient water. Distance from Sun: 1.5 AU (228 million km)'),
  
  // Jupiter - NO RINGS as requested, greatly increased orbital distance & accurate colors (bands)
  createPlanet(11, 0xd8ca9d, new THREE.Vector3(700, 0, 0), 700, 0.0001, 0.47, 0, false, 0xffe4b5, null, 'Jupiter', 'The largest planet with the Great Red Spot, a massive gas giant. Distance from Sun: 5.2 AU (778 million km)'),
  
  // Saturn - Kept rings, greatly increased orbital distance & accurate pale gold color
  createPlanet(9.2, 0xf0e4b8, new THREE.Vector3(1000, 0, 0), 1000, 0.00008, 0.47, 0, true, 0xf8f0dd, null, 'Saturn', 'The ringed planet with thousands of beautiful rings. Distance from Sun: 9.5 AU (1.4 billion km)'),
  
  // Uranus - Greatly increased orbital distance & accurate cyan-blue color
  createPlanet(4, 0x4fd0e7, new THREE.Vector3(1500, 0, 0), 1500, 0.00006, 0.47, Math.PI/2, false, 0xffffff, null, 'Uranus', 'A blue ice giant tilted on its side. Distance from Sun: 19.8 AU (2.9 billion km)'),
  
  // Neptune - Added thin rings as requested, greatly increased orbital distance & accurate deeper blue color
  createPlanet(3.9, 0x3b55ce, new THREE.Vector3(2000, 0, 0), 2000, 0.00004, 0.47, 0, true, 0xa0a0ff, null, 'Neptune', 'The windiest planet in our solar system with the fastest winds. Distance from Sun: 30 AU (4.5 billion km)')
];

// Create moons for Earth and Mars
function createMoon(parentPlanet, radius, color, orbitRadius, orbitSpeed, name = 'Moon') {
  const moonGeometry = new THREE.SphereGeometry(radius, 32, 32);
  const moonMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 });
  const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
  moonMesh.castShadow = true;
  moonMesh.receiveShadow = true;
  moonMesh.userData = { type: 'moon', name: name }; // For raycasting/identification
  
  const moonGroup = new THREE.Group();
  moonGroup.add(moonMesh);
  
  // Position moon relative to parent planet
  moonMesh.position.set(orbitRadius, 0, 0);
  parentPlanet.group.add(moonGroup);
  
  // Add physics for moon
  // Use parentPlanet.group.position instead of parentPlanet.position to avoid undefined error
  const moonBody = new CANNON.Body({
    mass: 0.1,
    position: new CANNON.Vec3(parentPlanet.group.position.x + orbitRadius, parentPlanet.group.position.y, parentPlanet.group.position.z)
  });
  moonBody.addShape(new CANNON.Sphere(radius));
  world.addBody(moonBody);
  
  // Add a small point light to the moon to simulate reflection of sunlight
  const moonLight = new THREE.PointLight(0xffffff, 0.05, radius * 5);
  moonMesh.add(moonLight);
  
  return { mesh: moonMesh, group: moonGroup, body: moonBody, orbitSpeed: orbitSpeed * 0.1, name: name }; // Slow down moon orbit speed
}

// Add moons
const moons = [
  createMoon(planets[2], 1, 0xaaaaaa, 7, 0.03), // Earth's Moon
  createMoon(planets[3], 0.5, 0xaaaaaa, 4, 0.05), // Mars' Phobos
  createMoon(planets[3], 0.4, 0x999999, 6, 0.04) // Mars' Deimos
];

// Create a space station
function createSpaceStation() {
  const stationGroup = new THREE.Group();
  
  // Base cylinder - significantly reduced size for realism
  const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    shininess: 50,
    specular: 0x333333,
    emissive: 0x111111,
    emissiveIntensity: 0.3
  });
  const baseModule = new THREE.Mesh(baseGeometry, baseMaterial);
  baseModule.rotation.x = Math.PI / 2;
  stationGroup.add(baseModule);
  
  // Solar panels
  const panelGeometry = new THREE.BoxGeometry(15, 0.2, 5);
  const panelMaterial = new THREE.MeshPhongMaterial({
    color: 0x2266aa,
    shininess: 100,
    specular: 0x6688cc,
    emissive: 0x001133,
    emissiveIntensity: 0.5
  });
  
  // Left solar panel
  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  leftPanel.position.set(-9, 0, 0);
  stationGroup.add(leftPanel);
  
  // Right solar panel
  const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  rightPanel.position.set(9, 0, 0);
  stationGroup.add(rightPanel);
  
  // Add blinking lights
  const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const redLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const greenLightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  
  const redLight = new THREE.Mesh(lightGeometry, redLightMaterial);
  redLight.position.set(0, 0, 4.5);
  stationGroup.add(redLight);
  
  const greenLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
  greenLight.position.set(0, 0, -4.5);
  stationGroup.add(greenLight);
  
  // Blinking animation for lights (logic moved to animate loop)
  
  // Set initial position in orbit around Earth (usually the 3rd planet)
  const earth = planets[2]; // Assuming Earth is the 3rd planet (index 2)
  const earthPos = earth ? earth.group.position.clone() : new THREE.Vector3(50, 0, 0);
  
  // Position slightly above Earth's orbit
  stationGroup.position.set(earthPos.x + 8, 4, earthPos.z + 8);
  scene.add(stationGroup);
  logScenePopulation('space station');
  
  // Physics
  const stationShape = new CANNON.Box(new CANNON.Vec3(3, 3, 4));
  const stationBody = new CANNON.Body({
    mass: 0.1,
    position: new CANNON.Vec3(stationGroup.position.x, stationGroup.position.y, stationGroup.position.z),
    shape: stationShape
  });
  world.addBody(stationBody);
  
  return {
    group: stationGroup,
    body: stationBody,
    redLight: redLight, // Expose redLight
    greenLight: greenLight, // Expose greenLight
    orbit: {
      target: earth,
      radius: 8,
      height: 4,
      speed: 0.00005, // Very slow orbit
      angle: 0
    }
  };
}

// Create satellite
function createSatellite() {
  const satelliteGroup = new THREE.Group();
  
  // Main body
  const bodyGeometry = new THREE.BoxGeometry(1, 1, 2);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xdddddd,
    shininess: 80,
    specular: 0x666666
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  satelliteGroup.add(body);
  
  // Solar panels
  const panelGeometry = new THREE.BoxGeometry(4, 0.1, 1);
  const panelMaterial = new THREE.MeshPhongMaterial({
    color: 0x2266aa,
    shininess: 100,
    specular: 0x6688cc
  });
  
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  panel.position.set(0, 0, 0);
  satelliteGroup.add(panel);
  
  // Antenna
  const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
  const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  antenna.position.set(0, 0, 1.5);
  antenna.rotation.x = Math.PI / 2;
  satelliteGroup.add(antenna);
  
  // Choose a random planet to orbit
  const planetIndex = Math.floor(Math.random() * planets.length);
  const planet = planets[planetIndex];
  const planetPos = planet ? planet.group.position.clone() : new THREE.Vector3(0, 0, 0);
  
  // Initial position in orbit
  const orbitRadius = planet ? planet.mesh.geometry.parameters.radius * 3 : 20;
  const orbitAngle = Math.random() * Math.PI * 2;
  satelliteGroup.position.set(
    planetPos.x + Math.cos(orbitAngle) * orbitRadius,
    (Math.random() - 0.5) * 10, // Random height
    planetPos.z + Math.sin(orbitAngle) * orbitRadius
  );
  
  scene.add(satelliteGroup);
  logScenePopulation('satellite');
  
  // Physics
  const satelliteShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 1));
  const satelliteBody = new CANNON.Body({
    mass: 0.05,
    position: new CANNON.Vec3(satelliteGroup.position.x, satelliteGroup.position.y, satelliteGroup.position.z),
    shape: satelliteShape
  });
  world.addBody(satelliteBody);
  
  return {
    group: satelliteGroup,
    body: satelliteBody,
    orbit: {
      target: planet,
      radius: orbitRadius,
      height: satelliteGroup.position.y,
      speed: 0.0001,
      angle: orbitAngle
    }
  };
}

// Create comet
function createComet() {
  const cometGroup = new THREE.Group();

  // Comet nucleus
  const nucleusGeometry = new THREE.IcosahedronGeometry(0.5, 0);
  const nucleusMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 0.9,
    metalness: 0.1
  });
  const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
  nucleus.castShadow = true;
  nucleus.receiveShadow = true;
  cometGroup.add(nucleus);

  // Comet tail (using particle system)
  const tailGeometry = new THREE.BufferGeometry();
  const tailPositions = [];
  const tailColors = [];
  const particleCount = 500;

  for (let i = 0; i < particleCount; i++) {
    const length = Math.random() * 10 + 2;
    const angle = Math.random() * Math.PI * 0.1 + Math.PI * 0.95;
    const spread = Math.random() * 0.5;
    tailPositions.push(
      Math.cos(angle) * length + (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      Math.sin(angle) * length + (Math.random() - 0.5) * spread
    );
    const color = new THREE.Color(0xccccff);
    tailColors.push(color.r, color.g, color.b);
  }

  tailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tailPositions, 3));
  tailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(tailColors, 3));
  const tailMaterial = new THREE.PointsMaterial({
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.5,
    vertexColors: true
  });
  const tail = new THREE.Points(tailGeometry, tailMaterial);
  cometGroup.add(tail);

  // Set initial position far away
  cometGroup.position.set(250, 50, 0);
  scene.add(cometGroup);
  logScenePopulation('comet');

  // Physics for comet
  const cometShape = new CANNON.Sphere(0.5);
  const cometBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(250, 50, 0),
    shape: cometShape
  });
  world.addBody(cometBody);

  return { group: cometGroup, body: cometBody, orbit: { radius: 250, height: 50, speed: 0.001 } };
}

const comet = createComet();

// Add planets to scene
planets.forEach(planet => {
  scene.add(planet.group);
  logScenePopulation('planets');
});

// Create asteroid belt
function createAsteroidBelt() {
  const asteroidBelt = new THREE.Group();
  const asteroidCount = 1000;
  const minRadius = 235; // Berada di antara Mars (220) dan Jupiter (300)
  const maxRadius = 280; // Lebih dekat ke Jupiter
  const minSize = 0.1;
  const maxSize = 1.2; // Sedikit lebih besar agar terlihat

  for (let i = 0; i < asteroidCount; i++) {
    const radius = Math.random() * (maxRadius - minRadius) + minRadius;
    const size = Math.random() * (maxSize - minSize) + minSize;
    const angle = Math.random() * Math.PI * 2;
    
    // Random asteroid shape
    const asteroidGeometry = new THREE.IcosahedronGeometry(size, 0);
    const asteroidMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 2,
      Math.sin(angle) * radius
    );
    
    // Random rotation
    asteroid.rotation.x = Math.random() * Math.PI;
    asteroid.rotation.y = Math.random() * Math.PI;
    asteroid.rotation.z = Math.random() * Math.PI;
    
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    
    // Store orbit data for animation
    asteroid.userData = {
      orbitRadius: radius,
      orbitSpeed: (0.0005 + Math.random() * 0.0005) * 1.3, // Much faster asteroid orbit speed (3x faster than planets)
      rotationSpeed: { 
        x: Math.random() * 0.01, 
        y: Math.random() * 0.01, 
        z: Math.random() * 0.01 
      } // Much faster asteroid rotation
    };
    
    asteroidBelt.add(asteroid);
  }
  
  scene.add(asteroidBelt);
  logScenePopulation('asteroid belt');
  return asteroidBelt;
}

const asteroidBelt = createAsteroidBelt();

// Create UFO (rare sighting!)
const ufo = createUFO();

// Create space station and satellites
const spaceStation = createSpaceStation();
const satellites = [
  createSatellite(),
  createSatellite(),
  createSatellite()
];

// Add descriptions to planets
planets.forEach((planet, index) => {
  const names = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  const descriptions = [
    'Mercury - The smallest and closest planet to the Sun',
    'Venus - Second planet from the Sun with thick atmosphere',
    'Earth - Our home planet with liquid water and life',
    'Mars - The Red Planet with polar ice caps',
    'Jupiter - The largest planet with the Great Red Spot',
    'Saturn - The ringed planet with many moons',
    'Uranus - A blue ice giant tilted on its side',
    'Neptune - The windiest planet in our solar system'
  ];
  
  if (index < names.length) {
    planet.name = names[index];
    planet.description = descriptions[index];
  }
});

// Create info panels for planets
const infoPanels = planets.map((planet, index) => {
  return createInfoPanel(planet.description || 'A celestial body', planet.group.position.clone().add(new THREE.Vector3(0, planet.mesh.geometry.parameters.radius * 3, 0)));
});

// Create a rocket that orbits the sun
function createRocket() {
  const rocketGroup = new THREE.Group();
  
  // Rocket body (cylinder)
  const bodyGeometry = new THREE.CylinderGeometry(1, 1, 7, 16);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xdddddd, // Silver-white
    shininess: 90,
    specular: 0x333333
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.x = Math.PI / 2; // Orient horizontally
  body.castShadow = true;
  body.receiveShadow = true;
  rocketGroup.add(body);
  
  // Rocket nose cone
  const noseGeometry = new THREE.ConeGeometry(1, 3, 16);
  const noseMaterial = new THREE.MeshPhongMaterial({
    color: 0xff3333, // Red
    shininess: 80,
    specular: 0x333333
  });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.position.z = 5; // Place at front of body
  nose.rotation.x = Math.PI / 2; // Orient horizontally
  nose.castShadow = true;
  nose.receiveShadow = true;
  rocketGroup.add(nose);
  
  // Rocket fins (3 triangular fins)
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(3, 0);
  finShape.lineTo(0, 2);
  finShape.lineTo(0, 0);
  
  const finGeometry = new THREE.ShapeGeometry(finShape);
  const finMaterial = new THREE.MeshPhongMaterial({
    color: 0x3333ff, // Blue
    shininess: 80,
    specular: 0x333333
  });
  
  // Create 3 fins around the rocket
  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    const angle = (i * Math.PI * 2) / 3;
    fin.position.set(0, 0, -2.5); // Place at rear of rocket
    fin.rotation.z = angle;
    fin.rotation.y = Math.PI / 2;
    fin.castShadow = true;
    fin.receiveShadow = true;
    rocketGroup.add(fin);
  }
  
  // Rocket engine (back circles with glow)
  const engineGeometry = new THREE.CircleGeometry(0.8, 32);
  const engineMaterial = new THREE.MeshPhongMaterial({
    color: 0xff9933,
    emissive: 0xff9933,
    emissiveIntensity: 1,
    side: THREE.DoubleSide
  });
  const engine = new THREE.Mesh(engineGeometry, engineMaterial);
  engine.position.z = -3.6; // Place at very back
  engine.rotation.y = Math.PI;
  rocketGroup.add(engine);
  
  // Set initial position
  rocketGroup.position.set(170, 0, -120);
  
  // Name and description for the rocket
  rocketGroup.name = "Rocket";
  rocketGroup.userData = {
    description: "A space rocket exploring the solar system. Speed: 28,000 km/h, Length: 50m, Thrust: 3.5 million pounds."
  };
  
  return rocketGroup;
}

const rocket = createRocket();
scene.add(rocket);

// Window resize handler
// Enhanced responsive handling for window resize events
function handleResize() {
  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // Update renderer size to match window dimensions
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Force a render to prevent black screen during resize
  renderer.render(scene, camera);
  
  console.log('Window resized, renderer dimensions updated');
}

// Listen for resize events with debounce to improve performance
let resizeTimer;
window.addEventListener('resize', () => {
  // Clear any pending resize handlers
  clearTimeout(resizeTimer);
  
  // Set a new resize handler with a short delay
  resizeTimer = setTimeout(handleResize, 100);
});

handleResize();

// Focus on object
function focusOnObject(targetObject) {
  if (!targetObject) {
    console.error('focusOnObject: No target object provided');
    return;
  }
  
  // Enable tracking for camera with animation for smoother transitions
  followingTarget = true;
  currentTarget = targetObject;
  
  // Store the focused object for reference
  currentFocusTarget = targetObject;
  
  // Play focus sound
  audioManager.playSound('click');
  
  const targetPosition = new THREE.Vector3();
  targetObject.getWorldPosition(targetPosition);
  
  // Use the object's size to determine appropriate distance if available
  let distance = 30; // Default distance
  
  // Identify which object we're focusing on to enable tracking
  // Reset tracking first
  targetPlanetToFollow = null;
  
  // If it's a planet, set it as the tracked object
  planets.forEach((planet, index) => {
    if (targetObject === planet.planetGroup || targetObject === planet.planet) {
      targetPlanetToFollow = planet;
      currentPlanetIndex = index;
      console.log(`Now tracking planet: ${planet.name || 'Planet ' + index}`);
    }
  });
  
  // If we're focusing on the sun, reset planet tracking
  if (targetObject === sun) {
    currentPlanetIndex = -1;
    console.log('Now focusing on the Sun');
  }
  
  // Calculate a good viewing distance based on object type
  if (targetObject.geometry && targetObject.geometry.boundingSphere) {
    distance = targetObject.geometry.boundingSphere.radius * 4;
  } else if (targetObject.children && targetObject.children.length > 0) {
    for (let i = 0; i < targetObject.children.length; i++) {
      const child = targetObject.children[i];
      if (child.geometry && child.geometry.boundingSphere) {
        distance = child.geometry.boundingSphere.radius * 4;
        break;
      }
    }
  }
  
  console.log(`Focusing on object at position ${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z} with distance ${distance}`);
  
  // Use TWEEN to smoothly animate to the new position
  new TWEEN.Tween(controls.target)
    .to(targetPosition, 1000)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
    
  // Calculate offset position for camera
  const offsetPosition = new THREE.Vector3().copy(targetPosition).add(new THREE.Vector3(0, distance/2, distance));
  
  // Animate camera position
  new TWEEN.Tween(camera.position)
    .to(offsetPosition, 1000)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
  
  // Play focus sound
  audioManager.playSound('click');
  
  // Find description and show info panel
  let description = 'A celestial object';
  
  // Check if it's a planet
  const planet = planets.find(p => p.planet === targetObject || p.planetGroup === targetObject);
  if (planet) {
    description = planet.description || `${planet.name} - A planet in our solar system`;
  } 
  // Check if it's the sun
  else if (targetObject === sun) {
    description = 'The Sun - The star at the center of our solar system';
  } 
  // Check if it's a moon
  else if (moons && moons.some(m => m.mesh === targetObject || m.group === targetObject)) {
    const moon = moons.find(m => m.mesh === targetObject || m.group === targetObject);
    description = `${moon.name} - A moon orbiting ${moon.parent.name}`;
  }

  console.log(`INFO: ${description}`);
  
  // Show information panel with description
  showInfoPanel(description, targetObject);
}
// Reset camera to default view
function resetCameraView(duration = 1000) {
  // Cancel any current focus
  currentFocusTarget = null;
  
  // Reset target to sun
  new TWEEN.Tween(controls.target)
    .to(new THREE.Vector3(0, 0, 0), duration)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
    
  // Move back to initial position
  new TWEEN.Tween(camera.position)
    .to(new THREE.Vector3(0, 80, 200), duration)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onComplete(() => {
      console.log('Camera reset complete');
      // Play sound effect
      audioManager.playSound('click');
    })
    .start();
}

// Cancel current focus
function cancelFocus() {
  currentFocusTarget = null;
  console.log('Focus canceled');
}

// Show info panel for object
function showInfoPanel(text, object) {
  // Implementation up to you, could update a DOM element or create a 3D panel
  console.log(`INFO: ${text}`);
}

// Check if camera is close to a planet
function checkPlanetProximity() {
  planets.forEach((planet, index) => {
    const distance = camera.position.distanceTo(planet.mesh.position);
    infoPanels[index].visible = distance < 30;
  });
}

// ...

// Animation loop control functions
function startAnimationLoop() {
  if (animationLoopActive) {
    console.log('Animation loop already active, not starting another one');
    return; // Don't start multiple animation loops
  }
  
  console.log('Starting animation loop');
  animationLoopActive = true;
  animate();
}

function stopAnimationLoop() {
  animationLoopActive = false;
  console.log('Animation loop stopped');
}

// Animation loop
function animate() {
  if (!animationLoopActive) {
    console.log('Animation loop canceled - flag is false');
    return; // Don't continue if animation should be stopped
  }
  
  requestAnimationFrame(animate);

  // Update physics
  world.step(1/60);
  
  // Camera tracking - update camera position if following target
  if (followingTarget && currentTarget) {
    const targetPosition = new THREE.Vector3();
    currentTarget.getWorldPosition(targetPosition);
    
    // Determine the target's size for better positioning
    let targetSize = 10; // Default size
    if (currentTarget.userData && currentTarget.userData.radius) {
      targetSize = currentTarget.userData.radius * 3; // Use object radius if available
    }
    
    // Calculate ideal distance based on target size
    const idealDistance = Math.max(30, targetSize * 2);
    
    // Calculate the ideal camera position - slightly offset to the side and above
    const offset = new THREE.Vector3(idealDistance * 0.8, idealDistance * 0.5, idealDistance * 0.8);
    
    // More responsive tracking by adjusting lerp factor based on distance
    const currentDistance = camera.position.distanceTo(targetPosition);
    const lerpFactor = currentDistance > 100 ? 0.1 : 0.05;
    
    // Smoothly move the camera to follow the target
    camera.position.lerp(targetPosition.clone().add(offset), lerpFactor);
    controls.target.lerp(targetPosition, lerpFactor * 1.5); // Target moves slightly faster
    controls.update();
    
    // Update info cards based on camera proximity
    updateInfoCards();
  }
  
  // Update TWEEN animations
  TWEEN.update();
  
  // Update stats if enabled
  if (stats) stats.update();
  
  // Update all space objects
  animateSpaceObjects();
  
  // Render the scene
  renderer.render(scene, camera);
}

// Create a flexible information card system that appears when near objects
function createInfoCardSystem() {
  // Create an info card container with modern glass-like design
  const infoCardContainer = document.createElement('div');
  infoCardContainer.id = 'info-card-container';
  
  // Position and sizing
  infoCardContainer.style.position = 'absolute';
  infoCardContainer.style.left = '50%';
  infoCardContainer.style.bottom = '10%';
  infoCardContainer.style.transform = 'translateX(-50%)';
  infoCardContainer.style.padding = '20px';
  infoCardContainer.style.width = 'auto';
  infoCardContainer.style.minWidth = '300px';
  infoCardContainer.style.maxWidth = '500px';
  
  // Modern glass effect styling
  infoCardContainer.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
  infoCardContainer.style.backdropFilter = 'blur(8px)';
  infoCardContainer.style.WebkitBackdropFilter = 'blur(8px)';
  infoCardContainer.style.color = 'white';
  infoCardContainer.style.borderRadius = '16px';
  infoCardContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  
  // Typography
  infoCardContainer.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  infoCardContainer.style.textAlign = 'center';
  
  // Effects
  infoCardContainer.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.25)';
  infoCardContainer.style.zIndex = '1000';
  infoCardContainer.style.opacity = '0'; // Start hidden
  infoCardContainer.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  infoCardContainer.style.pointerEvents = 'none'; // Don't block mouse events
  
  // Add title and description elements
  const titleElement = document.createElement('h2');
  titleElement.id = 'info-card-title';
  titleElement.style.margin = '0 0 10px 0';
  titleElement.style.fontSize = '1.5em';
  titleElement.style.fontWeight = 'bold';
  infoCardContainer.appendChild(titleElement);
  
  const descriptionElement = document.createElement('p');
  descriptionElement.id = 'info-card-description';
  descriptionElement.style.margin = '0';
  descriptionElement.style.fontSize = '1.1em';
  descriptionElement.style.lineHeight = '1.4';
  infoCardContainer.appendChild(descriptionElement);
  
  // Additional scientific data section
  const scienceDataElement = document.createElement('div');
  scienceDataElement.id = 'info-card-science';
  scienceDataElement.style.marginTop = '10px';
  scienceDataElement.style.fontSize = '0.9em';
  scienceDataElement.style.fontStyle = 'italic';
  scienceDataElement.style.borderTop = '1px solid rgba(255,255,255,0.3)';
  scienceDataElement.style.paddingTop = '8px';
  infoCardContainer.appendChild(scienceDataElement);
  
  document.body.appendChild(infoCardContainer);
  
  const infoCard = {
    container: infoCardContainer,
    titleEl: titleElement,
    descriptionEl: descriptionElement,
    scienceDataEl: scienceDataElement,
    currentObject: null,
    isVisible: false,
    show: function(title, description, scienceData) {
      // Check if this is a new object - if so, add a subtle animation
      const isNewObject = !this.currentObject || this.currentObject !== title;
      this.currentObject = title;
      
      if (isNewObject) {
        // Add sliding animation for new object
        this.container.style.transform = 'translateX(-50%) translateY(20px) scale(0.95)';
        this.container.style.opacity = '0';
        
        // Style title with space-themed highlight
        this.titleEl.innerHTML = title ? `<span style="background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${title}</span>` : 'Unknown Object';
        
        // Format description with better spacing and emphasis
        this.descriptionEl.innerHTML = description ? description.replace(/\. /g, '.<br>') : 'No description available.';
        
        // Format science data with icon and styling
        if (scienceData) {
          this.scienceDataEl.innerHTML = `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">🔬 <i>Science Data:</i></div><div style="font-size: 0.9em; opacity: 0.9; margin-top: 5px;">${scienceData}</div>`;
        } else {
          this.scienceDataEl.textContent = '';
        }
      } else {
        // Just update text content for same object
        this.titleEl.innerHTML = title ? `<span style="background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${title}</span>` : 'Unknown Object';
        this.descriptionEl.textContent = description || 'No description available.';
        if (scienceData) {
          this.scienceDataEl.innerHTML = `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">🔬 <i>Science Data:</i></div><div style="font-size: 0.9em; opacity: 0.9; margin-top: 5px;">${scienceData}</div>`;
        } else {
          this.scienceDataEl.textContent = '';
        }
      }
      
      // Show container with animation
      setTimeout(() => {
        this.container.style.opacity = '1';
        this.container.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        this.isVisible = true;
      }, isNewObject ? 50 : 0);
    },
    hide: function() {
      if (this.isVisible) {
        this.container.style.opacity = '0';
        this.container.style.transform = 'translateX(-50%) translateY(10px) scale(0.95)';
        this.isVisible = false;
      }
    }
  };
  
  return infoCard;
}

// Create the info card system
const infoCard = createInfoCardSystem();

// Function to update info cards based on camera proximity to objects
function updateInfoCards() {
  try {
    // Get camera position
    const cameraPosition = camera.position.clone();
    
    // Default state - no object close enough
    let closestObject = null;
    let closestDistance = Infinity;
    
    // Significantly reduced distance threshold to only show info cards when very close
    // Only show info cards when really close to objects being observed
    let minDistanceThreshold = currentFocusTarget ? 40 : 25; // Much smaller threshold for showing info cards
    
    // Dynamic threshold based on camera speed and distance
    if (controls) {
      // Get camera velocity by comparing current and previous positions
      const cameraVelocity = camera.position.distanceTo(previousCameraPosition || camera.position);
      // Adjust threshold based on camera speed - faster movement = see info from further away
      const speedFactor = Math.min(2, Math.max(1, 1 + (cameraVelocity * 10)));
      minDistanceThreshold *= speedFactor;
      
      // Store current position for next frame velocity calculation
      previousCameraPosition = camera.position.clone();
    }
  
  // Check distance to planets
  planets.forEach(planet => {
    if (planet && planet.group && planet.group.position) {
      const distance = cameraPosition.distanceTo(planet.group.position);
      if (distance < minDistanceThreshold && distance < closestDistance) {
        closestObject = planet;
        closestDistance = distance;
      }
    }
  });
  
  // Check distance to sun
  const sunDistance = cameraPosition.distanceTo(new THREE.Vector3(0, 0, 0));
  if (sunDistance < minDistanceThreshold && sunDistance < closestDistance) {
    closestObject = { 
      name: 'The Sun',
      description: 'The star at the center of our solar system',
      userData: {
        scienceData: 'Diameter: 1,392,700 km, Surface Temperature: 5,500°C, Age: 4.6 billion years, Type: G-type main-sequence star (G2V)'
      }
    };
    closestDistance = sunDistance;
  }
  
  // Check distance to other space objects
  const checkSpaceObject = (obj, name, description, scienceData) => {
    if (obj && obj.group && obj.group.position) {
      const distance = cameraPosition.distanceTo(obj.group.position);
      if (distance < minDistanceThreshold && distance < closestDistance) {
        closestObject = {
          name: name || (obj.name || 'Space Object'),
          description: description || (obj.userData ? obj.userData.description : 'A space object'),
          userData: { scienceData: scienceData || '' }
        };
        closestDistance = distance;
      }
    }
  };
  
  // Check all space objects
  if (ufo) checkSpaceObject(ufo, 'UFO', 'An unknown spacecraft observing the solar system', 'Origin: Unknown, Technology: Advanced propulsion system, Purpose: Observational');
  if (spaceStation) checkSpaceObject(spaceStation, 'Space Station', 'International space station orbiting Earth', 'Orbit: Low Earth Orbit, Mass: 420,000 kg, Crew Capacity: 6-7 astronauts');
  if (rocket) checkSpaceObject(rocket, 'Rocket', 'A spacecraft exploring the solar system', 'Speed: 28,000 km/h, Length: 50m, Thrust: 3.5 million pounds');
  if (comet) checkSpaceObject(comet, 'Comet', 'An icy celestial object with a visible tail', 'Composition: Ice, dust, and rocky particles, Orbital Period: Variable, Origin: Kuiper Belt/Oort Cloud');
  
  satellites.forEach((satellite, index) => {
    checkSpaceObject(satellite, `Satellite ${index+1}`, 'An artificial satellite orbiting in space', 'Orbit: Various Earth orbits, Purpose: Communications/Navigation/Science, Power: Solar arrays');
  });
  
  // Show or hide info card based on closest object
  if (closestObject) {
    // Calculate opacity based on distance - closer = more visible
    // Use a non-linear curve for a smoother transition
    const distanceRatio = closestDistance / minDistanceThreshold;
    const opacityFactor = Math.max(0, Math.min(1, 1 - Math.pow(distanceRatio, 1.5)));
    
    const infoCardContainer = document.getElementById('info-card-container');
    if (infoCardContainer) {
      // Set fixed opacity to eliminate flickering
      infoCardContainer.style.opacity = "1.0";
      
      // Use a fixed transform without animation to prevent flickering
      infoCardContainer.style.transform = "translateX(-50%)";
      
      // Fixed glow effect instead of dynamic changing
      infoCardContainer.style.boxShadow = "0 0 15px rgba(0, 150, 255, 0.7)";
      
      // Prevent any transition effects that could cause flickering
      if (!infoCardContainer.hasAttribute("data-stabilized")) {
        infoCardContainer.style.transition = "none";
        infoCardContainer.setAttribute("data-stabilized", "true");
      }
    }
    
    // Update card content with enhanced formatting
    infoCard.show(
      closestObject.name,
      closestObject.description,
      closestObject.userData ? closestObject.userData.scienceData : ''
    );
  } else {
    // Hide the card when no object is close enough
    infoCard.hide();
  }
  } catch (error) {
    console.error('Error updating info cards:', error);
  }
}

// Animate space objects
function animateSpaceObjects() {
  const elapsedTime = clock.getElapsedTime();
  
  // Animate planets
  planets.forEach((planet, index) => {
    // Update planet orbit with much faster speed
    if (planet.orbitRadius && planet.orbitSpeed) {
      // Increased orbit speed by 25x for much better visual effect
      const adjustedSpeed = planet.orbitSpeed * 25.0;
      planet.group.position.x = Math.cos(elapsedTime * adjustedSpeed) * planet.orbitRadius;
      planet.group.position.z = Math.sin(elapsedTime * adjustedSpeed) * planet.orbitRadius;
    }
    
    // Rotate planet around its axis with increased speed
    if (planet.rotationSpeed) {
      planet.planet.rotation.y += planet.rotationSpeed * 0.04; // Increased rotation speed by 8x
    }
  });
  
  // Follow the target planet if one is set
  if (targetPlanetToFollow) {
    // Update the camera target to follow the planet in its orbit
    controls.target.copy(targetPlanetToFollow.group.position);
    
    // Use TWEEN to smoothly animate camera position to maintain relative position
    // while following the planet
    const currentDistance = camera.position.distanceTo(controls.target);
    const cameraIdealPosition = new THREE.Vector3()
      .subVectors(camera.position, controls.target)
      .normalize()
      .multiplyScalar(currentDistance)
      .add(controls.target);
      
    // Apply a slightly faster lag for more responsive camera movement
    camera.position.lerp(cameraIdealPosition, 0.08);
    
    // Update controls
    controls.update();
  }

  // Animate rocket in its orbit around the sun
  if (rocket) {
    // Create an elliptical orbit path for the rocket
    const orbitSpeed = 0.05;
    const orbitRadiusX = 170;
    const orbitRadiusZ = 120;
    const verticalOscillation = 20; // Height variation
    
    rocket.position.x = Math.cos(elapsedTime * orbitSpeed) * orbitRadiusX;
    rocket.position.z = Math.sin(elapsedTime * orbitSpeed) * orbitRadiusZ;
    rocket.position.y = Math.sin(elapsedTime * orbitSpeed * 2) * verticalOscillation; // Oscillation
    
    // Make rocket point in the direction of travel
    const tangent = new THREE.Vector3(
      -Math.sin(elapsedTime * orbitSpeed) * orbitRadiusX,
      Math.cos(elapsedTime * orbitSpeed * 2) * verticalOscillation * 2 * orbitSpeed,
      Math.cos(elapsedTime * orbitSpeed) * orbitRadiusZ
    ).normalize();
    
    // Create a look-at point ahead of the rocket
    const lookPoint = new THREE.Vector3().copy(rocket.position).add(tangent);
    rocket.lookAt(lookPoint);
  }

  // UFO hover effect with increased movement
  if (ufo) {
    ufo.position.y = 4 + Math.sin(elapsedTime * 0.8) * 1.5; // Faster and wider vertical movement
    ufo.rotation.y = elapsedTime * 0.2; // Faster rotation
  }
  
  // Space station rotation
  if (spaceStation && spaceStation.group) {
    spaceStation.group.rotation.y += 0.001;
  }
  
  // Satellite orbit with increased speed
  if (satellites && satellites.length > 0) {
    satellites.forEach((satellite, index) => {
      if (satellite && satellite.group) {
        const orbitSpeed = 0.15 + (index * 0.03); // Increased speeds
        const orbitRadius = 60 + (index * 8); // More spread out distances
        satellite.group.position.x = Math.cos(elapsedTime * orbitSpeed) * orbitRadius;
        satellite.group.position.z = Math.sin(elapsedTime * orbitSpeed) * orbitRadius;
        satellite.group.rotation.y += 0.025; // Faster self rotation
      }
    });
  }
  
  // Comet movement with more dramatic orbit
  if (comet && comet.group) {
    const maxDistance = 350; // Slightly larger orbit
    // Move comet in an elliptical orbit with increased speed
    comet.group.position.x = Math.cos(elapsedTime * 0.06) * maxDistance * 1; // Doubled speed
    comet.group.position.z = Math.sin(elapsedTime * 0.06) * maxDistance * 0.6; // More elliptical
    // Add some vertical movement
    comet.group.position.y = Math.sin(elapsedTime * 0.04) * 20;
    // Keep comet pointing in direction of travel
    comet.group.lookAt(0, 0, 0);
  }
  
  // Update info cards based on camera distance to objects
  updateInfoCards();
}

  // Update planet positions with correct lighting based on sun position
  planets.forEach((planet, index) => {
    const time = Date.now() * planet.orbit.speed;
    const x = Math.cos(time) * planet.orbit.radius;
    const z = Math.sin(time) * planet.orbit.radius;
    
    // Reset position relative to group
    planet.mesh.position.set(0, 0, 0); 
    planet.group.position.set(x, 0, z); // Move the group
    
    // Calculate normalized vector from sun to planet for lighting calculation
    const sunToPlanet = new THREE.Vector3(x, 0, z).normalize();
    
    // If the planet has an atmosphere (emissive material), update it based on sun angle
    if (planet.mesh.material && planet.mesh.material.emissive) {
      // Base emissive intensity on position relative to sun
      // Planets facing the sun will have stronger atmospheric glow on the lit side
      const dotProduct = sunToPlanet.dot(new THREE.Vector3(1, 0, 0));
      const normalizedDot = (dotProduct + 1) / 2; // Convert from [-1,1] to [0,1]
      
      // Update emissive intensity based on sun angle
      planet.mesh.material.emissiveIntensity = 0.1 + (normalizedDot * 0.2);
    }
    planet.body.position.copy(planet.group.position);
    
    // Rotate planet on its axis - different rotation speeds
    const rotationSpeeds = [0.001, 0.0008, 0.001, 0.0012, 0.003, 0.0025, 0.002, 0.0018, 0.0015]; // Slower rotation
    planet.mesh.rotation.y += rotationSpeeds[index] || 0.001;
    
    // Update info panel position
    if (infoPanels[index]) {
      infoPanels[index].position.copy(planet.group.position).add(new THREE.Vector3(0, planet.mesh.geometry.parameters.radius * 3, 0));
    }
  });

  // Update moons with slower and more realistic orbit
  moons.forEach(moon => {
    // Use a much slower orbit speed for moons
    const time = Date.now() * (moon.orbitSpeed * 0.25);
    const parentPos = moon.group.parent.position;
    
    // Calculate orbital position
    moon.mesh.position.x = Math.cos(time) * moon.orbitRadius;
    moon.mesh.position.z = Math.sin(time) * moon.orbitRadius;
    
    // Slower rotation for moons
    moon.mesh.rotation.y += 0.002;
    
    // Update moon lighting based on sun position if it has material
    if (moon.mesh.material && moon.mesh.material.emissive) {
      // Calculate world position
      const moonWorldPos = new THREE.Vector3();
      moon.mesh.getWorldPosition(moonWorldPos);
      
      // Vector from sun to moon
      const sunToMoon = moonWorldPos.normalize();
      const dotProduct = sunToMoon.dot(new THREE.Vector3(1, 0, 0));
      const normalizedDot = (dotProduct + 1) / 2;
      
      // Update emissive intensity
      moon.mesh.material.emissiveIntensity = 0.05 + (normalizedDot * 0.15);
    }
    moon.body.position.set(
      parentPos.x + moon.mesh.position.x,
      parentPos.y + moon.mesh.position.y,
      parentPos.z + moon.mesh.position.z
    );
    
    // Rotate moon on its axis
    moon.mesh.rotation.y += 0.001; // Slower rotation
  });

  // Update comet position - elliptical orbit
  if (comet) {
    const time = Date.now() * 0.00005; // Much slower comet
    const x = Math.cos(time) * comet.orbit.radius;
    // Elliptical orbit by varying the Z coordinate more extremely
    const z = Math.sin(time) * (comet.orbit.radius * 0.6);
    const y = Math.sin(time) * comet.orbit.height;
    comet.group.position.set(x, y, z);
    comet.body.position.copy(comet.group.position);
    // Rotate tail particles to face direction of movement
    if (comet.group.children.length > 1) {
      comet.group.children[1].rotation.set(0, time, 0);
    }
  }

  // Update asteroid belt with 5x faster movement than planets
  asteroidBelt.children.forEach(asteroid => {
    const { orbitRadius, orbitSpeed, rotationSpeed } = asteroid.userData;
    // Make asteroids move 5x faster than planets (which are now 12x accelerated)
    const adjustedSpeed = orbitSpeed * 5.0;
    const time = Date.now() * adjustedSpeed;
    
    asteroid.position.x = Math.cos(time) * orbitRadius;
    asteroid.position.z = Math.sin(time) * orbitRadius;
    
    // Rotate asteroid with even higher speed
    asteroid.rotation.x += rotationSpeed.x * 3.0; // 6x faster asteroid rotation
    asteroid.rotation.y += rotationSpeed.y * 3.0; // 6x faster Y-axis rotation
    asteroid.rotation.z += rotationSpeed.z * 3.0; // 6x faster Z-axis rotation
  });
  asteroidBelt.rotation.y += 0.00005; // 10x faster rotation for asteroid belt as a whole

  // Rotate UFO at slower speed
  if (ufo) ufo.rotation.y += 0.0005; // Much slower UFO rotation
  
  // Update space station orbit around Earth
  if (spaceStation && spaceStation.orbit.target) {
    const stationTime = Date.now() * spaceStation.orbit.speed;
    const targetPos = spaceStation.orbit.target.group.position;
    
    // Circular orbit around Earth
    const stationX = targetPos.x + Math.cos(stationTime) * spaceStation.orbit.radius;
    const stationZ = targetPos.z + Math.sin(stationTime) * spaceStation.orbit.radius;
    
    spaceStation.group.position.set(stationX, spaceStation.orbit.height, stationZ);
    spaceStation.body.position.copy(spaceStation.group.position);
    
    // Rotate space station slowly to face the sun
    spaceStation.group.rotation.y += 0.0001;

    // Blinking lights for space station
    if (spaceStation.redLight && spaceStation.greenLight) {
      const time = clock.getElapsedTime();
      const blinkState = Math.floor(time * 2) % 2 === 0; // Blink every 0.5 seconds
      spaceStation.redLight.visible = blinkState;
      spaceStation.greenLight.visible = !blinkState; // Alternate blinking
    }
  }

// Mark the app as initialized inside an IIFE
(function() {
  appInitialized = true;
})();

// Old initialization logic block (formerly lines 1216-1248) has been removed and replaced by startMainExperience function.

// Double-check renderer is appended to DOM - critical for rendering
console.log('Checking renderer DOM status');
if (!document.body.contains(renderer.domElement)) {
  console.log('Renderer not in DOM - appending');
  const container = document.getElementById('container');
  if (container) {
    console.log('Appending renderer to container');
    container.innerHTML = ''; // Clear any junk
    container.appendChild(renderer.domElement);
  } else {
    console.log('No container found - appending renderer directly to body');
    document.body.appendChild(renderer.domElement);
  }
} else {
  console.log('Renderer already in DOM');
}

// Force an initial render in case something is stuck
setTimeout(() => {
  console.log('Triggering initial render');
  renderer.render(scene, camera);
}, 100);

// Animation will be started by the DOMContentLoaded event handler

// Cleanup function
function cleanup() {
  renderer.dispose();
  planets.forEach(planet => {
    planet.mesh.geometry.dispose();
    planet.mesh.material.dispose();
  });
  world.bodies.forEach(body => {
    world.removeBody(body);
  });
}

// Add cleanup on page unload
window.addEventListener('unload', cleanup);

// Click to focus on planets, sun, moons, and spacecraft
window.addEventListener('click', (event) => {
  // Calculate mouse position in normalized device coordinates
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Raycasting for interactive objects
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  // Collect all interactive objects
  const planetMeshes = planets.map(p => p.mesh);
  const moonMeshes = moons ? moons.map(m => m.mesh) : [];
  const satelliteMeshes = satellites.map(s => s.group);
  const allObjects = [
    ...planetMeshes, 
    ...moonMeshes, 
    sun, 
    comet?.mesh, 
    ufo, 
    spaceStation.group,
    ...satelliteMeshes
  ].filter(obj => obj); // Filter out undefined
  
  const intersects = raycaster.intersectObjects(allObjects, true); // true for recursive (check children too)

  if (intersects.length > 0) {
    const selectedObject = intersects[0].object;
    console.log('Selected object:', selectedObject.name || 'unnamed object');
    
    // Try to find what kind of object was clicked
    let targetObject = null;
    let targetInfo = '';
    
    // If it's a planet
    const planetIndex = planetMeshes.indexOf(selectedObject);
    if (planetIndex !== -1) {
      targetObject = planets[planetIndex].group;
      targetInfo = `Planet: ${planets[planetIndex].name || 'Planet ' + (planetIndex + 1)}`;
      // Removed redundant showInfoPanel call here, focusOnObject will handle it.
    } 
    // If it's a moon
    else if (moonMeshes.includes(selectedObject)) {
      const moonIndex = moonMeshes.indexOf(selectedObject);
      targetObject = moons[moonIndex].group;
      targetInfo = `Moon: ${moons[moonIndex].name || 'Moon'}`;
    }
    // If it's the sun
    else if (selectedObject === sun || selectedObject.parent === sun) {
      targetObject = sun;
      targetInfo = 'The Sun - The center of our solar system';
    }
    // If it's the comet
    else if (comet && (selectedObject === comet.mesh || selectedObject.parent === comet.mesh)) {
      targetObject = comet.group;
      targetInfo = 'Comet';
    }
    // If it's the UFO
    else if (selectedObject === ufo || selectedObject.parent === ufo) {
      targetObject = ufo;
      targetInfo = 'Spacecraft';
    }
    // If it's something else or a child of one of our objects
    else {
      // Try to find parent
      let parent = selectedObject.parent;
      while (parent && !targetObject) {
        if (parent === sun) {
          targetObject = sun;
          targetInfo = 'Sun';
        } else {
          for (let i = 0; i < planets.length; i++) {
            if (parent === planets[i].group || parent === planets[i].mesh) {
              targetObject = planets[i].group;
              targetInfo = `Planet: ${planets[i].name || 'Planet ' + (i + 1)}`;
              break;
            }
          }
        }
        parent = parent.parent;
      }
      
      // If we still couldn't find a proper target
      if (!targetObject) {
        targetObject = selectedObject;
        targetInfo = 'Unknown object';
      }
    }
    
    if (targetObject) {
      // Display info
      console.log(targetInfo);
      
      // Focus camera on the object
      focusOnObject(targetObject);
      
      // Play sound
      audioManager.playSound('click');
    }
  }
});

// Add key controls for camera navigation
window.addEventListener('keydown', (event) => {
  // 'R' key to reset view
  if (event.key === 'r' || event.key === 'R') {
    resetCameraView();
  }
  
  // 'Escape' key to cancel current focus
  if (event.key === 'Escape') {
    if (currentFocusTarget) {
      cancelFocus();
    }
  }
  
  // WASD keys for movement
  const moveSpeed = 10;
  if (event.key === 'w' || event.key === 'W') {
    // Move forward
    const direction = new THREE.Vector3(0, 0, -moveSpeed);
    direction.applyQuaternion(camera.quaternion);
    camera.position.add(direction);
    controls.target.add(direction);
  }
  if (event.key === 's' || event.key === 'S') {
    // Move backward
    const direction = new THREE.Vector3(0, 0, moveSpeed);
    direction.applyQuaternion(camera.quaternion);
    camera.position.add(direction);
    controls.target.add(direction);
  }
  if (event.key === 'a' || event.key === 'A') {
    // Move left
    const direction = new THREE.Vector3(-moveSpeed, 0, 0);
    direction.applyQuaternion(camera.quaternion);
    camera.position.add(direction);
    controls.target.add(direction);
  }
  if (event.key === 'd' || event.key === 'D') {
    // Move right
    const direction = new THREE.Vector3(moveSpeed, 0, 0);
    direction.applyQuaternion(camera.quaternion);
    camera.position.add(direction);
    controls.target.add(direction);
  }
  if (event.key === 'q' || event.key === 'Q') {
    // Move up
    camera.position.y += moveSpeed;
    controls.target.y += moveSpeed;
  }
  if (event.key === 'e' || event.key === 'E') {
    // Move down
    camera.position.y -= moveSpeed;
    controls.target.y -= moveSpeed;
  }
});

// Audio is handled by the audioManager from audio.js

// Set up sound toggle button - with guaranteed functionality
function setupSoundToggleButton() {
  const soundToggleButton = document.querySelector('.sound-toggle');
  if (!soundToggleButton) {
    console.error('Sound toggle button not found in DOM');
    return;
  }
  
  console.log('Setting up sound toggle button');
  
  // Make sure audio manager is initialized
  if (!audioManager.isInitialized) {
    audioManager.init();
  }
  
  // Ensure button shows correct initial state
  soundToggleButton.textContent = audioManager.isMuted ? '🔇' : '🔊';
  
  // Remove any existing event listeners to prevent duplicates
  const newButton = soundToggleButton.cloneNode(true);
  soundToggleButton.parentNode.replaceChild(newButton, soundToggleButton);
  
  let isHovered = false;
  
  newButton.addEventListener('mouseenter', () => {
    isHovered = true;
    newButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
  });
  
  newButton.addEventListener('mouseleave', () => {
    isHovered = false;
    newButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  });
  
  newButton.addEventListener('click', () => {
    console.log('Sound toggle button clicked');
    try {
      // Toggle mute status through audio manager
      const isMuted = audioManager.toggleMute();
      
      // Update button text to reflect current state
      newButton.textContent = isMuted ? '🔇' : '🔊';
      console.log(`Sound is now ${isMuted ? 'muted' : 'unmuted'}`);
      
      // Reset background color after click, but maintain hover state if still hovering
      if (isHovered) {
        newButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
      } else {
        newButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      }
      
      // Play click sound if unmuted
      if (!isMuted) {
        audioManager.playSound('click');
        // Ensure audio is playing if it was stopped
        if (!audioManager.sounds.ambient.playing()) {
          audioManager.startAmbient();
        }
      }
    } catch (err) {
      console.error('Error toggling audio:', err);
      // Fallback - toggle directly
      const currentState = newButton.textContent === '🔊';
      newButton.textContent = currentState ? '🔇' : '🔊';
    }
  });
  
  // Add keyboard shortcut for toggling audio (M key)
  if (!window.audioShortcutsAdded) {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'm' || event.key === 'M') {
        console.log('M key pressed - toggling audio');
        // Simulate button click
        newButton.click();
      }
      
      // N key for next track
      if (event.key === 'n' || event.key === 'N') {
        console.log('N key pressed - changing track');
        if (audioManager.nextTrack && typeof audioManager.nextTrack === 'function') {
          audioManager.nextTrack();
        }
      }
    });
    window.audioShortcutsAdded = true;
  }
  
  console.log('Sound toggle button setup complete');
}

// Setup sound button
setupSoundToggleButton();

// Add audio control button or ensure existing button works
document.addEventListener('DOMContentLoaded', () => {
  // Modernized audio control button with better styling and functionality
  let audioButton = document.getElementById('audioControl');
  if (!audioButton) {
    audioButton = document.createElement('button');
    audioButton.id = 'audioControl';
    
    // Modern styling with glass effect - positioned at bottom left to avoid conflicts
    audioButton.style.position = 'fixed';
    audioButton.style.bottom = '20px';
    audioButton.style.left = '20px';
    audioButton.style.padding = '12px';
    audioButton.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
    audioButton.style.backdropFilter = 'blur(8px)';
    audioButton.style.WebkitBackdropFilter = 'blur(8px)';
    audioButton.style.color = 'white';
    audioButton.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    audioButton.style.borderRadius = '50%'; // Circular button
    audioButton.style.width = '48px';
    audioButton.style.height = '48px';
    audioButton.style.display = 'flex';
    audioButton.style.alignItems = 'center';
    audioButton.style.justifyContent = 'center';
    audioButton.style.cursor = 'pointer';
    audioButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
    audioButton.style.transition = 'all 0.3s ease';
    audioButton.style.fontSize = '20px';
    audioButton.style.zIndex = '2000'; // Keep it above other elements
    
    // Icon-based display, no text
    audioButton.innerHTML = audioManager.isMuted ? '🔇' : '🔊';
    document.body.appendChild(audioButton);
    
    // Add hover effect
    audioButton.addEventListener('mouseenter', () => {
      audioButton.style.backgroundColor = 'rgba(59, 130, 246, 0.75)';
      audioButton.style.transform = 'scale(1.1)';
    });
    
    audioButton.addEventListener('mouseleave', () => {
      audioButton.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
      audioButton.style.transform = 'scale(1)';
    });

    // Improved click behavior with visual feedback
    audioButton.addEventListener('click', () => {
      // Create ripple effect
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      ripple.style.width = '100%';
      ripple.style.height = '100%';
      ripple.style.transform = 'scale(0)';
      ripple.style.opacity = '1';
      ripple.style.animation = 'ripple 0.6s linear';
      ripple.style.pointerEvents = 'none';
      
      // Add ripple style if it doesn't exist
      if (!document.getElementById('ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.innerHTML = `
          @keyframes ripple {
            to {
              transform: scale(2);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      audioButton.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
      
      // Toggle audio state
      if (audioManager.isMuted) {
        audioManager.unmute();
        audioButton.innerHTML = '🔊';
      } else {
        audioManager.mute();
        audioButton.innerHTML = '🔇';
      }
      
      // Provide visual feedback with scale
      audioButton.style.transform = 'scale(0.9)';
      setTimeout(() => {
        audioButton.style.transform = 'scale(1)';
      }, 200);
    });
  }
  
  // Ensure animation loop is started after DOM is fully loaded and all elements are initialized
  console.log('Starting animation loop from DOMContentLoaded event');
  startAnimationLoop();
});
