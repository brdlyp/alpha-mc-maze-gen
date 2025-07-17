import { MultiLevelMaze } from './maze-generator'
import { DisplayManager, currentDisplayMode } from './display-manager'
import { UIControls } from './ui-controls'
import { FileGenerator } from './file-generator'

// Global configuration object - this is what all the modules expect
declare global {
  var config: any;
}

// Initialize the global config object with default values
window.config = {
  width: 20,
  height: 20,
  levels: 3,
  wallSize: 1,
  wallHeight: 3,
  walkSize: 1,
  block: 'stone',
  addRoof: false,
  generateHoles: true,
  holesPerLevel: 1,
  generateLadders: true,
  showBlockLegend: true,
  showChunkBorders: false,
  customName: ''
};

// Global instances
let mazeGenerator: MultiLevelMaze | null = null;
let displayManager: DisplayManager;
let uiControls: UIControls;
let fileGenerator: FileGenerator;

// Global function for tree view level selection
(window as any).selectLevel = function(levelIndex: number) {
  if (mazeGenerator && levelIndex >=0 && levelIndex < mazeGenerator.levels) {
    mazeGenerator.currentLevel = levelIndex;
    uiControls.updateDisplay(currentDisplayMode);
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Create instances
  displayManager = new DisplayManager();
  uiControls = new UIControls(displayManager);
  fileGenerator = new FileGenerator();

  // Override the generateCommand method in UIControls to use FileGenerator
  uiControls.generateCommand = () => {
    if (mazeGenerator) {
      fileGenerator.generateCommand();
    }
  };

  // Set up the maze generator update callback
  uiControls.setMazeGeneratorChangeCallback((generator) => {
    mazeGenerator = generator;
    fileGenerator.setMazeGenerator(generator);
  });

  // Initialize event listeners and start the application
  uiControls.initializeEventListeners();
});

// Global debug function
(window as any).debugMaze = function() {
  if (mazeGenerator) {
    return mazeGenerator.debugMazeStructure(mazeGenerator.currentLevel);
  }
  return 'No maze generator available';
};

// Export for potential future use
export { mazeGenerator, displayManager, uiControls, fileGenerator };