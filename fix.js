// Script to check brace balance and locate potential issues
const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'src', 'main.js');
const content = fs.readFileSync(mainJsPath, 'utf8');

let openBraces = 0;
let closeBraces = 0;
let lineNumber = 1;
const suspiciousLines = [];

content.split('\n').forEach((line, index) => {
  let lineOpenBraces = (line.match(/\{/g) || []).length;
  let lineCloseBraces = (line.match(/\}/g) || []).length;
  
  openBraces += lineOpenBraces;
  closeBraces += lineCloseBraces;
  
  if (lineCloseBraces > lineOpenBraces && lineCloseBraces > 0) {
    suspiciousLines.push({
      line: index + 1,
      content: line,
      openBraces: lineOpenBraces,
      closeBraces: lineCloseBraces,
      balance: openBraces - closeBraces
    });
  }
});

console.log(`Total open braces: ${openBraces}`);
console.log(`Total close braces: ${closeBraces}`);
console.log(`Balance: ${openBraces - closeBraces}`);
console.log('\nSuspicious lines with more closing than opening braces:');
suspiciousLines.forEach(sl => {
  console.log(`Line ${sl.line} (${sl.openBraces} open, ${sl.closeBraces} close, running balance: ${sl.balance}): ${sl.content}`);
});

// Find lines where imbalance becomes negative
const problematicLines = suspiciousLines.filter(sl => sl.balance < 0);
if (problematicLines.length > 0) {
  console.log('\nProbably problematic lines (negative balance):');
  problematicLines.forEach(pl => {
    console.log(`Line ${pl.line}: ${pl.content}`);
  });
}
