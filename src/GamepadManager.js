export class GamepadManager {
  constructor() {
    this.gamepads = {};
    this.deadzone = 0.15;
    
    window.addEventListener("gamepadconnected", (e) => {
        console.log(`Gamepad connected: ${e.gamepad.id}`);
        this.gamepads[e.gamepad.index] = e.gamepad;
    });
    
    window.addEventListener("gamepaddisconnected", (e) => {
        console.log(`Gamepad disconnected: ${e.gamepad.id}`);
        delete this.gamepads[e.gamepad.index];
    });
  }
  
  poll() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            this.gamepads[i] = gamepads[i];
        }
    }
  }
  
  getGamepad(index) {
    this.poll();
    return this.gamepads[index] || null;
  }
  
  // Returns steering (-1 to 1)
  getSteer(index) {
    const gamepad = this.getGamepad(index);
    if (!gamepad) return 0;
    
    let steer = gamepad.axes[0] || 0;
    if (Math.abs(steer) < this.deadzone) steer = 0;
    
    if (gamepad.buttons[14]?.pressed) steer = -1; // D-Pad Left
    if (gamepad.buttons[15]?.pressed) steer = 1;  // D-Pad Right
    
    return steer;
  }
  
  // Returns throttle (-1 for reverse, 1 for forward)
  getThrottle(index) {
    const gamepad = this.getGamepad(index);
    if (!gamepad) return 0;
    
    // R2 or A button for forward
    const forward = Math.max(gamepad.buttons[7]?.value || 0, gamepad.buttons[0]?.pressed ? 1 : 0);
    // L2 or B button for reverse
    const reverse = Math.max(gamepad.buttons[6]?.value || 0, gamepad.buttons[1]?.pressed ? 1 : 0);
    
    if (forward > reverse) return forward;
    if (reverse > forward) return -reverse * 0.5; // same -0.5 max reverse as keyboard
    return 0;
  }
  
  // Returns boolean for whether boost button is held
  isBoosting(index) {
    const gamepad = this.getGamepad(index);
    if (!gamepad) return false;
    
    // X or Y buttons for boost
    return gamepad.buttons[2]?.pressed || gamepad.buttons[3]?.pressed || gamepad.buttons[5]?.pressed; // RB
  }
}
