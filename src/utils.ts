// Config is declared globally in the main bundle
declare const config: any;

// Helper: returns true if the given wall direction for cell (x, y) is a boundary wall
export function isBoundaryWall(x: number, y: number, dir: number, mazeWidth: number, mazeHeight: number, NORTH: number, SOUTH: number, WEST: number, EAST: number) {
  if (dir === NORTH && y === 0) return true;
  if (dir === SOUTH && y === mazeHeight - 1) return true;
  if (dir === WEST && x === 0) return true;
  if (dir === EAST && x === mazeWidth - 1) return true;
  return false;
}

// Helper: checks if a given block coordinate corresponds to a solid wall
export function isSolidBlock(
    blockX: number, 
    _blockY: number, 
    blockZ: number,
    maze: any,
    wallSize: number,
    walkSize: number,
    SOUTH: number,
    EAST: number
): boolean {
    const totalCellSize = walkSize + wallSize;

    // Determine the cell coordinates from the block coordinates
    const cellX = Math.floor(blockX / totalCellSize);
    const cellY = Math.floor(blockZ / totalCellSize);

    // Check if the coordinates fall within the grid
    if (cellY >= 0 && cellY < maze.height && cellX >= 0 && cellX < maze.width) {
        const xInCell = blockX % totalCellSize;
        const zInCell = blockZ % totalCellSize;

        // Check if the block is part of a pillar
        if (xInCell < wallSize && zInCell < wallSize) {
            return true;
        }

        // Check for horizontal walls (along Z axis)
        if (zInCell < wallSize) {
            if (cellY > 0) {
                // Wall is south of the cell above it
                return (maze.grid[cellY - 1][cellX].walls & SOUTH) === 0;
            }
            return true; // Top boundary wall
        }

        // Check for vertical walls (along X axis)
        if (xInCell < wallSize) {
            if (cellX > 0) {
                // Wall is east of the cell to the left
                return (maze.grid[cellY][cellX - 1].walls & EAST) === 0;
            }
            return true; // Left boundary wall
        }
    }

    // Check for the outer boundary walls
    const totalWidth = maze.width * walkSize + (maze.width + 1) * wallSize;
    const totalHeight = maze.height * walkSize + (maze.height + 1) * wallSize;

    if (blockX >= totalWidth - wallSize || blockZ >= totalHeight - wallSize) {
        return true;
    }

    return false;
}