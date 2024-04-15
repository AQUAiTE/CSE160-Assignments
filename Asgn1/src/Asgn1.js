// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Constant Vars
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

// UI Global Vars
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let isNightMode = false;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

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

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

}

function addActionsForHtmlUI() {

  // Slider Events
  document.getElementById('redSlider').addEventListener('mouseup', function() { g_selectedColor[0] = this.value / 100; });
  document.getElementById('greenSlider').addEventListener('mouseup', function() { g_selectedColor[1] = this.value / 100; });
  document.getElementById('blueSlider').addEventListener('mouseup', function() { g_selectedColor[2] = this.value / 100; });
  document.getElementById('sizeSlider').addEventListener('mouseup', function() { g_selectedSize = this.value; });
  document.getElementById('segmentSlider').addEventListener('mouseup', function () {g_selectedSegments = this.value; });

  // Button Events
  document.getElementById('pointButton').onclick = function () {g_selectedType = POINT};
  document.getElementById('triangleButton').onclick = function () {g_selectedType = TRIANGLE};
  document.getElementById('circleButton').onclick = function () {g_selectedType = CIRCLE};
  document.getElementById('surpriseButton').onclick = function () {handleSpecialEvent(); var audio = document.getElementById('cs2Theme'); 
                                                                  audio.volume = 0.15; audio.play(); };

}

function main() {

  // Set up canvas and gl vars 
  setupWebGL(); 

  // Set up GLSL shader programs and connect GLSL vars
  connectVariablesToGLSL();

  // Set up actions for HTML UI Elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = handleClicks;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { handleClicks(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function handleClicks(ev) {

  // Extract event click and return it in WebGL coords
  let [x,y] = convertCoordinatesEventToGL(ev);
  
  // Create and store a new point
  let point;

  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }

  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  point.segments = g_selectedSegments;
  g_shapesList.push(point);

  // Draw every shape that is supposed to be in the canvas
  renderAllShapes();
}

function handleClearEvent() {
  g_shapesList = [];
  renderAllShapes();
}

// Extract event click and return it in WebGL coords
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

// Draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  //var startTime = performance.now();
  // Clear <canvas>
  if (isNightMode) {
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  } else {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  //var duration = performance.now() - startTime;
  //sendTextToHTML ("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), "numdot");

}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }

  htmlElm.innerHTML = text;

}

function handleSpecialEvent() {
  // Clear the canvas with two different colors
  handleClearEvent();
  
  // Show the hidden image
  var img = document.getElementById('reference-image');
  img.style.display = 'block';

  // Color half of canvas blue using rectangle
  gl.clearColor(0.99, 0.67, 0.1, 1.0);
  gl.scissor(0, 0, canvas.width / 2, canvas.height);
  gl.enable(gl.SCISSOR_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.SCISSOR_TEST);

  // Color half of canvas orange using rectangle
  gl.clearColor(0.16, 0.22, 0.5, 1.0);
  gl.scissor(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  gl.enable(gl.SCISSOR_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.SCISSOR_TEST);
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);

  drawTriangle([-0.08, 0.16, -0.16, 0.24, -0.20, 0.16]);
  drawTriangle([-0.20, 0.16, -0.16, 0.24, -0.24, 0.24]);
  drawTriangle([-0.20, 0.16, -0.24, 0.24, -0.28, 0.16]);
  drawTriangle([-0.28, 0.16, -0.24, 0.24, -0.40, 0.16]);
  drawTriangle([-0.40, 0.16, -0.24, 0.24, -0.40, 0.24]);
  drawTriangle([-0.40, 0.24, -0.40, 0.16, -0.48, 0.16]);
  drawTriangle([-0.48, 0.16, -0.40, 0.16, -0.40, 0.08]);
  drawTriangle([-0.48, 0.16, -0.40, 0.16, -0.40, 0.08]);
  drawTriangle([-0.48, 0.16, -0.44, 0.08, -0.52, 0.08]);
  drawTriangle([-0.52, 0.08, -0.44, 0.08, -0.48, -0.04]);
  drawTriangle([-0.48, -0.04, -0.44, 0.08, -0.40, -0.04]);
  drawTriangle([-0.52, 0.08, -0.52, 0.10, -0.48, -0.04]);
  drawTriangle([-0.48, -0.04, -0.40, -0.04, -0.44, -0.16]);
  drawTriangle([-0.44, -0.16, -0.48, -0.04, -0.52, -0.16]);
  drawTriangle([-0.52, -0.16, -0.44, -0.16, -0.44, -0.24]);
  drawTriangle([-0.44, -0.24, -0.44, -0.16, -0.36, -0.24]);
  drawTriangle([-0.36, -0.24, -0.44, -0.16, -0.36, -0.16]);
  drawTriangle([-0.36, -0.16, -0.36, -0.24, -0.28, -0.24]);
  drawTriangle([-0.28, -0.24, -0.28, -0.16, -0.36, -0.16]);
  drawTriangle([-0.28, -0.16, -0.28, -0.24, -0.16, -0.16]);
  drawTriangle([-0.16, -0.16, -0.16, -0.24, -0.28, -0.24]);
  drawTriangle([-0.16, -0.24, -0.08, -0.24, -0.16, -0.20]);
  drawTriangle([-0.16, -0.20, -0.16, -0.16, -0.08, -0.16]);
  drawTriangle([-0.08, -0.24, -0.16, -0.20, -0.08, -0.16]);
  drawTriangle([-0.48, 0.16, -0.44, 0.08, -0.4, 0.08])
  drawTriangle([-0.4, 0.08, -0.44, 0.08, -0.4, -0.04])
  drawTriangle([-0.52, 0.08, -0.52, -0.16, -0.48, -0.04]);
  drawTriangle([-0.4, -0.04, -0.4, -0.16, -0.44, -0.16]);

}

// Inverts the page colors for my version of night mode
function handleNightModeToggle() {
  // Invert the setting for night mode
  isNightMode = !isNightMode;

  // Change the site accordingly
  if (isNightMode) {
    document.body.style.backgroundColor = '#000';
    document.body.style.color = '#fff';
    canvas.style.backgroundColor = '#fff';
    document.body.classList.add('nightMode');
  } else {
    document.body.style.backgroundColor = '#fff';
    document.body.style.color = '#000';
    canvas.style.backgroundColor = '#000';
    document.body.classList.remove('nightMode');
  }

  // Reset and invert canvas color
  handleClearEvent();
}