class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.buffer = null;
        this.vertices = 
        [
            // Front Side
            [-1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0],
            [-1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0],
            // Top Side
            [-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0],
            [-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
            // Bottom Side
            [-1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
            [-1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0],
            // Right Side
            [-1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0],
            [1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0],
            // Left Side
            [1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0],
            [-1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0],
            // Back Side
            [-1.0, -1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0],
            [-1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0]
        ];
    };

    render () {
        var rgba = this.color;

        // Create 1 Buffer
        if (this.buffer === null) {
            this.buffer = gl.createBuffer();
            if (!this.buffer) {
                console.log('Buffer object not created');
                return -1;
            }
        }

        // Pass color of circle to u_FragColor
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Apply Matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw and slightly change color for better visibility (fake lighting)
        let evenColor = [0,0, 1,1, 1,0];
        let oddColor = [0,0, 0,1, 1,1];
        for (let i = 0; i < 12; i++) {
            if (i % 2 == 0) {
                drawTriangle3DUV(this.vertices[i], evenColor);
            } else {
                drawTriangle3DUV(this.vertices[i], oddColor);
            }
        }

    }

}