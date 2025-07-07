const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const htmlFile = 'index.html';
const rootDir = process.cwd(); // current folder

// Load HTML and parse
const html = fs.readFileSync(htmlFile, 'utf8');
const $ = cheerio.load(html);

// 1. Gather referenced files from HTML
const referencedFiles = new Set();

$('link[href], script[src]').each((i, el) => {
  const attr = el.tagName === 'link' ? 'href' : 'src';
  const file = $(el).attr(attr);
  if (!file.startsWith('http') && !file.startsWith('data:')) {
    referencedFiles.add(file.replace(/^\//, ''));
  }
});

// 2. Recursively list all relevant local files
function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filepath));
    } else {
      results.push(filepath);
    }
  });
  return results;
}

const allFiles = walk(rootDir)
  .map(f => path.relative(rootDir, f))
  .filter(f => f.match(/\.(js|css|json|png)$/)); // Only file types we care about

// 3. Compare
const unused = allFiles.filter(f => !referencedFiles.has(f));

console.log('\n🔍 Unused local files:');
unused.forEach(f => console.log(' -', f));

// 4. Option: Rename unused files instead of deleting (safer)
console.log('\n✏️ Renaming unused files with ".unused"...');

unused.forEach(f => {
  const oldPath = path.join(rootDir, f);
  const newPath = oldPath + '.unused';

  if (!fs.existsSync(newPath)) {
    fs.renameSync(oldPath, newPath);
    console.log('Renamed:', f, '→', f + '.unused');
  } else {
    console.log('⚠️ Skipped (already renamed):', f);
  }
});