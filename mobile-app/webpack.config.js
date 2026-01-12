const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Fix MIME type issues for assets - ensure proper handling of image files
  if (config.module && config.module.rules) {
    // Add rule for image assets with proper MIME types
    config.module.rules.push({
      test: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
      type: 'asset/resource',
    });
  }
  
  return config;
};
