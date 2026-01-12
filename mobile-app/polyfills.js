// Polyfill for require() if not available
// This ensures require is available in the global scope for dependencies that need it
if (typeof global !== 'undefined' && typeof global.require === 'undefined') {
  // In React Native, require is provided by the runtime, but we ensure it's available
  // This is mainly for compatibility with some dependencies
  if (typeof require !== 'undefined') {
    global.require = require;
  }
}

