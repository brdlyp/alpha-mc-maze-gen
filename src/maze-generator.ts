// Config is declared globally in the main bundle
declare const config: any;

// Multi-Level Maze Generator
export class MultiLevelMaze {
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
    
    // Always generate 2D mazes
    for (let i = 0; i < this.levels; i++) {
        this.generate2DLevel(i);
    }
    
    // Generate holes before creating the level mazes
    if (config.generateHoles && this.levels > 1) {
        for (let i = 0; i < this.levels - 1; i++) {
            const numHoles = config.holesPerLevel;
            for (let j = 0; j < numHoles; j++) {
                const x = Math.floor(Math.random() * this.width);
                const y = Math.floor(Math.random() * this.height);
                this.grid[i][y][x] |= this.UP;
                this.grid[i + 1][y][x] |= this.DOWN;
            }
        }
    }
    
    // Create individual maze objects for each level
    this.createLevelMazes();
  }
  
  generate2DLevel(level: number) {
    const stack: { x: number, y: number }[] = [];
    const visited = new Set<string>();

    const startX = 0;
    const startY = 0;

    stack.push({x: startX, y: startY});
    visited.add(`${startX},${startY}`);

    const directions2D = [this.NORTH, this.SOUTH, this.EAST, this.WEST];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];

      // Get unvisited neighbors for 2D
      const neighbors = [];
      for (const dir of directions2D) {
        const nx = current.x + this.dx[dir];
        const ny = current.y + this.dy[dir];

        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && !visited.has(`${nx},${ny}`)) {
          neighbors.push({x: nx, y: ny, dir: dir});
        }
      }

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const nextNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        const { x: nextX, y: nextY, dir: direction } = nextNeighbor;

        // Carve passage
        this.grid[level][current.y][current.x] |= direction;
        this.grid[level][nextY][nextX] |= this.opposite[direction];

        visited.add(`${nextX},${nextY}`);
        stack.push({x: nextX, y: nextY});
      }
    }

    // For 2D mazes, we want standard entrance/exit on each level
    // Entrance: west wall of top-left cell
    // Exit: east wall of bottom-right cell
    this.grid[level][0][0] |= this.WEST;
    this.grid[level][this.height - 1][this.width - 1] |= this.EAST;

    // Ensure the exit cell is connected to the maze by forcing a path from a neighboring cell
    // Connect the bottom-right cell to its west neighbor if possible
    if (this.width > 1) {
      this.grid[level][this.height - 1][this.width - 2] |= this.EAST;  // West neighbor gets east passage
      this.grid[level][this.height - 1][this.width - 1] |= this.WEST;  // Exit cell gets west passage
    }
    // Also connect to north neighbor if possible
    if (this.height > 1) {
      this.grid[level][this.height - 2][this.width - 1] |= this.SOUTH;  // North neighbor gets south passage
      this.grid[level][this.height - 1][this.width - 1] |= this.NORTH;  // Exit cell gets north passage
    }
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

  // Shared function to determine which cells should have holes/ladders
  getHoleCells(levelIndex: number, generateHoles: boolean, _holesPerLevel: number) {
    const holeCells: Array<{x: number, y: number, hasUp: boolean, hasDown: boolean}> = [];
    if (!generateHoles) return holeCells;
    const maze = this.mazes[levelIndex];
    if (!maze) return holeCells;

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
    _maze: any, commands: string[]
  ): { method: string, success: boolean } | null {
    
    // This is the only fallback, as others were unreliable.
    // It creates a support pillar and places the ladder on it.

    const centerX = x * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
    const centerZ = y * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);

    // Pillar to the SOUTH of the ladder. Ladder faces NORTH (data=2)
    const pillarX = centerX;
    const pillarZ = centerZ + 1;

    let pillarBottomY, pillarTopY, ladderBottomY, ladderTopY;

    if (direction === 'up') {
        // Ladder is in current level's space
        pillarBottomY = floorY + 1;
        pillarTopY = floorY + wallHeight;
        ladderBottomY = floorY + 1;
        ladderTopY = floorY + wallHeight;
    } else { // direction === 'down'
        // Ladder is in level below's space
        pillarBottomY = floorY - wallHeight;
        pillarTopY = floorY - 1; // up to block below floor
        ladderBottomY = floorY - wallHeight;
        ladderTopY = floorY; // includes air block of hole
    }
    
    // Build the pillar
    commands.push(`# FALLBACK: Creating support pillar for ${direction} ladder at (${x},${y}) on level ${level}.\n`);
    commands.push(`fill ~${pillarX} ~${pillarBottomY} ~${pillarZ} ~${pillarX} ~${pillarTopY} ~${pillarZ} stone\n`);

    // Place the ladder
    commands.push(`# FALLBACK: Placing ${direction} ladder at (${x},${y}) on level ${level}.\n`);
    commands.push(`fill ~${centerX} ~${ladderBottomY} ~${centerZ} ~${centerX} ~${ladderTopY} ~${centerZ} ladder 2\n`);
    
    return { method: 'Pillar Creation', success: true };
  }

  attemptCornerPlacement(
    _x: number, _y: number, _level: number, _direction: 'up' | 'down',
    _wallSize: number, _walkSize: number, _wallHeight: number, _floorY: number,
    _commands: string[]
  ): { method: string, success: boolean } | null {
    // Deprecated: Unreliable and buggy.
    return null;
  }

  attemptWallCreation(
    _x: number, _y: number, _level: number, _direction: 'up' | 'down',
    _wallSize: number, _walkSize: number, _wallHeight: number, _floorY: number,
    _maze: any, _commands: string[]
  ): { method: string, success: boolean } | null {
    // Deprecated: Unreliable and buggy.
    return null;
  }

  attemptCeilingMounting(
    _x: number, _y: number, _level: number, _direction: 'up' | 'down',
    _wallSize: number, _walkSize: number, _wallHeight: number, _floorY: number,
    _commands: string[]
  ): { method: string, success: boolean } | null {
    // Deprecated: Unreliable and buggy.
    return null;
  }
}