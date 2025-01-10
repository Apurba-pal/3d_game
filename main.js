import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js"; // Import FBXLoader

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const scene = new THREE.Scene();
const canvas = document.getElementById("canvas");
let charizard; // Declare globally

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const loader = new GLTFLoader();
const fbxLoader = new FBXLoader();

let mixer; // Declare mixer for animation

// Load the mystical forest model
loader.load(
  "./models/mystical_forest_cartoon.glb",
  function (glb) {
    // console.log("Mystical forest loaded:", glb);
    const model = glb.scene;
    model.scale.set(0.01, 0.01, 0.01);
    glb.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(glb.scene);
  },
  undefined,
  function (error) {
    console.error("Error loading mystical forest:", error);
  }
);

// Load the avatar model
let avatar;
loader.load(
  "./models/my_avatar.glb",
  function (glb) {
    avatar = glb.scene;
    avatar.scale.set(2, 2, 2);
    avatar.position.set(-3, 0, 45);
    avatar.rotation.set(0, Math.PI, 0);
    avatar.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(avatar);

    const gltfAnimation = glb.animations;
    mixer = new THREE.AnimationMixer(avatar);

    const animationsMap = new Map();
    gltfAnimation
      .filter((a) => a.name !== "TPose")
      .forEach((a) => {
        animationsMap.set(a.name, mixer.clipAction(a));
      });

    // Initialize characterControl properly
    characterControl = new CharacterControl(
      avatar,
      mixer,
      animationsMap,
      controls,
      camera
      // "Idle"
    );
    // Load the Running animation and apply it to the avatar
    // fbxLoader.load(
    //   "./models/Running.fbx",
    //   function (fbx) {
    //     // console.log("Running animation loaded:", fbx);

    //     mixer = new THREE.AnimationMixer(avatar); // Create mixer for the avatar
    //     const action = mixer.clipAction(fbx.animations[0]); // Use the first animation
    //     action.play(); // Start the animation
    //   },
    //   undefined,
    //   function (error) {
    //     console.error("Error loading Running animation:", error);
    //   }
    // );
  },
  undefined,
  function (error) {
    console.error("Error loading avatar:", error);
  }
);
// charizard flying
loader.load(
  "./models/Charzard Flying.glb", // Path to your GLB file
  function (glb) {
    charizard = glb.scene;

    charizard.scale.set(3, 3, 3); // Adjust scaling as per your scene
    // charizard.position.set(20,20,20)
    // Enable shadows for the Charizard model
    charizard.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Position Charizard in the sky
    charizard.position.set(0, 17, 0); // Adjust position as needed
    scene.add(charizard);

    // console.log("Charizard loaded successfully!", charizard);
    charizard.getObjectByName("Armature").traverse((child) => {
      // console.log("charizard components: ", child.name); // Log all child object names
    });
  },
  undefined,
  function (error) {
    console.error("Error loading Charizard:", error);
  }
);

const sun = new THREE.DirectionalLight(0xffffff, 1);
scene.add(sun);
sun.position.set(100, 100, 100);
sun.target.position.set(0, 0, 0);
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
sun.shadow.mapSize.width = 2048; // Increase for sharper shadows
sun.shadow.mapSize.height = 2048;

const helper = new THREE.DirectionalLightHelper(sun, 10);
scene.add(helper);

const ShadowCamera = new THREE.CameraHelper(sun.shadow.camera);
scene.add(ShadowCamera);
// console.log("Shadow info:", sun.shadow);

const light = new THREE.AmbientLight(0x404040, 3); // Soft white light
scene.add(light);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

scene.add(camera);
camera.position.set(-3, 3, 50);

// Initialize OrbitControls
const controls = new OrbitControls(camera, canvas);

// Enable damping for smoother interaction
controls.enableDamping = true;

// Limit the rotation
controls.maxPolarAngle = Math.PI / 2; // Limit to looking straight (90 degrees upwards)
controls.minPolarAngle = 0; // Prevent looking below the horizon (0 degrees)

// Optional: Limit horizontal rotation (if needed)
// controls.minAzimuthAngle = -Math.PI / 2; // Left limit (-90 degrees)
// controls.maxAzimuthAngle = Math.PI / 2; // Right limit (90 degrees)

// Optional: Restrict zooming (if needed)
// controls.minDistance = 50; // Minimum zoom distance
// controls.maxDistance = 50; // Maximum zoom distance

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// const DIRECTIONS = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]; // WASD keys
// OR for arrow keys:
// const DIRECTIONS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

class CharacterControl {
  constructor(
    avatar,
    mixer,
    animationsMap = new Map(),
    orbitControls,
    camera,
    currentAction
  ) {
    this.avatar = avatar;
    this.mixer = mixer;
    // this.mixer = new THREE.AnimationMixer(avatar);
    this.animationsMap = animationsMap;
    this.currentAction = currentAction;
    this.toggleRun = true;
    this.orbitControls = orbitControls;
    this.camera = camera;
    this.walkDirection = new THREE.Vector3();
    this.rotateAngle = new THREE.Vector3(0, 1, 0);
    this.rotateQuarternion = new THREE.Quaternion();
    this.cameraTarget = new THREE.Vector3();
    this.fadeDuration = 0.2;
    this.runVelocity = 5;
    this.walkVelocity = 2;

    // Load animations
    this.loadAnimations();

    // Play the current action animation
    this.animationsMap.forEach((value, key) => {
      if (key === currentAction) {
        value.play();
      }
    });
  }

  // Load the FBX animations
  loadAnimations() {
    // const loader = new THREE.FBXLoader();

    // Load Idle animation
    fbxLoader.load("./models/Idle.fbx", (fbx) => {
      console.log("idle", fbx);
      console.log("FBX Animations:", fbx.animations[0]);
      this.mixer = new THREE.AnimationMixer(avatar);
      const idleAction = this.mixer.clipAction(fbx.animations[0]);
      idleAction.play();
      this.animationsMap.set("idle", idleAction);
    });
    fbxLoader.load("./models/Walking.fbx", (fbx) => {
      console.log("Walking", fbx);
      console.log("FBX Animations:", fbx.animations[0]);
      this.mixer = new THREE.AnimationMixer(avatar);
      const walkAction = this.mixer.clipAction(fbx.animations[0]);
      walkAction.play();
      this.animationsMap.set("Walk", walkAction);
    });
    fbxLoader.load("./models/Running.fbx", (fbx) => {
      console.log("Running", fbx);
      console.log("FBX Animations:", fbx.animations[0]);
      this.mixer = new THREE.AnimationMixer(avatar);
      const runAction = this.mixer.clipAction(fbx.animations[0]);
      runAction.play();
      this.animationsMap.set("Running", runAction);
    });
  }

  // Toggle the run state
  switchRunToggle() {
    this.toggleRun = !this.toggleRun;
  }

  // Update logic for character
  update(delta, keyPressed) {
    const DIRECTIONS = ["w", "a", "s", "d"]; // Example movement keys

    const directionPressed = DIRECTIONS.some((key) => keyPressed[key] == true);
    var play = "";
    if (directionPressed && this.toggleRun) {
      play = "run";
    } else if (directionPressed) {
      play = "walk";
    } else {
      play = "idle";
    }

    if (this.currentAction != play) {
      const toPlay = this.animationsMap.get(play);
      const current = this.animationsMap.get(this.currentAction);

      if (current) {
        current.fadeOut(this.fadeDuration);
      }
      if (toPlay) {
        toPlay.reset().fadeIn(this.fadeDuration).play();
      }

      this.currentAction = play;
    }

    this.mixer.update(delta);

    if (this.currentAction == "run" || this.currentAction == "walk") {
      var angleYCameraDirection = Math.atan2(
        this.camera.position.x - this.avatar.position.x,
        this.camera.position.z - this.avatar.position.z
      );
      var directionOffset = this.directionOffset(keyPressed);
      this.rotateQuarternion.setFromAxisAngle(
        this.rotateAngle,
        angleYCameraDirection + directionOffset + Math.PI
      );
      this.avatar.quaternion.rotateTowards(this.rotateQuarternion, 0.2);
      this.camera.getWorldDirection(this.walkDirection);
      this.walkDirection.y = 0;
      this.walkDirection.normalize();
      this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

      const velocity =
        this.currentAction == "run" ? this.runVelocity : this.walkVelocity;

      const moveX = this.walkDirection.x + velocity * delta;
      const moveZ = this.walkDirection.z + velocity * delta;

      this.avatar.position.x += moveX;
      this.avatar.position.z += moveZ;
      this.updateCameraTarget(moveX, moveZ);
    }
  }

  updateCameraTarget(moveX, moveZ) {
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;

    this.cameraTarget.x = this.avatar.position.x;
    this.cameraTarget.y = this.avatar.position.y + 1;
    this.cameraTarget.z = this.avatar.position.z;
    this.orbitControls.target = this.cameraTarget;
  }




  directionOffset(keyPressed) {
    var directionOffset = 0;

    if (keyPressed["w"]) {
        if (keyPressed["a"]) {
            directionOffset = Math.PI / 4; // Forward-left (45 degrees)
        } else if (keyPressed["d"]) {
            directionOffset = -Math.PI / 4; // Forward-right (-45 degrees)
        } else {
            directionOffset = 0; // Forward (0 degrees)
        }
    } else if (keyPressed["s"]) {
        if (keyPressed["a"]) {
            directionOffset = (3 * Math.PI) / 4; // Backward-left (135 degrees)
        } else if (keyPressed["d"]) {
            directionOffset = -(3 * Math.PI) / 4; // Backward-right (-135 degrees)
        } else {
            directionOffset = Math.PI; // Backward (180 degrees)
        }
    } else if (keyPressed["a"]) {
        directionOffset = Math.PI / 2; // Left (90 degrees)
    } else if (keyPressed["d"]) {
        directionOffset = -Math.PI / 2; // Right (-90 degrees)
    }

    return directionOffset;
}





}

var characterControl = new CharacterControl(
  avatar,
  mixer,
  new Map(),
  OrbitControls,
  camera,
  "idle"
);

const keyPressed = {};

document.addEventListener(
  "keydown",
  (event) => {
    if (event.shiftKey && characterControl) {
      characterControl.switchRunToggle();
    } else {
      keyPressed[event.key.toLowerCase()] = true;
    }
  },
  false
);

document.addEventListener(
  "keyup",
  (event) => {
    keyPressed[event.key.toLowerCase()] = false;
  },
  false
);

function animateWings(charizard) {
  const time = clock.getElapsedTime(); // Get elapsed time

  // Get wing components
  const leftWing1 = charizard.getObjectByName("Wing1L");
  const leftWing2 = charizard.getObjectByName("Wing2L");
  const leftWing3 = charizard.getObjectByName("Wing3L");

  const rightWing1 = charizard.getObjectByName("Wing1R");
  const rightWing2 = charizard.getObjectByName("Wing2R");
  const rightWing3 = charizard.getObjectByName("Wing3R");

  if (leftWing1 && rightWing1) {
    // Use a sine wave to control the wing flapping
    const flapFrequency = 3; // Controls the speed of flapping
    const downstrokeAngle = Math.PI / 4; // Max angle for downstroke (45 degrees)
    const upstrokeAngle = Math.PI / 12; // Max angle for upstroke (15 degrees)

    // Calculate the flap angle
    const flapAngle =
      Math.sin(time * flapFrequency) > 0
        ? Math.sin(time * flapFrequency) * downstrokeAngle
        : Math.sin(time * flapFrequency) * upstrokeAngle;

    // Apply flapping angles to sub-wing components
    // leftWing1.rotation.y = flapAngle;
    // rightWing1.rotation.y = flapAngle;

    // Additional subcomponents for finer wing movement
    if (leftWing2 && rightWing2) {
      leftWing2.rotation.x = flapAngle * 2; // Delayed and smaller movement
      rightWing2.rotation.x = flapAngle * 2;
    }
    if (leftWing3 && rightWing3) {
      leftWing3.rotation.z = flapAngle * 0.5; // Even smaller and delayed
      rightWing3.rotation.z = flapAngle * 0.5;
    }
  }
}

let time = 0;
function animate() {
  time += 0.01;
  if (charizard) {
    animateWings(charizard);

    // Other animations (movement, rotation, etc.)
    charizard.position.y += Math.sin(clock.getElapsedTime()) * -0.1;
    charizard.rotation.x = Math.PI / 6; // Forward tilt
  }
  raycaster.setFromCamera(pointer, camera);

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children);

  for (let i = 0; i < intersects.length; i++) {
    intersects[i].object.material.color.set();
  }

  const delta = clock.getDelta(); // Get time elapsed since the last frame
  if (characterControl && mixer) {
    characterControl.update(delta, keyPressed); // Update character control
  }

  if (mixer) mixer.update(delta); // Update animation mixer

  // Update controls
  controls.update();

  // Render the scene
  renderer.render(scene, camera);
}

// Start the animation loop
const clock = new THREE.Clock();
renderer.setAnimationLoop(animate);

// 4:18:00
