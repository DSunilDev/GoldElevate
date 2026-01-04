#!/usr/bin/env node
/**
 * Script to find potential runtime errors related to .length access on undefined values
 */

const fs = require('fs');
const path = require('path');

const patterns = [
  {
    name: 'Destructured array with .length access',
    pattern: /const\s+\[(\w+)\]\s*=\s*await\s+query\([\s\S]{0,300}?if\s*\(\s*\1\.length/,
    description: 'Array destructuring from query result followed by .length check - may be undefined'
  },
  {
    name: 'Direct .length access without null check',
    pattern: /if\s*\(\s*(\w+)\.length\s*(===|!==|>|<|>=|<=)/,
    description: 'Direct .length access without checking if variable exists first'
  }
];

function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'build', 'dist', '.next', 'coverage'].includes(file)) {
        findJSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') && !file.endsWith('.test.js') && !file.endsWith('.spec.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function checkFile(filePath, patterns) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  patterns.forEach(({ name, pattern, description }) => {
    const matches = [...content.matchAll(new RegExp(pattern, 'g'))];
    matches.forEach(match => {
      const matchLine = content.substring(0, match.index).split('\n').length;
      issues.push({
        type: name,
        description,
        line: matchLine,
        match: match[0].substring(0, 200),
        context: lines.slice(Math.max(0, matchLine - 3), matchLine + 3).join('\n')
      });
    });
  });
  
  // Also check for specific problematic patterns
  const destructurePattern = /const\s+\[(\w+)\]\s*=\s*await\s+query\(/g;
  let destructureMatch;
  const destructuredVars = new Set();
  
  while ((destructureMatch = destructurePattern.exec(content)) !== null) {
    destructuredVars.add(destructureMatch[1]);
  }
  
  // Check if destructured variables are used with .length without proper checks
  destructuredVars.forEach(varName => {
    const lengthPattern = new RegExp(`\\b${varName}\\.length\\b`, 'g');
    const nullCheckPattern = new RegExp(`(${varName}\\s*&&\\s*${varName}\\.length|Array\\.isArray\\(${varName}\\)|${varName}\\s*\\?\\s*${varName}\\.length)`, 'g');
    
    const lengthMatches = [...content.matchAll(lengthPattern)];
    lengthMatches.forEach(match => {
      const matchLine = content.substring(0, match.index).split('\n').length;
      const beforeMatch = content.substring(Math.max(0, match.index - 200), match.index);
      
      // Check if there's a proper null check before this .length access
      const hasNullCheck = nullCheckPattern.test(beforeMatch);
      
      if (!hasNullCheck) {
        issues.push({
          type: 'Unsafe .length access on destructured variable',
          description: `Variable ${varName} is destructured from query result but .length is accessed without null/undefined check`,
          line: matchLine,
          match: match[0],
          context: lines.slice(Math.max(0, matchLine - 5), matchLine + 2).join('\n')
        });
      }
    });
  });
  
  return issues;
}

// Find all JS files
console.log('🔍 Finding potential runtime errors...\n');

const backendFiles = findJSFiles('./backend/routes');

console.log(`Checking ${backendFiles.length} route files...\n`);

const allIssues = [];

backendFiles.forEach(file => {
  const relativePath = path.relative(process.cwd(), file);
  const issues = checkFile(file, patterns);
  
  if (issues.length > 0) {
    allIssues.push({
      file: relativePath,
      issues
    });
  }
});

console.log('='.repeat(80));
console.log('📊 RESULTS');
console.log('='.repeat(80));

if (allIssues.length === 0) {
  console.log('✅ No obvious runtime error patterns found!\n');
} else {
  console.log(`\n⚠️  Found ${allIssues.length} file(s) with potential runtime issues:\n`);
  
  allIssues.forEach(({ file, issues }) => {
    console.log(`\n📄 ${file}`);
    console.log('─'.repeat(80));
    issues.forEach((issue, idx) => {
      console.log(`\n  ${idx + 1}. ${issue.type}`);
      console.log(`     Line ${issue.line}: ${issue.description}`);
      console.log(`     Context:\n${issue.context.split('\n').map(l => `       ${l}`).join('\n')}`);
    });
  });
}

// Write report
const reportPath = './RUNTIME_ERRORS_REPORT.txt';
const reportContent = 
  `Runtime Error Patterns Report - ${new Date().toISOString()}\n` +
  '='.repeat(80) + '\n\n' +
  `Total files checked: ${backendFiles.length}\n` +
  `Files with potential issues: ${allIssues.length}\n\n` +
  allIssues.map(({ file, issues }) => 
    `FILE: ${file}\n${'─'.repeat(80)}\n` +
    issues.map((issue, idx) => 
      `${idx + 1}. ${issue.type}\n   Line ${issue.line}: ${issue.description}\n   Context:\n${issue.context.split('\n').map(l => `   ${l}`).join('\n')}\n`
    ).join('\n')
  ).join('\n\n');

fs.writeFileSync(reportPath, reportContent);
console.log(`\n📄 Full report saved to: ${reportPath}`);

process.exit(allIssues.length > 0 ? 1 : 0);

