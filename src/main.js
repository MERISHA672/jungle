
import * as THREE from 'three';
import './style.css';

// ========================================
// JUNGLE ESCAPE - 3D ENDLESS RUNNER
// ========================================

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 25, 110);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 1, -8);

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// LIGHTING
scene.add(new THREE.HemisphereLight(0xdaf0ff, 0x25451b, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(-5, 15, 8);
sun.castShadow = true;
scene.add(sun);

// GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x245c29 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.2;
scene.add(ground);

// RUNNING PATH
const path = new THREE.Mesh(
  new THREE.BoxGeometry(5, 0.25, 120),
  new THREE.MeshStandardMaterial({ color: 0x827765 })
);
path.position.set(0, -0.02, -40);
scene.add(path);

// JUNGLE TREES
function createTree(x, z, scale) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.35, 3.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x654321 })
  );
  trunk.position.y = 1.75;
  trunk.castShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.8, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x176b35 })
  );
  leaves.position.y = 4;
  leaves.castShadow = true;
  tree.add(leaves);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x287d37 })
  );
  crown.position.y = 5;
  crown.castShadow = true;
  tree.add(crown);

  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);
}

for (let z = 15; z >= -100; z -= 7) {
  createTree(-5 - Math.random() * 3, z, 0.8 + Math.random() * 0.6);
  createTree(5 + Math.random() * 3, z - 2, 0.8 + Math.random() * 0.6);
}

// PLAYER CHARACTER
const player = new THREE.Group();

const blue = new THREE.MeshStandardMaterial({ color: 0x2563eb });
const skin = new THREE.MeshStandardMaterial({ color: 0xe8b58d });
const trousers = new THREE.MeshStandardMaterial({ color: 0x172554 });

function addPart(geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  player.add(mesh);
  return mesh;
}

addPart(new THREE.BoxGeometry(0.7, 1, 0.45), blue, 0, 1.25, 0);
addPart(new THREE.SphereGeometry(0.32, 16, 12), skin, 0, 2, 0);

const arms = [
  addPart(new THREE.BoxGeometry(0.22, 0.8, 0.25), blue, -0.5, 1.25, 0),
  addPart(new THREE.BoxGeometry(0.22, 0.8, 0.25), blue, 0.5, 1.25, 0)
];

const legs = [
  addPart(new THREE.BoxGeometry(0.25, 0.75, 0.3), trousers, -0.2, 0.45, 0),
  addPart(new THREE.BoxGeometry(0.25, 0.75, 0.3), trousers, 0.2, 0.45, 0)
];

player.position.set(0, 0, 2);
scene.add(player);

// OBSTACLES AND COINS
const obstacles = [];
const coins = [];
const laneX = [-1.5, 0, 1.5];

function createObstacle(lane, type) {
  const group = new THREE.Group();

  if (type === 'block') {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xb45309 })
    );
    block.position.y = 0.6;
    block.castShadow = true;
    group.add(block);
  } else {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.35, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xdc2626 })
    );
    bar.position.y = 1.8;
    bar.castShadow = true;
    group.add(bar);
  }

  group.position.set(laneX[lane], 0, -48);
  scene.add(group);
  obstacles.push({ group, type, lane, hit: false });
}

function createCoin(lane, z) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.09, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.5,
      roughness: 0.3
    })
  );

  mesh.position.set(laneX[lane], 1.2, z);
  scene.add(mesh);
  coins.push({ mesh, lane, collected: false });
}

// HEADS-UP DISPLAY
const hud = document.createElement('div');
hud.id = 'hud';
hud.innerHTML = `
  <h1>🌴 JUNGLE ESCAPE</h1>
  <p>⭐ Score: <span id="score">0</span></p>
  <p>🪙 Coins: <span id="coinCount">0</span></p>
  <p>🏆 Best: <span id="best">0</span></p>
`;
document.body.appendChild(hud);

// MOVEMENT BUTTONS
const controls = document.createElement('div');
controls.id = 'gameControls';
controls.innerHTML = `
  <div class="moveButtons">
    <button data-action="left">⬅ LEFT</button>
    <button data-action="jump">⬆ JUMP</button>
    <button data-action="slide">⬇ SLIDE</button>
    <button data-action="right">RIGHT ➡</button>
  </div>
`;
document.body.appendChild(controls);

// START SCREEN
const overlay = document.createElement('div');
overlay.id = 'gameOverlay';
overlay.innerHTML = `
  <div class="overlayCard">
    <h2 id="overlayTitle">Jungle Escape</h2>
    <p id="overlayText">Dodge obstacles, jump, slide and collect coins!</p>
    <button id="playButton">START RUNNING</button>
  </div>
`;
document.body.appendChild(overlay);

// BEST SCORE
let best = 0;

try {
  best = Number(localStorage.getItem('jungleBest')) || 0;
} catch (error) {
  // The game can still run if storage is unavailable.
}

document.getElementById('best').textContent = best;

// GAME STATE
let lane = 1;
let jumpY = 0;
let jumpVelocity = 0;
let jumping = false;
let sliding = false;
let slideTimer = 0;
let score = 0;
let coinCount = 0;
let speed = 14;
let obstacleTimer = 1.5;
let coinTimer = 1;
let running = false;
let gameOver = false;

// MOVEMENT
function moveLeft() {
  if (running) lane = Math.max(0, lane - 1);
}

function moveRight() {
  if (running) lane = Math.min(2, lane + 1);
}

function jump() {
  if (!running || jumping || sliding) return;

  jumping = true;
  jumpVelocity = 9;
}

function slide() {
  if (!running || jumping || sliding) return;

  sliding = true;
  slideTimer = 0.8;
}

// MOBILE SWIPE CONTROLS
let touchStartX = 0;
let touchStartY = 0;

renderer.domElement.addEventListener('touchstart', (event) => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

renderer.domElement.addEventListener('touchend', (event) => {
  if (!running) return;

  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) moveLeft();
    else moveRight();
  } else {
    if (dy < 0) jump();
    else slide();
  }
}, { passive: true });

// KEYBOARD CONTROLS
window.addEventListener('keydown', (event) => {
  if ([
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Space'
  ].includes(event.code)) {
    event.preventDefault();
  }

  if (event.repeat) return;

  if (event.code === 'ArrowLeft' || event.code === 'KeyA') moveLeft();
  if (event.code === 'ArrowRight' || event.code === 'KeyD') moveRight();

  if (
    event.code === 'ArrowUp' ||
    event.code === 'Space' ||
    event.code === 'KeyW'
  ) {
    jump();
  }

  if (event.code === 'ArrowDown' || event.code === 'KeyS') slide();
});

// ON-SCREEN BUTTONS
controls.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const actions = {
    left: moveLeft,
    right: moveRight,
    jump,
    slide
  };

  actions[button.dataset.action]();
});

// REMOVE OBJECTS
function clearObjects(list, getObject) {
  list.forEach((item) => scene.remove(getObject(item)));
  list.length = 0;
}

// START OR RESTART
function startGame() {
  clearObjects(obstacles, (item) => item.group);
  clearObjects(coins, (item) => item.mesh);

  lane = 1;
  jumpY = 0;
  jumpVelocity = 0;
  jumping = false;
  sliding = false;
  slideTimer = 0;
  score = 0;
  coinCount = 0;
  speed = 14;
  obstacleTimer = 1.5;
  coinTimer = 1;
  gameOver = false;
  running = true;

  player.position.set(0, 0, 2);
  player.scale.set(1, 1, 1);
  camera.position.set(0, 5, 10);

  document.getElementById('score').textContent = '0';
  document.getElementById('coinCount').textContent = '0';
  document.getElementById('overlayTitle').textContent = 'Jungle Escape';
  document.getElementById('playButton').textContent = 'START RUNNING';

  overlay.style.display = 'none';
}

// GAME OVER
function finishGame() {
  if (gameOver) return;

  running = false;
  gameOver = true;

  const finalScore = Math.floor(score);

  if (finalScore > best) {
    best = finalScore;

    try {
      localStorage.setItem('jungleBest', String(best));
    } catch (error) {
      // Ignore unavailable browser storage.
    }
  }

  document.getElementById('best').textContent = best;
  document.getElementById('overlayTitle').textContent = '🏁 Game Over!';
  document.getElementById('overlayText').textContent =
    `Score: ${finalScore} | Coins: ${coinCount}`;
  document.getElementById('playButton').textContent = 'PLAY AGAIN';

  overlay.style.display = 'flex';
}

document.getElementById('playButton').addEventListener('click', startGame);

// ANIMATION TIMER
// THREE.Timer replaces the deprecated THREE.Clock.
const timer = new THREE.Timer();
timer.connect(document);

// MAIN GAME LOOP
function animate() {
  requestAnimationFrame(animate);

  timer.update();

  const dt = Math.min(timer.getDelta(), 0.04);
  const elapsed = timer.getElapsed();

  if (running) {
    score += dt * 10;
    speed = Math.min(28, 14 + score * 0.015);

    document.getElementById('score').textContent = Math.floor(score);

    // Move between lanes smoothly.
    player.position.x +=
      (laneX[lane] - player.position.x) * Math.min(1, dt * 12);

    // Jump physics.
    if (jumping) {
      jumpVelocity -= 23 * dt;
      jumpY += jumpVelocity * dt;

      if (jumpY <= 0) {
        jumpY = 0;
        jumpVelocity = 0;
        jumping = false;
      }
    }

    // Slide duration.
    if (sliding) {
      slideTimer -= dt;

      if (slideTimer <= 0) {
        sliding = false;
      }
    }

    player.position.y =
      jumpY + (jumping ? 0 : Math.abs(Math.sin(elapsed * 12)) * 0.06);

    player.scale.y +=
      ((sliding ? 0.5 : 1) - player.scale.y) * Math.min(1, dt * 18);

    // Camera follows the player.
    camera.position.x +=
      (player.position.x * 0.45 - camera.position.x) *
      Math.min(1, dt * 3);

    camera.lookAt(
      player.position.x * 0.2,
      1.2 + jumpY * 0.15,
      -8
    );

    // Animate arms and legs.
    legs[0].rotation.x =
      jumping || sliding ? 0 : Math.sin(elapsed * 14) * 0.7;

    legs[1].rotation.x =
      jumping || sliding ? 0 : -Math.sin(elapsed * 14) * 0.7;

    arms[0].rotation.z = Math.sin(elapsed * 14) * 0.25;
    arms[1].rotation.z = -Math.sin(elapsed * 14) * 0.25;

    // Spawn obstacles.
    obstacleTimer -= dt;

    if (obstacleTimer <= 0) {
      const obstacleLane = Math.floor(Math.random() * 3);
      const type = Math.random() < 0.6 ? 'block' : 'barrier';

      createObstacle(obstacleLane, type);
      obstacleTimer = Math.max(0.65, 1.35 - score / 150);
    }

    // Spawn coin lines.
    coinTimer -= dt;

    if (coinTimer <= 0) {
      const coinLane = Math.floor(Math.random() * 3);

      for (let i = 0; i < 4; i++) {
        createCoin(coinLane, -35 - i * 2);
      }

      coinTimer = 2.5;
    }

    // Move obstacles and check collisions.
    for (const obstacle of obstacles) {
      obstacle.group.position.z += speed * dt;

      const close =
        obstacle.group.position.z > 0.8 &&
        obstacle.group.position.z < 3.5;

      const sameLane = lane === obstacle.lane;

      if (!obstacle.hit && close && sameLane) {
        const avoided = obstacle.type === 'block'
          ? jumpY > 1.15
          : sliding;

        if (!avoided) {
          obstacle.hit = true;
          finishGame();
          break;
        }

        obstacle.hit = true;
      }
    }

    // Remove obstacles that have passed.
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].group.position.z > 12) {
        scene.remove(obstacles[i].group);
        obstacles.splice(i, 1);
      }
    }

    // Move and collect coins.
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];

      coin.mesh.position.z += speed * dt;
      coin.mesh.rotation.y += dt * 4;

      const close =
        coin.mesh.position.z > 0.5 &&
        coin.mesh.position.z < 3.5;

      if (
        close &&
        !coin.collected &&
        Math.abs(player.position.x - coin.mesh.position.x) < 0.85 &&
        jumpY < 1.8
      ) {
        coin.collected = true;
        coinCount++;

        document.getElementById('coinCount').textContent = coinCount;

        scene.remove(coin.mesh);
        coins.splice(i, 1);
        continue;
      }

      if (coin.mesh.position.z > 12) {
        scene.remove(coin.mesh);
        coins.splice(i, 1);
      }
    }
  } else if (!gameOver) {
    player.position.y = Math.abs(Math.sin(elapsed * 2)) * 0.04;
  }

  renderer.render(scene, camera);
}

animate();

// RESPONSIVE RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
