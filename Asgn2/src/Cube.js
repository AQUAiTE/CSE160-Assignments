class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
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

        // Pass color of circle to u_FragColor
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Apply Matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw and slightly change color for better visibility (fake lighting)
        let colorMod = 1.0;
        for (let i = 0; i < 12; i++) {
            gl.uniform4f(u_FragColor, rgba[0]*colorMod, rgba[1]*colorMod, rgba[2]*colorMod, rgba[3]);
            drawTriangle3D(this.vertices[i]);
            if (i % 2 == 1) {
                colorMod -= 0.1;
            }
        }

    }

}