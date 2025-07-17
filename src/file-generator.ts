// Config is declared globally in the main bundle
declare const config: any;
import { MultiLevelMaze } from './maze-generator'
import { isBoundaryWall, isSolidBlock } from './utils'

// File Generator - handles Minecraft command generation and file download
export class FileGenerator {
  private mazeGenerator: MultiLevelMaze | null = null;

  setMazeGenerator(generator: MultiLevelMaze | null) {
    this.mazeGenerator = generator;
  }

  generateCommand() {
    if (!this.mazeGenerator) return;

    let { wallSize, wallHeight, walkSize, block, levels, addRoof, generateHoles, holesPerLevel, generateLadders } = config;

    // Use user values directly
    // Each level: floor (1), walls (wallHeight), so total per level = 1 + wallHeight

    const commands: string[] = [
      `# Multi-Level Maze Generator\n`,
      `# Levels: ${levels}\n`,
      `# Dimensions: ${this.mazeGenerator.width}x${this.mazeGenerator.height}\n\n`
    ];

    // Calculate maze dimensions in blocks
    // For a maze of N cells, there are N+1 walls in each direction
    let lastWallTopY = 0;
    let totalWidth = 0;
    let totalHeight = 0;
    for (let level = 0; level < levels; level++) {
      commands.push(`# Level ${level + 1}\n`);
      const maze = this.mazeGenerator.mazes[level];
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
          if (x === mazeWidth || (x > 0 && (maze.grid[y][x - 1].walls & this.mazeGenerator.EAST) === 0)) {
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
          if (y === mazeHeight || (y > 0 && (maze.grid[y - 1][x].walls & this.mazeGenerator.SOUTH) === 0)) {
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
          const holeCells = this.mazeGenerator.getHoleCells(level, generateHoles, holesPerLevel);
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
        const maze = this.mazeGenerator.mazes[level];
        if (!maze) continue;
        
        const levelY = level * (1 + wallHeight);
        const floorY = levelY;
        
        const holeCells = this.mazeGenerator.getHoleCells(level, generateHoles, holesPerLevel);
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
          if (holeCell.hasUp && level < levels - 1) {
            commands.push(`# Up ladder at level ${level + 1}, cell (${x}, ${y})\n`);
            // Try each wall in order: N, S, W, E
            const wallOptions = [
              { dx: 0, dz: -1, dir: this.mazeGenerator.NORTH, facing: 3 }, // North wall, faces south (ladder at z-1)
              { dx: 0, dz: 1, dir: this.mazeGenerator.SOUTH, facing: 2 },  // South wall, faces north (ladder at z+1)
              { dx: -1, dz: 0, dir: this.mazeGenerator.WEST, facing: 5 },  // West wall, faces east (ladder at x-1)
              { dx: 1, dz: 0, dir: this.mazeGenerator.EAST, facing: 4 }    // East wall, faces west (ladder at x+1)
            ];
            let ladderPlaced = false;
            for (const wall of wallOptions) {
              // Only place ladders on internal walls (not boundary walls)
              // FIXED: Changed from !== 0 to === 0 to place ladders on SOLID walls (no passages)
              if ((maze.grid[y][x].walls & wall.dir) === 0 && !isBoundaryWall(x, y, wall.dir, maze.width, maze.height, this.mazeGenerator.NORTH, this.mazeGenerator.SOUTH, this.mazeGenerator.WEST, this.mazeGenerator.EAST)) {
                // Calculate the solid block position (the wall) - using the same logic as wall placement
                let wallX, wallZ;
                if (wall.dir === this.mazeGenerator.NORTH || wall.dir === this.mazeGenerator.SOUTH) {
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
                  commands.push(`# Ladder placed adjacent to ${wall.dx !== 0 ? 'East/West' : 'North/South'} wall at coordinates (~${ladderX}, ~${ladderStartY}-${ladderEndY}, ~${ladderZ}), facing ${wall.facing} (up ladder, ${ladderCount} rungs)\n`);
                  ladderPlaced = true;
                  break;
                }
              }
            }
            if (!ladderPlaced) {
              // FALLBACK STRATEGY: Try corner placement or create a temporary wall
              commands.push(`# WARNING: No internal wall found for up ladder at cell (${x}, ${y}) on level ${level + 1}\n`);
              commands.push(`# Attempting fallback placement strategies...\n`);
              
              const fallbackResult = this.mazeGenerator.attemptFallbackLadderPlacement(
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
              { dx: 0, dz: -1, dir: this.mazeGenerator.NORTH, facing: 3 }, // North wall, faces south (ladder at z-1)
              { dx: 0, dz: 1, dir: this.mazeGenerator.SOUTH, facing: 2 },  // South wall, faces north (ladder at z+1)
              { dx: -1, dz: 0, dir: this.mazeGenerator.WEST, facing: 5 },  // West wall, faces east (ladder at x-1)
              { dx: 1, dz: 0, dir: this.mazeGenerator.EAST, facing: 4 }    // East wall, faces west (ladder at x+1)
            ];
            let ladderPlaced = false;
            for (const wall of wallOptions) {
              // FIXED: Changed from !== 0 to === 0 to place ladders on SOLID walls (no passages)
              if ((maze.grid[y][x].walls & wall.dir) === 0 && !isBoundaryWall(x, y, wall.dir, maze.width, maze.height, this.mazeGenerator.NORTH, this.mazeGenerator.SOUTH, this.mazeGenerator.WEST, this.mazeGenerator.EAST)) {
                // Calculate the solid block position (the wall) - using the same logic as wall placement
                let wallX, wallZ;
                if (wall.dir === this.mazeGenerator.NORTH || wall.dir === this.mazeGenerator.SOUTH) {
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
                
                // DOWN LADDER: Goes from current floor down to floor below
                // Current floor is at floorY, floor below is at (floorY - (1 + wallHeight))
                const ladderStartY = floorY - wallHeight; // Start at floor below
                const ladderEndY = floorY; // End at current floor (includes hole)
                let anyLadderPlaced = false;
                for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
                  // 3D check: only place ladder if wall exists at this Y
                  if (isSolidBlock(wallX, ladderY, wallZ, wallSize, wallHeight, walkSize)) {
                    commands.push(`setblock ~${ladderX} ~${ladderY} ~${ladderZ} ladder ${wall.facing}\n`);
                    anyLadderPlaced = true;
                  }
                }
                if (anyLadderPlaced) {
                  const ladderCount = ladderEndY - ladderStartY + 1;
                  commands.push(`# Ladder placed adjacent to ${wall.dx !== 0 ? 'East/West' : 'North/South'} wall at coordinates (~${ladderX}, ~${ladderStartY}-${ladderEndY}, ~${ladderZ}), facing ${wall.facing} (down ladder, ${ladderCount} rungs)\n`);
                  ladderPlaced = true;
                  break;
                }
              }
            }
            if (!ladderPlaced) {
              // FALLBACK STRATEGY: Try corner placement or create a temporary wall
              commands.push(`# WARNING: No internal wall found for down ladder at cell (${x}, ${y}) on level ${level + 1}\n`);
              commands.push(`# Attempting fallback placement strategies...\n`);
              
              const fallbackResult = this.mazeGenerator.attemptFallbackLadderPlacement(
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
        filename = `${this.mazeGenerator.width}x${this.mazeGenerator.height}x${levels}maze-ww${wallSize}wh${wallHeight}pw${walkSize}wb${block}${suffix}.mcfunction`;
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

    // Download the file
    this.downloadFile(commands, filename);
  }

  private downloadFile(commands: string[], filename: string) {
    const element = document.createElement('a');
    const commandData = new Blob(commands, { type: 'text/plain' });
    element.href = URL.createObjectURL(commandData);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}