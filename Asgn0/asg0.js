// asg0.js

function drawVector(v, color) {
    /* 
     * Draws vector "v" as the color "color"
     */
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    var ctx = canvas.getContext('2d');

    // Create path for vector starting from origin
    ctx.beginPath();
    var xOrigin = canvas.width / 2;
    var yOrigin = canvas.height / 2;
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
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }
    
    // Get the rendering context for 2DCG <- (2)
    var ctx = canvas.getContext('2d');

    // Instantiate Vector v1 and fill canvas black
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initialize and draw red vector v1
    var v1 = new Vector3([2.25, 2.25, 0]);
    drawVector(v1, "red");
}