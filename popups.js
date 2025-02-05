import * as THREE from 'three';
import { models } from './models.js'; // Import models

let renderer, scene, camera;

function initThreeJS(container) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(300, 300); // Set the size of the renderer
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    const light = new THREE.AmbientLight(0x404040, 3);
    scene.add(light);
}

function renderModel(model, pokemonName) {
    if (!renderer || !scene || !camera) return;

    scene.add(model);
    renderer.render(scene, camera);

    model.userData = { name: pokemonName }; // Store the Pokemon name in the model's userData

    model.addEventListener('click', function(event) {
        showPokemonPopup(model.userData.name);
    });
}

// Function to create and show welcome popup
export function showPopup() {
    let popup = document.getElementById('welcomePopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'welcomePopup';
        popup.className = 'popup';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = function() {
            popup.style.display = 'none';
        };
        
        const message = document.createElement('span');
        message.innerHTML = 'Welcome to the Pokemon World!';
        
        popup.appendChild(closeBtn);
        popup.appendChild(message);
        document.body.appendChild(popup);
    }
    popup.style.display = 'block';
}

// Function to show Pokemon popup
export function showPokemonPopup(pokemonName) {
    let existingPopup = document.getElementById('pokemonPopup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'pokemonPopup';
    popup.className = 'pokemon-popup';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = function() {
        popup.style.display = 'none';
    };

    const message = document.createElement('span');
    message.innerHTML = `Oh! This is a ${pokemonName}!`;

    popup.appendChild(closeBtn);
    popup.appendChild(message);
    document.body.appendChild(popup);

    popup.style.display = 'block';
}

// Function to show the Pokémon popup
function onPokemonClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const parentObject = intersectedObject.parent || intersectedObject;
        const pokemonModel = models.find(model => model.name === parentObject.name);
        if (pokemonModel) {
            showPokemonPopup(pokemonModel.name);
        }
    }
}

// Modify the click event listener to handle both signboard and Pokémon clicks
window.addEventListener('click', (event) => {
    onSignboardClick(event);
    onPokemonClick(event);
});
