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
let g_globalAngle = 180;
let g_jointAngle = 0;

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
  document.getElementById('cameraSlider').addEventListener('input', function() { g_globalAngle = this.value; renderAllShapes(); });
  document.getElementById('joint').addEventListener('input', function() { g_jointAngle = this.value; renderAllShapes(); });

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

  // Clear <canvas>
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
  let globalRotMatrix = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMatrix.elements);

  buildHead();

  // Broque Monsieur's Body
  const body = new Cube();
  body.color = [0.98, 0.85, 0.0, 1.0];
  body.matrix.setTranslate(0.0, 0.05, 0.0);
  body.matrix.scale(0.18, 0.24, 0.18);
  body.render();

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

  // Right Eyeball
  const rightEye = new Cylinder();
  rightEye.color = [1.0, 1.0, 1.0, 1.0];
  rightEye.matrix.setTranslate(0.125, 0.55, -0.35);
  rightEye.matrix.scale(0.35, 0.55, 0.05);
  rightEye.render();

  // Left Eyeball
  const leftEye = new Cylinder();
  leftEye.color = [1.0, 1.0, 1.0, 1.0];
  leftEye.matrix.setTranslate(-0.125, 0.55, -0.35);
  leftEye.matrix.scale(0.35, 0.55, 0.05);
  leftEye.render();

  // Right Pupil
  const rightPupil = new Cylinder();
  rightPupil.color = [0.0, 0.0, 0.0, 1.0];
  rightPupil.matrix.setTranslate(0.125, 0.55, -0.39);
  rightPupil.matrix.scale(0.175, 0.275, 0.025);
  rightPupil.render();

  // Left Pupil
  const leftPupil = new Cylinder();
  leftPupil.color = [0.0, 0.0, 0.0, 1.0];
  leftPupil.matrix.setTranslate(-0.125, 0.55, -0.39);
  leftPupil.matrix.scale(0.175, 0.275, 0.025);
  leftPupil.render();

  // Right Eyebrow
  const leftBrow = new Cube();
  leftBrow.color = [0.0, 0.0, 0.0, 1.0];
  leftBrow.matrix.setTranslate(-0.15, 0.705, -0.35);
  leftBrow.matrix.rotate(7, 0, 0, 1);
  leftBrow.matrix.scale(0.1, 0.022, 0.02);
  leftBrow.render();

  // Left Eyebrow
  const rightBrow = new Cube();
  rightBrow.color = [0.0, 0.0, 0.0, 1.0];
  rightBrow.matrix.setTranslate(0.15, 0.705, -0.35);
  rightBrow.matrix.rotate(-7, 0, 0, 1);
  rightBrow.matrix.scale(0.1, 0.022, 0.02);
  rightBrow.render();

  // Left Moustache Segment
  const leftStache = new Cube();
  leftStache.color = [0.0, 0.0, 0.0, 1.0];
  leftStache.matrix.setTranslate(-0.085, 0.36, -0.35);
  leftStache.matrix.rotate(40, 0, 0, 1);
  leftStache.matrix.scale(0.15, 0.05, 0.02);
  leftStache.render();

  // Right Moustache Segment
  const rightStache = new Cube();
  rightStache.color = [0.0, 0.0, 0.0, 1.0];
  rightStache.matrix.setTranslate(0.085, 0.36, -0.35);
  rightStache.matrix.rotate(-40, 0, 0, 1);
  rightStache.matrix.scale(0.15, 0.05, 0.02);
  rightStache.render();
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
  const rightArm1 = new Cube();
  rightArm1.color = [0.0, 0.0, 0.0, 1.0];
  rightArm1.matrix.setTranslate(0.28, 0.125, 0.0);
  rightArm1.matrix.scale(0.1, 0.05, 0.05);
  rightArm1.render();

  const rightArm2 = new Cube();
  rightArm2.color = [1.0, 0.0, 0.0, 1.0];
  rightArm2.matrix.setTranslate(0.48, 0.125, 0.0);
  rightArm2.matrix.scale(0.1, 0.05, 0.05);
  rightArm2.render();

  const leftArm1 = new Cube();
  leftArm1.color = [0.0, 0.0, 0.0, 1.0];
  leftArm1.matrix.setTranslate(-0.28, 0.125, 0.0);
  leftArm1.matrix.scale(0.1, 0.05, 0.05);
  leftArm1.render();

  const leftArm2 = new Cube();
  leftArm2.color = [1.0, 0.0, 0.0, 1.0];
  leftArm2.matrix.setTranslate(-0.48, 0.125, 0.0);
  leftArm2.matrix.scale(0.1, 0.05, 0.05);
  leftArm2.render();

  buildHands();
}

function buildHands() {
  const rightWrist = new Cylinder();
  rightWrist.color = [1.0, 1.0, 1.0, 1.0];
  rightWrist.matrix.setTranslate(0.57, 0.125, 0.0);
  rightWrist.matrix.rotate(90, 0, 1, 0);
  rightWrist.matrix.scale(0.5, 0.5, 0.0625);
  rightWrist.render();

  const leftWrist = new Cylinder();
  leftWrist.color = [1.0, 1.0, 1.0, 1.0];
  leftWrist.matrix.setTranslate(-0.62, 0.125, 0.0);
  leftWrist.matrix.rotate(90, 0, 1, 0);
  leftWrist.matrix.scale(0.5, 0.5, 0.0625);
  leftWrist.render();

  buildLeftHand();
  buildRightHand();
}

function buildLeftHand() { 
  const palmL = new Cylinder();
  palmL.color = [1.0, 1.0, 1.0, 1.0];
  palmL.matrix.setTranslate(0.63, 0.15, -0.12);
  palmL.matrix.scale(0.125, 0.12, 0.25);
  palmL.render();

  const indexL = new Cylinder();
  indexL.color = [1.0, 1.0, 1.0, 1.0];
  indexL.matrix.setTranslate(0.61, 0.15, -0.1);
  indexL.matrix.rotate(90, 0, 1, 0);
  indexL.matrix.scale(0.14, 0.14, 0.2);
  indexL.render();

  const middleL = new Cylinder();
  middleL.color = [1.0, 1.0, 1.0, 1.0];
  middleL.matrix.setTranslate(0.61, 0.15, -0.03);
  middleL.matrix.rotate(90, 0, 1, 0);
  middleL.matrix.scale(0.14, 0.14, 0.2);
  middleL.render();

  const ringL = new Cylinder();
  ringL.color = [1.0, 1.0, 1.0, 1.0];
  ringL.matrix.setTranslate(0.61, 0.15, 0.04);
  ringL.matrix.rotate(90, 0, 1, 0);
  ringL.matrix.scale(0.14, 0.14, 0.2);
  ringL.render();

  const pinkyL = new Cylinder();
  pinkyL.color = [1.0, 1.0, 1.0, 1.0];
  pinkyL.matrix.setTranslate(0.61, 0.15, 0.11);
  pinkyL.matrix.rotate(90, 0, 1, 0);
  pinkyL.matrix.scale(0.14, 0.14, 0.2);
  pinkyL.render();

  const thumbL = new Cylinder();
  thumbL.color = [1.0, 1.0, 1.0, 1.0];
  thumbL.matrix.setTranslate(0.63, 0.15, -0.3);
  thumbL.matrix.scale(0.14, 0.14, 0.2);
  thumbL.render();

}

function buildRightHand() {
  const palmR = new Cylinder();
  palmR.color = [0.5, 0.0, 0.0, 1.0];
  palmR.matrix.setTranslate(-0.68, 0.15, -0.12);
  palmR.matrix.scale(0.125, 0.12, 0.25);
  palmR.render();

  const indexR = new Cylinder();
  indexR.color = [0.5, 0.0, 0.0, 1.0];
  indexR.matrix.setTranslate(-0.66, 0.15, -0.1);
  indexR.matrix.rotate(90, 0, 1, 0);
  indexR.matrix.scale(0.14, 0.14, 0.2);
  indexR.render();

  const middleR = new Cylinder();
  middleR.color = [0.5, 0.0, 0.0, 1.0];
  middleR.matrix.setTranslate(-0.66, 0.15, -0.03);
  middleR.matrix.rotate(90, 0, 1, 0);
  middleR.matrix.scale(0.14, 0.14, 0.2);
  middleR.render();

  const ringR = new Cylinder();
  ringR.color = [0.5, 0.0, 0.0, 1.0];
  ringR.matrix.setTranslate(-0.66, 0.15, 0.04);
  ringR.matrix.rotate(90, 0, 1, 0);
  ringR.matrix.scale(0.14, 0.14, 0.2);
  ringR.render();

  const pinkyR = new Cylinder();
  pinkyR.color = [0.5, 0.0, 0.0, 1.0];
  pinkyR.matrix.setTranslate(-0.66, 0.15, 0.11);
  pinkyR.matrix.rotate(90, 0, 1, 0);
  pinkyR.matrix.scale(0.14, 0.14, 0.2);
  pinkyR.render();

  const thumbR = new Cylinder();
  thumbR.color = [0.5, 0.0, 0.0, 1.0];
  thumbR.matrix.setTranslate(-0.68, 0.15, -0.3);
  thumbR.matrix.scale(0.14, 0.14, 0.2);
  thumbR.render();

}

function sendTextToHTML(text, htmlID) {
  let htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }

  htmlElm.innerHTML = text;

}