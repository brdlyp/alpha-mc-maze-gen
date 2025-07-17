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
    
    // Generate maze based on mode
    if (config.mazeGenerationMode === '2D') {
      for (let z = 0; z < this.levels; z++) {
        this.generate2DLevel(z);
      }
    } else {
      // Generate maze using depth-first search (original 3D method)
      this.generate3DMaze();
    }
    
    // Create individual maze objects for each level
    this.createLevelMazes();

    // After mazes are created, punch holes for 2D mode
    if (config.mazeGenerationMode === '2D' && config.generateHoles && this.levels > 1) {
      const { holesPerLevel } = config;

      // Create a list of all possible cell coordinates
      const allCells: Array<{x: number, y: number}> = [];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          // Exclude border cells from being chosen for holes to avoid issues with entrance/exit
          if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
            allCells.push({ x, y });
          }
        }
      }

      // Shuffle the list to randomize hole placement
      for (let i = allCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
      }

      // For each level-to-level connection, pick 'holesPerLevel' unique locations
      for (let z = 0; z < this.levels - 1; z++) {
        let holesOnThisLevel = 0;
        while (holesOnThisLevel < holesPerLevel && allCells.length > 0) {
          const holeLocation = allCells.pop(); // Take a unique location
          if (holeLocation) {
            const { x, y } = holeLocation;
            // Punch hole between level z and z+1
            this.mazes[z].grid[y][x].hasUp = true;
            this.mazes[z+1].grid[y][x].hasDown = true;
            holesOnThisLevel++;
          }
        }
      }
    }
  }
  
  generate3DMaze() {
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
  
  generate2DLevel(level: number) {
    // Use Growing Tree algorithm for a single level
    const cells: Array<{x: number, y: number}> = [];
    const visited = new Set<string>();

    const startX = 0;
    const startY = 0;

    cells.push({x: startX, y: startY});
    visited.add(`${startX},${startY}`);

    const directions2D = [this.NORTH, this.SOUTH, this.EAST, this.WEST];

    while (cells.length > 0) {
      const useRandom = Math.random() < 0.5;
      const index = useRandom ? Math.floor(Math.random() * cells.length) : cells.length - 1;

      const current = cells[index];

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
        cells.splice(index, 1);
      } else {
        const nextNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        const { x: nextX, y: nextY, dir: direction } = nextNeighbor;

        // Carve passage
        this.grid[level][current.y][current.x] |= direction;
        this.grid[level][nextY][nextX] |= this.opposite[direction];

        visited.add(`${nextX},${nextY}`);
        cells.push({x: nextX, y: nextY});
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