import fs from 'fs';
import path from 'path';

const srcDir = './dist';
const destDir = './public/js';
function addJsExtensionToImports(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');

  const modifiedCode = code.replace(
    /(import\s[^'"]+['"])(\.{1,2}\/[^'"]+?)(?<!\.js)(['"])/g,
    (_, p1, p2, p3) => {
      return `${p1}${p2}.js${p3}`;
    }
  );

  fs.writeFileSync(filePath, modifiedCode, 'utf8');
}

function processDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      processDir(srcPath, destPath); // recursión
    } else {
      if (entry.name.endsWith('.js')) {
        console.log(`Processing file: ${srcPath}`);
        fs.copyFileSync(srcPath, destPath);
        addJsExtensionToImports(destPath);
      }
    }
  }
}

processDir(srcDir, destDir);
