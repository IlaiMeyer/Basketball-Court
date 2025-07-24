import {OrbitControls} from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


// Define a series of preset camera positions and corresponding lookAt points.
// The user can cycle through these views by pressing the 'C' key.  The
// presets include:
//   0) Default: above centre court looking along the long axis.
//   1) Opposite side: same height but from behind the far baseline.
//   2) Behind the left hoop: low angle view behind the left basket.
//   3) Behind the right hoop: low angle view behind the right basket.
// Each entry stores a THREE.Vector3 for the camera position and a Vector3 for
// the point to look at.

const cameraPresets = [
  {
    position: new THREE.Vector3(0, 15, 30),
    lookAt:  new THREE.Vector3(0, 0, 0),
  },
  {
    position: new THREE.Vector3(0, 15, -30),
    lookAt:  new THREE.Vector3(0, 0, 0),
  },
  {
    position: new THREE.Vector3(-20, 8, 0),
    lookAt:  new THREE.Vector3(-15.5, 3, 0),
  },
  {
    position: new THREE.Vector3(20, 8, 0),
    lookAt:  new THREE.Vector3(15.5, 3, 0),
  },
];

// Index of the current preset.  Starts at 0 (the default view).  When the user
// presses 'C', this index increments modulo the number of presets.
let cameraPresetIndex = 0;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Set background color
scene.background = new THREE.Color(0x000000);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.35);
directionalLight.position.set(10, 30, 15);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 100;
scene.add(directionalLight);

// To get an arena like lightings we set a few extra lighting sources as
// directional lights symmetrically around the court.  These extra lights
// help illuminate the scene evenly from multiple directions and reduce
// overly dark areas while still casting shadows.  Each light uses the
// same colour and intensity but originates from different positions.
const additionalLights = [];
[
  { x: -10, y: 30, z: 15 },
  { x: 10, y: 30, z: -15 },
  { x: -10, y: 30, z: -15 },
].forEach(pos => {
  const light = new THREE.DirectionalLight(0xffffff, 0.35);
  light.position.set(pos.x, pos.y, pos.z);
  light.castShadow = true;
  scene.add(light);
  additionalLights.push(light);
});

// Enable shadows
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

// Create basketball court
function createBasketballCourt() {
  // Load textures for the court and Lakers logo
  const textureLoader = new THREE.TextureLoader();
  const woodTexture = textureLoader.load('wood.jpg');
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(14, 7);

  // Load Lakers logo with transparent background
  const lakersLogoTexture = textureLoader.load('Laker.PNG');

  // Court base is wooden floor and Lakers colors for the sides
  const courtGroup = new THREE.Group();

  // Purple out‑of‑bounds area to match Lakers theme
  const sidelineGeometry = new THREE.BoxGeometry(34, 0.1, 19);
  const sidelineMaterial = new THREE.MeshPhongMaterial({ color: 0x552583 });
  const sideline = new THREE.Mesh(sidelineGeometry, sidelineMaterial);
  sideline.position.y = -0.05;
  sideline.receiveShadow = true;
  courtGroup.add(sideline);

  // Wooden court surface
  const courtGeometry = new THREE.BoxGeometry(30, 0.1, 15);
  const courtMaterial = new THREE.MeshPhongMaterial({ map: woodTexture, shininess: 50 });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  courtGroup.add(court);

  // Add court markings
  addCourtMarkings(courtGroup);

  // Add hoops and supports
  createHoopAssembly(courtGroup, 'left');
  createHoopAssembly(courtGroup, 'right');

  // Add static basketball at centre court
  createTexturedBasketball(courtGroup);

  // Place Lakers logos along the sideline on alternating halves
  createSidelineLogos(courtGroup, lakersLogoTexture);

  // Add the entire court group to the scene
  scene.add(courtGroup);
}


 // Add all required court markings to the court, lines are created as box
 // geometry elements to get normal width since lines have default width.
 // Center circle is done as a ring at the same width of the lines.
 
function addCourtMarkings(parent) {
  const markingY = 0.06;
  const lineColor = 0xffffff;
  // Court outline
  const outlineGroup = new THREE.Group();
  const w = 30;
  const h = 15;
  const thickness = 0.1;
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: lineColor });
  const outlineSegments = [
    { x: 0, z: -h / 2, w: w, h: thickness }, // bottom
    { x: 0, z: h / 2, w: w, h: thickness }, // top
    { x: -w / 2, z: 0, w: thickness, h: h }, // left
    { x: w / 2, z: 0, w: thickness, h: h }, // right
  ];
  outlineSegments.forEach(({ x, z, w, h }) => {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, h), outlineMaterial);
    seg.position.set(x, markingY, z);
    outlineGroup.add(seg);
  });
  parent.add(outlineGroup);

  // Center line
  const centreLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.01, 15),
    new THREE.MeshBasicMaterial({ color: lineColor }),
  );
  centreLine.position.set(0, markingY, 0);
  parent.add(centreLine);

  // Center circle
  const centreCircle = new THREE.Mesh(
    new THREE.RingGeometry(1.9, 2.0, 64),
    new THREE.MeshBasicMaterial({ color: lineColor, side: THREE.DoubleSide }),
  );
  centreCircle.rotation.x = degrees_to_radians(-90);
  centreCircle.position.set(0, markingY, 0);
  parent.add(centreCircle);

  // Three‑point arcs on each end
  createThreePointArc(parent, -13.5, 'left');
  createThreePointArc(parent, 13.5, 'right');

  // Key areas and free throw arcs on each end
  createKeyArea(parent, -12, 'left');
  createKeyArea(parent, 12, 'right');
}


 // Create a three‑point arc for a given side of the court.  A tube geometry
 // approximates the locaition as to get the best arc. Arc width matches
 // the lines of the court.
 
function createThreePointArc(parent, centreZ, direction) {
  const radius = 6.75;
  const segments = 64;
  const angleStartDeg = direction === 'left' ? -13 : -193;
  const angleEndDeg = direction === 'left' ? 193 : 13;
  const y = 0.02;
  const curvePoints = [];
  for (let i = 0; i <= segments; i++) {
    const angleDeg = angleStartDeg + ((angleEndDeg - angleStartDeg) * i) / segments;
    const angle = degrees_to_radians(angleDeg);
    const localX = Math.cos(angle) * radius;
    const localZ = Math.sin(angle) * radius;
    // Convert local arc coordinates into world coordinates by rotating
    const worldX = localX;
    const worldZ = localZ + centreZ;
    const rotatedX = worldZ;
    const rotatedZ = -worldX;
    curvePoints.push(new THREE.Vector3(rotatedX, y, rotatedZ));
  }
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const tubeGeometry = new THREE.TubeGeometry(curve, 128, 0.05, 8, false);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(tubeGeometry, material);
  parent.add(mesh);
}


 // Create the key area for a given side.  The entire key area is constructed as a group 
 // so it can be rotated by 90° to align with the court's orientation on both sides.

function createKeyArea(parent, centreZ, side) {
  const y = 0.06;
  const lineColor = 0xffffff;
  const keyWidth = 4.9;
  const keyHeight = 5.8;
  const thickness = 0.1;
  const keyGroup = new THREE.Group();
  // Rectangle outline
  const edges = [
    { x: 0, z: centreZ - keyHeight / 2, w: keyWidth, h: thickness },
    { x: 0, z: centreZ + keyHeight / 2, w: keyWidth, h: thickness },
    { x: -keyWidth / 2, z: centreZ, w: thickness, h: keyHeight },
    { x: keyWidth / 2, z: centreZ, w: thickness, h: keyHeight },
  ];
  edges.forEach(({ x, z, w, h }) => {
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.01, h),
      new THREE.MeshBasicMaterial({ color: lineColor }),
    );
    edge.position.set(x, y, z);
    keyGroup.add(edge);
  });
  // Free throw line
  const ftLine = new THREE.Mesh(
    new THREE.BoxGeometry(keyWidth + 0.1, 0.01, thickness),
    new THREE.MeshBasicMaterial({ color: lineColor }),
  );
  const ftOffset = side === 'left' ? keyHeight / 2 : -keyHeight / 2;
  ftLine.position.set(0, y, centreZ + ftOffset);
  keyGroup.add(ftLine);
  // Free throw arc
  const safeSegments = 64;
  const safeRadius = 1.8;
  const arcCentreZ = centreZ + (side === 'left' ? keyHeight / 2 : -keyHeight / 2);
  const arcStartDeg = 0;
  const arcEndDeg = 180;
  for (let i = 0; i < safeSegments; i++) {
    const deg1 = arcStartDeg + (i * (arcEndDeg - arcStartDeg)) / safeSegments;
    const deg2 = arcStartDeg + ((i + 1) * (arcEndDeg - arcStartDeg)) / safeSegments;
    const angle1 = degrees_to_radians(deg1);
    const angle2 = degrees_to_radians(deg2);
    const x1 = Math.cos(angle1) * safeRadius;
    const z1 = Math.sin(angle1) * safeRadius;
    const x2 = Math.cos(angle2) * safeRadius;
    const z2 = Math.sin(angle2) * safeRadius;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    if (length < 1e-6 || isNaN(length)) continue;
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const angle = Math.atan2(dz, dx);
    const segment = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.01, 0.1),
      new THREE.MeshBasicMaterial({ color: lineColor }),
    );
    segment.position.set(midX, y, midZ + arcCentreZ);
    segment.rotation.y = -angle;
    keyGroup.add(segment);
  }
  // Hash marks outside the key
  const markPositionsZ = [-0.85, 0.0, 0.85, 1.75];
  const markX = keyWidth / 2 + 0.1;
  markPositionsZ.forEach((offsetZ) => {
    const mirroredZ = side === 'right' ? -offsetZ : offsetZ;
    const z = centreZ + mirroredZ;
    [-1, 1].forEach((sign) => {
      const mark = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.01, 0.05),
        new THREE.MeshBasicMaterial({ color: lineColor }),
      );
      mark.position.set(sign * markX, y, z);
      keyGroup.add(mark);
    });
  });
  // Rotate entire key group 90° around centre of court to align with court orientation
  keyGroup.rotation.y = degrees_to_radians(90);
  parent.add(keyGroup);
}


 // Construct a complete hoop assembly (base, support, backboard, rim and net)
 // at one end of the court.  The `side` argument determines whether the
 // structure is placed on the left or right baseline (negative or positive
 // x direction). The specification for the backboard, edge mark and shooter
 // square are included here.
 
function createHoopAssembly(parent, side) {
  // Build the coloured base under the support pole
  const baseGroup = new THREE.Group();
  const baseWidth = 1.0;
  const baseDepth = 1.8;
  const baseHeight = 0.25;
  const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x4169e1 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth), baseMaterial);
  base.castShadow = true;
  base.receiveShadow = true;
  // Position base at end of court beyond out‑of‑bounds line
  const baseOffset = 16.0;
  base.position.set(0, baseHeight / 2 + 0.06, side === 'left' ? -baseOffset : baseOffset);
  baseGroup.add(base);
  // Rotate group 90° so the depth faces along the court's length
  baseGroup.rotation.y = degrees_to_radians(90);
  parent.add(baseGroup);

  // Create the support structure including backboard, rim and net
  // The supportGroup is a separate transform root so it can be rotated for left/right sides
  const supportGroup = new THREE.Group();
  const baseHeightForPole = baseHeight;
  const poleHeight = 2.2;
  // Vertical pole
  const pole = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, poleHeight, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x0044aa }),
  );
  pole.position.set(0, baseHeightForPole + poleHeight / 2, 0);
  pole.castShadow = true;
  supportGroup.add(pole);
  // Angled arm connecting pole to backboard
  const armLength = 1.8;
  const armGeom = new THREE.BoxGeometry(armLength, 0.2, 0.4);
  const arm = new THREE.Mesh(
    armGeom,
    new THREE.MeshStandardMaterial({ color: 0x0044aa }),
  );
  const armAngle = degrees_to_radians(25);
  arm.rotation.z = armAngle;
  const armOffsetX = Math.cos(armAngle) * (armLength / 2);
  const armOffsetY = Math.sin(armAngle) * (armLength / 2);
  arm.position.set(armOffsetX - 0.15, baseHeightForPole + poleHeight + armOffsetY - 0.09, 0);
  arm.castShadow = true;
  supportGroup.add(arm);
  // Backboard is transparent black glass with white border and shooter's square
  const backboardWidth = 1.8;
  const backboardHeight = 1.05;
  const backboardGeom = new THREE.PlaneGeometry(backboardWidth, backboardHeight);
  const backboardMat = new THREE.MeshPhongMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
    shininess: 100,
  });
  const backboard = new THREE.Mesh(backboardGeom, backboardMat);
  const armEndX = arm.position.x + Math.cos(armAngle) * (armLength / 2);
  const armEndY = arm.position.y + Math.sin(armAngle) * (armLength / 2);
  const backboardOffset = 0.15;
  // Position the backboard relative to the arm tip
  backboard.position.set(armEndX + backboardOffset, armEndY, 0);
  backboard.rotation.y = degrees_to_radians(90);
  backboard.castShadow = true;
  supportGroup.add(backboard);
  // Connector from angled part to backboard, parallel to the floor
  {
    const connectorLength = backboardOffset + 0.03;
    const connectorGeom = new THREE.BoxGeometry(connectorLength, 0.2, 0.4);
    const connectorMat = new THREE.MeshStandardMaterial({ color: 0x0044aa });
    const connector = new THREE.Mesh(connectorGeom, connectorMat);
    
    // adjustment in x and y aligns it between the pole and backboard
    connector.position.set((armEndX + connectorLength / 2) - 0.05, armEndY - 0.011, 0);
    connector.castShadow = true;
    supportGroup.add(connector);
  }
  // Create a border and shooter's square around the backboard for better visibility
  addBackboardFrame(supportGroup, backboard);
  // Create rim and net attached to backboard
  addRimAndNet(supportGroup, backboard, side);
  // Rotate support for left or right baseline
  if (side === 'right') {
    supportGroup.rotation.y = degrees_to_radians(180);
  } else {
    supportGroup.rotation.y = degrees_to_radians(0);
  }
  // Position entire support structure at baseline beyond court edge
  const supportOffsetX = 15.5;
  supportGroup.position.set(side === 'left' ? -supportOffsetX : supportOffsetX, 0, 0);
  parent.add(supportGroup);
}


 // Create a rim and hanging net (line segments) for a hoop.  The rim
 // position is based on the backboard position, and the net is constructed
 // using lines connecting the rim to smaller rings below to create a net-like structure.
 
function addRimAndNet(supportGroup, backboard, side) {
  // Rim geometry and material
  const rimRadius = 0.23;
  const rimTube   = 0.02;
  const rimGeom   = new THREE.TorusGeometry(rimRadius, rimTube, 16, 60);
  const rimMat    = new THREE.MeshPhongMaterial({ color: 0xd35400, shininess: 30 });
  const rim = new THREE.Mesh(rimGeom, rimMat);
  rim.rotation.x = degrees_to_radians(90);
  // Position the rim relative to the backboard
  const squareVerticalOffset = 0.2;
  const squareHeight         = 0.45;
  const rimHeight            = backboard.position.y - squareVerticalOffset - squareHeight / 2;
  const rimOffset            = 0.25;
  rim.position.set(backboard.position.x + rimOffset, rimHeight, backboard.position.z);
  rim.castShadow = true;
  supportGroup.add(rim);

  // Net parameters
  const netLength    = 0.5;
  // Number of strands around the rim
  const netSegments  = 16;
  // Number of intermediate rings
  const ringCount    = 2;
  const ringShrink   = 0.8;
  const verticalSpacing = netLength / (ringCount + 1);

  // Group to hold all net elements
  const netGroup = new THREE.Group();

  // Calculate and create intermediate rings
  const ringRadii = [];
  let currentRadius = rimRadius;
  for (let i = 0; i < ringCount; i++) {
    currentRadius *= ringShrink;
    ringRadii.push(currentRadius);

    const ringGeom  = new THREE.TorusGeometry(currentRadius, 0.005, 8, 32);
    const ringMat   = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ringMesh  = new THREE.Mesh(ringGeom, ringMat);

    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(0, -verticalSpacing * (i + 1), 0);
    netGroup.add(ringMesh);
  }

  // Final bottom ring
  const bottomRadius = currentRadius * ringShrink;
  const bottomRingGeom = new THREE.TorusGeometry(bottomRadius, 0.005, 8, 32);
  const bottomRingMat  = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const bottomRing     = new THREE.Mesh(bottomRingGeom, bottomRingMat);
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.set(0, -netLength, 0);
  netGroup.add(bottomRing);

  // Material for connecting strands
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  // Create strands for the net
  for (let i = 0; i < netSegments; i++) {
    const angle = (i / netSegments) * Math.PI * 2;
    let prevRadius = rimRadius;
    let prevY      = 0;
    // Connect to each intermediate ring
    for (let j = 0; j < ringCount; j++) {
      const nextRadius = ringRadii[j];
      const nextY      = -verticalSpacing * (j + 1);
      const start = new THREE.Vector3(
        Math.cos(angle) * prevRadius, prevY, Math.sin(angle) * prevRadius,
      );
      const end   = new THREE.Vector3(
        Math.cos(angle) * nextRadius, nextY, Math.sin(angle) * nextRadius,
      );
      const geom  = new THREE.BufferGeometry().setFromPoints([start, end]);
      netGroup.add(new THREE.Line(geom, lineMaterial));
      prevRadius = nextRadius;
      prevY      = nextY;
    }
    // Connect last intermediate ring to bottom ring
    const finalStart = new THREE.Vector3(
      Math.cos(angle) * prevRadius, prevY, Math.sin(angle) * prevRadius,
    );
    const finalEnd = new THREE.Vector3(
      Math.cos(angle) * bottomRadius, -netLength, Math.sin(angle) * bottomRadius,
    );
    const finalGeom = new THREE.BufferGeometry().setFromPoints([finalStart, finalEnd]);
    netGroup.add(new THREE.Line(finalGeom, lineMaterial));
  }
  // Align the net group with the rim
  netGroup.position.copy(rim.position);
  supportGroup.add(netGroup);
}



 // Add a thick white border and shooter's square to a backboard. Using
 // small box geometries instead of line primitives allows the edges to be
 // visually thicker and thus more noticeable from afar.
 
function addBackboardFrame(supportGroup, backboard) {
  const bWidth = 1.8;
  const bHeight = 1.05;
  const thickness = 0.03;
  const frameGroup = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
  // Outer border
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(bWidth + 0.06, thickness, thickness), material);
  topBar.position.set(0, bHeight / 2 + thickness / 2, 0);
  frameGroup.add(topBar);
  const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(bWidth + 0.06, thickness, thickness), material);
  bottomBar.position.set(0, -bHeight / 2 - thickness / 2, 0);
  frameGroup.add(bottomBar);
  const leftBar = new THREE.Mesh(new THREE.BoxGeometry(thickness, bHeight + 0.06, thickness), material);
  leftBar.position.set(-bWidth / 2 - thickness / 2, 0, 0);
  frameGroup.add(leftBar);
  const rightBar = new THREE.Mesh(new THREE.BoxGeometry(thickness, bHeight + 0.06, thickness), material);
  rightBar.position.set(bWidth / 2 + thickness / 2, 0, 0);
  frameGroup.add(rightBar);
  // Shooter's square
  const sqWidth = 0.6;
  const sqHeight = 0.45;
  // top of square
  const sqTop = new THREE.Mesh(new THREE.BoxGeometry(sqWidth + 0.06, thickness, thickness), material);
  sqTop.position.set(0, sqHeight / 2 + thickness / 2 - 0.2, 0);
  frameGroup.add(sqTop);
  const sqBottom = new THREE.Mesh(new THREE.BoxGeometry(sqWidth + 0.06, thickness, thickness), material);
  sqBottom.position.set(0, -sqHeight / 2 - thickness / 2 - 0.2, 0);
  frameGroup.add(sqBottom);
  const sqLeft = new THREE.Mesh(new THREE.BoxGeometry(thickness, sqHeight + 0.06, thickness), material);
  sqLeft.position.set(-sqWidth / 2 - thickness / 2, -0.2, 0);
  frameGroup.add(sqLeft);
  const sqRight = new THREE.Mesh(new THREE.BoxGeometry(thickness, sqHeight + 0.06, thickness), material);
  sqRight.position.set(sqWidth / 2 + thickness / 2, -0.2, 0);
  frameGroup.add(sqRight);
  
  // Court facing side.  Without this shift the bars extrude through the glass.
  frameGroup.position.set(
    backboard.position.x - thickness / 2,
    backboard.position.y,
    backboard.position.z,
  );
  frameGroup.rotation.y = degrees_to_radians(90);
  supportGroup.add(frameGroup);
}


 // Create the static basketball positioned at center court. The ball is
 // represented by a sphere with an orange Phong material from texture and
 // also a normal map to approximate the black seam lines found on a real basketball.
 
function createTexturedBasketball(parent) {
  const radius = 0.22; 
  const segments = 64;
  const geometry = new THREE.SphereGeometry(radius, segments, segments);

  const loader = new THREE.TextureLoader();
  const diffuseMap = loader.load('basketball.png');
  const bumpMap    = loader.load('basketballBump.png');

  const material = new THREE.MeshPhongMaterial({
    map:     diffuseMap,
    bumpMap: bumpMap,
    bumpScale: 0.04,
    shininess: 40,
  });

  const ball = new THREE.Mesh(geometry, material);
  ball.position.set(0, radius + 0.07, 0);
  ball.castShadow = true;
  ball.receiveShadow = true;
  parent.add(ball);
}


 // Place two Lakers logos along the sideline on alternate halves of the court.
 // Each logo is applied to a vertical plane so it faces outward towards the
 // stands. The logo texture is loaded once and reused on both planes.
 
function createSidelineLogos(parent, logoTexture) {
  
  const logoSize = 4.0;
  const yPos = 0.06 + 0.01;
  const zOffset = 4.0;
  const xOffset = 5.0;

  // Helper to create a logo on the floor
  function createLogoFloor(zPos, xPos, flip) {
    const planeGeom = new THREE.PlaneGeometry(logoSize, logoSize - 1.0);
    const planeMat = new THREE.MeshPhongMaterial({
      map: logoTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeom, planeMat);
    // Lay flat on the court surface
    plane.rotation.x = -Math.PI / 2;
    // If flip is true, mirror the texture horizontally so the logo faces the
    // opposite direction.  Scaling by -1 in the X and Y diamensions will 
    // get the logo to face the crowd on both sides
    if (flip) {
      plane.scale.x = -1;
      plane.scale.y = -1;
    }
    plane.position.set(xPos, yPos, zPos);
    plane.receiveShadow = true;
    parent.add(plane);
  }
  
  // The second logo is mirrored to face toward the opposite sideline.
  createLogoFloor(-zOffset, -xOffset, true);
  createLogoFloor(zOffset, xOffset, false);
}


// Create all elements
createBasketballCourt();

// Camera positioning: elevate and pull back to view the whole arena
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// Instructions display
const instructionsElement = document.createElement('div');
instructionsElement.style.position = 'absolute';
instructionsElement.style.bottom = '20px';
instructionsElement.style.left = '20px';
instructionsElement.style.color = 'white';
instructionsElement.style.fontSize = '16px';
instructionsElement.style.fontFamily = 'Arial, sans-serif';
instructionsElement.style.textAlign = 'left';
instructionsElement.innerHTML = `
  <h3>Controls:</h3>
  <p>O - Toggle orbit camera</p>
  <p>C - Toggle cameras</p>
`;
document.body.appendChild(instructionsElement);

// We create holders for future interactive features (scorekeeping, player controls
// and so on, we create two additional HTML containers. Basic CSS styling is
// applied directly via JavaScript for simplicity.

// Scoreboard container: positioned in the upper left of the screen.  At
// runtime this could display anything but now has placeholder names.
const scoreContainer = document.createElement('div');
scoreContainer.id = 'scoreDisplay';
scoreContainer.textContent = 'Score: 0 – 0';
scoreContainer.style.position = 'absolute';
scoreContainer.style.top = '20px';
scoreContainer.style.left = '20px';
scoreContainer.style.color = 'white';
scoreContainer.style.fontSize = '24px';
scoreContainer.style.fontFamily = 'Arial, sans-serif';
scoreContainer.style.fontWeight = 'bold';
scoreContainer.style.pointerEvents = 'none';
document.body.appendChild(scoreContainer);

// Controls hint container positioned just above the control instructions.
// This container will later list keybindings for normal operaition of the 
// program, not to be confused with actions changing the scene
const controlsHintContainer = document.createElement('div');
controlsHintContainer.id = 'controlsHint';
controlsHintContainer.style.position = 'absolute';
controlsHintContainer.style.bottom = '60px';
controlsHintContainer.style.left = '20px';
controlsHintContainer.style.color = 'white';
controlsHintContainer.style.fontSize = '14px';
controlsHintContainer.style.fontFamily = 'Arial, sans-serif';
controlsHintContainer.style.pointerEvents = 'none';
// Placeholder text
controlsHintContainer.innerHTML = '<p></p>';
document.body.appendChild(controlsHintContainer);

// Handle key events
function handleKeyDown(e) {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }
  // 'C' lets you control the camera preset, this changes the location of the camera.
  // If the user changed the orbit this function allows him to return to preset locations.
  if (e.key === 'c' || e.key === 'C') {
    // Advance to the next preset index and wrap around
    cameraPresetIndex = (cameraPresetIndex + 1) % cameraPresets.length;
    const preset = cameraPresets[cameraPresetIndex];
    // Update camera position and target
    camera.position.copy(preset.position);
    controls.target.copy(preset.lookAt);
    // Ensure the camera actually looks at the new target
    camera.lookAt(preset.lookAt);
    // Update the orbit controls so the pivot point matches the new target
    controls.update();
  }
}

document.addEventListener('keydown', handleKeyDown);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();