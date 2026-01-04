// Quick error check
try {
  const fs = require('fs');
  const files = [
    'App.js',
    'index.js',
    'src/config/api.js',
    'app.config.js'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
} catch (e) {
  console.log('Error:', e.message);
}
