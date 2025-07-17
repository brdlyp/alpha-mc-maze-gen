import { MultiLevelMaze } from './maze-generator'
import { DisplayManager } from './display-manager'
import { UIControls } from './ui-controls'
import { FileGenerator } from './file-generator'

// Global instances
let mazeGenerator: MultiLevelMaze | null = null;
let displayManager: DisplayManager;
let uiControls: UIControls;
let fileGenerator: FileGenerator;

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