#!/usr/bin/env node
/**
 * Script to find all JavaScript syntax errors in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const errors = [];
const checkedFiles = [];

function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and common ignored directories
      if (!['node_modules', '.git', 'build', 'dist', '.next', 'coverage'].includes(file)) {
        findJSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') && !file.endsWith('.test.js') && !file.endsWith('.spec.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function checkSyntax(filePath) {
  try {
    execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error.stdout.toString() + error.stderr.toString();
    return { success: false, error: errorMessage };
  }
}

// Find all JS files
console.log('🔍 Finding JavaScript files...\n');

const backendFiles = findJSFiles('./backend');
const mobileAppFiles = findJSFiles('./mobile-app').filter(f => !f.includes('node_modules'));

const allFiles = [...backendFiles, ...mobileAppFiles];

console.log(`Found ${allFiles.length} JavaScript files to check\n`);

// Check each file
allFiles.forEach((file, index) => {
  const relativePath = path.relative(process.cwd(), file);
  process.stdout.write(`\rChecking [${index + 1}/${allFiles.length}]: ${relativePath}`);
  
  const result = checkSyntax(file);
  if (!result.success) {
    errors.push({
      file: relativePath,
      error: result.error
    });
  }
  checkedFiles.push({ file: relativePath, success: result.success });
});

console.log('\n\n' + '='.repeat(80));
console.log('📊 RESULTS');
console.log('='.repeat(80));

if (errors.length === 0) {
  console.log('✅ No syntax errors found!\n');
} else {
  console.log(`\n❌ Found ${errors.length} file(s) with syntax errors:\n`);
  
  errors.forEach((err, index) => {
    console.log(`${index + 1}. ${err.file}`);
    console.log('─'.repeat(80));
    console.log(err.error);
    console.log('\n');
  });
}

// Write results to file
const reportPath = './SYNTAX_ERRORS_REPORT.txt';
fs.writeFileSync(reportPath, 
  `Syntax Error Report - ${new Date().toISOString()}\n` +
  '='.repeat(80) + '\n\n' +
  `Total files checked: ${allFiles.length}\n` +
  `Files with errors: ${errors.length}\n\n` +
  errors.map((err, i) => 
    `${i + 1}. ${err.file}\n${'─'.repeat(80)}\n${err.error}\n`
  ).join('\n')
);

console.log(`\n📄 Full report saved to: ${reportPath}`);

process.exit(errors.length > 0 ? 1 : 0);

