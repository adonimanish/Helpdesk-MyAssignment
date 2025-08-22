// scripts/setup-dirs.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createDirectoryStructure = () => {
  const rootDir = path.join(__dirname, '..');
  
  const directories = [
    'models',
    'routes', 
    'middleware',
    'scripts',
    'tests',
    'config'
  ];

  console.log('📁 Creating directory structure...');
  
  directories.forEach(dir => {
    const dirPath = path.join(rootDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created: ${dir}/`);
    } else {
      console.log(`⏭️  Already exists: ${dir}/`);
    }
  });

  console.log('🎉 Directory structure complete!');
};

createDirectoryStructure();