const fs = require('fs');
const path = require('path');

const REPO_NAME = 'Orixis-pwa';

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Pour les fichiers JS
    if (filePath.endsWith('.js')) {
        // Fix tous les formats possibles
        content = content
            .replace(/from\s+['"]\/widgets\//g, `from '/Orixis-pwa/widgets/`)
            .replace(/from\s+['"]\/src\//g, `from '/Orixis-pwa/src/`)
            .replace(/from\s+['"]\/modules\//g, `from '/Orixis-pwa/modules/`)
            .replace(/import\(['"]\/widgets\//g, `import('/Orixis-pwa/widgets/`)
            .replace(/import\(['"]\/src\//g, `import('/Orixis-pwa/src/`)
            .replace(/href\s*=\s*['"`]\/widgets\//g, `href = '/Orixis-pwa/widgets/`)
            .replace(/href\s*=\s*['"`]\/src\//g, `href = '/Orixis-pwa/src/`)
            .replace(/['"`]\/widgets\//g, `'/Orixis-pwa/widgets/`)
            .replace(/['"`]\/src\//g, `'/Orixis-pwa/src/`)
            .replace(/['"`]\/modules\//g, `'/Orixis-pwa/modules/`);
    }
    
    // Pour les fichiers HTML
    if (filePath.endsWith('.html')) {
        content = content
            .replace(/href="\/(?!Orixis)/g, `href="/Orixis-pwa/`)
            .replace(/src="\/(?!Orixis)/g, `src="/Orixis-pwa/`);
    }
    
    // Pour les fichiers CSS
    if (filePath.endsWith('.css')) {
        content = content
            .replace(/url\(['"]?\//g, `url('/Orixis-pwa/`);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed: ${filePath}`);
        return true;
    }
    return false;
}

function processDirectory(dir) {
    let count = 0;
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (item === '.git' || item === 'node_modules' || item === 'functions') return;
        
        if (stat.isDirectory()) {
            count += processDirectory(fullPath);
        } else if (item.endsWith('.js') || item.endsWith('.html') || item.endsWith('.css')) {
            if (fixFile(fullPath)) count++;
        }
    });
    
    return count;
}

console.log('🚀 Fixing all paths for GitHub Pages...\n');
const fixed = processDirectory('.');
console.log(`\n✅ Done! Fixed ${fixed} files.`);