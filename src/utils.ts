import { config } from './config'

// Utility functions

// Debounce function to limit rapid function calls
export function debounce(func: () => void, wait: number) {
  let timeout: number | undefined;
  return function executedFunction() {
    const later = function() {
      clearTimeout(timeout);
      func();
    };
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}

// Update detailed filename based on current config
export function updateDetailedFilename() {
  const { width, height, levels, wallSize, wallHeight, walkSize, block, addRoof } = config;
  let suffix = '';
  if (addRoof) suffix = '-wceiling';
  const filename = `${width}x${height}x${levels}maze-ww${wallSize}wh${wallHeight}pw${walkSize}wb${block}${suffix}.mcfunction`;
  
  const customNamePreview = document.getElementById('customNamePreview');
  const customNameText = document.getElementById('customNameText');
  if (customNamePreview && customNameText) {
    (customNamePreview as HTMLElement).textContent = filename;
    (customNameText as HTMLInputElement).placeholder = filename;
  }
}

// Update custom name preview
export function updateCustomNamePreview() {
  const customNameInput = document.querySelector('input[data-for="customMazeName"]') as HTMLInputElement;
  const customNamePreview = document.getElementById('customNamePreview');
  
  if (customNameInput && customNamePreview) {
    const customName = customNameInput.value.trim();
    if (customName) {
      customNamePreview.textContent = customName.endsWith('.mcfunction') ? customName : `${customName}.mcfunction`;
    } else {
      updateDetailedFilename(); // Fallback to detailed filename
    }
  }
}

// Update dimensions when config changes
export function updateDimensions() {
  // This function is called when config values change
  // It can be used to trigger updates that depend on dimension changes
}

// Input validation function
export function validate() {
  // Get all inputs and validate them
  const inputs = document.querySelectorAll('input, select') as NodeListOf<HTMLInputElement | HTMLSelectElement>;
  inputs.forEach(input => {
    const dataFor = input.getAttribute('data-for');
    if (dataFor && dataFor in config) {
      if (input.type === 'checkbox') {
        (config as any)[dataFor] = (input as HTMLInputElement).checked;
      } else if (input.type === 'number' || input.tagName === 'SELECT') {
        const value = input.type === 'number' ? parseInt(input.value) : input.value;
        (config as any)[dataFor] = value;
      } else {
        (config as any)[dataFor] = input.value;
      }
    }
  });
  
  // Update filename preview when config changes
  updateDetailedFilename();
  updateCustomNamePreview();
}

// Helper: checks if a given boundary wall should be solid
export function isBoundaryWall(x: number, y: number, dir: number, mazeWidth: number, mazeHeight: number, NORTH: number, SOUTH: number, WEST: number, EAST: number) {
  if (dir === NORTH && y === 0) return true;
  if (dir === SOUTH && y === mazeHeight - 1) return true;
  if (dir === WEST && x === 0) return true;
  if (dir === EAST && x === mazeWidth - 1) return true;
  return false;
}

// Helper: checks if a given block coordinate corresponds to a solid wall
// This is a simplified check and might not cover all edge cases perfectly without full context.
export function isSolidBlock(_x: number, _y: number, _z: number, _wallSize: number, _wallHeight: number, _walkSize: number): boolean {
  // This check is a simplification. A more robust implementation would need to
  // perfectly replicate the wall-generation logic from generateCommand.
  // For now, we assume that if a ladder is being attempted, the general area is a wall.
  // The main failure point is passages, which this can't easily detect.
  return true;
}