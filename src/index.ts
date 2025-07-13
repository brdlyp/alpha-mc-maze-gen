import { config } from './config'

// Multi-Level Maze Generator
class MultiLevelMaze {
  width: number;
  height: number;
  levels: number;
  currentLevel: number;
  mazes: Array<{
    width: number;
    height: number;
    level: number;
    grid: Array<Array<{
      walls: number;
      hasUp: boolean;
      hasDown: boolean;
    }>>;
  }>;
  grid: number[][][];
  
  // Direction constants
  NORTH: number;
  SOUTH: number;
  EAST: number;
  WEST: number;
  UP: number;
  DOWN: number;
  
  directions: number[];
  opposite: { [key: number]: number };
  dx: { [key: number]: number };
  dy: { [key: number]: number };
  dz: { [key: number]: number };
  
  constructor(width: number, height: number, levels: number) {
    this.width = width;
    this.height = height;
    this.levels = levels;
    this.currentLevel = 0;
    this.mazes = [];
    this.grid = [];
    
    // Direction constants
    this.NORTH = 1;
    this.SOUTH = 2;
    this.EAST = 4;
    this.WEST = 8;
    this.UP = 16;
    this.DOWN = 32;
    
    this.directions = [this.NORTH, this.SOUTH, this.EAST, this.WEST, this.UP, this.DOWN];
    this.opposite = {
      [this.NORTH]: this.SOUTH,
      [this.SOUTH]: this.NORTH,
      [this.EAST]: this.WEST,
      [this.WEST]: this.EAST,
      [this.UP]: this.DOWN,
      [this.DOWN]: this.UP
    };
    
    this.dx = {
      [this.NORTH]: 0,
      [this.SOUTH]: 0,
      [this.EAST]: 1,
      [this.WEST]: -1,
      [this.UP]: 0,
      [this.DOWN]: 0
    };
    
    this.dy = {
      [this.NORTH]: -1,
      [this.SOUTH]: 1,
      [this.EAST]: 0,
      [this.WEST]: 0,
      [this.UP]: 0,
      [this.DOWN]: 0
    };
    
    this.dz = {
      [this.NORTH]: 0,
      [this.SOUTH]: 0,
      [this.EAST]: 0,
      [this.WEST]: 0,
      [this.UP]: 1,
      [this.DOWN]: -1
    };
  }
  
  generate() {
    // Initialize 3D grid
    this.grid = [];
    for (let z = 0; z < this.levels; z++) {
      this.grid[z] = [];
      for (let y = 0; y < this.height; y++) {
        this.grid[z][y] = [];
        for (let x = 0; x < this.width; x++) {
          this.grid[z][y][x] = 0;
        }
      }
    }
    
    // Generate maze using depth-first search
    this.generateMaze();
    
    // Create individual maze objects for each level
    this.createLevelMazes();
  }
  
  generateMaze() {
    // Use Growing Tree algorithm with 50/50 split between random and newest
    const cells: Array<{x: number, y: number, z: number}> = [];
    const visited = new Set<string>();
    
    // Start from a random cell
    const startX = Math.floor(Math.random() * this.width);
    const startY = Math.floor(Math.random() * this.height);
    const startZ = Math.floor(Math.random() * this.levels);
    
    cells.push({x: startX, y: startY, z: startZ});
    visited.add(`${startX},${startY},${startZ}`);
    
    while (cells.length > 0) {
      // Choose cell selection method: 50% random, 50% newest
      const useRandom = Math.random() < 0.5;
      const index = useRandom ? Math.floor(Math.random() * cells.length) : cells.length - 1;
      
      const current = cells[index];
      const neighbors = this.getUnvisitedNeighbors(current.x, current.y, current.z, visited);
      
      if (neighbors.length === 0) {
        // No unvisited neighbors, remove this cell
        cells.splice(index, 1);
      } else {
        // Choose a random unvisited neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        const direction = this.getDirection(current, next);
        
        // Carve passage
        this.grid[current.z][current.y][current.x] |= direction;
        this.grid[next.z][next.y][next.x] |= this.opposite[direction];
        
        visited.add(`${next.x},${next.y},${next.z}`);
        cells.push(next);
      }
    }
    
    // Ensure entrance and exit
    this.grid[0][0][0] |= this.WEST;
    this.grid[this.levels - 1][this.height - 1][this.width - 1] |= this.EAST;
  }
  
  getUnvisitedNeighbors(x: number, y: number, z: number, visited: Set<string>) {
    const neighbors = [];
    
    for (const dir of this.directions) {
      const nx = x + this.dx[dir];
      const ny = y + this.dy[dir];
      const nz = z + this.dz[dir];
      
      if (this.isValidCell(nx, ny, nz) && !visited.has(`${nx},${ny},${nz}`)) {
        neighbors.push({x: nx, y: ny, z: nz});
      }
    }
    
    return neighbors;
  }
  
  getDirection(from: {x: number, y: number, z: number}, to: {x: number, y: number, z: number}) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    
    if (dx === 1) return this.EAST;
    if (dx === -1) return this.WEST;
    if (dy === 1) return this.SOUTH;
    if (dy === -1) return this.NORTH;
    if (dz === 1) return this.UP;
    if (dz === -1) return this.DOWN;
    
    return 0;
  }
  
  isValidCell(x: number, y: number, z: number) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.levels;
  }
  
  createLevelMazes() {
    this.mazes = [];
    
    for (let z = 0; z < this.levels; z++) {
      const levelMaze: {
        width: number;
        height: number;
        level: number;
        grid: Array<Array<{
          walls: number;
          hasUp: boolean;
          hasDown: boolean;
        }>>;
      } = {
        width: this.width,
        height: this.height,
        level: z,
        grid: []
      };
      
      for (let y = 0; y < this.height; y++) {
        levelMaze.grid[y] = [];
        for (let x = 0; x < this.width; x++) {
          levelMaze.grid[y][x] = {
            walls: this.grid[z][y][x],
            hasUp: (this.grid[z][y][x] & this.UP) !== 0,
            hasDown: (this.grid[z][y][x] & this.DOWN) !== 0
          };
        }
      }
      
      this.mazes.push(levelMaze);
    }
  }
  
  renderLevel(levelIndex: number) {
    const maze = this.mazes[levelIndex];
    if (!maze) return '';
    
    let html = '<div class="maze-grid">';
    
    // Top border row
    html += '<div class="maze-row">';
    for (let x = 0; x < maze.width * 2 + 1; x++) {
      html += '<div class="maze-cell wall"></div>';
    }
    html += '</div>';
    
    for (let y = 0; y < maze.height; y++) {
      // Main row with cells
      html += '<div class="maze-row">';
      
      // Left border
      const hasWest = (maze.grid[y][0].walls & this.WEST) !== 0;
      html += `<div class="maze-cell ${hasWest ? 'path' : 'wall'}"></div>`;
      
      // Cells with passages
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x];
        const hasEast = (cell.walls & this.EAST) !== 0;
        
        // Cell content with up/down indicators
        html += '<div class="maze-cell path">';
        html += `<div class="maze-indicator ${cell.hasUp ? 'up' : 'horizontal'}"></div>`;
        html += `<div class="maze-indicator ${cell.hasDown ? 'down' : 'horizontal'}"></div>`;
        html += '</div>';
        
        // Right wall of cell
        html += `<div class="maze-cell ${hasEast ? 'path' : 'wall'}"></div>`;
      }
      
      html += '</div>';
      
      // Bottom row with south passages (except last row)
      if (y < maze.height - 1) {
        html += '<div class="maze-row">';
        html += '<div class="maze-cell wall"></div>';
        
        for (let x = 0; x < maze.width; x++) {
          const cell = maze.grid[y][x];
          const hasSouth = (cell.walls & this.SOUTH) !== 0;
          html += `<div class="maze-cell ${hasSouth ? 'path' : 'wall'}"></div>`;
          html += '<div class="maze-cell wall"></div>';
        }
        
        html += '</div>';
      }
    }
    
    // Bottom border row
    html += '<div class="maze-row">';
    for (let x = 0; x < maze.width * 2 + 1; x++) {
      html += '<div class="maze-cell wall"></div>';
    }
    html += '</div>';
    
    html += '</div>';
    return html;
  }
  
  renderTreeView() {
    let html = '';
    for (let i = 0; i < this.levels; i++) {
      const activeClass = i === this.currentLevel ? 'active' : '';
      html += `<div class="tree-item ${activeClass}" onclick="selectLevel(${i})">Level ${i + 1}</div>`;
    }
    return html;
  }
}

// Global variables
let mazeGenerator: MultiLevelMaze | null = null;

function debounce(func: () => void, wait: number) {
  let timeout: number;
  const later = function () {
    timeout = 0;
    func();
  };

  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function updateDetailedFilename() {
  let { width, height, wallSize, wallHeight, walkSize, block, levels } = config;
  const filename = `${width}x${height}x${levels}maze-ww${wallSize + 1}wh${wallHeight + 1}pw${walkSize + 1}wb${block}.mcfunction`;
  const detailedNameElement = document.querySelector('[data-show="detailed-name"]');
  if (detailedNameElement) {
    detailedNameElement.textContent = filename;
  }
}

function updateCustomNamePreview() {
  const customNameInput = document.querySelector('[data-for="customName"]') as HTMLInputElement;
  const customNamePreview = document.getElementById('customNamePreview');
  const customNameText = document.getElementById('customNameText');
  const customRadio = document.querySelector('input[name="naming"][value="custom"]') as HTMLInputElement;
  
  if (customNameInput && customNamePreview && customNameText) {
    const customName = customNameInput.value.trim();
    
    if (customRadio.checked && customName) {
      // Remove .mcfunction if user typed it, then show preview
      const cleanName = customName.replace(/\.mcfunction$/i, '');
      customNameText.textContent = cleanName;
      customNamePreview.style.display = 'block';
    } else {
      customNamePreview.style.display = 'none';
    }
  }
}

function updateDimensions() {
  let { width, height, wallSize, walkSize } = config;
  const totalWidth = (width * wallSize) + (width * walkSize) + wallSize;
  const totalHeight = (height * wallSize) + (height * walkSize) + wallSize;
  document.querySelector('[data-show=dimensions]')!.innerHTML = `${totalWidth} &times; ${totalHeight}`;
}

function validate() {
  Array.from(document.querySelectorAll('input')).forEach(element => {
    if (element.type === 'number') {
      if (+element.value > +element.max) {
        element.value = element.max;
      } else if (+element.value < +element.min) {
        element.value = element.min;
      }
    }
  });

  updateDetailedFilename();
  updateCustomNamePreview();
  updateDimensions();
  drawDelay();
}

function updateDisplay() {
  if (!mazeGenerator) return;
  
  // Update maze display
  const mazeDisplay = document.getElementById('mazeDisplay');
  if (mazeDisplay) {
    mazeDisplay.innerHTML = mazeGenerator.renderLevel(mazeGenerator.currentLevel);
    
    // Calculate optimal cell size based on available space to ensure perfect squares
    const container = mazeDisplay.parentElement;
    if (container) {
      const containerWidth = container.clientWidth - 60; // Account for padding and borders
      const containerHeight = container.clientHeight - 60; // Account for padding and borders
      
      // Calculate how many cells we need to fit (including borders)
      const totalCellsX = mazeGenerator.width + 2; // +2 for top/bottom borders
      const totalCellsY = mazeGenerator.height + 2; // +2 for left/right borders
      
      // Calculate maximum cell size that fits both dimensions
      const maxCellWidth = Math.floor(containerWidth / totalCellsX);
      const maxCellHeight = Math.floor(containerHeight / totalCellsY);
      
      // Use the smaller of the two to ensure perfect squares
      const optimalCellSize = Math.min(maxCellWidth, maxCellHeight, 40); // Max 40px, min 15px
      const finalCellSize = Math.max(optimalCellSize, 15);
      
      // Apply dynamic sizing to ensure perfect squares
      const mazeGrid = mazeDisplay.querySelector('.maze-grid');
      if (mazeGrid) {
        const cells = mazeGrid.querySelectorAll('.maze-cell');
        cells.forEach(cell => {
          (cell as HTMLElement).style.width = `${finalCellSize}px`;
          (cell as HTMLElement).style.height = `${finalCellSize}px`;
        });
      }
    }
  }
  
  // Update tree view
  const treeView = document.getElementById('treeView');
  if (treeView) {
    treeView.innerHTML = mazeGenerator.renderTreeView();
  }
  
  // Update level controls
  const currentLevel = document.getElementById('currentLevel');
  const totalLevels = document.getElementById('totalLevels');
  if (currentLevel) currentLevel.textContent = (mazeGenerator.currentLevel + 1).toString();
  if (totalLevels) totalLevels.textContent = mazeGenerator.levels.toString();
  
  // Update navigation buttons
  const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
  const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
  if (prevBtn) prevBtn.disabled = mazeGenerator.currentLevel === 0;
  if (nextBtn) nextBtn.disabled = mazeGenerator.currentLevel === mazeGenerator.levels - 1;
}

function draw() {
  let { width, height, levels } = config;
  
  mazeGenerator = new MultiLevelMaze(width, height, levels);
  mazeGenerator.generate();
  
  updateDisplay();
}

function generateCommand() {
  if (!mazeGenerator) return;
  
  let { wallSize, wallHeight, walkSize, block, levels } = config;
  
  // MineCraft... 0 wallSize = 1 block
  wallSize--;
  walkSize--;
  wallHeight--;

  const commands: string[] = [
    `# Multi-Level Maze Generator\n`,
    `# Levels: ${levels}\n`,
    `# Dimensions: ${mazeGenerator.width}x${mazeGenerator.height}\n\n`
  ];

  // Generate commands for each level
  for (let level = 0; level < levels; level++) {
    commands.push(`# Level ${level + 1}\n`);
    
    const maze = mazeGenerator.mazes[level];
    if (!maze) continue;
    
    // Clear level
    const clearSize = Math.floor(Math.sqrt(32768 / (wallHeight + 1)));
    const levelY = level * (wallHeight + 1);
    
    for (let y = 0; y < maze.height; y += clearSize) {
      for (let x = 0; x < maze.width; x += clearSize) {
        const xMax = Math.min(x + clearSize, maze.width);
        const yMax = Math.min(y + clearSize, maze.height);
        commands.push(`fill ~${x} ~${levelY} ~${y} ~${xMax - 1} ~${levelY + wallHeight} ~${yMax - 1} air\n`);
      }
    }
    
    // Fill maze blocks
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x];
        const hasNorth = (cell.walls & mazeGenerator.NORTH) !== 0;
        const hasSouth = (cell.walls & mazeGenerator.SOUTH) !== 0;
        const hasEast = (cell.walls & mazeGenerator.EAST) !== 0;
        const hasWest = (cell.walls & mazeGenerator.WEST) !== 0;
        
        // If it's a wall (no passages), fill it
        if (!hasNorth && !hasSouth && !hasEast && !hasWest) {
          commands.push(`fill ~${x} ~${levelY} ~${y} ~${x} ~${levelY + wallHeight} ~${y} ${block}\n`);
        }
      }
    }
    
    // Add level transitions
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x];
        
        if (cell.hasUp && level < levels - 1) {
          commands.push(`# Up transition at ${x}, ${y} on level ${level + 1}\n`);
          // Add ladder or stairs up
          commands.push(`setblock ~${x} ~${levelY + wallHeight + 1} ~${y} ladder[facing=north]\n`);
        }
        
        if (cell.hasDown && level > 0) {
          commands.push(`# Down transition at ${x}, ${y} on level ${level + 1}\n`);
          // Add ladder or stairs down
          commands.push(`setblock ~${x} ~${levelY - 1} ~${y} ladder[facing=south]\n`);
        }
      }
    }
    
    commands.push('\n');
  }

  // Generate filename based on selected naming option
  let filename: string;
  const namingOption = (document.querySelector('input[name="naming"]:checked') as HTMLInputElement)?.value;
  
  switch (namingOption) {
    case 'simple':
      filename = 'maze.mcfunction';
      break;
    case 'detailed':
      // Format: <width>x<height>x<levels>maze-<ww#><wh#><pw#><wb"word">.mcfunction
      filename = `${mazeGenerator.width}x${mazeGenerator.height}x${levels}maze-ww${wallSize + 1}wh${wallHeight + 1}pw${walkSize + 1}wb${block}.mcfunction`;
      break;
    case 'custom':
      const customName = (document.querySelector('[data-for="customName"]') as HTMLInputElement)?.value?.trim();
      if (customName) {
        filename = customName.endsWith('.mcfunction') ? customName : `${customName}.mcfunction`;
      } else {
        // Fallback to simple if no custom name provided
        filename = 'maze.mcfunction';
      }
      break;
    default:
      filename = 'maze.mcfunction';
  }

  const element = document.body.appendChild(document.createElement('a'));
  const commandData = new Blob(commands, { type: 'text/plain' });
  element.href = URL.createObjectURL(commandData);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  element.click();
  document.body.removeChild(element);
}

// Navigation functions
function nextLevel() {
  if (mazeGenerator && mazeGenerator.currentLevel < mazeGenerator.levels - 1) {
    mazeGenerator.currentLevel++;
    updateDisplay();
  }
}

function previousLevel() {
  if (mazeGenerator && mazeGenerator.currentLevel > 0) {
    mazeGenerator.currentLevel--;
    updateDisplay();
  }
}

function selectLevel(level: number) {
  if (mazeGenerator && level >= 0 && level < mazeGenerator.levels) {
    mazeGenerator.currentLevel = level;
    updateDisplay();
  }
}

const drawDelay = debounce(draw, 500);

// Event listeners
document.addEventListener('change', validate);
document.addEventListener('input', (event) => {
  const target = event.target as HTMLElement;
  if (target.getAttribute('data-for') === 'customName') {
    updateCustomNamePreview();
  }
});

// Add event listener to the download button
const downloadButton = document.querySelector('button.button.is-primary');
if (downloadButton) {
  downloadButton.addEventListener('click', generateCommand);
}

// Handle window resize for dynamic sizing
window.addEventListener('resize', () => {
  if (mazeGenerator) {
    updateDisplay();
  }
});

// Initialize
draw();
updateDetailedFilename();
updateCustomNamePreview();
updateDimensions();

// Make functions globally available
(window as any).nextLevel = nextLevel;
(window as any).previousLevel = previousLevel;
(window as any).selectLevel = selectLevel;
