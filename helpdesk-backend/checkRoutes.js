import fs from "fs";
import path from "path";

// Folder where your route files are located
const ROUTES_DIR = path.join(process.cwd(), "routes");

// Regex to detect colon without a valid name after it
const INVALID_COLON_REGEX = /\/:\s*([\/'"]|$)/g;

const checkFile = (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  let match;
  let found = false;
  while ((match = INVALID_COLON_REGEX.exec(content)) !== null) {
    console.log(`⚠️  Invalid colon found in ${filePath} at position ${match.index}`);
    found = true;
  }
  return found;
};

const checkFolder = (folderPath) => {
  const files = fs.readdirSync(folderPath);
  let totalIssues = 0;
  files.forEach((file) => {
    const fullPath = path.join(folderPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      totalIssues += checkFolder(fullPath);
    } else if (file.endsWith(".js")) {
      if (checkFile(fullPath)) totalIssues++;
    }
  });
  return totalIssues;
};

const total = checkFolder(ROUTES_DIR);
if (total === 0) {
  console.log("✅ No invalid colons found in your route files!");
} else {
  console.log(`⚠️  Total files with issues: ${total}`);
}
