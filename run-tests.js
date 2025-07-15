// Simple test runner for ladder placement test suite
import LadderPlacementTestSuite from './test-suite.js';

console.log("🚀 Starting Ladder Placement Test Suite...\n");

const testSuite = new LadderPlacementTestSuite();
testSuite.runAllTests().then(() => {
  console.log("\n✅ Test suite completed!");
}).catch(error => {
  console.error("❌ Test suite failed:", error);
}); 