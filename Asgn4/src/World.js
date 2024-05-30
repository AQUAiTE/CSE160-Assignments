// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_TextureUnit;
  uniform bool u_UseSpecular;
  uniform bool u_UseLighting;
  uniform bool u_IsSpotlight;
  uniform float u_texColorWeight;
  uniform vec3 u_LightPos;
  uniform vec3 u_cameraPos;
  uniform vec3 u_DiffuseColor;
  void main() {
    gl_FragColor = vec4(v_UV, 1.0, 1.0);
    vec4 texColor;
    if (u_TextureUnit == -1) {
      texColor = vec4( (v_Normal + 1.0) / 2.0, 1.0);
    }
    else if (u_TextureUnit == 0) {
      texColor = texture2D(u_Sampler0, v_UV);
    }
    else if (u_TextureUnit == 1) {
      texColor = texture2D(u_Sampler1, v_UV);
    } 
    else {
      texColor = texture2D(u_Sampler2, v_UV);
    }
    // Final Color/Texture Set Based on texColorWeight
    gl_FragColor = (1.0 - u_texColorWeight) * u_FragColor + u_texColorWeight * texColor;

    vec3 lightVector = u_LightPos - vec3(v_VertPos);
    float r = length(lightVector);

    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    vec3 R = reflect(-L, N);
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
    float nDotL = max(dot(N, L), 0.0);

    float specular = pow(max(dot(E, R), 0.0), 500.0);
    vec3 diffuse = u_DiffuseColor * nDotL * 0.7;
    vec3 ambient = vec3(gl_FragColor) * 0.3;

    if (u_IsSpotlight) {
      if (r < 1.0) {
        gl_FragColor = vec4(u_DiffuseColor, 0.7);
      } else if (r < 2.0) {
        gl_FragColor = vec4(u_DiffuseColor, 0.9);
      } else if (u_UseLighting) {
        if (u_UseSpecular) {
          gl_FragColor = vec4(diffuse + ambient + specular, 1.0);
        } else {
          gl_FragColor = vec4(diffuse + ambient, 1.0);
        }
      }
    }
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
let u_LightPos;
let u_cameraPos;
let u_UseLighting;
let u_UseSpecular;
let u_DiffuseColor;
let u_IsSpotlight;


// UI Global Vars
let g_globalAngle = [25, 0];
// Shoulder X, Shoulder Y, Elbow
let g_leftAngles = [0, 0, 0];
let g_rightAngles = [0, 0, 0]; 
let g_lightPos = [0, 1, -2];
let g_lightColor = [1.0, 1.0, 1.0];
let g_camera;
let g_normalOn = false;
let g_lightsOn = true;

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
let g_currentBlocks = [];

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
  // Get the storage location of u_UseLighting
  u_UseLighting = gl.getUniformLocation(gl.program, 'u_UseLighting');
  if (!u_UseLighting) {
    console.log('Failed to get the storage location of u_UseLighting');
    return;
  }

  // Get the storage location of u_IsSpotlight
  u_IsSpotlight = gl.getUniformLocation(gl.program, 'u_IsSpotlight');
  if (!u_IsSpotlight) {
    console.log('Failed to get the storage location of u_IsSpotlight');
    return;
  }

  // Get the storage location of u_UseLighting
  u_DiffuseColor = gl.getUniformLocation(gl.program, 'u_DiffuseColor');
  if (!u_DiffuseColor) {
    console.log('Failed to get the storage location of u_DiffuseColor');
    return;
  }

  // Get the storage location of u_UseSpecular
  u_UseSpecular = gl.getUniformLocation(gl.program, 'u_UseSpecular');
  if (!u_UseSpecular) {
    console.log('Failed to get the storage location of u_UseSpecular');
    return;
  }


  // Get the storage location of u_texColorWeight
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  if (!u_texColorWeight) {
    console.log('Failed to get the storage location of u_texColorWeight');
    return;
  }

  // Get the storage location of a_Normal
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // Get the storage location of u_lightPos
  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  if (u_LightPos < 0) {
    console.log('Failed to get the storage location of u_LightPos');
    return;
  }

  // Get the storage location of u_cameraPos
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (u_cameraPos < 0) {
    console.log('Failed to get the storage location of u_cameraPos');
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
  document.getElementById('lightX').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) { g_lightPos[0] = this.value / 100; renderAllShapes(); } });
  document.getElementById('lightY').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) { g_lightPos[1] = this.value / 100; renderAllShapes(); } });
  document.getElementById('lightZ').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) { g_lightPos[2] = this.value / 100; renderAllShapes(); } });
  document.getElementById('lightR').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) { g_lightColor[0] = this.value; renderAllShapes(); } });
  document.getElementById('lightG').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) { g_lightColor[1] = this.value; renderAllShapes(); } });
  document.getElementById('lightB').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) { g_lightColor[2] = this.value; renderAllShapes(); } });
  

  // Button Events
  document.getElementById('normalsOn').onclick = function() {g_normalOn = true;};
  document.getElementById('normalsOff').onclick = function() {g_normalOn = false;};
  document.getElementById('lightsOn').onclick = function() {g_lightsOn = true;};
  document.getElementById('lightsOff').onclick = function() {g_lightsOn = false;};

  // Lock/Unlock Cursor when Canvas Clicked
  canvas.onclick = async () => {
    if (!document.pointerLockElement) 
      {await canvas.requestPointerLock();} 
  };

  document.addEventListener('pointerlockchange', lockAlert, false);
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
  image2.src = '../assets/questionBlock.png';

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
  tick();
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
      //console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 68: // D
      g_camera.moveRight();
      //console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 87: // W
      g_camera.moveForward();
      //console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 83: // S
      g_camera.moveBackwards();
      //console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 69: // E
      g_camera.panRight();
      //console.log("Hitting keycode: " + ev.keyCode);
      break;
    case 81: // Q
      g_camera.panLeft();
      //console.log("Hitting keycode: " + ev.keyCode);
      break;
    default: return;
  }

}

function updateCamera() {
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
}

function lockAlert() {
  if (document.pointerLockElement == canvas) {
    document.onmousemove = (ev) => lookAround(ev);
    document.onclick = (ev) => blockController(ev);
  } else {
    document.onmousemove = null;
  }
}

function lookAround(ev) {
  g_camera.horizontalPan(ev.movementX * 0.1);
  g_camera.verticalPan(ev.movementY * 0.1);
}

function blockController(ev) {
  let x  = Math.round(g_camera.at.elements[0]) + 16.1;
  let y = Math.round(g_camera.at.elements[1]) - 0.1;
  let z = Math.round(g_camera.at.elements[2]) + 16.1;

  if (x < 0) {
    worldFactor 
  }

  // Destroy Box
  if (ev.button == 0) {
    g_currentBlocks[x * y * z + 1] = null;
  } else if (ev.button == 2) {
    if (g_currentBlocks[x * y * z + 1]) {
      return;
    }

    let block = new Cube();
    block.matrix.translate(x - 16.1, y + 0.1, z - 16.1);
    console.log(x - 16, " ", y, " ", z - 16);
    console.log(g_camera.at.elements[0], " ", g_camera.at.elements[1], " ", g_camera.at.elements[2])
    block.matrix.scale(1, 1, 1);
    g_currentBlocks[x * y * z + 1] = block;
  }
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  // Pass matrix to rotate camera angle
  let globalRotMatrix = new Matrix4().rotate(g_globalAngle[0], 0, 1, 0);
  globalRotMatrix.rotate(g_globalAngle[1], 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMatrix.elements);

  gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);

  gl.uniform1f(u_texColorWeight, 0.0);
  if (g_normalOn) {
    gl.uniform1i(u_TextureUnit, -1);
    gl.uniform1f(u_texColorWeight, 1.0); 
  }
  // Don't Apply Specular Lighting to Skybox
  gl.uniform1i(u_UseSpecular, false);
  gl.uniform1i(u_IsSpotlight, true);
  buildSky();

  gl.uniform1i(u_UseSpecular, true);
  gl.uniform1i(u_UseLighting, g_lightsOn);
  gl.uniform1f(u_texColorWeight, 0.0);
  buildLight();

  gl.uniform1i(u_TextureUnit, 0);
  gl.uniform1f(u_texColorWeight, 1.0);
  buildGround();

  gl.uniform1f(u_texColorWeight, 0.0);
  // Use Default Color
  if (g_normalOn) {
    gl.uniform1i(u_TextureUnit, -1);
    gl.uniform1f(u_texColorWeight, 1.0);
  }

  buildHead();

  buildBody();

  buildArms();

  buildSphere();

  buildLegs();

  // Use Castle Walls Texture
  gl.uniform1i(u_TextureUnit, 0);
  gl.uniform1f(u_texColorWeight, 1.0);
  if (g_normalOn) {
    gl.uniform1i(u_TextureUnit, -1);
  }
//  buildMap();

}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
function tick() {
    stats.begin();
    document.onkeydown = keydown.bind(g_camera);
    updateCamera();
    renderAllShapes();
    stats.end();
    g_seconds = performance.now() / 1000.0 - g_startTime;

    //updateAnimationAngles();
    requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  g_lightPos[0] = Math.cos(g_seconds);
}


// Build the Sky and Ground ================================================================================================
function buildSky() {
  const sky = new Cube();
  sky.color = [0.2, 0.2, 1.0, 1.0];
  sky.matrix.scale(-15, -15, -15);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();
}

function buildGround() {
  const ground = new Cube();
  ground.color = [0.0, 0.6, 0.4, 1.0];
  ground.matrix.translate(0, -0.55, 0.0);
  ground.matrix.scale(15, 0.5, 15);
  ground.matrix.translate(-0.5, 0.0, -0.5);
  ground.render();
}

function buildSphere() {
  const s = new Sphere();
  s.matrix.scale(0.5, 0.5, 0.5);
  s.matrix.translate(1.0, 1, -4.0);
  s.render();
}

function buildLight() {
  gl.uniform3f(u_LightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_DiffuseColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  var light = new Cube();
  light.color = [g_lightColor[0], g_lightColor[1], g_lightColor[2], g_lightColor[3]];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1, -0.1, -0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);
  light.render();
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
      if (g_normalOn) {
        gl.uniform1i(u_TextureUnit, -1);
      }
      if (map[x][z] != 0) {
        let wall = new Cube();
        wall.color = [0.0, 0.0, 0.0, 1.0];
        wall.matrix.translate(0.0, -0.1, 0.0);
        if (map[x][z] == 2) { 
          gl.uniform1i(u_TextureUnit, 2);
          if (g_normalOn) {
            gl.uniform1i(u_TextureUnit, -1);
          }
          wall.matrix.scale(0.15, 0.15, 0.15);
          wall.matrix.translate((x-16)*2, 0.0, (z-16)*2);
          wall.render();
        } else {
          wall.matrix.scale(0.3, 0.6, 0.3);
          wall.matrix.translate(x-16, 0.0, z-16);
          wall.render();
        }
      }
    }
  }

  for (let index in g_currentBlocks) {
    if (g_currentBlocks[index]) {
      gl.uniform1i(u_TextureUnit, 2);
      g_currentBlocks[index].render();
    }
  }
}

// Functions that build the 3D Blocky Animal ===============================================================================
function buildHead() {
  // Broque Monsieur's Head
  const head = new Cube();
  head.color = [0.98, 0.905, 0.3, 1.0];
  head.matrix.setTranslate(0.0, 0.4, 0.0);
  head.matrix.translate(-0.06, -0.05, -0.15);
  head.matrix.scale(0.3, 0.3, 0.3);
  head.render();

  // Left Eyeball
  const leftEye = new Cylinder();
  leftEye.color = [1.0, 1.0, 1.0, 1.0];
  leftEye.matrix.setTranslate(0.125, 0.55, -0.35);
  leftEye.matrix.translate(0.03, -0.05, 0.17);
  leftEye.matrix.scale(0.175, 0.275, 0.025);
  leftEye.render();

  // Right Eyeball
  const rightEye = new Cylinder();
  rightEye.color = [1.0, 1.0, 1.0, 1.0];
  rightEye.matrix.setTranslate(-0.125, 0.55, -0.35);
  rightEye.matrix.translate(0.15, -0.05, 0.17);
  rightEye.matrix.scale(0.175, 0.275, 0.025);
  rightEye.render();

  // Left Pupil
  const leftPupil = new Cylinder();
  leftPupil.color = [0.0, 0.0, 0.0, 1.0];
  leftPupil.matrix.setTranslate(0.125, 0.55, -0.36);
  leftPupil.matrix.translate(0.03, -0.05, 0.17);
  leftPupil.matrix.scale(0.175 * 0.5, 0.275 * 0.5, 0.025 * 0.5);
  leftPupil.render();

  // Right Pupil
  const rightPupil = new Cylinder();
  rightPupil.color = [0.0, 0.0, 0.0, 1.0];
  rightPupil.matrix.setTranslate(-0.125, 0.55, -0.36);
  rightPupil.matrix.translate(0.15, -0.05, 0.17);
  rightPupil.matrix.scale(0.175 * 0.5, 0.275 * 0.5, 0.025 * 0.5);
  rightPupil.render();

  // Right Eyebrow
  const rightBrow = new Cube();
  rightBrow.color = [0.0, 0.0, 0.0, 1.0];
  rightBrow.matrix.setTranslate(-0.15, 0.705, -0.31);
  rightBrow.matrix.translate(g_browMoveX, g_browMoveY, 0.0);
  rightBrow.matrix.translate(0, g_eyebrowR, 0)
  rightBrow.matrix.translate(0.11, -.13, 0.15);
  rightBrow.matrix.rotate(g_browRotate, 0, 0, 1);
  rightBrow.matrix.scale(0.1, 0.022, 0.02);
  rightBrow.render();

  // Left Eyebrow
  const leftBrow = new Cube();
  leftBrow.color = [0.0, 0.0, 0.0, 1.0];
  leftBrow.matrix.setTranslate(0.15, 0.705, -0.31);
  leftBrow.matrix.translate(-g_browMoveX, -g_browMoveY, 0.0);
  leftBrow.matrix.translate(0, g_eyebrowL, 0);
  leftBrow.matrix.translate(-0.04, -.12, 0.15);
  leftBrow.matrix.rotate(-g_browRotate, 0, 0, 1);
  leftBrow.matrix.scale(0.1, 0.022, 0.02);
  leftBrow.render();

  // Right Moustache Segment
  const rightStache = new Cube();
  rightStache.color = [0.0, 0.0, 0.0, 1.0];
  rightStache.matrix.setTranslate(-0.075, 0.37, -0.31);
  rightStache.matrix.translate(0.085, -.06, 0.15);
  rightStache.matrix.translate(g_flipStacheX, g_flipStacheY, 0.0);
  rightStache.matrix.translate(0, -g_moustacheHt, 0);
  rightStache.matrix.rotate(45, 0, 0, 1);
  rightStache.matrix.scale(0.15, 0.05, 0.02);
  rightStache.render();

  // Left Moustache Segment
  const leftStache = new Cube();
  leftStache.color = [0.0, 0.0, 0.0, 1.0];
  leftStache.matrix.setTranslate(0.075, 0.37, -0.31);
  leftStache.matrix.translate(-0.015, 0.06, 0.15);
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
  body.matrix.translate(0.0, 0.1, 0.0);
  body.matrix.scale(0.18, 0.24, 0.18);
  body.render();

  // Broque Monsieur's Bowtie
  const middleBow = new Cylinder();
  middleBow.color = [1.0, 0.0, 0.0, 1.0];
  middleBow.matrix.setTranslate(0.0, 0.13, -0.2);
  middleBow.matrix.translate(0.09, 0.175, 0.19);
  middleBow.matrix.scale(0.2*.5, 0.25*.5, 0.03*.5);
  middleBow.render();

  const leftBow = new Cube();
  leftBow.color = [0.8, 0.0, 0.0, 1.0];
  leftBow.matrix.setTranslate(-0.07, 0.13, -0.2);
  leftBow.matrix.translate(0.09, 0.15, 0.19);
  leftBow.matrix.scale(0.05, 0.05, 0.03);
  leftBow.render();

  const rightBow = new Cube();
  rightBow.color = [0.8, 0.0, 0.0, 1.0];
  rightBow.matrix.setTranslate(0.07, 0.13, -0.2);
  rightBow.matrix.translate(0.04, 0.15, 0.19);
  rightBow.matrix.scale(0.05, 0.05, 0.03);
  rightBow.render();
  

}

function buildLegs() {
  // Broque Monsieur's Left Leg
  const leftLeg = new Cube();
  leftLeg.color = [0.0, 0.0, 0.0, 1.0];
  leftLeg.matrix.setTranslate(-0.09, -0.25, 0.05);
  leftLeg.matrix.translate(0.1, 0.3, 0.05);
  leftLeg.matrix.scale(0.04, 0.1, 0.04);
  leftLeg.render();

  // Broque Monsieur's Right Leg
  const rightLeg = new Cube();
  rightLeg.color = [0.0, 0.0, 0.0, 1.0];
  rightLeg.matrix.setTranslate(0.09, -0.25, 0.05);
  rightLeg.matrix.translate(0.025, 0.3, 0.05);
  rightLeg.matrix.scale(0.04, 0.1, 0.04);
  rightLeg.render();

  // Broque Monsieur's Left Boot
  const leftFt = new Cube();
  leftFt.color = [0.46, 0.247, 0.173, 0.9];
  leftFt.matrix.setTranslate(-0.1, -0.38, -0.01);
  leftFt.matrix.translate(0.06, 0.38, 0.1);
  leftFt.matrix.rotate(30, 0, 1, 0);
  leftFt.matrix.scale(0.08, 0.07, 0.1);
  leftFt.render();

  // Broque Monsieur's Right Boot
  const rightFt = new Cube();
  rightFt.color = [0.46, 0.247, 0.173, 0.9];
  rightFt.matrix.setTranslate(0.1, -0.38, -0.01);
  rightFt.matrix.translate(0.04, 0.38, 0.05);
  rightFt.matrix.rotate(-30, 0, 1, 0);
  rightFt.matrix.scale(0.08, 0.07, 0.1);
  rightFt.render();

  // Broque Monsieur's Left Boot Base
  const leftBase = new Cube();
  leftBase.color = [0.46, 0.247, 0.173, 1.0];
  leftBase.matrix.setTranslate(0.1, -0.47, -0.01);
  leftBase.matrix.translate(0.04, 0.45, 0.05);
  leftBase.matrix.rotate(-30, 0, 1, 0);
  leftBase.matrix.scale(0.08, 0.02, 0.1);
  leftBase.render();

  // Broque Monsieur's Left Boot Base
  const rightBase = new Cube();
  rightBase.color = [0.46, 0.247, 0.173, 1.0];
  rightBase.matrix.setTranslate(-0.1, -0.47, -0.01);
  rightBase.matrix.translate(0.06, 0.45, 0.1);
  rightBase.matrix.rotate(30, 0, 1, 0);
  rightBase.matrix.scale(0.08, 0.02, 0.1);
  rightBase.render();
}

function buildArms() {
  const leftArm = new Cube();
  leftArm.color = [0.0, 0.0, 0.0, 1.0];
  leftArm.matrix.setTranslate(0.28, 0.125, 0.0);
  leftArm.matrix.translate(-0.2, 0.2, 0.0);
  leftArm.matrix.rotate(g_leftAngles[0], 0, 1, 0);
  leftArm.matrix.rotate(g_leftAngles[1], 0, 0, 1);
  leftArm.matrix.translate(0.1, -0.05, 0.0);
  var leftArmCoords = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.1, 0.05, 0.05);
  leftArm.render();

  const forearmL = new Cube();
  forearmL.color = [1.0, 0.0, 0.0, 1.0];
  forearmL.matrix = leftArmCoords;
  forearmL.matrix.translate(0.1, 0.0, 0.0);
  forearmL.matrix.translate(-0.1, 0.05, 0.0);
  forearmL.matrix.rotate(g_leftAngles[2], 0, 0, 1);
  forearmL.matrix.translate(0.1, -0.05, 0.0);
  var forearmLCoords = new Matrix4(forearmL.matrix);
  forearmL.matrix.scale(0.1, 0.05, 0.05);
  forearmL.render();

  const leftHand = new Cube();
  leftHand.color = [1.0, 1.0, 1.0, 1.0];
  leftHand.matrix = forearmLCoords;
  leftHand.matrix.translate(0.1, -0.025, -0.025);
  leftHand.matrix.scale(0.1, 0.1, 0.1);
  leftHand.render();

  const rightArm = new Cube();
  rightArm.color = [0.0, 0.0, 0.0, 1.0];
  rightArm.matrix.setTranslate(-0.21, 0.125, 0.0);
  rightArm.matrix.translate(0.2, 0.2, 0.0);
  rightArm.matrix.rotate(-g_rightAngles[0], 0, 1, 0);
  rightArm.matrix.rotate(-g_rightAngles[1], 0, 0, 1);
  rightArm.matrix.translate(-0.1, -0.05, 0.0);
  var rightArmCoords = new Matrix4(rightArm.matrix);
  rightArm.matrix.scale(0.1, 0.05, 0.05);
  rightArm.render();

  const forearmR = new Cube();
  forearmR.color = [1.0, 0.0, 0.0, 1.0];
  forearmR.matrix = rightArmCoords;
  forearmR.matrix.translate(-0.1, 0.0, 0.0);
  forearmR.matrix.translate(0.1, .05, 0.0);
  forearmR.matrix.rotate(-g_rightAngles[2], 0, 0, 1);
  forearmR.matrix.translate(-0.1, -0.05, 0.0);
  var forearmRCoords = new Matrix4(forearmR.matrix);
  forearmR.matrix.scale(0.1, 0.05, 0.05);
  forearmR.render();

  const rightHand = new Cube();
  rightHand.color = [1.0, 1.0, 1.0, 1.0];
  rightHand.matrix = forearmRCoords;
  rightHand.matrix.translate(-0.1, -0.025, -0.025);
  rightHand.matrix.scale(0.1, 0.1, 0.1);
  rightHand.render();
}