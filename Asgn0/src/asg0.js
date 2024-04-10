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
    drawVector(v2, "blue");

    // Determine and handle the operation input
    let scalarValue = document.getElementById("scalar").value;
    let op = document.getElementById("operations").value;

    // Operation cases using cuoun operations
    switch (op) {
        case "add":
            v1.add(v2);
            drawVector(v1, "green");
            break;
        case "subtract":
            v1.sub(v2);
            drawVector(v1, "green");
            break;
        case "multiply":
            v1.mul(scalarValue);
            v2.mul(scalarValue);
            drawVector(v1, "green");
            drawVector(v2, "green");
            break;
        case "divide":
            v1.div(scalarValue);
            v2.div(scalarValue);
            drawVector(v1, "green");
            drawVector(v2, "green");
            break;
        case "magnitude":
            console.log("Magnitude v1: ", v1.magnitude());
            console.log("Magnitude v2: ", v2.magnitude());
            break;
        case "normalize":
            v1.normalize();
            v2.normalize();
            drawVector(v1, "green");
            drawVector(v2, "green");
            break;
        case "dot":
            // Convert dot product to degrees
            let dotProd = Vector3.dot(v1, v2);
            dotProd = Math.acos (dotProd / (v1.magnitude() * v2.magnitude()));
            dotProd = (dotProd * 180) / Math.PI;
            console.log("Angle: ", dotProd);
            break;
        case "area":
            let v3 = Vector3.cross(v1, v2);
            // Triangle: ||a x b|| / 2
            console.log("Area of the triangle: ", v3.magnitude() / 2);
            break;
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