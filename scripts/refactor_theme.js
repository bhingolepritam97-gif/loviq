const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findJsFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const jsFiles = findJsFiles(srcDir);
let changedCount = 0;

for (const file of jsFiles) {
  // Skip context and theme directories to avoid circular deps
  if (file.includes(path.join('src', 'context')) || file.includes(path.join('src', 'theme'))) continue;

  let content = fs.readFileSync(file, 'utf8');

  // Check if it imports Colors
  if (content.includes('import { Colors') || content.includes('import { Typography, Colors }') || content.includes('import { Colors, Typography }') || content.match(/import\s*\{[^}]*Colors[^}]*\}\s*from\s*['"]\.\.\/?.*theme['"]/)) {
    
    // Remove Colors from import
    let newContent = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*['"](\.\.\/?.*)theme['"];?/g, (match, imports, prefix) => {
      let parts = imports.split(',').map(s => s.trim());
      parts = parts.filter(p => p !== 'Colors');
      
      // Inject useTheme import below the theme import
      let replacement = '';
      if (parts.length > 0) {
        replacement += `import { ${parts.join(', ')} } from '${prefix}theme';\n`;
      }
      
      // Calculate depth for context import
      const depth = prefix === '../' ? '../' : prefix === '../../' ? '../../' : prefix === '../../../' ? '../../../' : '../';
      replacement += `import { useTheme } from '${depth}context/ThemeContext';`;
      return replacement;
    });

    // Replace StyleSheet.create with createStyles
    let hasStyleSheet = newContent.includes('StyleSheet.create');
    if (hasStyleSheet) {
      newContent = newContent.replace(/const styles = StyleSheet\.create\({/g, 'const createStyles = (Colors) => StyleSheet.create({');
    }

    // Inject hook into component
    // We assume default export function Name() or const Name = () =>
    const componentMatch = newContent.match(/(?:export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/);
    
    if (componentMatch) {
      const insertionIndex = componentMatch.index + componentMatch[0].length;
      let injection = `\n  const { colors: Colors } = useTheme();`;
      if (hasStyleSheet) {
        injection += `\n  const styles = createStyles(Colors);`;
      }
      
      newContent = newContent.slice(0, insertionIndex) + injection + newContent.slice(insertionIndex);
      
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Refactored: ${file}`);
      changedCount++;
    } else {
      console.log(`Skipped (could not find component body): ${file}`);
    }
  }
}

console.log(`\nFinished refactoring ${changedCount} files.`);
