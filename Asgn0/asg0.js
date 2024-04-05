// asg0.js

/**
  * Handles actions for user clicking "Draw" button
  * Clears canvas
  * Creates vector using user inputs
  * Calls drawVector with the color red
  */
function handleDrawEvent() {
    const canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Reset Canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create and draw vector
    let xInput = document.getElementById("xCoord").value;
    let yInput = document.getElementById("yCoord").value;
    let v1 = new Vector3([xInput, yInput, 0.0]);
    drawVector(v1, "red");

    // Create and draw vector
    let xV2 = document.getElementById("xV2").value;
    let yV2 = document.getElementById("yV2").value;
    let v2 = new Vector3([xV2, yV2, 0.0]);
    drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
    const canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Reset Canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create and draw vector
    let xInput = document.getElementById("xCoord").value;
    let yInput = document.getElementById("yCoord").value;
    let v1 = new Vector3([xInput, yInput, 0.0]);
    drawVector(v1, "red");

    // Create and draw vector
    let xV2 = document.getElementById("xV2").value;
    let yV2 = document.getElementById("yV2").value;
    let v2 = new Vector3([xV2, yV2, 0.0]);
    console.log(v1);
    console.log(v2.elements);
    drawVector(v2, "blue");

    // Determine and handle the operation input
    let scalarValue = document.getElementById("scalar").value;
    let op = document.getElementById("operations").value;

    if (op == "add") {
        v1.add(v2);
        drawVector(v1, "green");
    } else if (op == "subtract") {
        v1.sub(v2);
        drawVector(v1, "green");
    } else if (op == "multiply") {
        v1.mul(scalarValue);
        v2.mul(scalarValue);
        drawVector(v1, "green");
        drawVector(v2, "green");
    } else {
        v1.div(scalarValue);
        v2.div(scalarValue);
        drawVector(v1, "green");
        drawVector(v2, "green");
    }
    

}

/**
  * Draws vector "v" as the color "color"
  */
function drawVector(v, color) {
    const canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Create path for vector starting from origin
    ctx.beginPath();
    let xOrigin = canvas.width / 2;
    let yOrigin = canvas.height / 2;
    ctx.moveTo(xOrigin, yOrigin);
    // Scale coords by 20 to visualize length 1 vectors
    ctx.lineTo(xOrigin + (v.elements[0] * 20), yOrigin - (v.elements[1] * 20));
    ctx.closePath();

    // Draw vector as color "color"
    ctx.strokeStyle = color;
    ctx.stroke();
}

function main() {
    // Retrieve <canvas> element <- (1)
    const canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }
    
    // Get the rendering context for 2DCG <- (2)
    const ctx = canvas.getContext('2d');

    // Instantiate Vector v1 and fill canvas black
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initialize and draw red vector v1
    const v1 = new Vector3([2.25, 2.25, 0.0]);
    drawVector(v1, "red");
}