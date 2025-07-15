// Ladder Placement Testing Framework
// This script will help diagnose and test ladder placement logic

class LadderPlacementTester {
  constructor() {
    this.testResults = [];
    this.debugOutput = [];
  }

  // Test 1: Validate wall detection logic
  testWallDetection() {
    console.log("=== TEST 1: Wall Detection Logic ===");
    
    // Test cases for different wall configurations
    const testCases = [
      { name: "Solid North Wall", walls: 0, expected: { north: true, south: false, east: false, west: false } },
      { name: "Passage North", walls: 1, expected: { north: false, south: false, east: false, west: false } },
      { name: "Solid East Wall", walls: 0, expected: { north: true, south: false, east: true, west: false } },
      { name: "Multiple Passages", walls: 7, expected: { north: false, south: false, east: false, west: false } }
    ];

    testCases.forEach(testCase => {
      const result = this.validateWallLogic(testCase);
      this.testResults.push(result);
    });
  }

  // Test 2: Validate coordinate calculations
  testCoordinateCalculations() {
    console.log("=== TEST 2: Coordinate Calculations ===");
    
    const config = { wallSize: 1, walkSize: 2, wallHeight: 3 };
    const testCases = [
      { cellX: 0, cellY: 0, direction: 'NORTH', expected: { wallX: 1, wallZ: 0, ladderX: 1, ladderZ: -1 } },
      { cellX: 0, cellY: 0, direction: 'SOUTH', expected: { wallX: 1, wallZ: 0, ladderX: 1, ladderZ: 1 } },
      { cellX: 0, cellY: 0, direction: 'EAST', expected: { wallX: 0, wallZ: 1, ladderX: 1, ladderZ: 1 } },
      { cellX: 0, cellY: 0, direction: 'WEST', expected: { wallX: 0, wallZ: 1, ladderX: -1, ladderZ: 1 } }
    ];

    testCases.forEach(testCase => {
      const result = this.validateCoordinateLogic(testCase, config);
      this.testResults.push(result);
    });
  }

  // Test 3: Validate 3D block detection
  test3DBlockDetection() {
    console.log("=== TEST 3: 3D Block Detection ===");
    
    const config = { wallSize: 1, walkSize: 2, wallHeight: 3 };
    const testCases = [
      { x: 1, y: 1, z: 0, expected: true, description: "Pillar at intersection" },
      { x: 1, y: 1, z: 1, expected: true, description: "Horizontal wall" },
      { x: 0, y: 1, z: 1, expected: true, description: "Vertical wall" },
      { x: 2, y: 1, z: 2, expected: false, description: "Path area" },
      { x: 1, y: 0, z: 1, expected: false, description: "Below floor" },
      { x: 1, y: 5, z: 1, expected: false, description: "Above wall height" }
    ];

    testCases.forEach(testCase => {
      const result = this.validate3DBlockLogic(testCase, config);
      this.testResults.push(result);
    });
  }

  // Test 4: Generate sample maze and analyze ladder placement
  testSampleMaze() {
    console.log("=== TEST 4: Sample Maze Analysis ===");
    
    // Create a simple 3x3 maze for testing
    const sampleMaze = this.generateSampleMaze();
    const analysis = this.analyzeMazeForLadderPlacement(sampleMaze);
    
    this.testResults.push({
      test: "Sample Maze Analysis",
      passed: analysis.totalHoles > 0,
      details: analysis
    });
  }

  // Helper methods
  validateWallLogic(testCase) {
    const NORTH = 1, SOUTH = 2, EAST = 4, WEST = 8;
    const walls = testCase.walls;
    
    const actual = {
      north: (walls & NORTH) === 0,
      south: (walls & SOUTH) === 0,
      east: (walls & EAST) === 0,
      west: (walls & WEST) === 0
    };

    const passed = JSON.stringify(actual) === JSON.stringify(testCase.expected);
    
    return {
      test: testCase.name,
      passed: passed,
      expected: testCase.expected,
      actual: actual
    };
  }

  validateCoordinateLogic(testCase, config) {
    const { cellX, cellY, direction, expected } = testCase;
    const { wallSize, walkSize } = config;
    
    let wallX, wallZ, ladderX, ladderZ;
    
    if (direction === 'NORTH' || direction === 'SOUTH') {
      wallX = cellX * (walkSize + wallSize) + wallSize;
      wallZ = cellY * (walkSize + wallSize);
      ladderX = wallX;
      ladderZ = wallZ + (direction === 'NORTH' ? -1 : 1);
    } else {
      wallX = cellX * (walkSize + wallSize);
      wallZ = cellY * (walkSize + wallSize) + wallSize;
      ladderX = wallX + (direction === 'EAST' ? 1 : -1);
      ladderZ = wallZ;
    }
    
    const actual = { wallX, wallZ, ladderX, ladderZ };
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    
    return {
      test: `Coordinate calculation for ${direction}`,
      passed: passed,
      expected: expected,
      actual: actual
    };
  }

  validate3DBlockLogic(testCase, config) {
    const { x, y, z, expected, description } = testCase;
    const { wallSize, walkSize, wallHeight } = config;
    
    // Simplified isSolidBlock logic for testing
    let isSolid = false;
    
    // Check if it's a pillar (intersection of walls)
    if ((x % (walkSize + wallSize)) < wallSize && (z % (walkSize + wallSize)) < wallSize) {
      const cellLevel = Math.floor(y / (1 + wallHeight));
      const floorY = cellLevel * (1 + wallHeight);
      const wallTopY = floorY + wallHeight;
      isSolid = y >= floorY + 1 && y <= wallTopY;
    }
    // Check if it's a vertical wall (north-south)
    else if ((x % (walkSize + wallSize)) < wallSize && (z % (walkSize + wallSize)) >= wallSize) {
      const cellLevel = Math.floor(y / (1 + wallHeight));
      const floorY = cellLevel * (1 + wallHeight);
      const wallTopY = floorY + wallHeight;
      isSolid = y >= floorY + 1 && y <= wallTopY;
    }
    // Check if it's a horizontal wall (west-east)
    else if ((x % (walkSize + wallSize)) >= wallSize && (z % (walkSize + wallSize)) < wallSize) {
      const cellLevel = Math.floor(y / (1 + wallHeight));
      const floorY = cellLevel * (1 + wallHeight);
      const wallTopY = floorY + wallHeight;
      isSolid = y >= floorY + 1 && y <= wallTopY;
    }
    
    return {
      test: `3D Block Detection: ${description}`,
      passed: isSolid === expected,
      expected: expected,
      actual: isSolid,
      coordinates: { x, y, z }
    };
  }

  generateSampleMaze() {
    // Create a simple 3x3 maze for testing
    return {
      width: 3,
      height: 3,
      levels: 2,
      grid: [
        // Level 0
        [
          { walls: 0, hasUp: true, hasDown: false },   // (0,0) - solid walls, has up passage
          { walls: 2, hasUp: false, hasDown: false },  // (0,1) - south passage
          { walls: 0, hasUp: false, hasDown: false }   // (0,2) - solid walls
        ],
        [
          { walls: 4, hasUp: false, hasDown: false },  // (1,0) - east passage
          { walls: 6, hasUp: false, hasDown: false },  // (1,1) - south and east passages
          { walls: 4, hasUp: false, hasDown: false }   // (1,2) - east passage
        ],
        [
          { walls: 0, hasUp: false, hasDown: true },   // (2,0) - solid walls, has down passage
          { walls: 2, hasUp: false, hasDown: false },  // (2,1) - south passage
          { walls: 0, hasUp: false, hasDown: false }   // (2,2) - solid walls
        ]
      ]
    };
  }

  analyzeMazeForLadderPlacement(maze) {
    const analysis = {
      totalCells: maze.width * maze.height,
      cellsWithUpPassages: 0,
      cellsWithDownPassages: 0,
      cellsWithSolidWalls: 0,
      potentialLadderLocations: [],
      issues: []
    };

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[y][x];
        
        if (cell.hasUp) analysis.cellsWithUpPassages++;
        if (cell.hasDown) analysis.cellsWithDownPassages++;
        
        // Count solid walls (no passages)
        const solidWalls = this.countSolidWalls(cell.walls);
        if (solidWalls > 0) {
          analysis.cellsWithSolidWalls++;
          analysis.potentialLadderLocations.push({
            x, y,
            solidWalls,
            hasUp: cell.hasUp,
            hasDown: cell.hasDown
          });
        }
        
        // Check for potential issues
        if ((cell.hasUp || cell.hasDown) && solidWalls === 0) {
          analysis.issues.push(`Cell (${x},${y}) needs ladder but has no solid walls`);
        }
      }
    }

    return analysis;
  }

  countSolidWalls(walls) {
    const NORTH = 1, SOUTH = 2, EAST = 4, WEST = 8;
    let count = 0;
    if ((walls & NORTH) === 0) count++;
    if ((walls & SOUTH) === 0) count++;
    if ((walls & EAST) === 0) count++;
    if ((walls & WEST) === 0) count++;
    return count;
  }

  // Run all tests
  runAllTests() {
    console.log("Starting Ladder Placement Testing Framework...\n");
    
    this.testWallDetection();
    this.testCoordinateCalculations();
    this.test3DBlockDetection();
    this.testSampleMaze();
    
    this.printResults();
  }

  printResults() {
    console.log("\n=== TEST RESULTS SUMMARY ===");
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`Tests Passed: ${passed}/${total}`);
    console.log(`Success Rate: ${((passed/total)*100).toFixed(1)}%`);
    
    console.log("\n=== DETAILED RESULTS ===");
    this.testResults.forEach(result => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} ${result.test}`);
      if (!result.passed && result.details) {
        console.log(`  Details:`, result.details);
      }
    });
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LadderPlacementTester;
} else {
  window.LadderPlacementTester = LadderPlacementTester;
} 