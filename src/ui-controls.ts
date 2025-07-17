// Config is declared globally in the main bundle
declare const config: any;
import { MultiLevelMaze } from './maze-generator'
import { DisplayManager, switchDisplay } from './display-manager'
import { debounce, validate, updateCustomNamePreview, updateDetailedFilename } from './utils'

// UI Controls - handles user interactions and control logic
export class UIControls {
  public mazeGenerator: MultiLevelMaze | null = null;
  private displayManager: DisplayManager;
  private drawDelay: () => void;
  private onMazeGeneratorChange?: (generator: MultiLevelMaze | null) => void;

  constructor(displayManager: DisplayManager) {
    this.displayManager = displayManager;
    this.drawDelay = debounce(() => this.draw(), 500);
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
    
    this.updateDisplay();
  }

  // Display refresh functions
  refreshDisplay() {
    // Only update the visual display without regenerating the maze
    if (this.mazeGenerator) {
      this.updateDisplay();
    }
  }

  regenerateMaze() {
    // Force a complete maze regeneration
    this.draw();
  }

  updateDisplay() {
    if (!this.mazeGenerator) return;
    
    const mazeDisplay = document.getElementById('mazeDisplay');
    if (!mazeDisplay) return;
    
    const currentLevel = this.mazeGenerator.currentLevel;
    const { showBlockLegend } = config;
    
    // Update level display based on current display mode
    let html = '';
    if (currentDisplayMode === 'schematic') {
      html = this.displayManager.renderLevel(currentLevel);
    } else {
      html = this.displayManager.renderExactBlockLayout(currentLevel);
    }
    
    mazeDisplay.innerHTML = html;
    
    // Update block legend
    if (showBlockLegend) {
      const blockLegend = document.getElementById('blockLegend');
      if (blockLegend) {
        blockLegend.innerHTML = this.displayManager.renderBlockLegend();
      }
    }
    
    // Update tree view
    this.updateTreeView();
    this.updateLevelControls();
    
    // Show/hide chunk overlay
    this.updateChunkOverlay();
    
    // Update filename preview
    updateDetailedFilename();
    updateCustomNamePreview();
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
    
    // Create new chunk overlay (placeholder implementation)
    const mazeDisplay = document.getElementById('mazeDisplay');
    if (mazeDisplay) {
      const overlay = document.createElement('div');
      overlay.id = 'chunkOverlay';
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.border = '2px dashed #ff0000';
      overlay.style.zIndex = '10';
      
      // Simple chunk border visualization (16x16 grid)
      // This is a simplified implementation
      mazeDisplay.style.position = 'relative';
      mazeDisplay.appendChild(overlay);
    }
  }

  // Navigation functions
  nextLevel() {
    if (this.mazeGenerator && this.mazeGenerator.currentLevel < this.mazeGenerator.levels - 1) {
      this.mazeGenerator.currentLevel++;
      this.updateDisplay();
    }
  }

  previousLevel() {
    if (this.mazeGenerator && this.mazeGenerator.currentLevel > 0) {
      this.mazeGenerator.currentLevel--;
      this.updateDisplay();
    }
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
    const is3D = config.mazeGenerationMode === '3D';
    const holeOptionsWrapper = document.getElementById('holeOptionsWrapper');
    const holeOptionsNote = document.getElementById('holeOptionsNote');
    const generateHolesLabel = document.getElementById('generateHolesLabel');
    const holesPerLevelField = document.getElementById('holesPerLevelField');
    const ladder3DControl = document.getElementById('ladder3DControl');
    
    if (holeOptionsWrapper && holeOptionsNote && generateHolesLabel && holesPerLevelField && ladder3DControl) {
      if (is3D) {
        holeOptionsWrapper.style.display = 'none';
        holeOptionsNote.style.display = 'block';
        ladder3DControl.style.display = 'block';
      } else {
        holeOptionsWrapper.style.display = '';
        holeOptionsNote.style.display = 'none';
        ladder3DControl.style.display = 'none';
      }
    }
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Input validation listeners
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        validate();
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
      this.updateDisplay();
    });
    document.getElementById('exactBtn')?.addEventListener('click', () => {
      switchDisplay('exact');
      this.updateDisplay();
    });

    // Initial setup
    updateDetailedFilename();
    updateCustomNamePreview();
    this.updateHoleOptionsUI();
    
    // Add listener for maze generation mode radio buttons
    const mazeModeRadios = document.querySelectorAll('input[name="mazeGenerationMode"]');
    mazeModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.updateHoleOptionsUI();
        this.regenerateMaze(); // Regenerate maze when mode changes
      });
    });
    
    this.draw();
  }

  // Placeholder for generateCommand - will be implemented in file-generator module
  generateCommand() {
    console.log('Generate command called - this will be implemented in file-generator module');
  }
}

// Global current display mode
export let currentDisplayMode: 'schematic' | 'exact' = 'schematic';