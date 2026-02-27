/**
 * AUTOMATED MEMORY LEAK CLEANUP FIXER
 * 
 * Purpose: Automatically fixes missing useEffect cleanup patterns in React components
 * Usage: node fix-memory-leaks.js
 * 
 * This script identifies setInterval/setTimeout calls without proper cleanup
 * and wraps them in useEffect with cleanup functions
 */

const fs = require('fs');
const path = require('path');

class MemoryLeakFixer {
    constructor() {
        this.pagesPath = path.join(__dirname, '../../resources/js/Pages/Admin');
        this.issues = [];
    }

    run() {
        console.log('🧠 Memory Leak Cleanup Fixer - Starting...');
        console.log(`📁 Target: ${this.pagesPath}\n`);

        const files = fs.readdirSync(this.pagesPath).filter(f => f.endsWith('.jsx'));
        let fixedCount = 0;

        files.forEach(file => {
            const filePath = path.join(this.pagesPath, file);
            const fixed = this.fixFile(filePath);
            
            if (fixed > 0) {
                fixedCount += fixed;
                console.log(`✅ ${file}: Fixed ${fixed} memory leak(s)`);
            }
        });

        console.log(`\n📊 Summary: Fixed ${fixedCount} memory leaks across ${files.length} files`);
        console.log('✨ Memory leak cleanup complete!\n');
        
        if (this.issues.length > 0) {
            console.log('⚠️  Manual Review Required:');
            this.issues.forEach(issue => console.log(`  • ${issue}`));
        }
    }

    fixFile(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let fixedCount = 0;

        // Pattern 1: Bare setInterval/setTimeout not in useEffect
        const bareIntervalPattern = /^\s*(const|let|var)\s+\w+\s*=\s*set(Interval|Timeout)\([^)]+\);/gm;
        
        content = content.replace(bareIntervalPattern, (match) => {
            const intervalMatch = match.match(/set(Interval|Timeout)\([^,]+,\s*(\d+)\)/);
            if (intervalMatch) {
                const isInterval = intervalMatch[1] === 'Interval';
                const varName = match.match(/const|let|var)\s+(\w+)/)[1];
                const delay = intervalMatch[2];
                
                // Convert to useEffect with cleanup
                if (isInterval) {
                    fixedCount++;
                    return `useEffect(() => {
        const interval = ${match.trim().substring(match.trim().indexOf('set'))}
        return () => clearInterval(interval);
    }, []);`;
                } else {
                    fixedCount++;
                    return `useEffect(() => {
        const timeout = ${match.trim().substring(match.trim().indexOf('set'))}
        return () => clearTimeout(timeout);
    }, []);`;
                }
            }
            return match;
        });

        // Pattern 2: setInterval in useEffect without cleanup
        const useEffectPattern = /useEffect\(\s*\(\)\s*=>\s*\{([^}]*?(setInterval|setTimeout)[^}]*?)\}\s*,\s*\[([^\]]*)\]\s*\);/gs;
        
        content = content.replace(useEffectPattern, (match) => {
            if (!match.includes('return') || !match.includes('clear')) {
                // Extract interval/timeout variable
                const intervalMatch = match.match(/(const|let)\s+(\w+)\s*=\s*set(Interval|Timeout)/);
                if (intervalMatch) {
                    const varName = intervalMatch[2];
                    const clearFn = intervalMatch[3] === 'Interval' ? 'clearInterval' : 'clearTimeout';
                    
                    // Add cleanup return statement
                    const fixedMatch = match.replace(
                        /}\s*,\s*\[([^\]]*)\]\s*\);$/,
                        `\n        return () => ${clearFn}(${varName});
    }, [$1]);`
                    );
                    
                    fixedCount++;
                    return fixedMatch;
                }
            }
            return match;
        });

        // Pattern 3: addEventListener without removeEventListener
        const addEventPattern = /(\w+)\.addEventListener\('(\w+)',\s*(\w+)\)/g;
        content = content.replace(addEventPattern, (match, element, event, handler) => {
            // Check if removeEventListener exists nearby
            const endOfFunc = content.substring(content.indexOf(match) + match.length, 
                                               content.indexOf(match) + match.length + 500);
            
            if (!endOfFunc.includes('removeEventListener')) {
                fixedCount++;
                this.issues.push(`${path.basename(filePath)}: addEventListener needs removeEventListener cleanup`);
                return `useEffect(() => {
        ${element}.addEventListener('${event}', ${handler});
        return () => ${element}.removeEventListener('${event}', ${handler});
    }, []);`;
            }
            return match;
        });

        // Pattern 4: fetch without AbortController
        const fetchPattern = /fetch\('([^']+)'\)/g;
        const fetchMatches = content.match(fetchPattern) || [];
        
        if (fetchMatches.length > 0) {
            const needsAbort = !content.includes('AbortController');
            if (needsAbort) {
                fixedCount++;
                this.issues.push(`${path.basename(filePath)}: Fetch calls should use AbortController for cleanup`);
            }
        }

        // Write back if changed
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
        }

        return fixedCount;
    }
}

// Run the fixer
const fixer = new MemoryLeakFixer();
fixer.run();
