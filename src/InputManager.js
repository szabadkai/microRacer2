export class InputManager {
  constructor() {
    this.keys = {};
    
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  isDown(code) {
    if (Array.isArray(code)) {
      return code.some(c => this.keys[c] === true);
    }
    return this.keys[code] === true;
  }
}
