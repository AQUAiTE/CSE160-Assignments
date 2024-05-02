class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.buffer = null;
        this.vertices = 
        [
            [-1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0],
            [-1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0],
            [-1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0],
            [-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0],
            [-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
            [-1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
            [-1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0],
            [-1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0],
            [1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0],
            [1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0],
            [-1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0],
            [-1.0, -1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0]
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
        let colorMod = 1.0;
        for (let i = 0; i < 12; i++) {
            gl.uniform4f(u_FragColor, rgba[0]*colorMod, rgba[1]*colorMod, rgba[2]*colorMod, rgba[3]);
            drawTriangle3D(this.vertices[i], this.buffer);
            if (i == 3 || i == 4) {
                colorMod = 0.8;
            }
            else if (i == 9 || i == 10) {
                colorMod = 0.8;
            }
            else if (i == 7 || i == 8) {
                colorMod = 0.6;
            } else {
                colorMod = 1.0;
            }
        }

    }

}