export class MenuNavigation {
  constructor(gamepadManager) {
    this.gamepadManager = gamepadManager;
    this.activeMenu = null;
    this.focusableElements = [];
    this.currentIndex = -1;
    this.isEnabled = false;

    // Cooldowns to prevent holding a direction from flying through menus
    this.inputCooldown = 0;
    this.COOLDOWN_TIME = 0.2; // secondary cooldown
    this.INITIAL_COOLDOWN = 0.4; // Initial delay before repeating
    
    this.isHoldingDir = false;
    this.lastDir = null;

    this.bindKeyboard();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.isEnabled || !this.activeMenu) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }

      const dirMap = {
        'ArrowUp': 'up', 'KeyW': 'up',
        'ArrowDown': 'down', 'KeyS': 'down',
        'ArrowLeft': 'left', 'KeyA': 'left',
        'ArrowRight': 'right', 'KeyD': 'right'
      };

      if (dirMap[e.code]) {
        if (this.lastDir !== dirMap[e.code]) {
           this.navigate(dirMap[e.code]);
           this.inputCooldown = this.INITIAL_COOLDOWN;
           this.lastDir = dirMap[e.code];
           this.isHoldingDir = true;
        }
      } else if (e.code === 'Enter' || e.code === 'Space') {
        if (this.currentIndex >= 0 && this.currentIndex < this.focusableElements.length) {
          e.preventDefault();
          this.clickCurrent();
        }
      } else if (e.code === 'Escape') {
        this.goBack();
      }
    });

    window.addEventListener('keyup', (e) => {
       const dirMap = {
        'ArrowUp': 'up', 'KeyW': 'up',
        'ArrowDown': 'down', 'KeyS': 'down',
        'ArrowLeft': 'left', 'KeyA': 'left',
        'ArrowRight': 'right', 'KeyD': 'right'
      };
      if (dirMap[e.code] && dirMap[e.code] === this.lastDir) {
         this.isHoldingDir = false;
         this.lastDir = null;
      }
    });
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearFocus();
    }
  }

  setActiveMenu(menuElement) {
    this.activeMenu = menuElement;
    this.refreshFocusableElements();
  }

  refreshFocusableElements() {
    if (!this.activeMenu) return;

    // Find all visible focusable elements within the active menu
    const query = 'button, input[type="range"], input[type="checkbox"], a';
    const elements = Array.from(this.activeMenu.querySelectorAll(query))
                         .filter(el => {
                            // Elements must be visible
                            const style = window.getComputedStyle(el);
                            return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                         });

    this.focusableElements = elements;
    
    // Attempt to keep focus on the currently focused element if it's still there
    const activeEl = document.activeElement;
    const activeIndex = this.focusableElements.indexOf(activeEl);

    if (activeIndex !== -1) {
      this.currentIndex = activeIndex;
    } else {
      // Default focus first element
      if (this.focusableElements.length > 0) {
        this.currentIndex = 0;
        this.focusCurrent();
      } else {
        this.currentIndex = -1;
      }
    }
  }

  clearFocus() {
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    this.currentIndex = -1;
  }

  focusCurrent() {
    if (this.currentIndex >= 0 && this.currentIndex < this.focusableElements.length) {
      const el = this.focusableElements[this.currentIndex];
      el.focus();
      
      // If it's a range input or hidden checkbox, scroll it into view if needed
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  clickCurrent() {
    if (this.currentIndex >= 0 && this.currentIndex < this.focusableElements.length) {
      const el = this.focusableElements[this.currentIndex];
      
      // Normal click
      el.click();
      
      // Delay refresh slightly to allow DOM changes (e.g. going to next screen, changing tracks)
      setTimeout(() => this.refreshFocusableElements(), 50);
    }
  }

  goBack() {
    // Attempt to find a back button in the active menu
    if (!this.activeMenu) return;
    
    const possibleBackIds = ['campaignBackBtn', 'settingsBackBtn', 'leaderboardBackBtn', 'lobbyBackBtn', 'menuBtn', 'quitBtn'];
    
    for (let id of possibleBackIds) {
      const btn = this.activeMenu.querySelector(`#${id}`);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
    
    // Fallback: look for a button containing the word 'back'
    const btns = this.activeMenu.querySelectorAll('button');
    for (let btn of btns) {
      if (btn.textContent.toLowerCase().includes('back') && btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
  }

  navigate(direction) {
    if (this.focusableElements.length === 0) return;
    if (this.currentIndex === -1) {
        this.currentIndex = 0;
        this.focusCurrent();
        return;
    }

    const currentEl = this.focusableElements[this.currentIndex];
    const currentRect = currentEl.getBoundingClientRect();

    let bestMatchIndex = -1;
    let minDistance = Infinity;

    // Handle range inputs special case for left/right
    if (currentEl.tagName === 'INPUT' && currentEl.type === 'range') {
        if (direction === 'left' || direction === 'right') {
            // Let the range input handle its own left/right natively if possible,
            // or we simulate it here to ensure it works for gamepads too.
            const step = parseFloat(currentEl.step) || 1;
            const min = parseFloat(currentEl.min) || 0;
            const max = parseFloat(currentEl.max) || 100;
            let val = parseFloat(currentEl.value);
            
            if (direction === 'left') val = Math.max(min, val - step);
            if (direction === 'right') val = Math.min(max, val + step);
            
            if (val !== parseFloat(currentEl.value)) {
                currentEl.value = val;
                // Dispatch input/change events so the game catches it
                currentEl.dispatchEvent(new Event('input', { bubbles: true }));
                currentEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return; // Don't change focus
        }
    }
    
    // Handle toggle inputs special case for left/right
    if (currentEl.tagName === 'INPUT' && currentEl.type === 'checkbox') {
        if (direction === 'left' || direction === 'right') {
            currentEl.checked = !currentEl.checked;
            currentEl.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }
    }

    // Spatial navigation calculation
    for (let i = 0; i < this.focusableElements.length; i++) {
      if (i === this.currentIndex) continue;

      const rect = this.focusableElements[i].getBoundingClientRect();
      let dx = 0;
      let dy = 0;
      let isValidCandidate = false;

      // Calculate centers
      const cx1 = currentRect.left + currentRect.width / 2;
      const cy1 = currentRect.top + currentRect.height / 2;
      const cx2 = rect.left + rect.width / 2;
      const cy2 = rect.top + rect.height / 2;

      switch (direction) {
        case 'up':
          if (cy2 < cy1 - 5) { // Must be definitively higher
            dx = cx2 - cx1;
            dy = cy2 - cy1;
            isValidCandidate = true;
          }
          break;
        case 'down':
          if (cy2 > cy1 + 5) { // Must be definitively lower
            dx = cx2 - cx1;
            dy = cy2 - cy1;
            isValidCandidate = true;
          }
          break;
        case 'left':
          if (cx2 < cx1 - 5) { // Must be definitively left
            dx = cx2 - cx1;
            dy = cy2 - cy1;
            isValidCandidate = true;
          }
          break;
        case 'right':
          if (cx2 > cx1 + 5) { // Must be definitively right
            dx = cx2 - cx1;
            dy = cy2 - cy1;
            isValidCandidate = true;
          }
          break;
      }

      if (isValidCandidate) {
        // Distance heuristic: heavily penalize movement perpendicular to intended direction
        let distance;
        if (direction === 'up' || direction === 'down') {
            distance = Math.abs(dy) + Math.abs(dx) * 3; 
        } else {
            distance = Math.abs(dx) + Math.abs(dy) * 3;
        }

        if (distance < minDistance) {
          minDistance = distance;
          bestMatchIndex = i;
        }
      }
    }

    if (bestMatchIndex !== -1) {
      this.currentIndex = bestMatchIndex;
      this.focusCurrent();
    }
  }

  update(dt) {
    if (!this.isEnabled || !this.activeMenu) return;

    if (this.inputCooldown > 0) {
      this.inputCooldown -= dt;
      if (this.inputCooldown > 0) return;
    }

    // Process Gamepad
    if (this.gamepadManager) {
        this.gamepadManager.poll();
        
        let dir = null;
        let p1Gamepad = null;
        
        // Find Player 1's gamepad or fallback to first active gamepad
        for(let i=0; i<4; i++) {
            const gp = this.gamepadManager.getGamepad(i);
            if(gp) {
                p1Gamepad = gp;
                break; // Just use first connected gamepad for menu nav
            }
        }
        
        if (p1Gamepad) {
            // Analog stick (axes 0 and 1)
            const deadzone = 0.5;
            const x = p1Gamepad.axes[0] || 0;
            const y = p1Gamepad.axes[1] || 0;
            
            // D-Pad (buttons 12, 13, 14, 15)
            const up = p1Gamepad.buttons[12]?.pressed || y < -deadzone;
            const down = p1Gamepad.buttons[13]?.pressed || y > deadzone;
            const left = p1Gamepad.buttons[14]?.pressed || x < -deadzone;
            const right = p1Gamepad.buttons[15]?.pressed || x > deadzone;
            
            if (up) dir = 'up';
            else if (down) dir = 'down';
            else if (left) dir = 'left';
            else if (right) dir = 'right';
            
            if (dir) {
                if(this.lastDir !== dir || !this.isHoldingDir) {
                    this.navigate(dir);
                    this.lastDir = dir;
                    this.isHoldingDir = true;
                    this.inputCooldown = this.INITIAL_COOLDOWN;
                } else if(this.isHoldingDir && this.inputCooldown <= 0) {
                    this.navigate(dir);
                    this.inputCooldown = this.COOLDOWN_TIME;
                }
            } else {
                if(this.lastDir !== null && this.isHoldingDir) {
                    // Check if they let go of the keyboard keys too
                    this.isHoldingDir = false;
                    this.lastDir = null;
                }
            }
            
            // A Button (Submit)
            if (p1Gamepad.buttons[0]?.pressed) {
                if(!this.aPressed) {
                    this.clickCurrent();
                    this.aPressed = true;
                }
            } else {
                this.aPressed = false;
            }
            
            // B Button (Back)
            if (p1Gamepad.buttons[1]?.pressed) {
                if(!this.bPressed) {
                    this.goBack();
                    this.bPressed = true;
                }
            } else {
                this.bPressed = false;
            }
        }
    }
    
    // Handle held keyboard repeating
    if (this.isHoldingDir && this.inputCooldown <= 0 && this.lastDir) {
        this.navigate(this.lastDir);
        this.inputCooldown = this.COOLDOWN_TIME;
    }
  }
}
