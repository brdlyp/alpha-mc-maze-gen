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
    
    // Start from a consistent cell to ensure connectivity
    // For single level mazes, start from the entrance cell (top-left)
    // For multi-level mazes, start from the entrance cell (top-left of first level)
    const startX = 0;
    const startY = 0;
    const startZ = 0;
    
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
    
    // Ensure entrance and exit - force passages to guarantee connectivity
    // For single level mazes: entrance on west wall, exit on east wall
    // For multi-level mazes: entrance on north wall of first level, exit on south wall of last level
    if (this.levels === 1) {
      // Single level: force west passage for entrance (top-left cell), east passage for exit (bottom-right cell)
      this.grid[0][0][0] |= this.WEST;  // Entrance: west wall of top-left cell
      this.grid[0][this.height - 1][this.width - 1] |= this.EAST;  // Exit: east wall of bottom-right cell
      
      // Ensure the exit cell is connected to the maze by forcing a path from a neighboring cell
      // Connect the bottom-right cell to its west neighbor if possible
      if (this.width > 1) {
        this.grid[0][this.height - 1][this.width - 2] |= this.EAST;  // West neighbor gets east passage
        this.grid[0][this.height - 1][this.width - 1] |= this.WEST;  // Exit cell gets west passage
      }
      // Also connect to north neighbor if possible
      if (this.height > 1) {
        this.grid[0][this.height - 2][this.width - 1] |= this.SOUTH;  // North neighbor gets south passage
        this.grid[0][this.height - 1][this.width - 1] |= this.NORTH;  // Exit cell gets north passage
      }
    } else {
      // Multi-level: force north passage for entrance on first level, south passage for exit on last level
      this.grid[0][0][0] |= this.NORTH;  // Entrance: north wall of top-left cell on first level
      this.grid[this.levels - 1][this.height - 1][this.width - 1] |= this.SOUTH;  // Exit: south wall of bottom-right cell on last level
    }
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
    
    // Get current wall and path sizes from config
    const { wallSize, walkSize, generateHoles, holesPerLevel, generateLadders } = config;
    
    let html = '<div class="maze-grid">';
    
    // Calculate total grid dimensions based on wall and path sizes
    const totalWidth = maze.width * walkSize + (maze.width + 1) * wallSize;
    
    // Top border row (all walls)
    html += '<div class="maze-row">';
    for (let x = 0; x < totalWidth; x++) {
      // Check for entrance hole on north wall for multi-level mazes
      if (this.levels > 1 && levelIndex === 0 && x === wallSize + Math.floor(walkSize / 2)) {
        html += '<div class="maze-cell path"></div>';
      } else {
        html += '<div class="maze-cell wall"></div>';
      }
    }
    html += '</div>';
    
    for (let y = 0; y < maze.height; y++) {
      // For each maze row, we need walkSize rows in the display
      for (let displayRow = 0; displayRow < walkSize; displayRow++) {
        html += '<div class="maze-row">';
        
        // Left border wall
        if (this.levels === 1 && levelIndex === 0 && y === 0) {
          // Single level maze: entrance hole on west wall for first cell
          for (let i = 0; i < walkSize; i++) {
            html += '<div class="maze-cell path"></div>';
          }
        } else {
          // Solid left border wall
          for (let i = 0; i < wallSize; i++) {
            html += '<div class="maze-cell wall"></div>';
          }
        }
        
        // Cells with passages
        for (let x = 0; x < maze.width; x++) {
          const cell = maze.grid[y][x];
          const hasEast = (cell.walls & this.EAST) !== 0;
          
          // Cell content (path area)
          for (let i = 0; i < walkSize; i++) {
            html += '<div class="maze-cell path">';
            // Add up/down indicators only in the center of the path
            if (displayRow === Math.floor(walkSize / 2)) {
              // Use the shared function to determine which cells should show indicators
              const holeCells = this.getHoleCells(levelIndex, generateHoles, holesPerLevel);
              const isHoleCell = holeCells.some(hole => hole.x === x && hole.y === y);
              
              let showUp = false;
              let showDown = false;
              
              if (isHoleCell) {
                const holeCell = holeCells.find(hole => hole.x === x && hole.y === y);
                if (holeCell) {
                  showUp = holeCell.hasUp;
                  showDown = holeCell.hasDown;
                }
              }
              
              // Show indicators based on config
              if (showUp && generateLadders) {
                html += `<div class="maze-indicator up"></div>`;
              } else if (showUp && !generateLadders) {
                html += `<div class="maze-indicator horizontal" style="background: #ffaaaa;" title="Hole only (no ladder)"></div>`;
              } else {
                html += `<div class="maze-indicator horizontal"></div>`;
              }
              
              if (showDown && generateLadders) {
                html += `<div class="maze-indicator down"></div>`;
              } else if (showDown && !generateLadders) {
                html += `<div class="maze-indicator horizontal" style="background: #aaaaff;" title="Hole only (no ladder)"></div>`;
              } else {
                html += `<div class="maze-indicator horizontal"></div>`;
              }
            }
            html += '</div>';
          }
          
          // Right wall of cell
          if (hasEast || (this.levels === 1 && levelIndex === this.levels - 1 && y === maze.height - 1 && x === maze.width - 1)) {
            // Path opening - either east passage or exit hole for single level maze
            for (let i = 0; i < walkSize; i++) {
              html += '<div class="maze-cell path"></div>';
            }
          } else {
            // Solid wall
            for (let i = 0; i < wallSize; i++) {
              html += '<div class="maze-cell wall"></div>';
            }
          }
        }
        
        html += '</div>';
      }
      
      // Bottom wall row (except last maze row)
      if (y < maze.height - 1) {
        html += '<div class="maze-row">';
        
        // Left border wall
        for (let i = 0; i < wallSize; i++) {
          html += '<div class="maze-cell wall"></div>';
        }
        
        for (let x = 0; x < maze.width; x++) {
          const cell = maze.grid[y][x];
          const hasSouth = (cell.walls & this.SOUTH) !== 0;
          
          if (hasSouth) {
            // Path opening
            for (let i = 0; i < walkSize; i++) {
              html += '<div class="maze-cell path"></div>';
            }
          } else {
            // Solid wall
            for (let i = 0; i < wallSize; i++) {
              html += '<div class="maze-cell wall"></div>';
            }
          }
          
          // Wall intersection
          for (let i = 0; i < wallSize; i++) {
            html += '<div class="maze-cell wall"></div>';
          }
        }
        
        html += '</div>';
      }
    }
    
    // Bottom border row (all walls)
    html += '<div class="maze-row">';
    for (let x = 0; x < totalWidth; x++) {
      // Check for exit hole on south wall for multi-level mazes
      if (this.levels > 1 && levelIndex === this.levels - 1 && x === wallSize + (maze.width - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2)) {
        html += '<div class="maze-cell path"></div>';
      } else {
        html += '<div class="maze-cell wall"></div>';
      }
    }
    html += '</div>';
    
    html += '</div>';
    return html;
  }

  // New method: Render exact one-to-one block representation
  renderExactBlockLayout(levelIndex: number) {
    const maze = this.mazes[levelIndex];
    if (!maze) return '';
    
    const { wallSize, walkSize, generateHoles, holesPerLevel, generateLadders } = config;
    
    // Calculate exact dimensions (same as command generation)
    const totalWidth = maze.width * walkSize + (maze.width + 1) * wallSize;
    const totalHeight = maze.height * walkSize + (maze.height + 1) * wallSize;
    
    let html = '<div class="exact-maze-grid" style="border: 2px solid #333; background: #333; display: inline-block;">';
    html += '<div class="grid-info" style="background: #f0f0f0; padding: 5px; margin-bottom: 10px; font-size: 12px;">';
    html += `Exact Block Layout - Level ${levelIndex + 1} | Dimensions: ${totalWidth}×${totalHeight} blocks`;
    html += '</div>';
    
    // Render each block exactly as it appears in Minecraft
    for (let z = 0; z < totalHeight; z++) {
      html += '<div class="exact-maze-row" style="display: flex;">';
      for (let x = 0; x < totalWidth; x++) {
        const blockType = this.getBlockTypeAt(levelIndex, x, z, wallSize, walkSize, generateHoles, holesPerLevel, generateLadders);
        const blockClass = this.getBlockClass(blockType);
        const blockTitle = this.getBlockTitle(blockType, x, z);
        
        html += `<div class="exact-maze-cell ${blockClass}" title="${blockTitle}" data-x="${x}" data-z="${z}"></div>`;
      }
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }
  
  // Helper method to determine block type at specific coordinates
  getBlockTypeAt(levelIndex: number, x: number, z: number, wallSize: number, walkSize: number, generateHoles: boolean, holesPerLevel: number, generateLadders: boolean): string {
    const maze = this.mazes[levelIndex];
    if (!maze) return 'unknown';
    
    // Calculate which maze cell this block belongs to
    const cellX = Math.floor(x / (walkSize + wallSize));
    const cellY = Math.floor(z / (walkSize + wallSize));
    
    // Check if this is a border block
    if (x === 0 || x === maze.width * walkSize + (maze.width + 1) * wallSize - 1 || 
        z === 0 || z === maze.height * walkSize + (maze.height + 1) * wallSize - 1) {
      
      // Check for entrance/exit openings based on maze type
      if (this.levels === 1) {
        // Single level maze: entrance on west wall, exit on east wall
        if (levelIndex === 0 && x === 0 && z === wallSize + Math.floor(walkSize / 2)) {
          return 'entrance';
        }
        if (levelIndex === this.levels - 1 && x === maze.width * walkSize + (maze.width + 1) * wallSize - 1 && 
            z === wallSize + (maze.height - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2)) {
          return 'exit';
        }
      } else {
        // Multi-level maze: entrance on north wall of first level, exit on south wall of last level
        if (levelIndex === 0 && z === 0 && x === wallSize + Math.floor(walkSize / 2)) {
          return 'entrance';
        }
        if (levelIndex === this.levels - 1 && z === maze.height * walkSize + (maze.height + 1) * wallSize - 1 && 
            x === wallSize + (maze.width - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2)) {
          return 'exit';
        }
      }
      return 'border-wall';
    }
    
    // Check if this is a wall intersection (pillar)
    const isWallX = (x % (walkSize + wallSize)) < wallSize;
    const isWallZ = (z % (walkSize + wallSize)) < wallSize;
    
    if (isWallX && isWallZ) {
      return 'wall-pillar';
    }
    
    // Check if this is a vertical wall
    if (isWallX && !isWallZ) {
      // For vertical walls, check the cell to the left (same logic as command generation)
      const cell = cellX > 0 ? maze.grid[cellY][cellX - 1] : null;
      const hasEast = (cell && (cell.walls & this.EAST) !== 0);
      return hasEast ? 'path' : 'vertical-wall';
    }
    
    // Check if this is a horizontal wall
    if (!isWallX && isWallZ) {
      // For horizontal walls, check the cell above (same logic as command generation)
      const cell = cellY > 0 ? maze.grid[cellY - 1][cellX] : null;
      const hasSouth = (cell && (cell.walls & this.SOUTH) !== 0);
      return hasSouth ? 'path' : 'horizontal-wall';
    }
    
    // This is a path block
    // Check if it's a hole location
    if (generateHoles) {
      const holeCells = this.getHoleCells(levelIndex, generateHoles, holesPerLevel);
      const isHoleCell = holeCells.some(hole => hole.x === cellX && hole.y === cellY);
      if (isHoleCell) {
        const holeCell = holeCells.find(hole => hole.x === cellX && hole.y === cellY);
        if (holeCell) {
          if (holeCell.hasUp && generateLadders) return 'hole-up-ladder';
          if (holeCell.hasUp && !generateLadders) return 'hole-up-only';
          if (holeCell.hasDown && generateLadders) return 'hole-down-ladder';
          if (holeCell.hasDown && !generateLadders) return 'hole-down-only';
        }
      }
    }
    
    return 'path';
  }
  
  // Helper method to get CSS class for block type
  getBlockClass(blockType: string): string {
    const classes: { [key: string]: string } = {
      'path': 'exact-path',
      'border-wall': 'exact-border-wall',
      'vertical-wall': 'exact-vertical-wall',
      'horizontal-wall': 'exact-horizontal-wall',
      'wall-pillar': 'exact-wall-pillar',
      'entrance': 'exact-entrance',
      'exit': 'exact-exit',
      'hole-up-ladder': 'exact-hole-up-ladder',
      'hole-down-ladder': 'exact-hole-down-ladder',
      'hole-up-only': 'exact-hole-up-only',
      'hole-down-only': 'exact-hole-down-only',
      'unknown': 'exact-unknown'
    };
    return classes[blockType] || 'exact-unknown';
  }
  
  // Helper method to get title/tooltip for block
  getBlockTitle(blockType: string, x: number, z: number): string {
    const titles: { [key: string]: string } = {
      'path': `Path block at (${x}, ${z})`,
      'border-wall': `Border wall at (${x}, ${z})`,
      'vertical-wall': `Vertical wall at (${x}, ${z})`,
      'horizontal-wall': `Horizontal wall at (${x}, ${z})`,
      'wall-pillar': `Wall pillar at (${x}, ${z})`,
      'entrance': `Entrance at (${x}, ${z})`,
      'exit': `Exit at (${x}, ${z})`,
      'hole-up-ladder': `Hole with up ladder at (${x}, ${z})`,
      'hole-down-ladder': `Hole with down ladder at (${x}, ${z})`,
      'hole-up-only': `Hole only (up) at (${x}, ${z})`,
      'hole-down-only': `Hole only (down) at (${x}, ${z})`,
      'unknown': `Unknown block at (${x}, ${z})`
    };
    return titles[blockType] || `Unknown block at (${x}, ${z})`;
  }
  
  renderTreeView() {
    let html = '';
    for (let i = 0; i < this.levels; i++) {
      const activeClass = i === this.currentLevel ? 'active' : '';
      html += `<div class="tree-item ${activeClass}" onclick="selectLevel(${i})">Level ${i + 1}</div>`;
    }
    return html;
  }

  // Shared function to determine which cells should have holes/ladders
  getHoleCells(levelIndex: number, generateHoles: boolean, holesPerLevel: number) {
    const holeCells: Array<{x: number, y: number, hasUp: boolean, hasDown: boolean}> = [];
    if (!generateHoles) return holeCells;
    const maze = this.mazes[levelIndex];
    if (!maze) return holeCells;
    // --- FIX: In 3D mode, return all vertical passages, ignore holesPerLevel ---
    const is3D = config.mazeGenerationMode === '3D';
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x];
        if ((cell.hasUp && levelIndex < this.levels - 1) || (cell.hasDown && levelIndex > 0)) {
          holeCells.push({
            x: x,
            y: y,
            hasUp: cell.hasUp && levelIndex < this.levels - 1,
            hasDown: cell.hasDown && levelIndex > 0
          });
        }
      }
    }
    if (!is3D && holesPerLevel > 0 && holeCells.length > holesPerLevel) {
      // Shuffle and limit for 2D mode
      for (let i = holeCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [holeCells[i], holeCells[j]] = [holeCells[j], holeCells[i]];
      }
      return holeCells.slice(0, holesPerLevel);
    }
    return holeCells;
  }

  // Debug function to help understand the maze structure
  debugMazeStructure(levelIndex: number) {
    const maze = this.mazes[levelIndex];
    if (!maze) return 'No maze data';
    
    let debug = `Maze Level ${levelIndex + 1} Structure:\n`;
    debug += `Dimensions: ${maze.width}x${maze.height}\n\n`;
    
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x];
        const walls = cell.walls;
        const hasNorth = (walls & this.NORTH) !== 0;
        const hasSouth = (walls & this.SOUTH) !== 0;
        const hasEast = (walls & this.EAST) !== 0;
        const hasWest = (walls & this.WEST) !== 0;
        
        debug += `Cell [${x},${y}]: N:${hasNorth ? '1' : '0'} S:${hasSouth ? '1' : '0'} E:${hasEast ? '1' : '0'} W:${hasWest ? '1' : '0'}\n`;
      }
      debug += '\n';
    }
    
    // Check connectivity for single level mazes
    if (this.levels === 1) {
      debug += `\nConnectivity Check:\n`;
      const entranceCell = maze.grid[0][0];
      const exitCell = maze.grid[maze.height - 1][maze.width - 1];
      
      debug += `Entrance cell [0,0]: N:${(entranceCell.walls & this.NORTH) !== 0 ? '1' : '0'} S:${(entranceCell.walls & this.SOUTH) !== 0 ? '1' : '0'} E:${(entranceCell.walls & this.EAST) !== 0 ? '1' : '0'} W:${(entranceCell.walls & this.WEST) !== 0 ? '1' : '0'}\n`;
      debug += `Exit cell [${maze.width-1},${maze.height-1}]: N:${(exitCell.walls & this.NORTH) !== 0 ? '1' : '0'} S:${(exitCell.walls & this.SOUTH) !== 0 ? '1' : '0'} E:${(exitCell.walls & this.EAST) !== 0 ? '1' : '0'} W:${(exitCell.walls & this.WEST) !== 0 ? '1' : '0'}\n`;
    }
    
    console.log(debug);
    return debug;
  }

  // Fallback ladder placement strategies
  attemptFallbackLadderPlacement(
    x: number, y: number, level: number, direction: 'up' | 'down', 
    wallSize: number, walkSize: number, wallHeight: number, floorY: number,
    maze: any, commands: string[]
  ): { method: string, success: boolean } | null {
    
    // Strategy 1: Corner placement (place ladder in corner of cell)
    const cornerResult = this.attemptCornerPlacement(x, y, level, direction, wallSize, walkSize, wallHeight, floorY, commands);
    if (cornerResult) return cornerResult;
    
    // Strategy 2: Create temporary wall and place ladder
    const wallResult = this.attemptWallCreation(x, y, level, direction, wallSize, walkSize, wallHeight, floorY, maze, commands);
    if (wallResult) return wallResult;
    
    // Strategy 3: Ceiling mounting (place ladder on ceiling)
    const ceilingResult = this.attemptCeilingMounting(x, y, level, direction, wallSize, walkSize, wallHeight, floorY, commands);
    if (ceilingResult) return ceilingResult;
    
    return null;
  }

  attemptCornerPlacement(
    x: number, y: number, _level: number, _direction: 'up' | 'down',
    wallSize: number, walkSize: number, wallHeight: number, floorY: number,
    commands: string[]
  ): { method: string, success: boolean } | null {
    
    // Place ladder in the corner of the cell (adjacent to a pillar)
    const cornerX = x * (walkSize + wallSize);
    const cornerZ = y * (walkSize + wallSize);
    
    // Try placing ladder adjacent to the corner pillar
    const ladderX = cornerX + 1;
    const ladderZ = cornerZ + 1;
    
    const ladderCount = wallHeight + 2;
    const ladderStartY = floorY + 1;
    const ladderEndY = ladderStartY + ladderCount - 1;
    
    let anyLadderPlaced = false;
    for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
      commands.push(`setblock ~${ladderX} ~${ladderY} ~${ladderZ} ladder 2\n`);
      anyLadderPlaced = true;
    }
    
    if (anyLadderPlaced) {
      commands.push(`# Corner ladder placed at coordinates (~${ladderX}, ~${ladderStartY}-${ladderEndY}, ~${ladderZ})\n`);
      return { method: 'corner placement', success: true };
    }
    
    return null;
  }

  attemptWallCreation(
    x: number, y: number, _level: number, _direction: 'up' | 'down',
    wallSize: number, walkSize: number, wallHeight: number, floorY: number,
    _maze: any, commands: string[]
  ): { method: string, success: boolean } | null {
    
    // Create a temporary wall and place ladder on it
    // Choose the north wall as default
    const wallX = x * (walkSize + wallSize) + wallSize;
    const wallZ = y * (walkSize + wallSize);
    
    // Create the wall first
    const wallTopY = floorY + wallHeight;
    commands.push(`# Creating temporary wall for ladder placement\n`);
    commands.push(`fill ~${wallX} ~${floorY + 1} ~${wallZ} ~${wallX + wallSize - 1} ~${wallTopY} ~${wallZ + walkSize - 1} stone\n`);
    
    // Place ladder on the created wall
    const ladderX = wallX;
    const ladderZ = wallZ - 1; // Adjacent to the wall
    
    const ladderCount = wallHeight + 2;
    const ladderStartY = floorY + 1;
    const ladderEndY = ladderStartY + ladderCount - 1;
    
    let anyLadderPlaced = false;
    for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
      commands.push(`setblock ~${ladderX} ~${ladderY} ~${ladderZ} ladder 3\n`);
      anyLadderPlaced = true;
    }
    
    if (anyLadderPlaced) {
      commands.push(`# Wall creation ladder placed at coordinates (~${ladderX}, ~${ladderStartY}-${ladderEndY}, ~${ladderZ})\n`);
      return { method: 'wall creation', success: true };
    }
    
    return null;
  }

  attemptCeilingMounting(
    x: number, y: number, _level: number, _direction: 'up' | 'down',
    wallSize: number, walkSize: number, wallHeight: number, floorY: number,
    commands: string[]
  ): { method: string, success: boolean } | null {
    
    // Place ladder hanging from the ceiling
    const centerX = x * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
    const centerZ = y * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
    
    const wallTopY = floorY + wallHeight;
    const ladderCount = wallHeight + 2;
    const ladderStartY = wallTopY - ladderCount + 1;
    const ladderEndY = wallTopY;
    
    let anyLadderPlaced = false;
    for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
      commands.push(`setblock ~${centerX} ~${ladderY} ~${centerZ} ladder 2\n`);
      anyLadderPlaced = true;
    }
    
    if (anyLadderPlaced) {
      commands.push(`# Ceiling mounted ladder placed at coordinates (~${centerX}, ~${ladderStartY}-${ladderEndY}, ~${centerZ})\n`);
      return { method: 'ceiling mounting', success: true };
    }
    
    return null;
  }
}

// Global variables
let mazeGenerator: MultiLevelMaze | null = null;
let currentDisplayMode: 'schematic' | 'exact' = 'schematic';

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
  let { width, height, wallSize, wallHeight, walkSize, block, levels, addRoof } = config;
  let suffix = '';
  if (addRoof) suffix = '-wceiling';
  const filename = `${width}x${height}x${levels}maze-ww${wallSize}wh${wallHeight}pw${walkSize}wb${block}${suffix}.mcfunction`;
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
  const totalWidth = width * walkSize + (width + 1) * wallSize;
  const totalHeight = height * walkSize + (height + 1) * wallSize;
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
  
  // Check if dimensions changed (requires full regeneration)
  const currentWidth = config.width;
  const currentHeight = config.height;
  const currentLevels = config.levels;
  
  if (!mazeGenerator || 
      currentWidth !== mazeGenerator.width || 
      currentHeight !== mazeGenerator.height || 
      currentLevels !== mazeGenerator.levels) {
    // Dimensions changed - regenerate maze
    drawDelay();
  } else {
    // Only visual options changed - just refresh display
    refreshDisplay();
  }
}

function refreshDisplay() {
  // Only update the visual display without regenerating the maze
  if (mazeGenerator) {
    updateDisplay();
  }
}

function regenerateMaze() {
  // Force a complete maze regeneration
  draw();
}

function updateDisplay() {
  if (!mazeGenerator) return;
  
  // Update maze display
  const mazeDisplay = document.getElementById('mazeDisplay');
  if (mazeDisplay) {
    // Render based on current display mode
    if (currentDisplayMode === 'exact') {
      mazeDisplay.innerHTML = mazeGenerator.renderExactBlockLayout(mazeGenerator.currentLevel);
    } else {
      mazeDisplay.innerHTML = mazeGenerator.renderLevel(mazeGenerator.currentLevel);
    }
    
    // Calculate optimal cell size based on available space to ensure perfect squares
    const container = mazeDisplay.parentElement;
    if (container) {
      const containerWidth = container.clientWidth - 60; // Account for padding and borders
      const containerHeight = container.clientHeight - 60; // Account for padding and borders
      
      // Get current wall and path sizes from config
      const { wallSize, walkSize } = config;
      
      // Calculate how many cells we need to fit based on dynamic grid structure
      const totalCellsX = mazeGenerator.width * walkSize + (mazeGenerator.width + 1) * wallSize;
      const totalCellsY = mazeGenerator.height * walkSize + (mazeGenerator.height + 1) * wallSize;
      
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
      
      // Apply dynamic sizing to exact block layout cells
      const exactMazeGrid = mazeDisplay.querySelector('.exact-maze-grid');
      if (exactMazeGrid) {
        const exactCells = exactMazeGrid.querySelectorAll('.exact-maze-cell');
        exactCells.forEach(cell => {
          (cell as HTMLElement).style.width = `${finalCellSize}px`;
          (cell as HTMLElement).style.height = `${finalCellSize}px`;
        });
      }

      // --- Block Legend ---
      const blockLegend = document.getElementById('blockLegend');
      if (blockLegend) {
        if (config.showBlockLegend) {
          // Render a row legend: [wall][wall]...[path][path]... with labels
          let legendHtml = '<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">';
          legendHtml += '<span style="font-size: 0.9em; color: #555; margin-right: 6px;">Wall</span>';
          for (let i = 0; i < wallSize; i++) {
            legendHtml += `<div class="maze-cell wall" style="width: ${finalCellSize}px; height: ${finalCellSize}px;"></div>`;
          }
          legendHtml += '<span style="font-size: 0.9em; color: #555; margin: 0 6px;">Path</span>';
          for (let i = 0; i < walkSize; i++) {
            legendHtml += `<div class="maze-cell path" style="width: ${finalCellSize}px; height: ${finalCellSize}px;"></div>`;
          }
          legendHtml += '</div>';
          blockLegend.innerHTML = legendHtml;
        } else {
          blockLegend.innerHTML = '';
        }
      }

      // --- Chunk Borders ---
      // Remove any previous chunk overlays
      const oldChunkOverlay = document.getElementById('chunkOverlay');
      if (oldChunkOverlay && oldChunkOverlay.parentElement) {
        oldChunkOverlay.parentElement.removeChild(oldChunkOverlay);
      }
      
      if (config.showChunkBorders) {
        // Determine which grid to use based on display mode
        const targetGrid = currentDisplayMode === 'exact' ? exactMazeGrid : mazeGrid;
        
        if (targetGrid) {
          // Create overlay div
          const overlay = document.createElement('div');
          overlay.id = 'chunkOverlay';
          overlay.style.position = 'absolute';
          const gridRect = targetGrid as HTMLElement;
          overlay.style.left = gridRect.offsetLeft + 'px';
          overlay.style.top = gridRect.offsetTop + 'px';
          overlay.style.pointerEvents = 'none';
          overlay.style.width = gridRect.offsetWidth + 'px';
          overlay.style.height = gridRect.offsetHeight + 'px';
          overlay.style.zIndex = '10';
          overlay.style.display = 'block';
          
          // Draw chunk lines (every 16 blocks)
          const overlaySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          overlaySvg.setAttribute('width', overlay.style.width);
          overlaySvg.setAttribute('height', overlay.style.height);
          overlaySvg.style.position = 'absolute';
          overlaySvg.style.left = '0';
          overlaySvg.style.top = '0';
          overlaySvg.style.width = '100%';
          overlaySvg.style.height = '100%';
          
          // Calculate dimensions based on display mode
          let totalBlocksX, totalBlocksY;
          if (currentDisplayMode === 'exact') {
            // For exact mode, use the actual block dimensions
            const maze = mazeGenerator.mazes[mazeGenerator.currentLevel];
            if (maze) {
              totalBlocksX = maze.width * config.walkSize + (maze.width + 1) * config.wallSize;
              totalBlocksY = maze.height * config.walkSize + (maze.height + 1) * config.wallSize;
            } else {
              totalBlocksX = totalCellsX;
              totalBlocksY = totalCellsY;
            }
          } else {
            // For schematic mode, use the calculated cell dimensions
            totalBlocksX = totalCellsX;
            totalBlocksY = totalCellsY;
          }
          
          // Vertical lines (every 16 blocks)
          for (let x = 16; x < totalBlocksX; x += 16) {
            const pos = x * finalCellSize;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', pos.toString());
            line.setAttribute('y1', '0');
            line.setAttribute('x2', pos.toString());
            line.setAttribute('y2', (totalBlocksY * finalCellSize).toString());
            line.setAttribute('stroke', '#ff0000');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-dasharray', '8,8');
            line.setAttribute('opacity', '0.7');
            overlaySvg.appendChild(line);
          }
          
          // Horizontal lines (every 16 blocks)
          for (let y = 16; y < totalBlocksY; y += 16) {
            const pos = y * finalCellSize;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', pos.toString());
            line.setAttribute('x2', (totalBlocksX * finalCellSize).toString());
            line.setAttribute('y2', pos.toString());
            line.setAttribute('stroke', '#ff0000');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-dasharray', '8,8');
            line.setAttribute('opacity', '0.7');
            overlaySvg.appendChild(line);
          }
          
          overlay.appendChild(overlaySvg);
          mazeDisplay.appendChild(overlay);
        }
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

  // Ensure we're using the current maze data that's displayed
  // Force a refresh of the display to make sure we have the latest maze
  updateDisplay();

  let { wallSize, wallHeight, walkSize, block, levels, addRoof, generateHoles, holesPerLevel, generateLadders } = config;

  // Use user values directly
  // Each level: floor (1), walls (wallHeight), so total per level = 1 + wallHeight

  const commands: string[] = [
    `# Multi-Level Maze Generator\n`,
    `# Levels: ${levels}\n`,
    `# Dimensions: ${mazeGenerator.width}x${mazeGenerator.height}\n\n`
  ];

  // Calculate maze dimensions in blocks
  // For a maze of N cells, there are N+1 walls in each direction
  let lastWallTopY = 0;
  let totalWidth = 0;
  let totalHeight = 0;
  for (let level = 0; level < levels; level++) {
    commands.push(`# Level ${level + 1}\n`);
    const maze = mazeGenerator.mazes[level];
    if (!maze) continue;
    // Y coordinate for this level
    const levelY = level * (1 + wallHeight); // floor + wallHeight, no air gap
    const mazeWidth = maze.width;
    const mazeHeight = maze.height;
    totalWidth = mazeWidth * walkSize + (mazeWidth + 1) * wallSize;
    totalHeight = mazeHeight * walkSize + (mazeHeight + 1) * wallSize;
    const floorY = levelY;
    const wallTopY = levelY + wallHeight; // wallHeight blocks above floor

    // 1. Clear the area for this level
    commands.push(`fill ~0 ~${floorY} ~0 ~${totalWidth - 1} ~${wallTopY} ~${totalHeight - 1} air\n`);

    // 2. Fill the floor (1 block thick)
    commands.push(`fill ~0 ~${floorY} ~0 ~${totalWidth - 1} ~${floorY} ~${totalHeight - 1} stone\n`);

    // 3. Build walls
    // Place all vertical (north-south) walls
    for (let x = 0; x <= mazeWidth; x++) {
      for (let y = 0; y < mazeHeight; y++) {
        // If this is a wall (either left of cell or rightmost border)
        if (x === mazeWidth || (x > 0 && (maze.grid[y][x - 1].walls & mazeGenerator.EAST) === 0)) {
          // --- FIX: For the last vertical wall, ensure it's at the true east edge ---
          let wx;
          if (x === mazeWidth) {
            wx = mazeWidth * (walkSize + wallSize); // rightmost edge
          } else {
            wx = x * (walkSize + wallSize);
          }
          const wz = y * (walkSize + wallSize) + wallSize;
          commands.push(`fill ~${wx} ~${floorY + 1} ~${wz} ~${wx + wallSize - 1} ~${wallTopY} ~${wz + walkSize - 1} ${block}\n`);
        }
      }
    }
    // Place all horizontal (west-east) walls
    for (let y = 0; y <= mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        // If this is a wall (either above cell or bottom border)
        if (y === mazeHeight || (y > 0 && (maze.grid[y - 1][x].walls & mazeGenerator.SOUTH) === 0)) {
          // --- FIX: For the last horizontal wall, ensure it's at the true south edge ---
          let wz;
          if (y === mazeHeight) {
            wz = mazeHeight * (walkSize + wallSize); // bottom edge
          } else {
            wz = y * (walkSize + wallSize);
          }
          const wx = x * (walkSize + wallSize) + wallSize;
          commands.push(`fill ~${wx} ~${floorY + 1} ~${wz} ~${wx + walkSize - 1} ~${wallTopY} ~${wz + wallSize - 1} ${block}\n`);
        }
      }
    }
    // Place all wall intersections (pillars)
    for (let y = 0; y <= mazeHeight; y++) {
      for (let x = 0; x <= mazeWidth; x++) {
        const wx = x * (walkSize + wallSize);
        const wz = y * (walkSize + wallSize);
        commands.push(`fill ~${wx} ~${floorY + 1} ~${wz} ~${wx + wallSize - 1} ~${wallTopY} ~${wz + wallSize - 1} ${block}\n`);
      }
    }

    // 3b. Add solid perimeter walls, with entrance/exit openings
    // Calculate entrance/exit positions
    // For single level mazes: entrance on west wall, exit on east wall
    // For multi-level mazes: entrance on north wall of first level, exit on south wall of last level
    let entranceX, entranceZ, exitX, exitZ;
    
    if (levels === 1) {
      // Single level maze: entrance on west wall, exit on east wall
      entranceX = 0;
      entranceZ = wallSize + Math.floor(walkSize / 2);
      exitX = totalWidth - 1;
      exitZ = wallSize + (mazeHeight - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2);
    } else {
      // Multi-level maze: entrance on north wall of first level, exit on south wall of last level
      entranceX = wallSize + Math.floor(walkSize / 2);
      entranceZ = 0;
      exitX = wallSize + (mazeWidth - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2);
      exitZ = totalHeight - 1;
    }

    // North edge (z = 0)
    for (let x = 0; x < totalWidth; x++) {
      // Only skip the single entrance block on the first level for multi-level mazes
      if (levels > 1 && level === 0 && x === entranceX && 0 === entranceZ) continue;
      commands.push(`fill ~${x} ~${floorY + 1} ~0 ~${x} ~${wallTopY} ~0 ${block}\n`);
    }
    // South edge (z = totalHeight - 1)
    for (let x = 0; x < totalWidth; x++) {
      // Only skip the single exit block on the last level for multi-level mazes
      if (levels > 1 && level === levels - 1 && x === exitX && totalHeight - 1 === exitZ) continue;
      commands.push(`fill ~${x} ~${floorY + 1} ~${totalHeight - 1} ~${x} ~${wallTopY} ~${totalHeight - 1} ${block}\n`);
    }
    // West edge (x = 0)
    for (let z = 0; z < totalHeight; z++) {
      // Only skip the single entrance block on the first level for single level mazes
      if (levels === 1 && level === 0 && 0 === entranceX && z === entranceZ) continue;
      commands.push(`fill ~0 ~${floorY + 1} ~${z} ~0 ~${wallTopY} ~${z} ${block}\n`);
    }
    // East edge (x = totalWidth - 1)
    for (let z = 0; z < totalHeight; z++) {
      // Only skip the single exit block on the last level for single level mazes
      if (levels === 1 && level === levels - 1 && totalWidth - 1 === exitX && z === exitZ) continue;
      commands.push(`fill ~${totalWidth - 1} ~${floorY + 1} ~${z} ~${totalWidth - 1} ~${wallTopY} ~${z} ${block}\n`);
    }

    // 4. Carve floor holes for ladder connections (before ladders are placed)
    if (config.generateHoles) {
      // --- FIX: Only carve floor holes for levels above 0 ---
      if (level > 0) {
        const holeCells = mazeGenerator.getHoleCells(level, generateHoles, holesPerLevel);
        // Determine entrance/exit cell coordinates for this level
        let entranceCellX = null, entranceCellY = null, exitCellX = null, exitCellY = null;
        if (levels === 1) {
          // Single level: entrance on west wall (cell 0,0), exit on east wall (cell width-1, height-1)
          entranceCellX = 0; entranceCellY = 0;
          exitCellX = maze.width - 1; exitCellY = maze.height - 1;
        } else {
          // Multi-level: entrance on north wall of first level (cell 0,0), exit on south wall of last level (cell width-1, height-1)
          if (level === 0) { entranceCellX = 0; entranceCellY = 0; }
          if (level === levels - 1) { exitCellX = maze.width - 1; exitCellY = maze.height - 1; }
        }
        for (const holeCell of holeCells) {
          // Skip if this cell is the entrance or exit for this level
          if ((entranceCellX !== null && holeCell.x === entranceCellX && holeCell.y === entranceCellY) ||
              (exitCellX !== null && holeCell.x === exitCellX && holeCell.y === exitCellY)) {
            continue;
          }
          // --- Prevent holes at south/east edge except exit ---
          if ((holeCell.y === maze.height - 1 && !(exitCellX === holeCell.x && exitCellY === holeCell.y)) ||
              (holeCell.x === maze.width - 1 && !(exitCellX === holeCell.x && exitCellY === holeCell.y))) {
            continue;
          }
          // Center of the path cell
          const px = holeCell.x * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
          const pz = holeCell.y * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
          // Carve hole in floor for up/down connections
          commands.push(`# Floor hole at level ${level + 1}, cell (${holeCell.x}, ${holeCell.y}), coordinates (~${px}, ~${floorY}, ~${pz})\n`);
          commands.push(`setblock ~${px} ~${floorY} ~${pz} air\n`);
        }
      }
    }

    // 5. Explicitly carve entrance and exit holes at the very end (so they are never overwritten)
    // Carve entrance (west wall, first cell, first level)
    if (level === 0) {
      for (let y = floorY + 1; y <= wallTopY; y++) {
        commands.push(`setblock ~${entranceX} ~${y} ~${entranceZ} air\n`);
      }
    }
    // Carve exit (east wall, last cell, last level)
    if (level === levels - 1) {
      for (let y = floorY + 1; y <= wallTopY; y++) {
        commands.push(`setblock ~${exitX} ~${y} ~${exitZ} air\n`);
      }
    }

    commands.push('\n');
    lastWallTopY = wallTopY;
  }

  // Add ceiling/roof if enabled (after all levels)
  if (addRoof) {
    commands.push(`# Ceiling/Roof\n`);
    commands.push(`fill ~0 ~${lastWallTopY + 1} ~0 ~${totalWidth - 1} ~${lastWallTopY + 1} ~${totalHeight - 1} ${block}\n`);
  }

  // 6. Place all ladders AFTER all walls and floors are built
  if (generateLadders && generateHoles) {
    commands.push(`# Ladder Placement (after all walls are built)\n`);
    for (let level = 0; level < levels; level++) {
      const maze = mazeGenerator.mazes[level];
      if (!maze) continue;
      
      const levelY = level * (1 + wallHeight);
      const floorY = levelY;
      
      const holeCells = mazeGenerator.getHoleCells(level, generateHoles, holesPerLevel);
      // Determine entrance/exit cell coordinates for this level
      let entranceCellX = null, entranceCellY = null, exitCellX = null, exitCellY = null;
      if (levels === 1) {
        entranceCellX = 0; entranceCellY = 0;
        exitCellX = maze.width - 1; exitCellY = maze.height - 1;
      } else {
        if (level === 0) { entranceCellX = 0; entranceCellY = 0; }
        if (level === levels - 1) { exitCellX = maze.width - 1; exitCellY = maze.height - 1; }
      }
      for (const holeCell of holeCells) {
        // Skip if this cell is the entrance or exit for this level
        if ((entranceCellX !== null && holeCell.x === entranceCellX && holeCell.y === entranceCellY) ||
            (exitCellX !== null && holeCell.x === exitCellX && holeCell.y === exitCellY)) {
          continue;
        }
        // --- Prevent ladders at south/east edge except exit ---
        if ((holeCell.y === maze.height - 1 && !(exitCellX === holeCell.x && exitCellY === holeCell.y)) ||
            (holeCell.x === maze.width - 1 && !(exitCellX === holeCell.x && exitCellY === holeCell.y))) {
          continue;
        }
        const x = holeCell.x;
        const y = holeCell.y;
        
        // Up ladder (to next level)
        if (holeCell.hasUp) {
          commands.push(`# Up ladder at level ${level + 1}, cell (${x}, ${y})\n`);
          // Try each wall in order: N, S, W, E
          const wallOptions = [
            { dx: 0, dz: -1, dir: mazeGenerator.NORTH, facing: 3 }, // North wall, faces south (ladder at z-1)
            { dx: 0, dz: 1, dir: mazeGenerator.SOUTH, facing: 2 },  // South wall, faces north (ladder at z+1)
            { dx: -1, dz: 0, dir: mazeGenerator.WEST, facing: 5 },  // West wall, faces east (ladder at x-1)
            { dx: 1, dz: 0, dir: mazeGenerator.EAST, facing: 4 }    // East wall, faces west (ladder at x+1)
          ];
          let ladderPlaced = false;
          for (const wall of wallOptions) {
            // Only place ladders on internal walls (not boundary walls)
            // FIXED: Changed from !== 0 to === 0 to place ladders on SOLID walls (no passages)
            if ((maze.grid[y][x].walls & wall.dir) === 0 && !isBoundaryWall(x, y, wall.dir, maze.width, maze.height, mazeGenerator.NORTH, mazeGenerator.SOUTH, mazeGenerator.WEST, mazeGenerator.EAST)) {
              // Calculate the solid block position (the wall) - using the same logic as wall placement
              let wallX, wallZ;
              if (wall.dir === mazeGenerator.NORTH || wall.dir === mazeGenerator.SOUTH) {
                // Horizontal wall (north/south)
                wallX = x * (walkSize + wallSize) + wallSize;
                wallZ = y * (walkSize + wallSize);
              } else {
                // Vertical wall (east/west)
                wallX = x * (walkSize + wallSize);
                wallZ = y * (walkSize + wallSize) + wallSize;
              }
              
              // Calculate ladder position (adjacent to the wall)
              let ladderX = wallX;
              let ladderZ = wallZ;
              if (wall.dx !== 0) ladderX += wall.dx; // Place ladder adjacent to wall
              if (wall.dz !== 0) ladderZ += wall.dz; // Place ladder adjacent to wall
              
              // Ensure ladder is within bounds
              const maxX = maze.width * (walkSize + wallSize) + wallSize - 1;
              const maxZ = maze.height * (walkSize + wallSize) + wallSize - 1;
              ladderX = Math.max(0, Math.min(ladderX, maxX));
              ladderZ = Math.max(0, Math.min(ladderZ, maxZ));
              
              // CRITICAL: Check if the block the ladder would be attached to is solid
              // We need to check if there's actually a wall block at the ladder's Y level
              const ladderCount = wallHeight + 2;
              const ladderStartY = floorY + 1;
              const ladderEndY = ladderStartY + ladderCount - 1;
              let anyLadderPlaced = false;
              for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
                // 3D check: only place ladder if wall exists at this Y
                if (isSolidBlock(wallX, ladderY, wallZ, wallSize, wallHeight, walkSize)) {
                  commands.push(`setblock ~${ladderX} ~${ladderY} ~${ladderZ} ladder ${wall.facing}\n`);
                  anyLadderPlaced = true;
                }
              }
              if (anyLadderPlaced) {
                commands.push(`# Ladder placed adjacent to ${wall.dx !== 0 ? 'East/West' : 'North/South'} wall at coordinates (~${ladderX}, ~${ladderStartY}-${ladderEndY}, ~${ladderZ}), facing ${wall.facing} (up to ${ladderCount} ladders total)\n`);
                ladderPlaced = true;
                break;
              }
            }
          }
          if (!ladderPlaced) {
            // FALLBACK STRATEGY: Try corner placement or create a temporary wall
            commands.push(`# WARNING: No internal wall found for up ladder at cell (${x}, ${y}) on level ${level + 1}\n`);
            commands.push(`# Attempting fallback placement strategies...\n`);
            
            const fallbackResult = mazeGenerator.attemptFallbackLadderPlacement(
              x, y, level, 'up', wallSize, walkSize, wallHeight, floorY, maze, commands
            );
            
            if (fallbackResult) {
              commands.push(`# Fallback ladder placement successful using ${fallbackResult.method}\n`);
            } else {
              commands.push(`# ERROR: All fallback strategies failed for up ladder at cell (${x}, ${y})\n`);
            }
          }
        }
        
        // Down ladder (to previous level)
        if (holeCell.hasDown) {
          commands.push(`# Down ladder at level ${level + 1}, cell (${x}, ${y})\n`);
          const wallOptions = [
            { dx: 0, dz: -1, dir: mazeGenerator.NORTH, facing: 3 }, // North wall, faces south (ladder at z-1)
            { dx: 0, dz: 1, dir: mazeGenerator.SOUTH, facing: 2 },  // South wall, faces north (ladder at z+1)
            { dx: -1, dz: 0, dir: mazeGenerator.WEST, facing: 5 },  // West wall, faces east (ladder at x-1)
            { dx: 1, dz: 0, dir: mazeGenerator.EAST, facing: 4 }    // East wall, faces west (ladder at x+1)
          ];
          let ladderPlaced = false;
          for (const wall of wallOptions) {
            // FIXED: Changed from !== 0 to === 0 to place ladders on SOLID walls (no passages)
            if ((maze.grid[y][x].walls & wall.dir) === 0 && !isBoundaryWall(x, y, wall.dir, maze.width, maze.height, mazeGenerator.NORTH, mazeGenerator.SOUTH, mazeGenerator.WEST, mazeGenerator.EAST)) {
              // Calculate the solid block position (the wall) - using the same logic as wall placement
              let wallX, wallZ;
              if (wall.dir === mazeGenerator.NORTH || wall.dir === mazeGenerator.SOUTH) {
                // Horizontal wall (north/south) - wall is at the edge of the cell
                wallX = x * (walkSize + wallSize) + wallSize;
                wallZ = y * (walkSize + wallSize);
              } else {
                // Vertical wall (east/west) - wall is at the edge of the cell
                wallX = x * (walkSize + wallSize);
                wallZ = y * (walkSize + wallSize) + wallSize;
              }
              
              // Calculate ladder position (adjacent to the wall)
              let ladderX = wallX;
              let ladderZ = wallZ;
              if (wall.dx !== 0) ladderX += wall.dx; // Place ladder adjacent to wall
              if (wall.dz !== 0) ladderZ += wall.dz; // Place ladder adjacent to wall
              
              // Ensure ladder is within bounds
              const maxX = maze.width * (walkSize + wallSize) + wallSize - 1;
              const maxZ = maze.height * (walkSize + wallSize) + wallSize - 1;
              ladderX = Math.max(0, Math.min(ladderX, maxX));
              ladderZ = Math.max(0, Math.min(ladderZ, maxZ));
              
              // Ladder Count Formula: wallHeight + 2
              // This ensures: wallHeight ladders up from floor + 1 for floor hole + 1 for next level clearance
              const ladderCount = wallHeight + 2;
              const ladderStartY = floorY + 1;
              const ladderEndY = ladderStartY + ladderCount - 1;
              let anyLadderPlaced = false;
              for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
                // 3D check: only place ladder if wall exists at this Y
                if (isSolidBlock(wallX, ladderY, wallZ, wallSize, wallHeight, walkSize)) {
                  commands.push(`setblock ~${ladderX} ~${ladderY} ~${ladderZ} ladder ${wall.facing}\n`);
                  anyLadderPlaced = true;
                }
              }
              if (anyLadderPlaced) {
                commands.push(`# Ladder placed adjacent to ${wall.dx !== 0 ? 'East/West' : 'North/South'} wall at coordinates (~${ladderX}, ~${ladderStartY}-${ladderEndY}, ~${ladderZ}), facing ${wall.facing} (up to ${ladderCount} ladders total)\n`);
                ladderPlaced = true;
                break;
              }
            }
          }
          if (!ladderPlaced) {
            // FALLBACK STRATEGY: Try corner placement or create a temporary wall
            commands.push(`# WARNING: No internal wall found for down ladder at cell (${x}, ${y}) on level ${level + 1}\n`);
            commands.push(`# Attempting fallback placement strategies...\n`);
            
            const fallbackResult = mazeGenerator.attemptFallbackLadderPlacement(
              x, y, level, 'down', wallSize, walkSize, wallHeight, floorY, maze, commands
            );
            
            if (fallbackResult) {
              commands.push(`# Fallback ladder placement successful using ${fallbackResult.method}\n`);
            } else {
              commands.push(`# ERROR: All fallback strategies failed for down ladder at cell (${x}, ${y})\n`);
            }
          }
        }
      }
    }
  }

  // Generate filename based on selected naming option
  let filename: string;
  const namingOption = (document.querySelector('input[name="naming"]:checked') as HTMLInputElement)?.value;
  switch (namingOption) {
    case 'simple':
      filename = 'maze.mcfunction';
      break;
    case 'detailed': {
      // Format: <width>x<height>x<levels>maze-<ww#><wh#><pw#><wb"word">[-wceiling].mcfunction
      let suffix = '';
      if (addRoof) suffix = '-wceiling';
      filename = `${mazeGenerator.width}x${mazeGenerator.height}x${levels}maze-ww${wallSize}wh${wallHeight}pw${walkSize}wb${block}${suffix}.mcfunction`;
      break;
    }
    case 'custom':
      const customName = (document.querySelector('[data-for="customName"]') as HTMLInputElement)?.value?.trim();
      if (customName) {
        filename = customName.endsWith('.mcfunction') ? customName : `${customName}.mcfunction`;
      } else {
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

function switchDisplay(mode: 'schematic' | 'exact') {
  currentDisplayMode = mode;
  
  // Update button states
  const schematicBtn = document.getElementById('schematicBtn') as HTMLButtonElement;
  const exactBtn = document.getElementById('exactBtn') as HTMLButtonElement;
  
  if (schematicBtn) {
    schematicBtn.classList.toggle('active', mode === 'schematic');
  }
  if (exactBtn) {
    exactBtn.classList.toggle('active', mode === 'exact');
  }
  
  // Update legend visibility
  const schematicLegend = document.getElementById('schematic-legend');
  const exactLegend = document.getElementById('exact-legend');
  const legendNote = document.getElementById('legend-note');
  
  if (schematicLegend) {
    schematicLegend.style.display = mode === 'schematic' ? 'flex' : 'none';
  }
  if (exactLegend) {
    exactLegend.style.display = mode === 'exact' ? 'flex' : 'none';
  }
  if (legendNote) {
    legendNote.textContent = mode === 'schematic' 
      ? 'Note: Indicators show hole locations (center of cells). Ladders are placed on adjacent walls.'
      : 'Note: Each pixel represents exactly one Minecraft block. Hover over blocks for coordinate information.';
  }
  
  // Update display
  updateDisplay();
}

const drawDelay = debounce(draw, 500);

// Global debug function
(window as any).debugMaze = function() {
  if (mazeGenerator) {
    return mazeGenerator.debugMazeStructure(mazeGenerator.currentLevel);
  }
  return 'No maze generator available';
};

// Add this function near other UI helpers
function updateHoleOptionsUI() {
  const is3D = config.mazeGenerationMode === '3D';
  const holeOptionsWrapper = document.getElementById('holeOptionsWrapper');
  const holeOptionsNote = document.getElementById('holeOptionsNote');
  const generateHolesLabel = document.getElementById('generateHolesLabel');
  const holesPerLevelField = document.getElementById('holesPerLevelField');
  if (holeOptionsWrapper && holeOptionsNote && generateHolesLabel && holesPerLevelField) {
    if (is3D) {
      holeOptionsWrapper.style.display = 'none';
      holeOptionsNote.style.display = 'block';
    } else {
      holeOptionsWrapper.style.display = '';
      holeOptionsNote.style.display = 'none';
    }
  }
}

// Helper: returns true if the given wall direction for cell (x, y) is a boundary wall
function isBoundaryWall(x: number, y: number, dir: number, mazeWidth: number, mazeHeight: number, NORTH: number, SOUTH: number, WEST: number, EAST: number) {
  if (dir === NORTH && y === 0) return true;
  if (dir === SOUTH && y === mazeHeight - 1) return true;
  if (dir === WEST && x === 0) return true;
  if (dir === EAST && x === mazeWidth - 1) return true;
  return false;
}

// Helper: returns true if the block at the given coordinates is solid (can support a ladder)
function isSolidBlock(x: number, y: number, z: number, wallSize: number, wallHeight: number, walkSize: number): boolean {
  // This function checks if a wall block exists at (x, y, z) based on wall placement logic
  // 1. Check if it's a pillar (intersection of walls)
  if ((x % (walkSize + wallSize)) < wallSize && (z % (walkSize + wallSize)) < wallSize) {
    // Pillar: placed from floorY+1 to wallTopY
    const cellLevel = Math.floor(y / (1 + wallHeight));
    const floorY = cellLevel * (1 + wallHeight);
    const wallTopY = floorY + wallHeight;
    return y >= floorY + 1 && y <= wallTopY;
  }
  // 2. Check if it's a vertical wall (north-south)
  if ((x % (walkSize + wallSize)) < wallSize && (z % (walkSize + wallSize)) >= wallSize) {
    const cellLevel = Math.floor(y / (1 + wallHeight));
    const floorY = cellLevel * (1 + wallHeight);
    const wallTopY = floorY + wallHeight;
    return y >= floorY + 1 && y <= wallTopY;
  }
  // 3. Check if it's a horizontal wall (west-east)
  if ((x % (walkSize + wallSize)) >= wallSize && (z % (walkSize + wallSize)) < wallSize) {
    const cellLevel = Math.floor(y / (1 + wallHeight));
    const floorY = cellLevel * (1 + wallHeight);
    const wallTopY = floorY + wallHeight;
    return y >= floorY + 1 && y <= wallTopY;
  }
  // 4. Check if it's a border wall (outermost edge)
  // (This is a simplification; you may want to refine for entrances/exits)
  return false;
}

// Event listeners
document.addEventListener('change', validate);
document.addEventListener('input', (event) => {
  const target = event.target as HTMLElement;
  if (target.getAttribute('data-for') === 'customName') {
    updateCustomNamePreview();
  }
});

// Add event listener for addRoof checkbox to update the filename example
const addRoofCheckbox = document.querySelector('[data-for="addRoof"]');
if (addRoofCheckbox) {
  addRoofCheckbox.addEventListener('change', updateDetailedFilename);
}

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

// Add event listeners for visual aids toggles
window.addEventListener('DOMContentLoaded', () => {
  const blockLegendToggle = document.querySelector('[data-for="showBlockLegend"]') as HTMLInputElement;
  const chunkBordersToggle = document.querySelector('[data-for="showChunkBorders"]') as HTMLInputElement;
  const generateHolesToggle = document.querySelector('[data-for="generateHoles"]') as HTMLInputElement;
  const holesPerLevelInput = document.querySelector('[data-for="holesPerLevel"]') as HTMLInputElement;
  const generateLaddersToggle = document.querySelector('[data-for="generateLadders"]') as HTMLInputElement;
  
  if (blockLegendToggle) {
    blockLegendToggle.checked = config.showBlockLegend;
    blockLegendToggle.addEventListener('change', () => {
      config.showBlockLegend = blockLegendToggle.checked;
      updateDisplay();
    });
  }
  if (chunkBordersToggle) {
    chunkBordersToggle.checked = config.showChunkBorders;
    chunkBordersToggle.addEventListener('change', () => {
      config.showChunkBorders = chunkBordersToggle.checked;
      updateDisplay();
    });
  }
  if (generateHolesToggle) {
    generateHolesToggle.checked = config.generateHoles;
    generateHolesToggle.addEventListener('change', () => {
      config.generateHoles = generateHolesToggle.checked;
      updateDisplay();
    });
  }
  if (holesPerLevelInput) {
    holesPerLevelInput.value = config.holesPerLevel.toString();
    holesPerLevelInput.addEventListener('change', () => {
      config.holesPerLevel = parseInt(holesPerLevelInput.value) || 1;
      updateDisplay();
    });
  }
  if (generateLaddersToggle) {
    generateLaddersToggle.checked = config.generateLadders;
    generateLaddersToggle.addEventListener('change', () => {
      config.generateLadders = generateLaddersToggle.checked;
      updateDisplay();
    });
  }
  updateHoleOptionsUI();
  // Add event listeners for maze generation mode radio buttons
  const mazeGenerationModeRadios = document.querySelectorAll('input[name="mazeGenerationMode"]') as NodeListOf<HTMLInputElement>;
  mazeGenerationModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateHoleOptionsUI();
      regenerateMaze();
    });
  });
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
(window as any).switchDisplay = switchDisplay;
(window as any).refreshDisplay = refreshDisplay;
(window as any).regenerateMaze = regenerateMaze;
