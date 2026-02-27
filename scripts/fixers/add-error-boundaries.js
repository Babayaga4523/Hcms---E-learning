/**
 * AUTOMATED ERROR BOUNDARY WRAPPER
 * 
 * Purpose: Wraps critical React components with ErrorBoundary HOC
 * Usage: node add-error-boundaries.js
 * 
 * This script adds error boundary wrappers to pages that lack error handling
 */

const fs = require('fs');
const path = require('path');

class ErrorBoundaryWrapper {
    constructor() {
        this.pagesPath = path.join(__dirname, '../../resources/js/Pages/Admin');
        this.criticalPages = [
            'Dashboard.jsx',
            'AdvancedAnalytics.jsx',
            'TrainingProgram.jsx',
            'UserManagement.jsx',
            'QuestionManagement.jsx',
            'ComplianceTracker.jsx',
            'RecentActivity.jsx',
            'ExamAttempts.jsx',
            'ApprovalWorkflow.jsx',
            'SystemSettings.jsx'
        ];
    }

    run() {
        console.log('🛡️  Error Boundary Wrapper - Starting...');
        console.log(`📁 Target: ${this.pagesPath}\n`);

        let wrappedCount = 0;

        this.criticalPages.forEach(pageName => {
            const filePath = path.join(this.pagesPath, pageName);
            
            if (fs.existsSync(filePath)) {
                const wrapped = this.wrapComponent(filePath, pageName);
                if (wrapped) {
                    wrappedCount++;
                    console.log(`✅ ${pageName}: Added error boundary`);
                } else {
                    console.log(`⏭️  ${pageName}: Already has error boundary or incompatible`);
                }
            } else {
                console.log(`⚠️  ${pageName}: File not found`);
            }
        });

        console.log(`\n📊 Summary: Wrapped ${wrappedCount} components with ErrorBoundary`);
        console.log('✨ Error boundary implementation complete!\n');
    }

    wrapComponent(filePath, pageName) {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // Check if already wrapped
        if (content.includes('ErrorWrapper') || content.includes('withErrorBoundary') || 
            content.includes('ErrorBoundary')) {
            return false;
        }

        // Check if file uses export default
        if (!content.includes('export default')) {
            return false;
        }

        // Add import for ErrorBoundary if not present
        if (!content.includes('import.*ErrorBoundary')) {
            const lastImportIndex = content.lastIndexOf('import');
            const endOfLastImport = content.indexOf('\n', lastImportIndex);
            
            const errorBoundaryImport = "import ErrorWrapper from '@/Components/Admin/ErrorBoundary';\n";
            content = content.slice(0, endOfLastImport + 1) + errorBoundaryImport + content.slice(endOfLastImport + 1);
        }

        // Find and wrap the main component export
        const exportMatch = content.match(/export default (\w+);?$/m);
        if (exportMatch) {
            const componentName = exportMatch[1];
            
            // Wrap export
            content = content.replace(
                /export default (\w+);?$/m,
                `export default withErrorBoundary(${componentName}, '${pageName}');`
            );

            // Add HOC helper or use ErrorWrapper
            content = content.replace(
                /import ErrorWrapper from '@\/Components\/Admin\/ErrorBoundary';/,
                `import ErrorWrapper from '@/Components/Admin/ErrorBoundary';\n
const withErrorBoundary = (Component, pageName) => (props) => (
    <ErrorWrapper pageName={pageName}>
        <Component {...props} />
    </ErrorWrapper>
);`
            );
        }

        // Write back if changed
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }

        return false;
    }
}

// Run the wrapper
const wrapper = new ErrorBoundaryWrapper();
wrapper.run();
