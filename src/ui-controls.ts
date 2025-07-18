// Config is declared globally in the main bundle
declare const config: any;
import { MultiLevelMaze } from './maze-generator'
import { DisplayManager, switchDisplay, currentDisplayMode } from './display-manager'

// UI Controls - handles user interactions and control logic
export class UIControls {
  public mazeGenerator: MultiLevelMaze | null = null;
  private displayManager: DisplayManager;
  private drawDelay: () => void;
  private onMazeGeneratorChange?: (generator: MultiLevelMaze | null) => void;

  constructor(displayManager: DisplayManager) {
    this.displayManager = displayManager;
    this.drawDelay = this.debounce(() => this.draw(), 500);
  }

  setMazeGenerator(generator: MultiLevelMaze | null) {
    this.mazeGenerator = generator;
    this.displayManager.setMazeGenerator(generator);
    if (this.onMazeGeneratorChange) {
      this.onMazeGeneratorChange(generator);
    }
  }

  setMazeGeneratorChangeCallback(callback: (generator: MultiLevelMaze | null) => void) {
    this.onMazeGeneratorChange = callback;
  }

  // Main drawing/generation function
  draw() {
    let { width, height, levels } = config;
    
    this.setMazeGenerator(new MultiLevelMaze(width, height, levels));
    this.mazeGenerator!.generate();
    
    this.updateDisplay(currentDisplayMode);
  }

  // Display refresh functions
  refreshDisplay() {
    // Only update the visual display without regenerating the maze
    if (this.mazeGenerator) {
      this.updateDisplay(currentDisplayMode);
    }
  }

  regenerateMaze() {
    // Force a complete maze regeneration
    this.draw();
  }

  updateDisplay(mode: 'schematic' | 'exact') {
    if (!this.mazeGenerator) return;
    
    const mazeDisplay = document.getElementById('mazeDisplay');
    if (!mazeDisplay) return;
    
    const currentLevel = this.mazeGenerator.currentLevel;
    
    // Update level display based on current display mode
    let html = '';
    if (mode === 'schematic') {
      html = this.displayManager.renderLevel(currentLevel);
    } else {
      html = this.displayManager.renderExactBlockLayout(currentLevel);
    }
    
    mazeDisplay.innerHTML = html;
    
    // Update tree view
    this.updateTreeView();
    this.updateLevelControls();
    
    // Show/hide chunk overlay
    this.updateChunkOverlay();
    
    // Update filename preview
    this.updateDetailedFilename();
    this.updateCustomNamePreview();
  }

  updateTreeView() {
    if (!this.mazeGenerator) return;
    
    const treeView = document.getElementById('treeView');
    if (treeView) {
      treeView.innerHTML = this.displayManager.renderTreeView();
    }
    
    const currentLevel = document.getElementById('currentLevel');
    const totalLevels = document.getElementById('totalLevels');
    if (currentLevel) currentLevel.textContent = (this.mazeGenerator.currentLevel + 1).toString();
    if (totalLevels) totalLevels.textContent = this.mazeGenerator.levels.toString();
    
    const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
    const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
    if (prevBtn) prevBtn.disabled = this.mazeGenerator.currentLevel === 0;
    if (nextBtn) nextBtn.disabled = this.mazeGenerator.currentLevel === this.mazeGenerator.levels - 1;
  }

  updateLevelControls() {
    // This method can be expanded to update other level-specific controls
  }

  updateChunkOverlay() {
    const { showChunkBorders } = config;
    
    // Remove existing overlay
    const oldChunkOverlay = document.getElementById('chunkOverlay');
    if (oldChunkOverlay) {
      oldChunkOverlay.remove();
    }
    
    if (!showChunkBorders || !this.mazeGenerator) return;
    
    const mazeDisplay = document.getElementById('mazeDisplay');
    if (!mazeDisplay) return;
    
    // Calculate maze dimensions in blocks
    const maze = this.mazeGenerator.mazes[this.mazeGenerator.currentLevel];
    if (!maze) return;
    
    const { wallSize, walkSize } = config;
    const totalWidth = maze.width * walkSize + (maze.width + 1) * wallSize;
    const totalHeight = maze.height * walkSize + (maze.height + 1) * wallSize;
    
    // Get the size of maze cells in pixels
    const firstMazeCell = mazeDisplay.querySelector('.maze-cell, .exact-maze-cell') as HTMLElement;
    if (!firstMazeCell) return;
    
    const cellRect = firstMazeCell.getBoundingClientRect();
    const cellSize = cellRect.width; // Assuming square cells
    
    // Create chunk overlay container
    const overlay = document.createElement('div');
    overlay.id = 'chunkOverlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    
    // Draw vertical chunk lines (every 16 blocks)
    for (let x = 16; x < totalWidth; x += 16) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.left = `${x * cellSize}px`;
      line.style.top = '0';
      line.style.width = '2px';
      line.style.height = '100%';
      line.style.background = '#ff6b35';
      line.style.border = '1px dashed #ff6b35';
      line.style.opacity = '0.7';
      overlay.appendChild(line);
    }
    
    // Draw horizontal chunk lines (every 16 blocks)
    for (let z = 16; z < totalHeight; z += 16) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.left = '0';
      line.style.top = `${z * cellSize}px`;
      line.style.width = '100%';
      line.style.height = '2px';
      line.style.background = '#ff6b35';
      line.style.border = '1px dashed #ff6b35';
      line.style.opacity = '0.7';
      overlay.appendChild(line);
    }
    
    // Add chunk coordinate labels at intersections
    for (let chunkX = 0; chunkX * 16 < totalWidth; chunkX++) {
      for (let chunkZ = 0; chunkZ * 16 < totalHeight; chunkZ++) {
        if (chunkX === 0 && chunkZ === 0) continue; // Skip origin
        
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.left = `${chunkX * 16 * cellSize + 2}px`;
        label.style.top = `${chunkZ * 16 * cellSize + 2}px`;
        label.style.fontSize = '10px';
        label.style.color = '#ff6b35';
        label.style.fontWeight = 'bold';
        label.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
        label.style.pointerEvents = 'none';
        label.textContent = `${chunkX},${chunkZ}`;
        overlay.appendChild(label);
      }
    }
    
    mazeDisplay.style.position = 'relative';
    mazeDisplay.appendChild(overlay);
  }

  // Navigation functions
  nextLevel() {
    if (this.mazeGenerator && this.mazeGenerator.currentLevel < this.mazeGenerator.levels - 1) {
      this.mazeGenerator.currentLevel++;
      this.updateDisplay(currentDisplayMode);
    }
  }

  previousLevel() {
    if (this.mazeGenerator && this.mazeGenerator.currentLevel > 0) {
      this.mazeGenerator.currentLevel--;
      this.updateDisplay(currentDisplayMode);
    }
  }

  // Debounce function to limit rapid function calls
  private debounce(func: () => void, wait: number) {
    let timeout: number | undefined;
    return () => {
      const later = () => {
        clearTimeout(timeout);
        func();
      };
      clearTimeout(timeout);
      timeout = window.setTimeout(later, wait);
    };
  }

  // Update detailed filename based on current config
  private updateDetailedFilename() {
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
  private updateCustomNamePreview() {
    const customNameInput = document.querySelector('input[data-for="customMazeName"]') as HTMLInputElement;
    const customNamePreview = document.getElementById('customNamePreview');
    
    if (customNameInput && customNamePreview) {
      const customName = customNameInput.value.trim();
      if (customName) {
        customNamePreview.textContent = customName.endsWith('.mcfunction') ? customName : `${customName}.mcfunction`;
      } else {
        this.updateDetailedFilename(); // Fallback to detailed filename
      }
    }
  }

  // Input validation function
  private validate() {
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
    this.updateDetailedFilename();
    this.updateCustomNamePreview();
  }

  // Configuration update handler
  onConfigChange() {
    // Check if dimensions changed (requires full regeneration)
    const currentWidth = config.width;
    const currentHeight = config.height;
    const currentLevels = config.levels;
    
    if (!this.mazeGenerator || 
        currentWidth !== this.mazeGenerator.width || 
        currentHeight !== this.mazeGenerator.height || 
        currentLevels !== this.mazeGenerator.levels) {
      // Dimensions changed - regenerate maze
      this.drawDelay();
    } else {
      // Only visual options changed - just refresh display
      this.refreshDisplay();
    }
  }

  // UI state management
  updateHoleOptionsUI() {
    const generateHoles = (document.querySelector('[data-for="generateHoles"]') as HTMLInputElement)?.checked;
    const holesPerLevelField = document.getElementById('holesPerLevelField');
    if(holesPerLevelField) {
      holesPerLevelField.style.display = generateHoles ? 'block' : 'none';
    }
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Input validation listeners
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.validate();
        this.onConfigChange();
      });
    });

    // Button event listeners
    document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshDisplay());
    document.getElementById('regenerateBtn')?.addEventListener('click', () => this.regenerateMaze());
    document.getElementById('downloadBtn')?.addEventListener('click', () => this.generateCommand());
    document.getElementById('prevBtn')?.addEventListener('click', () => this.previousLevel());
    document.getElementById('nextBtn')?.addEventListener('click', () => this.nextLevel());
    
    // Display mode switcher
    document.getElementById('schematicBtn')?.addEventListener('click', () => {
      switchDisplay('schematic');
      this.updateDisplay('schematic');
    });
    document.getElementById('exactBtn')?.addEventListener('click', () => {
      switchDisplay('exact');
      this.updateDisplay('exact');
    });

    // Initial setup
    this.updateDetailedFilename();
    this.updateCustomNamePreview();
    this.updateHoleOptionsUI();
    
    // Add listener for maze generation mode radio buttons
    const generateHolesCheckbox = document.querySelector('input[data-for="generateHoles"]');
    if (generateHolesCheckbox) {
      generateHolesCheckbox.addEventListener('change', () => {
        this.updateHoleOptionsUI();
        this.regenerateMaze();
      });
    }
    
    this.draw();
  }

  // Placeholder for generateCommand - will be implemented in file-generator module
  generateCommand() {
    console.log('Generate command called - this will be implemented in file-generator module');
  }
}