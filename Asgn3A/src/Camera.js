class Camera {
  constructor() {
    this.type = 'camera';
    this.fov = 90.0;
    this.eye = new Vector3([-0.8, 0.0, 0.5]);
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

  moveForward() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(0.25);
    this.eye.add(f);
    this.at.add(f);
  }

  moveBackwards() {
    let b = new Vector3();
    b.set(this.eye);
    b.sub(this.at);
    b.normalize();
    b.mul(0.25);
    this.eye.sub(b);
    this.at.sub(b);
  }

  moveLeft() {
    let f = new Vector3();
    let s;
    f.set(this.at);
    f.sub(this.eye);
    s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(0.25);
    this.eye.add(s);
    this.at.add(s);
  }

  moveRight() {
    let f = new Vector3();
    let s;
    f.set(this.at);
    f.sub(this.eye);
    s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(0.25);
    this.eye.add(s);
    this.at.add(s);
  }

  panLeft() {
    let f = new Vector3();
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(3, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    f.set(this.at);
    f.sub(this.eye);
    f.normalize();

    let fPrime = rotationMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(fPrime);
  }

  panRight() {
    let f = new Vector3();
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(-3, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    f.set(this.at);
    f.sub(this.eye);
    f.normalize();

    let fPrime = rotationMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(fPrime);
  }
}