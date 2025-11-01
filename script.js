const counterDOM = document.getElementById("counter");
const endDOM = document.getElementById("end");

const scene = new THREE.Scene();

const distance = 500;
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  0.1,
  10000
);

camera.rotation.x = (50 * Math.PI) / 180;
camera.rotation.y = (20 * Math.PI) / 180;
camera.rotation.z = (10 * Math.PI) / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX =
  Math.tan(camera.rotation.y) *
  Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

const zoom = 2;

const soldierSize = 15;

const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;

const stepTime = 200; // Milliseconds for the soldier to take a step in any direction

let lanes;
let currentLane;
let currentColumn;

let previousTimestamp;
let startMoving;
let moves;
let stepStartTimestamp;

const generateLanes = () =>
  [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((index) => {
      const lane = new Lane(index);
      lane.mesh.position.y = index * positionWidth * zoom;
      scene.add(lane.mesh);
      return lane;
    })
    .filter((lane) => lane.index >= 0);

const addLane = () => {
  const index = lanes.length;
  const lane = new Lane(index);
  lane.mesh.position.y = index * positionWidth * zoom;
  scene.add(lane.mesh);
  lanes.push(lane);
};

const soldier = new Soldier();
scene.add(soldier);

hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight);

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;
dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
dirLight.target = soldier;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

// var helper = new THREE.CameraHelper( dirLight.shadow.camera );
// var helper = new THREE.CameraHelper( camera );
// scene.add(helper)

backLight = new THREE.DirectionalLight(0x000000, 0.4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight);

const laneTypes = ["tank", "armored", "barricade"];
const laneSpeeds = [2, 2.5, 3];
const vehicleColors = [0x2f4f4f, 0x556b2f, 0x6b4f2f];
const barricadeHeights = [20, 35, 50];

const initaliseValues = () => {
  lanes = generateLanes();

  currentLane = 0;
  currentColumn = Math.floor(columns / 2);

  previousTimestamp = null;

  startMoving = false;
  moves = [];
  stepStartTimestamp;

  soldier.position.x = 0;
  soldier.position.y = 0;

  camera.position.y = initialCameraPositionY;
  camera.position.x = initialCameraPositionX;

  dirLight.position.x = initialDirLightPositionX;
  dirLight.position.y = initialDirLightPositionY;

  counterDOM.innerHTML = `Advance: ${currentLane}`;
};

initaliseValues();

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function TrackSegment() {
  const segment = new THREE.Mesh(
    new THREE.BoxBufferGeometry(12 * zoom, 36 * zoom, 10 * zoom),
    new THREE.MeshLambertMaterial({ color: 0x2b2b2b, flatShading: true })
  );
  segment.position.z = 6 * zoom;
  return segment;
}

function Tank() {
  const tank = new THREE.Group();
  const color =
    vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

  const hull = new THREE.Mesh(
    new THREE.BoxBufferGeometry(70 * zoom, 40 * zoom, 18 * zoom),
    new THREE.MeshPhongMaterial({ color, flatShading: true })
  );
  hull.position.z = 9 * zoom;
  hull.castShadow = true;
  hull.receiveShadow = true;
  tank.add(hull);

  const turret = new THREE.Mesh(
    new THREE.BoxBufferGeometry(40 * zoom, 32 * zoom, 14 * zoom),
    new THREE.MeshPhongMaterial({
      color: 0x36402c,
      flatShading: true,
    })
  );
  turret.position.x = 6 * zoom;
  turret.position.z = 18 * zoom;
  turret.castShadow = true;
  turret.receiveShadow = true;
  tank.add(turret);

  const barrel = new THREE.Mesh(
    new THREE.BoxBufferGeometry(30 * zoom, 6 * zoom, 4 * zoom),
    new THREE.MeshLambertMaterial({ color: 0x1f1f1f, flatShading: true })
  );
  barrel.position.x = 32 * zoom;
  barrel.position.z = 19 * zoom;
  tank.add(barrel);

  const frontTrack = new TrackSegment();
  frontTrack.scale.set(1.2, 1, 1);
  frontTrack.position.x = -20 * zoom;
  tank.add(frontTrack);

  const backTrack = new TrackSegment();
  backTrack.scale.set(1.2, 1, 1);
  backTrack.position.x = 20 * zoom;
  tank.add(backTrack);

  tank.castShadow = true;
  tank.receiveShadow = false;

  return tank;
}

function ArmoredCarrier() {
  const carrier = new THREE.Group();
  const color =
    vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

  const chassis = new THREE.Mesh(
    new THREE.BoxBufferGeometry(110 * zoom, 45 * zoom, 20 * zoom),
    new THREE.MeshPhongMaterial({ color, flatShading: true })
  );
  chassis.position.z = 10 * zoom;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  carrier.add(chassis);

  const cabin = new THREE.Mesh(
    new THREE.BoxBufferGeometry(40 * zoom, 36 * zoom, 28 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x3a3f2b, flatShading: true })
  );
  cabin.position.x = -35 * zoom;
  cabin.position.z = 24 * zoom;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  carrier.add(cabin);

  const turret = new THREE.Mesh(
    new THREE.BoxBufferGeometry(28 * zoom, 24 * zoom, 12 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x2c3024, flatShading: true })
  );
  turret.position.x = 15 * zoom;
  turret.position.z = 26 * zoom;
  turret.castShadow = true;
  turret.receiveShadow = true;
  carrier.add(turret);

  const cannon = new THREE.Mesh(
    new THREE.BoxBufferGeometry(26 * zoom, 5 * zoom, 4 * zoom),
    new THREE.MeshLambertMaterial({ color: 0x1c1f1a, flatShading: true })
  );
  cannon.position.x = 35 * zoom;
  cannon.position.z = 27 * zoom;
  carrier.add(cannon);

  const frontTrack = new TrackSegment();
  frontTrack.position.x = -45 * zoom;
  carrier.add(frontTrack);

  const midTrack = new TrackSegment();
  midTrack.position.x = -5 * zoom;
  carrier.add(midTrack);

  const rearTrack = new TrackSegment();
  rearTrack.position.x = 35 * zoom;
  carrier.add(rearTrack);

  return carrier;
}

function Barricade() {
  const barricade = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxBufferGeometry(20 * zoom, 20 * zoom, 10 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x8b6b4a, flatShading: true })
  );
  base.position.z = 5 * zoom;
  base.castShadow = true;
  base.receiveShadow = true;
  barricade.add(base);

  const height =
    barricadeHeights[Math.floor(Math.random() * barricadeHeights.length)];

  const shield = new THREE.Mesh(
    new THREE.BoxBufferGeometry(35 * zoom, 15 * zoom, height * zoom),
    new THREE.MeshLambertMaterial({ color: 0x4a4e4d, flatShading: true })
  );
  shield.position.z = (height / 2 + 10) * zoom;
  shield.castShadow = true;
  shield.receiveShadow = false;
  barricade.add(shield);

  const support = new THREE.Mesh(
    new THREE.BoxBufferGeometry(12 * zoom, 25 * zoom, 8 * zoom),
    new THREE.MeshLambertMaterial({ color: 0x3b3f3c, flatShading: true })
  );
  support.position.y = -15 * zoom;
  support.position.z = 12 * zoom;
  support.castShadow = true;
  support.receiveShadow = false;
  barricade.add(support);

  return barricade;
}

function Soldier() {
  const soldier = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxBufferGeometry(
      soldierSize * zoom,
      soldierSize * zoom,
      20 * zoom
    ),
    new THREE.MeshPhongMaterial({ color: 0x6b8e23, flatShading: true })
  );
  body.position.z = 10 * zoom;
  body.castShadow = true;
  body.receiveShadow = true;
  soldier.add(body);

  const helmet = new THREE.Mesh(
    new THREE.BoxBufferGeometry(
      soldierSize * 0.9 * zoom,
      soldierSize * 0.9 * zoom,
      8 * zoom
    ),
    new THREE.MeshLambertMaterial({ color: 0x3a4d3a, flatShading: true })
  );
  helmet.position.z = 20 * zoom;
  helmet.castShadow = true;
  helmet.receiveShadow = false;
  soldier.add(helmet);

  const visor = new THREE.Mesh(
    new THREE.BoxBufferGeometry(6 * zoom, soldierSize * 0.6 * zoom, 2 * zoom),
    new THREE.MeshLambertMaterial({ color: 0x1c1f26, flatShading: true })
  );
  visor.position.z = 18 * zoom;
  visor.position.x = 4 * zoom;
  visor.castShadow = false;
  visor.receiveShadow = false;
  soldier.add(visor);

  return soldier;
}

function NoMansLand() {
  const battlefield = new THREE.Group();

  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom),
      new THREE.MeshPhongMaterial({ color })
    );

  const middle = createSection(0x5a4b3c);
  middle.receiveShadow = true;
  battlefield.add(middle);

  const left = createSection(0x4b3d30);
  left.position.x = -boardWidth * zoom;
  battlefield.add(left);

  const right = createSection(0x4b3d30);
  right.position.x = boardWidth * zoom;
  battlefield.add(right);

  return battlefield;
}

function OutpostGround() {
  const terrain = new THREE.Group();

  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        boardWidth * zoom,
        positionWidth * zoom,
        3 * zoom
      ),
      new THREE.MeshPhongMaterial({ color })
    );

  const middle = createSection(0x4f5d34);
  middle.receiveShadow = true;
  terrain.add(middle);

  const left = createSection(0x3f4b29);
  left.position.x = -boardWidth * zoom;
  terrain.add(left);

  const right = createSection(0x3f4b29);
  right.position.x = boardWidth * zoom;
  terrain.add(right);

  terrain.position.z = 1.5 * zoom;
  return terrain;
}

function Lane(index) {
  this.index = index;
  this.type =
    index <= 0
      ? "camp"
      : laneTypes[Math.floor(Math.random() * laneTypes.length)];

  switch (this.type) {
    case "camp": {
      this.type = "camp";
      this.mesh = new OutpostGround();
      break;
    }
    case "barricade": {
      this.mesh = new OutpostGround();

      this.occupiedPositions = new Set();
      this.barricades = [1, 2, 3, 4].map(() => {
        const barricade = new Barricade();
        let position;
        do {
          position = Math.floor(Math.random() * columns);
        } while (this.occupiedPositions.has(position));
        this.occupiedPositions.add(position);
        barricade.position.x =
          (position * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2;
        this.mesh.add(barricade);
        return barricade;
      });
      break;
    }
    case "tank": {
      this.mesh = new NoMansLand();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      this.vehicles = [1, 2, 3].map(() => {
        const vehicle = new Tank();
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 2);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        vehicle.position.x =
          (position * positionWidth * 2 + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2;
        if (!this.direction) vehicle.rotation.z = Math.PI;
        this.mesh.add(vehicle);
        return vehicle;
      });

      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
      break;
    }
    case "armored": {
      this.mesh = new NoMansLand();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      this.vehicles = [1, 2].map(() => {
        const vehicle = new ArmoredCarrier();
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 3);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        vehicle.position.x =
          (position * positionWidth * 3 + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2;
        if (!this.direction) vehicle.rotation.z = Math.PI;
        this.mesh.add(vehicle);
        return vehicle;
      });

      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
      break;
    }
  }
}

document.querySelector("#retry").addEventListener("click", () => {
  lanes.forEach((lane) => scene.remove(lane.mesh));
  initaliseValues();
  endDOM.style.visibility = "hidden";
});

document
  .getElementById("forward")
  .addEventListener("click", () => move("forward"));

document
  .getElementById("backward")
  .addEventListener("click", () => move("backward"));

document.getElementById("left").addEventListener("click", () => move("left"));

document.getElementById("right").addEventListener("click", () => move("right"));

window.addEventListener("keydown", (event) => {
  if (event.keyCode == "38") {
    // up arrow
    move("forward");
  } else if (event.keyCode == "40") {
    // down arrow
    move("backward");
  } else if (event.keyCode == "37") {
    // left arrow
    move("left");
  } else if (event.keyCode == "39") {
    // right arrow
    move("right");
  }
});

function move(direction) {
  const finalPositions = moves.reduce(
    (position, move) => {
      if (move === "forward")
        return { lane: position.lane + 1, column: position.column };
      if (move === "backward")
        return { lane: position.lane - 1, column: position.column };
      if (move === "left")
        return { lane: position.lane, column: position.column - 1 };
      if (move === "right")
        return { lane: position.lane, column: position.column + 1 };
    },
    { lane: currentLane, column: currentColumn }
  );

  if (direction === "forward") {
    if (
      lanes[finalPositions.lane + 1].type === "barricade" &&
      lanes[finalPositions.lane + 1].occupiedPositions.has(
        finalPositions.column
      )
    )
      return;
    if (!stepStartTimestamp) startMoving = true;
    addLane();
  } else if (direction === "backward") {
    if (finalPositions.lane === 0) return;
    if (
      lanes[finalPositions.lane - 1].type === "barricade" &&
      lanes[finalPositions.lane - 1].occupiedPositions.has(
        finalPositions.column
      )
    )
      return;
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "left") {
    if (finalPositions.column === 0) return;
    if (
      lanes[finalPositions.lane].type === "barricade" &&
      lanes[finalPositions.lane].occupiedPositions.has(
        finalPositions.column - 1
      )
    )
      return;
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "right") {
    if (finalPositions.column === columns - 1) return;
    if (
      lanes[finalPositions.lane].type === "barricade" &&
      lanes[finalPositions.lane].occupiedPositions.has(
        finalPositions.column + 1
      )
    )
      return;
    if (!stepStartTimestamp) startMoving = true;
  }
  moves.push(direction);
}

function animate(timestamp) {
  requestAnimationFrame(animate);

  if (!previousTimestamp) previousTimestamp = timestamp;
  const delta = timestamp - previousTimestamp;
  previousTimestamp = timestamp;

  // Animate armored units moving on the lane
  lanes.forEach((lane) => {
    if (lane.type === "tank" || lane.type === "armored") {
      const aBitBeforeTheBeginingOfLane =
        (-boardWidth * zoom) / 2 - positionWidth * 2 * zoom;
      const aBitAfterTheEndOFLane =
        (boardWidth * zoom) / 2 + positionWidth * 2 * zoom;
      lane.vehicles.forEach((vehicle) => {
        if (lane.direction) {
          vehicle.position.x =
            vehicle.position.x < aBitBeforeTheBeginingOfLane
              ? aBitAfterTheEndOFLane
              : (vehicle.position.x -= (lane.speed / 16) * delta);
        } else {
          vehicle.position.x =
            vehicle.position.x > aBitAfterTheEndOFLane
              ? aBitBeforeTheBeginingOfLane
              : (vehicle.position.x += (lane.speed / 16) * delta);
        }
      });
    }
  });

  if (startMoving) {
    stepStartTimestamp = timestamp;
    startMoving = false;
  }

  if (stepStartTimestamp) {
    const moveDeltaTime = timestamp - stepStartTimestamp;
    const moveDeltaDistance =
      Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
    const jumpDeltaDistance =
      Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;
    switch (moves[0]) {
      case "forward": {
        const positionY =
          currentLane * positionWidth * zoom + moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        soldier.position.y = positionY; // initial soldier position is 0

        soldier.position.z = jumpDeltaDistance;
        break;
      }
      case "backward": {
        positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        soldier.position.y = positionY;

        soldier.position.z = jumpDeltaDistance;
        break;
      }
      case "left": {
        const positionX =
          (currentColumn * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2 -
          moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        soldier.position.x = positionX; // initial soldier position is 0
        soldier.position.z = jumpDeltaDistance;
        break;
      }
      case "right": {
        const positionX =
          (currentColumn * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2 +
          moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        soldier.position.x = positionX;

        soldier.position.z = jumpDeltaDistance;
        break;
      }
    }
    // Once a step has ended
    if (moveDeltaTime > stepTime) {
      switch (moves[0]) {
        case "forward": {
          currentLane++;
          counterDOM.innerHTML = `Advance: ${currentLane}`;
          break;
        }
        case "backward": {
          currentLane--;
          counterDOM.innerHTML = `Advance: ${currentLane}`;
          break;
        }
        case "left": {
          currentColumn--;
          break;
        }
        case "right": {
          currentColumn++;
          break;
        }
      }
      moves.shift();
      // If more steps are to be taken then restart counter otherwise stop stepping
      stepStartTimestamp = moves.length === 0 ? null : timestamp;
    }
  }

  // Hit test
  if (
    lanes[currentLane].type === "tank" ||
    lanes[currentLane].type === "armored"
  ) {
    const soldierMinX = soldier.position.x - (soldierSize * zoom) / 2;
    const soldierMaxX = soldier.position.x + (soldierSize * zoom) / 2;
    const vehicleLength = { tank: 60, armored: 105 }[lanes[currentLane].type];
    lanes[currentLane].vehicles.forEach((vehicle) => {
      const vehicleMinX = vehicle.position.x - (vehicleLength * zoom) / 2;
      const vehicleMaxX = vehicle.position.x + (vehicleLength * zoom) / 2;
      if (soldierMaxX > vehicleMinX && soldierMinX < vehicleMaxX) {
        endDOM.style.visibility = "visible";
      }
    });
  }
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
