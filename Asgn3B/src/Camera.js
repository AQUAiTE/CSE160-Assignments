class Camera {
  constructor() {
    this.type = 'camera';
    this.fov = 60.0;
    this.eye = new Vector3([10, 0, 3.5]);
    this.at = new Vector3([0, 0, -1]);
    this.up = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );

    this.projMatrix = new Matrix4();
    this.projMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
  }

  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }
  
  moveForward() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(0.1);
    this.eye.add(f);
    this.at.add(f);
    this.updateViewMatrix();
    console.log(this.eye.elements[0]);
  }

  moveBackwards() {
    let b = new Vector3();
    b.set(this.at);
    b.sub(this.eye);
    b.normalize();
    b.mul(0.1);
    this.eye.sub(b);
    this.at.sub(b);
    this.updateViewMatrix();
  }

  moveLeft() {
    let f = new Vector3();
    let s;
    f.set(this.at);
    f.sub(this.eye);
    s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(0.1);
    this.eye.add(s);
    this.at.add(s);
    this.updateViewMatrix();
  }

  moveRight() {
    let f = new Vector3();
    let s;
    f.set(this.at);
    f.sub(this.eye);
    s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(0.1);
    this.eye.add(s);
    this.at.add(s);
    this.updateViewMatrix();
  }

  horizontalPan(panAmount) {
    let f = new Vector3();
    let rotationMatrix = new Matrix4();

    f.set(this.at);
    f.sub(this.eye);
    f.normalize();

    rotationMatrix.setRotate(-panAmount, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    let fPrime = rotationMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(fPrime);

    this.updateViewMatrix();
  }

  verticalPan(panAmount) {
    let f = new Vector3();
    let rotationMatrix = new Matrix4();
    let s;
    const maxAngle = Math.PI / 2 - 0.1;

    f.set(this.at);
    f.sub(this.eye);
    f.normalize();

    // Perpendicular vector for horizontal plane of camera
    s = Vector3.cross(f, this.up);
    s.normalize();

    rotationMatrix.setRotate(-panAmount, s.elements[0], s.elements[1], s.elements[2]);

    let fPrime = rotationMatrix.multiplyVector3(f);
    let currentAngle = Math.acos(Vector3.dot(fPrime, this.up) / (fPrime.magnitude() * this.up.magnitude()));

    if ( (currentAngle < maxAngle || panAmount < 0) || (currentAngle > -maxAngle || panAmount > 0)) {
      this.at.set(this.eye);
      this.at.add(fPrime);
    }

    this.updateViewMatrix();
  }
}