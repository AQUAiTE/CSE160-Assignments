class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.buffer = null;
        this.vertices = 
        [
            // Front Side (DONE)
            [0.0, 0.0, 0.0,     1.0, 1.0, 0.0,      1.0, 0.0, 0.0],
            [0.0, 0.0, 0.0,     0.0, 1.0, 0.0,      1.0, 1.0, 0.0],
            // Top Side (DONE)
            [0.0, 1.0, 0.0,     1.0, 1.0, 1.0,      1.0, 1.0, 0.0],
            [0.0, 1.0, 0.0,     0.0, 1.0, 1.0,      1.0, 1.0, 1.0],
            // Right Side (DONE)
            [1.0, 0.0, 0.0,     1.0, 1.0, 1.0,      1.0, 0.0, 1.0],
            [1.0, 0.0, 0.0,     1.0, 1.0, 0.0,      1.0, 1.0, 1.0],
            // Left Side (DONE)
            [0.0, 0.0, 1.0,      0.0, 1.0, 0.0,       0.0, 0.0, 0.0],
            [0.0, 0.0, 1.0,     0.0, 1.0, 1.0,      0.0, 1.0, 0.0],
            // Back Side (DONE)
            [1.0, 0.0, 1.0,     0.0, 1.0, 1.0,      0.0, 0.0, 1.0],
            [1.0, 0.0, 1.0,     1.0, 1.0, 1.0,       0.0, 1.0, 1.0],
            // Bottom Side (DONE)
            [0.0, 0.0, 1.0,     1.0, 0.0, 0.0,     1.0, 0.0, 1.0],
            [0.0, 0.0, 1.0,     0.0, 0.0, 0.0,     1.0, 0.0, 0.0]
        ];
        this.normals = 
        [
            // Front
            [0.0, 0.0, -1.0,     0.0, 0.0, -1.0,     0.0, 0.0, -1.0],
            [0.0, 0.0, -1.0,     0.0, 0.0, -1.0,     0.0, 0.0, -1.0],
            // Top
            [0.0, 1.0, 0.0,     0.0, 1.0, 0.0,   0.0, 1.0, 0.0],
            [0.0, 1.0, 0.0,     0.0, 1.0, 0.0,   0.0, 1.0, 0.0],
            // Right
            [1.0, 0.0, 0.0,     1.0, 0.0, 0.0,   1.0, 0.0, 0.0],
            [1.0, 0.0, 0.0,     1.0, 0.0, 0.0,   1.0, 0.0, 0.0],
            // Left
            [-1.0, 0.0, 0.0,     -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0],
            [-1.0, 0.0, 0.0,     -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0],
            // Back
            [0.0, 0.0, 1.0,     0.0, 0.0, 1.0,   0.0, 0.0, 1.0],
            [0.0, 0.0, 1.0,     0.0, 0.0, 1.0,   0.0, 0.0, 1.0],
            // Bottom
            [0.0, -1.0, 0.0,     0.0, -1.0, 0.0,   0.0, -1.0, 0.0],
            [0.0, -1.0, 0.0,     0.0, -1.0, 0.0,   0.0, -1.0, 0.0]
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
                drawTriangle3DUV(this.vertices[i], evenColor, this.normals[i]);
            } else {
                drawTriangle3DUV(this.vertices[i], oddColor, this.normals[i]);
            }
        }

    }

}