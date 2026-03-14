/**
 * Helper function to check if performance tests should be skipped based on an environment variable.
 *
 * @returns {boolean} - Returns true if performance tests are disabled, false otherwise.
 */
export function performanceTestsAreDisabled() {
  return process.env.RUN_PERFORMANCE_TESTS === "false";
}
