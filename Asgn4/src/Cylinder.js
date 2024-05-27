class Cylinder{
    constructor() {
      this.type = 'Cylinder';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.position = [0.0, 0.0, 0.0];
      this.size = 50.0;
      this.segments = 15;
      this.matrix = new Matrix4();
      this.buffer = null;
    }
  
    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        // Create 1 buffer
        if (this.buffer === null) {
            this.buffer = gl.createBuffer();
            if (!this.buffer) {
                console.log('Buffer object not created');
                return -1;
            }
        }

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to a u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw
        var d = size / 200.0;

        let angleStep = 360 / this.segments;
        for (var angle = 0; angle < 360; angle = angle + angleStep) {
            let centerPt = [xy[0], xy[1]];
            let angle1 = angle;
            let angle2 = angle + angleStep;
            let vec1 = [Math.cos(angle1 * Math.PI / 180) * d, Math.sin(angle1 * Math.PI / 180) * d];
            let vec2 = [Math.cos(angle2 * Math.PI / 180) * d, Math.sin(angle2 * Math.PI / 180) * d];
            let pt1 = [centerPt[0] + vec1[0], centerPt[1] + vec1[1]];
            let pt2 = [centerPt[0] + vec2[0], centerPt[1] + vec2[1]];

            // Top Face
            gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
            drawTriangle3D( [xy[0], xy[1], 0, pt1[0], pt1[1], 0, pt2[0], pt2[1], 0], this.buffer);

            // Bottom Face
            gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
            drawTriangle3D ( [xy[0], xy[1], 1, pt1[0], pt1[1], 1, pt2[0], pt2[1], 1], this.buffer);

            // Sides
            gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
            drawTriangle3D( [pt2[0], pt2[1], 0, pt1[0], pt1[1], 0, pt2[0], pt2[1], 1], this.buffer);
            drawTriangle3D( [pt2[0], pt2[1], 1, pt1[0], pt1[1], 0, pt1[0], pt1[1], 1], this.buffer);
        }
    }
  }