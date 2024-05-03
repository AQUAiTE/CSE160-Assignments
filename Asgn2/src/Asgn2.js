// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

// UI Global Vars
let g_globalAngle = [0, 0];
// Shoulder X, Shoulder Y, Elbow
let g_leftAngles = [0, 0, 0];
let g_rightAngles = [0, 0, 0]; 

// Animation Global Vars
let g_eyebrowL = 0;
let g_eyebrowR = 0;
let g_moustacheHt = 0;
let g_flipStacheX = 0.0;
let g_flipStacheY = 0.0;
let g_browRotate = 7;
let g_browMoveX = 0.0;
let g_browMoveY = 0.0;

let g_startTime = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0 - g_startTime;
let g_idle = false;
let g_poke = true;

// Other Vars
let idleAudio = new Audio('../assets/BroqueMonsieur.mp3');

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

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
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

  // Set identity matrix at first
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

function addActionsForHtmlUI() {
  // Slider Events
  document.getElementById('cameraX').addEventListener('input', function() { g_globalAngle[0] = this.value; renderAllShapes(); });
  document.getElementById('cameraY').addEventListener('input', function() { g_globalAngle[1] = this.value; renderAllShapes(); });
  document.getElementById('elbowL').addEventListener('input', function() { g_leftAngles[2] = this.value; renderAllShapes(); });
  document.getElementById('elbowR').addEventListener('input', function() { g_rightAngles[2] = this.value; renderAllShapes(); });

  document.getElementById('shoulderLX').addEventListener('input', function() { g_leftAngles[0] = this.value; renderAllShapes(); });
  document.getElementById('shoulderLY').addEventListener('input', function() { g_leftAngles[1] = this.value; renderAllShapes(); });

  document.getElementById('shoulderRX').addEventListener('input', function() { g_rightAngles[0] = this.value; renderAllShapes(); });
  document.getElementById('shoulderRY').addEventListener('input', function() { g_rightAngles[1] = this.value; renderAllShapes(); });

  document.getElementById('eyebrowL').addEventListener('input', function() { g_eyebrowL = this.value; renderAllShapes(); });
  document.getElementById('eyebrowR').addEventListener('input', function() { g_eyebrowR = this.value; renderAllShapes(); });

  document.getElementById('moustache').addEventListener('input', function() { g_moustacheHt = this.value; renderAllShapes(); });

  // Buttons
  document.getElementById('idleOn').onclick = function() {
    g_idle = true;
    tick();
  };
  document.getElementById('idleOff').onclick = function() {
    g_idle = false;
    idleAudio.pause();
  }

}

function main() {

  // Set up canvas and gl vars 
  setupWebGL(); 

  // Set up GLSL shader programs and connect GLSL vars
  connectVariablesToGLSL();

  // Set up actions for HTML UI Elements
  addActionsForHtmlUI();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.53, 0.87, 0.98, 1.0);

  canvas.addEventListener('mousedown', function(event) {
    if (event.shiftKey) {
      g_poke = true;
      console.log("test");
      pokeAnimation(g_seconds);
    }
  });

  //gl.clear(gl.COLOR_BUFFER_BIT);
  renderAllShapes();
}

var g_shapesList = [];

function handleClearEvent() {
  g_shapesList = [];
  renderAllShapes();
}

// Extract event click and return it in WebGL coords
function convertCoordinatesEventToGL(ev) {
  let x = ev.clientX; // x coordinate of a mouse pointer
  let y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

// Draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  let startTime = performance.now();

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Pass matrix to rotate camera angle
  let globalRotMatrix = new Matrix4().rotate(g_globalAngle[0], 0, 1, 0);
  globalRotMatrix.rotate(g_globalAngle[1], 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMatrix.elements);

  buildHead();

  buildBody();

  buildArms();

  buildLegs();

  var duration = performance.now() - startTime;
  sendTextToHTML (" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), "numdot");

}

function buildHead() {
  // Broque Monsieur's Head
  const head = new Cube();
  head.color = [0.98, 0.905, 0.3, 1.0];
  head.matrix.setTranslate(0.0, .5, 0.0);
  head.matrix.scale(0.3, 0.3, 0.3);
  head.render();

  // Left Eyeball
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
  leftStache.render();
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

  const leftHand = new Cube();
  leftHand.color = [1.0, 1.0, 1.0, 1.0];
  leftHand.matrix = forearmLCoords;
  leftHand.matrix.translate(0.2, 0.0, 0.0);
  leftHand.matrix.scale(0.1, 0.1, 0.1);
  leftHand.render();


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

  const rightHand = new Cube();
  rightHand.color = [1.0, 1.0, 1.0, 1.0];
  rightHand.matrix = forearmRCoords;
  rightHand.matrix.translate(-0.2, 0.0, 0.0);
  rightHand.matrix.scale(0.1, 0.1, 0.1);
  rightHand.render();


}

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;

  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_idle) {
    idleAnimation(g_seconds);
  }
  renderAllShapes();
}

function idleAnimation(time) {
  let timePassed = performance.now()/1000.0 - time;
  g_seconds += timePassed;

  const browSpeed = 0.8;
  let wave = Math.sin(2 * Math.PI * g_seconds / browSpeed);
  let idleTime = (wave + 1) / 2;

  const minEyebrowHt = 0.0;
  const maxEyebrowHt = 0.06;
  g_eyebrowL = document.getElementById('eyebrowL').value = minEyebrowHt + idleTime * (maxEyebrowHt - minEyebrowHt);
  g_eyebrowR = document.getElementById('eyebrowR').value = minEyebrowHt + idleTime * (maxEyebrowHt - minEyebrowHt);

  const maxMoustache = 0.02;
  g_moustacheHt = document.getElementById('moustache').value = minEyebrowHt + idleTime * (maxMoustache - minEyebrowHt);

  const rightArmMin = -60;
  const rightArmMax = -35;
  let rightArm = rightArmMin + (1 - idleTime) * (rightArmMax - rightArmMin);
  g_rightAngles[0] = document.getElementById('shoulderRX').value = 50;
  g_rightAngles[2] = document.getElementById('elbowR').value = 69;
  g_rightAngles[1] = document.getElementById('shoulderRY').value = rightArm;

  let leftSpeed = 15;
  leftWave = Math.sin(2 * Math.PI * g_seconds / leftSpeed);
  idleTime = (leftWave + 1) / 2;
  const leftArmMin = 17;
  const leftArmMax = 90
  let leftArm = leftArmMin + (1 - idleTime) * (leftArmMax - leftArmMin);
  g_leftAngles[0] = document.getElementById('shoulderLX').value = 50;
  g_leftAngles[1] = document.getElementById('shoulderLY').value = -60;
  g_leftAngles[2] = document.getElementById('elbowL').value = leftArm;

  if(idleAudio.paused) {
    startSong();
    idleAudio.play();
  }

  if (g_idle) {
    currentAnimation = requestAnimationFrame(idleAnimation);
  } else {
    idleAudio.pause();
    cancelAnimationFrame(currentAnimation);
  }
}

function pokeAnimation(time) {
  let elapsedTime = performance.now() / 1000.0 - time;

  // Check if 5 seconds have elapsed
  if (elapsedTime >= 3.0) {
    // Reset Values
    g_browMoveX = 0.0;
    g_browMoveY = 0.0;
    g_browRotate = 7;
    g_eyebrowL = 0;
    g_eyebrowR = 0;
    g_flipStacheX = 0.0;
    g_flipStacheY = 0.0;
    g_leftAngles[0] = 0;
    g_leftAngles[1] = 0;
    g_leftAngles[2] = 0;
    g_rightAngles[0] = 0;
    g_rightAngles[1] = 0;
    g_rightAngles[2] = 0;
    renderAllShapes();
    g_seconds += elapsedTime;
    return;
  }

  g_browMoveX = 0.03;
  const browMoveY = -0.4;
  g_browRotate = 35;
  const stacheMoveX = 0.15;
  const stacheMoveY = 0.36; 

  g_eyebrowL = browMoveY;
  document.getElementById('eyebrowL').value = browMoveY;
  
  g_eyebrowR = browMoveY;
  document.getElementById('eyebrowR').value = browMoveY;


  g_flipStacheX = stacheMoveX;
  g_flipStacheY = stacheMoveY;

  const browSpeed = 15;
  let wave = Math.sin(2 * Math.PI * g_seconds / browSpeed);
  let idleTime = (wave + 1) / 2;

  const rightArmMin = -60;
  const rightArmMax = -35;
  g_rightAngles[0] = document.getElementById('shoulderRX').value = 50;
  g_rightAngles[2] = document.getElementById('elbowR').value = 69;
  g_rightAngles[1] = document.getElementById('shoulderRY').value = rightArmMin + (1 - idleTime) * (rightArmMax - rightArmMin);

  let leftSpeed = 15;
  leftWave = Math.sin(2 * Math.PI * g_seconds / leftSpeed);
  idleTime = (leftWave + 1) / 2;
  const leftArmMin = 17;
  const leftArmMax = 90
  let leftArm = leftArmMin + (1 - idleTime) * (leftArmMax - leftArmMin);
  g_leftAngles[0] = document.getElementById('shoulderLX').value = 50;
  g_leftAngles[1] = document.getElementById('shoulderLY').value = -60;
  g_leftAngles[2] = document.getElementById('elbowL').value = leftArm;

  renderAllShapes();


  currentAnimation = requestAnimationFrame(() => pokeAnimation(time));
}

function startSong() {
  idleAudio.loop = true;
  idleAudio.volume = 0.1;
}

function sendTextToHTML(text, htmlID) {
  let htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }

  htmlElm.innerHTML = text;

}