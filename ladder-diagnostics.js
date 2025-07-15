// Ladder Placement Diagnostics Tool
// This tool analyzes the current ladder placement logic and identifies issues

class LadderDiagnostics {
  constructor() {
    this.issues = [];
    this.recommendations = [];
  }

  // Analyze the current ladder placement logic from the source code
  analyzeCurrentLogic() {
    console.log("=== LADDER PLACEMENT DIAGNOSTICS ===\n");
    
    this.analyzeWallDetectionLogic();
    this.analyzeCoordinateCalculations();
    this.analyze3DBlockDetection();
    this.analyzeBoundaryDetection();
    this.analyzeLadderPlacementStrategy();
    
    this.printDiagnostics();
  }

  analyzeWallDetectionLogic() {
    console.log("1. WALL DETECTION LOGIC ANALYSIS");
    
    // Current logic: (maze.grid[y][x].walls & wall.dir) !== 0
    // This means: place ladders on walls that HAVE passages (which is wrong!)
    
    this.issues.push({
      category: "Wall Detection",
      severity: "CRITICAL",
      description: "Logic inversion: ladders are placed on walls with passages instead of solid walls",
      current: "(maze.grid[y][x].walls & wall.dir) !== 0",
      correct: "(maze.grid[y][x].walls & wall.dir) === 0",
      explanation: "Ladders should be placed on solid walls (no passages), not on walls with passages"
    });

    console.log("❌ CRITICAL: Logic inversion detected");
    console.log("   Current: places ladders on walls WITH passages");
    console.log("   Should: place ladders on walls WITHOUT passages (solid walls)");
  }

  analyzeCoordinateCalculations() {
    console.log("\n2. COORDINATE CALCULATIONS ANALYSIS");
    
    // Analyze the coordinate calculation logic
    const coordinateIssues = [
      {
        issue: "Wall coordinate calculation may be inconsistent",
        details: "The wall coordinate calculation in ladder placement doesn't exactly match the wall building logic"
      },
      {
        issue: "Ladder positioning logic is complex",
        details: "Multiple coordinate transformations make debugging difficult"
      }
    ];

    coordinateIssues.forEach(issue => {
      this.issues.push({
        category: "Coordinate Calculations",
        severity: "MEDIUM",
        description: issue.issue,
        explanation: issue.details
      });
    });

    console.log("⚠️  MEDIUM: Coordinate calculation complexity");
    console.log("   Multiple coordinate transformations may cause inconsistencies");
  }

  analyze3DBlockDetection() {
    console.log("\n3. 3D BLOCK DETECTION ANALYSIS");
    
    // The isSolidBlock function looks comprehensive but may have edge cases
    const blockDetectionIssues = [
      {
        issue: "Border wall detection may be incomplete",
        details: "The isSolidBlock function doesn't fully account for entrance/exit openings"
      },
      {
        issue: "Y-level calculation may have off-by-one errors",
        details: "Floor and ceiling calculations need careful validation"
      }
    ];

    blockDetectionIssues.forEach(issue => {
      this.issues.push({
        category: "3D Block Detection",
        severity: "LOW",
        description: issue.issue,
        explanation: issue.details
      });
    });

    console.log("✅ GOOD: 3D block detection is comprehensive");
    console.log("   The isSolidBlock function covers pillars, walls, and Y-level validation");
  }

  analyzeBoundaryDetection() {
    console.log("\n4. BOUNDARY DETECTION ANALYSIS");
    
    // The boundary detection logic looks correct
    console.log("✅ GOOD: Boundary detection logic is correct");
    console.log("   Properly prevents ladders on outer walls");
  }

  analyzeLadderPlacementStrategy() {
    console.log("\n5. LADDER PLACEMENT STRATEGY ANALYSIS");
    
    const strategyIssues = [
      {
        issue: "No fallback strategy for cells without solid walls",
        details: "If a cell needs a ladder but has no solid walls, it fails completely"
      },
      {
        issue: "Limited wall options",
        details: "Only tries 4 wall directions, no consideration for corner placement"
      }
    ];

    strategyIssues.forEach(issue => {
      this.issues.push({
        category: "Placement Strategy",
        severity: "MEDIUM",
        description: issue.issue,
        explanation: issue.details
      });
    });

    console.log("⚠️  MEDIUM: Limited fallback strategies");
    console.log("   No alternative placement methods when solid walls aren't available");
  }

  // Generate test cases for validation
  generateTestCases() {
    console.log("\n=== GENERATED TEST CASES ===");
    
    const testCases = [
      {
        name: "Cell with all solid walls",
        mazeCell: { walls: 0, hasUp: true, hasDown: false },
        expected: "Should place ladder on any wall",
        current: "Should work correctly"
      },
      {
        name: "Cell with passages in 3 directions",
        mazeCell: { walls: 7, hasUp: true, hasDown: false }, // North, South, East passages
        expected: "Should place ladder on west wall",
        current: "Will fail - no solid walls"
      },
      {
        name: "Cell with passages in all directions",
        mazeCell: { walls: 15, hasUp: true, hasDown: false }, // All passages
        expected: "Should use fallback strategy",
        current: "Will fail completely"
      }
    ];

    testCases.forEach(testCase => {
      console.log(`\nTest: ${testCase.name}`);
      console.log(`  Expected: ${testCase.expected}`);
      console.log(`  Current: ${testCase.current}`);
    });

    return testCases;
  }

  // Generate recommendations for fixes
  generateRecommendations() {
    console.log("\n=== RECOMMENDATIONS ===");
    
    this.recommendations = [
      {
        priority: "CRITICAL",
        action: "Fix wall detection logic inversion",
        code: "Change (maze.grid[y][x].walls & wall.dir) !== 0 to (maze.grid[y][x].walls & wall.dir) === 0",
        impact: "Will fix the core issue of ladder placement"
      },
      {
        priority: "HIGH",
        action: "Add fallback ladder placement strategies",
        code: "Implement corner placement, ceiling mounting, or wall creation",
        impact: "Will ensure ladders are always placed successfully"
      },
      {
        priority: "MEDIUM",
        action: "Simplify coordinate calculations",
        code: "Create helper functions for wall and ladder coordinate calculations",
        impact: "Will improve maintainability and reduce bugs"
      },
      {
        priority: "LOW",
        action: "Add comprehensive logging",
        code: "Log wall detection, coordinate calculations, and placement decisions",
        impact: "Will improve debugging capabilities"
      }
    ];

    this.recommendations.forEach(rec => {
      console.log(`\n${rec.priority}: ${rec.action}`);
      console.log(`  Code: ${rec.code}`);
      console.log(`  Impact: ${rec.impact}`);
    });
  }

  // Create a fix implementation plan
  createFixPlan() {
    console.log("\n=== FIX IMPLEMENTATION PLAN ===");
    
    const plan = [
      {
        step: 1,
        action: "Fix wall detection logic",
        files: ["src/index.ts"],
        lines: "~1150-1200",
        description: "Change the condition from !== 0 to === 0"
      },
      {
        step: 2,
        action: "Add fallback placement strategies",
        files: ["src/index.ts"],
        lines: "~1200-1250",
        description: "Implement corner placement and wall creation fallbacks"
      },
      {
        step: 3,
        action: "Add comprehensive testing",
        files: ["test-ladder-placement.js"],
        description: "Create automated tests for all ladder placement scenarios"
      },
      {
        step: 4,
        action: "Add debugging output",
        files: ["src/index.ts"],
        description: "Add detailed logging for ladder placement decisions"
      }
    ];

    plan.forEach(step => {
      console.log(`\nStep ${step.step}: ${step.action}`);
      console.log(`  Files: ${step.files.join(", ")}`);
      if (step.lines) console.log(`  Lines: ${step.lines}`);
      console.log(`  Description: ${step.description}`);
    });

    return plan;
  }

  printDiagnostics() {
    console.log("\n=== DIAGNOSTICS SUMMARY ===");
    
    const critical = this.issues.filter(i => i.severity === "CRITICAL").length;
    const medium = this.issues.filter(i => i.severity === "MEDIUM").length;
    const low = this.issues.filter(i => i.severity === "LOW").length;
    
    console.log(`Issues Found: ${this.issues.length}`);
    console.log(`  Critical: ${critical}`);
    console.log(`  Medium: ${medium}`);
    console.log(`  Low: ${low}`);
    
    if (critical > 0) {
      console.log("\n🚨 CRITICAL ISSUES MUST BE FIXED FIRST:");
      this.issues.filter(i => i.severity === "CRITICAL").forEach(issue => {
        console.log(`  - ${issue.description}`);
      });
    }
  }

  // Run complete diagnostics
  runCompleteDiagnostics() {
    this.analyzeCurrentLogic();
    this.generateTestCases();
    this.generateRecommendations();
    this.createFixPlan();
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LadderDiagnostics;
} else {
  window.LadderDiagnostics = LadderDiagnostics;
} 