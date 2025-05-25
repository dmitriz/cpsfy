const fs = require('fs');
const path = require('path');

// Get all test files
const testDir = path.join(__dirname, 'test');
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'));

// Update each file
let updatedCount = 0;
testFiles.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the import
  const newContent = content.replace(
    `const test = require('./config')`, 
    `const test = require('./helpers/ava-patched')`
  );
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${file}`);
    updatedCount++;
  }
});

console.log(`\nUpdated ${updatedCount} files.`);
