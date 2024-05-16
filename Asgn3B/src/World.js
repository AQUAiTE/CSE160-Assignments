// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_TextureUnit;
  uniform float u_texColorWeight;
  void main() {
    gl_FragColor = vec4(v_UV, 1.0, 1.0);
    vec4 texColor;
    if (u_TextureUnit == 0) {
      texColor = texture2D(u_Sampler0, v_UV);
    }
    else if (u_TextureUnit == 1) {
      texColor = texture2D(u_Sampler1, v_UV);
    } else {
      texColor = texture2D(u_Sampler2, v_UV);
    }
    // Final Color/Texture Set Based on texColorWeight
    gl_FragColor = (1.0 - u_texColorWeight) * u_FragColor + u_texColorWeight * texColor;
  }`

// Global Vars
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_TextureUnit;
let u_texColorWeight;


// UI Global Vars
let g_globalAngle = [25, 0];
// Shoulder X, Shoulder Y, Elbow
let g_leftAngles = [0, 0, 0];
let g_rightAngles = [0, 0, 0]; 
let g_camera;

// Animation Global Vars 
// *Note: Holdover from previous assignment, breaks the model w/o it
let g_eyebrowL = 0;
let g_eyebrowR = 0;
let g_moustacheHt = 0;
let g_flipStacheX = 0.0;
let g_flipStacheY = 0.0;
let g_browRotate = 7;
let g_browMoveX = 0.0;
let g_browMoveY = 0.0;

// Performance Monitor
var stats = new Stats();
stats.dom.style.left = "auto";
stats.dom.style.right = "0";
stats.showPanel(0);
document.body.appendChild(stats.dom);


// Setup Functions =======================================================================================================
function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Enable depth test
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
      console.log('Failed to get the storage location of u_ProjectionMatrix');
      return;
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // Get the storage location of u_Sampler0
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  // Get the storage location of u_Sampler1
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  } 

  // Get the storage location of u_Sampler2
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return;
  } 

  // Get the storage location of u_TextureUnit
  u_TextureUnit = gl.getUniformLocation(gl.program, 'u_TextureUnit');
  if (!u_TextureUnit) {
    console.log('Failed to get the storage location of u_TextureUnit');
    return;
  }

  // Get the storage location of u_texColorWeight
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  if (!u_texColorWeight) {
    console.log('Failed to get the storage location of u_texColorWeight');
    return;
  }



  // Set identity matrix at first
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

function addActionsForHtmlUI() {
  // Slider Events
  document.getElementById('cameraX').addEventListener('input', function() { g_globalAngle[0] = this.value; renderAllShapes(); });
  document.getElementById('cameraY').addEventListener('input', function() { g_globalAngle[1] = this.value; renderAllShapes(); });

  // Lock/Unlock Cursor when Canvas Clicked
  canvas.onclick = async () => {
    if (!document.pointerLockElement) 
      {await canvas.requestPointerLock();} 
  };

  document.addEventListener('pointerlockchange', lockAlert, false);
}

function lockAlert() {
  if (document.pointerLockElement == canvas) {
    document.onmousemove = (ev) => lookAround(ev);
  } else {
    console.log("NO YEET");
    document.onmousemove = null;
  }
}

function lookAround(ev) {
  g_camera.horizontalPan(ev.movementX * 0.1);
}

function initTextures() {
  var image0 = new Image();
  var image1 = new Image();
  var image2 = new Image();
  if (!image0 || !image1 || !image2) {
    console.log('Failed to create the image object');
    return false;
  }

  image2.onload = function() { loadTexture(image0, image1, image2); };
  image0.src = '../assets/castleWalls.png';
  image1.src = '../assets/64SeaClouds.png'
  image2.src = '../assets/PinkShrooms.png';

  return true;
}

function loadTexture(image0, image1, image2) {
  var texture0 = gl.createTexture();
  var texture1 = gl.createTexture();
  var texture2 = gl.createTexture();
  if (!texture0 || !texture1 || !texture2) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  // Set up texture for image0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image0);
  gl.uniform1i(u_Sampler0, 0);

  // Set up texture for image1
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);
  gl.uniform1i(u_Sampler1, 1);

  // Set up texture for image2
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture2);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image2);
  gl.uniform1i(u_Sampler2, 2);
}

// Main Function  to load canvas and draw 3D Model =============================================================================
function main() {

  // Set up canvas and gl vars 
  setupWebGL(); 

  // Set up GLSL shader programs and connect GLSL vars
  connectVariablesToGLSL();

  // Set up actions for HTML UI Elements
  addActionsForHtmlUI();

  initTextures();

  g_camera = new Camera();
  updateCamera();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.53, 0.87, 0.98, 1.0);

  //gl.clear(gl.COLOR_BUFFER_BIT);
  tick()
}

// Handling Events =======================================================================================================
// Extract event click and return it in WebGL coords
function convertCoordinatesEventToGL(ev) {
  let x = ev.clientX; // x coordinate of a mouse pointer
  let y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function keydown(ev) {
  switch (ev.keyCode) {
    case 65: // A
      g_camera.moveLeft();
      console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 68: // D
      g_camera.moveRight();
      console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 87: // W
      g_camera.moveForward();
      console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 83: // S
      g_camera.moveBackwards();
      console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 69: // E
      g_camera.panRight();
      console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 81: // Q
      g_camera.panLeft();
      console.log("Hitting keycode: " + ev.keyCode);
      break;
    default: return;
  }

}

function updateCamera() {
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  // Pass matrix to rotate camera angle
  let globalRotMatrix = new Matrix4().rotate(g_globalAngle[0], 0, 1, 0);
  globalRotMatrix.rotate(g_globalAngle[1], 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMatrix.elements);

  // Use the Sea and Clouds Image
  gl.uniform1i(u_TextureUnit, 1);
  // Use the texture
  gl.uniform1f(u_texColorWeight, 1.0);
  buildSky();

  gl.uniform1f(u_texColorWeight, 0.0);
  buildGround();

  // Use Default Color
  buildHead();

  buildBody();

  buildArms();

  // Use the base color
  gl.uniform1f(u_texColorWeight, 0.0);
  buildLegs();

  // Use Castle Walls Texture
  gl.uniform1i(u_TextureUnit, 0);
  gl.uniform1f(u_texColorWeight, 1.0);
  buildMap();

}

function tick() {
    stats.begin();
    document.onkeydown = keydown.bind(g_camera);
    updateCamera();
    renderAllShapes();
    stats.end();

    requestAnimationFrame(tick);
}

// Build the Sky and Ground ================================================================================================
function buildSky() {
  const sky = new Cube();
  sky.color = [0.5, 0.5, 1.0, 1.0];
  sky.matrix.scale(20, 20, 20);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();
}

function buildGround() {
  const ground = new Cube();
  ground.color = [0.0, 0.6, 0.4, 1.0];
  ground.matrix.translate(0, -0.1, 0.0);
  ground.matrix.scale(20, 0, 20);
  ground.matrix.translate(-0.5, 0.0, -0.5);
  ground.render();
}

// Map Key
// 0 = No Wall
// 1 = Black Wall
// 2 = Pink Shroom Block

let map = [
  // Opposite Corner
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Top Left Corner
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] 
  // Right Corner                                                                                 // Starting Corner
];
function buildMap() {
  for (x = 0; x < 32; x++) {
    for (z = 0; z < 32; z++) {
      gl.uniform1i(u_TextureUnit, 0);
      if (map[x][z] != 0) {
        let wall = new Cube();
        wall.color = [0.0, 0.0, 0.0, 1.0];
        wall.matrix.translate(0.0, -0.1, 0.0);
        if (map[x][z] == 2) { 
          gl.uniform1i(u_TextureUnit, 2);
          wall.matrix.scale(0.15, 0.15, 0.15);
          wall.matrix.translate((x-5)*2, 0.0, (z-5)*2);
          wall.render();
        } else {
          wall.matrix.scale(0.3, 0.3, 0.3);
          wall.matrix.translate(x-5, 0.0, z-5);
          wall.render();
        }
      }
    }
  }
}

// Functions that build the 3D Blocky Animal ===============================================================================
function buildHead() {
  // Broque Monsieur's Head
  const head = new Cube();
  head.color = [0.98, 0.905, 0.3, 1.0];
  head.matrix.setTranslate(0.0, 0.5, 0.0);
  head.matrix.scale(0.3, 0.3, 0.3);
  head.render();

  /*// Left Eyeball
  const leftEye = new Cylinder();
  leftEye.color = [1.0, 1.0, 1.0, 1.0];
  leftEye.matrix.setTranslate(0.125, 0.55, -0.35);
  leftEye.matrix.scale(0.35, 0.55, 0.05);
  leftEye.render();

  // Right Eyeball
  const rightEye = new Cylinder();
  rightEye.color = [1.0, 1.0, 1.0, 1.0];
  rightEye.matrix.setTranslate(-0.125, 0.55, -0.35);
  rightEye.matrix.scale(0.35, 0.55, 0.05);
  rightEye.render();

  // Left Pupil
  const leftPupil = new Cylinder();
  leftPupil.color = [0.0, 0.0, 0.0, 1.0];
  leftPupil.matrix.setTranslate(0.125, 0.55, -0.36);
  leftPupil.matrix.scale(0.175, 0.275, 0.025);
  leftPupil.render();

  // Right Pupil
  const rightPupil = new Cylinder();
  rightPupil.color = [0.0, 0.0, 0.0, 1.0];
  rightPupil.matrix.setTranslate(-0.125, 0.55, -0.36);
  rightPupil.matrix.scale(0.175, 0.275, 0.025);
  rightPupil.render();

  // Right Eyebrow
  const rightBrow = new Cube();
  rightBrow.color = [0.0, 0.0, 0.0, 1.0];
  rightBrow.matrix.setTranslate(-0.15, 0.705, -0.31);
  rightBrow.matrix.translate(g_browMoveX, g_browMoveY, 0.0);
  rightBrow.matrix.translate(0, g_eyebrowR, 0)
  rightBrow.matrix.rotate(g_browRotate, 0, 0, 1);
  rightBrow.matrix.scale(0.1, 0.022, 0.02);
  rightBrow.render();

  // Left Eyebrow
  const leftBrow = new Cube();
  leftBrow.color = [0.0, 0.0, 0.0, 1.0];
  leftBrow.matrix.setTranslate(0.15, 0.705, -0.31);
  leftBrow.matrix.translate(-g_browMoveX, -g_browMoveY, 0.0);
  leftBrow.matrix.translate(0, g_eyebrowL, 0);
  leftBrow.matrix.rotate(-g_browRotate, 0, 0, 1);
  leftBrow.matrix.scale(0.1, 0.022, 0.02);
  leftBrow.render();

  // Right Moustache Segment
  const rightStache = new Cube();
  rightStache.color = [0.0, 0.0, 0.0, 1.0];
  rightStache.matrix.setTranslate(-0.075, 0.37, -0.31);
  rightStache.matrix.translate(g_flipStacheX, g_flipStacheY, 0.0);
  rightStache.matrix.translate(0, -g_moustacheHt, 0);
  rightStache.matrix.rotate(45, 0, 0, 1);
  rightStache.matrix.scale(0.15, 0.05, 0.02);
  rightStache.render();

  // Left Moustache Segment
  const leftStache = new Cube();
  leftStache.color = [0.0, 0.0, 0.0, 1.0];
  leftStache.matrix.setTranslate(0.075, 0.37, -0.31);
  leftStache.matrix.translate(-g_flipStacheX, g_flipStacheY, 0.0);
  leftStache.matrix.translate(0, -g_moustacheHt, 0);
  leftStache.matrix.rotate(-45, 0, 0, 1);
  leftStache.matrix.translate(0.0, 0.0, 0.0);
  leftStache.matrix.scale(0.15, 0.05, 0.02);
  leftStache.render();*/
}

function buildBody() {
  // Broque Monsieur's Body
  const body = new Cube();
  body.color = [0.98, 0.85, 0.0, 1.0];
  body.matrix.setTranslate(0.0, 0.05, 0.0);
  body.matrix.scale(0.18, 0.24, 0.18);
  body.render();

  // Broque Monsieur's Bowtie
  const middleBow = new Cylinder();
  middleBow.color = [1.0, 0.0, 0.0, 1.0];
  middleBow.matrix.setTranslate(0.0, 0.13, -0.2);
  middleBow.matrix.scale(0.2, 0.25, 0.03);
  middleBow.render();

  const leftBow = new Cube();
  leftBow.color = [0.8, 0.0, 0.0, 1.0];
  leftBow.matrix.setTranslate(-0.07, 0.13, -0.2);
  leftBow.matrix.scale(0.05, 0.05, 0.03);
  leftBow.render();

  const rightBow = new Cube();
  rightBow.color = [0.8, 0.0, 0.0, 1.0];
  rightBow.matrix.setTranslate(0.07, 0.13, -0.2);
  rightBow.matrix.scale(0.05, 0.05, 0.03);
  rightBow.render();
  

}

function buildLegs() {
  // Broque Monsieur's Left Leg
  const leftLeg = new Cube();
  leftLeg.color = [0.0, 0.0, 0.0, 1.0];
  leftLeg.matrix.setTranslate(-0.09, -0.25, 0.05);
  leftLeg.matrix.scale(0.04, 0.1, 0.04);
  leftLeg.render();

  // Broque Monsieur's Right Leg
  const rightLeg = new Cube();
  rightLeg.color = [0.0, 0.0, 0.0, 1.0];
  rightLeg.matrix.setTranslate(0.09, -0.25, 0.05);
  rightLeg.matrix.scale(0.04, 0.1, 0.04);
  rightLeg.render();

  // Broque Monsieur's Left Boot
  const leftFt = new Cube();
  leftFt.color = [0.46, 0.247, 0.173, 0.9];
  leftFt.matrix.setTranslate(-0.1, -0.38, -0.01);
  leftFt.matrix.rotate(30, 0, 1, 0);
  leftFt.matrix.scale(0.08, 0.07, 0.1);
  leftFt.render();

  // Broque Monsieur's Right Boot
  const rightFt = new Cube();
  rightFt.color = [0.46, 0.247, 0.173, 0.9];
  rightFt.matrix.setTranslate(0.1, -0.38, -0.01);
  rightFt.matrix.rotate(-30, 0, 1, 0);
  rightFt.matrix.scale(0.08, 0.07, 0.1);
  rightFt.render();

  // Broque Monsieur's Left Boot Base
  const leftBase = new Cube();
  leftBase.color = [0.46, 0.247, 0.173, 1.0];
  leftBase.matrix.setTranslate(0.1, -0.47, -0.01);
  leftBase.matrix.rotate(-30, 0, 1, 0);
  leftBase.matrix.scale(0.08, 0.02, 0.1);
  leftBase.render();

  // Broque Monsieur's Left Boot Base
  const rightBase = new Cube();
  rightBase.color = [0.46, 0.247, 0.173, 1.0];
  rightBase.matrix.setTranslate(-0.1, -0.47, -0.01);
  rightBase.matrix.rotate(30, 0, 1, 0);
  rightBase.matrix.scale(0.08, 0.02, 0.1);
  rightBase.render();
}

function buildArms() {
  const leftArm = new Cube();
  leftArm.color = [0.0, 0.0, 0.0, 1.0];
  leftArm.matrix.setTranslate(0.28, 0.125, 0.0);
  leftArm.matrix.translate(-0.1, 0.05, 0.0);
  leftArm.matrix.rotate(g_leftAngles[0], 0, 1, 0);
  leftArm.matrix.rotate(g_leftAngles[1], 0, 0, 1);
  leftArm.matrix.translate(0.1, -0.05, 0.0);
  var leftArmCoords = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.1, 0.05, 0.05);
  leftArm.render();

  const forearmL = new Cube();
  forearmL.color = [1.0, 0.0, 0.0, 1.0];
  forearmL.matrix = leftArmCoords;
  forearmL.matrix.translate(0.2, 0.0, 0.0);
  forearmL.matrix.translate(-0.1, 0.05, 0.0);
  forearmL.matrix.rotate(g_leftAngles[2], 0, 0, 1);
  forearmL.matrix.translate(0.1, -0.05, 0.0);
  var forearmLCoords = new Matrix4(forearmL.matrix);
  forearmL.matrix.scale(0.1, 0.05, 0.05);
  forearmL.render();

  gl.uniform1f(u_texColorWeight, 0.0);
  const leftHand = new Cube();
  leftHand.color = [1.0, 1.0, 1.0, 1.0];
  leftHand.matrix = forearmLCoords;
  leftHand.matrix.translate(0.1, 0.0, 0.0);
  leftHand.matrix.scale(0.1, 0.1, 0.1);
  leftHand.render();

  gl.uniform1f(u_texColorWeight, 1.0);
  const rightArm = new Cube();
  rightArm.color = [0.0, 0.0, 0.0, 1.0];
  rightArm.matrix.setTranslate(-0.28, 0.125, 0.0);
  rightArm.matrix.translate(0.1, 0.05, 0.0);
  rightArm.matrix.rotate(-g_rightAngles[0], 0, 1, 0);
  rightArm.matrix.rotate(-g_rightAngles[1], 0, 0, 1);
  rightArm.matrix.translate(-0.1, -0.05, 0.0);
  var rightArmCoords = new Matrix4(rightArm.matrix);
  rightArm.matrix.scale(0.1, 0.05, 0.05);
  rightArm.render();

  const forearmR = new Cube();
  forearmR.color = [1.0, 0.0, 0.0, 1.0];
  forearmR.matrix = rightArmCoords;
  forearmR.matrix.translate(-0.2, 0.0, 0.0);
  forearmR.matrix.translate(0.1, .05, 0.0);
  forearmR.matrix.rotate(-g_rightAngles[2], 0, 0, 1);
  forearmR.matrix.translate(-0.1, -0.05, 0.0);
  var forearmRCoords = new Matrix4(forearmR.matrix);
  forearmR.matrix.scale(0.1, 0.05, 0.05);
  forearmR.render();

  gl.uniform1f(u_texColorWeight, 0.0);
  const rightHand = new Cube();
  rightHand.color = [1.0, 1.0, 1.0, 1.0];
  rightHand.matrix = forearmRCoords;
  rightHand.matrix.translate(-0.2, 0.0, 0.0);
  rightHand.matrix.scale(0.1, 0.1, 0.1);
  rightHand.render();
}