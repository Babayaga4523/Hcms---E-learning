// File: resources/js/Utils/LearnerAnalyticsValidator.js
// Fungsi untuk validasi dan test learner analytics features

export const validateLearnerPerformanceEndpoint = async () => {
    try {
        const response = await fetch('/api/learner/performance', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ /api/learner/performance endpoint works');
        console.log('Response data:', data);
        
        // Validate response structure
        const requiredFields = [
            'averageScore',
            'completionRate',
            'certifications',
            'hoursSpent',
            'totalPrograms',
            'activitiesThisWeek',
            'scoreChange',
            'completionChange',
            'scoresTrend',
            'performanceByProgram',
            'engagement'
        ];

        for (const field of requiredFields) {
            if (!(field in data)) {
                console.warn(`⚠️ Missing field: ${field}`);
            }
        }

        return { success: true, data };
    } catch (error) {
        console.error('❌ Error fetching /api/learner/performance:', error);
        return { success: false, error: error.message };
    }
};

export const validateLearnerProgressEndpoint = async () => {
    try {
        const response = await fetch('/api/learner/progress', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ /api/learner/progress endpoint works');
        console.log('Response data:', data);
        
        // Validate response structure
        if (!Array.isArray(data.programs)) {
            console.warn('⚠️ programs should be an array');
        }

        return { success: true, data };
    } catch (error) {
        console.error('❌ Error fetching /api/learner/progress:', error);
        return { success: false, error: error.message };
    }
};

export const validateLearnerProgressDetailEndpoint = async (programId) => {
    try {
        const response = await fetch(`/api/learner/progress/${programId}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log(`✅ /api/learner/progress/${programId} endpoint works`);
        console.log('Response data:', data);
        
        // Validate response structure
        if (!data.program) {
            console.warn('⚠️ Missing program object in response');
        }

        return { success: true, data };
    } catch (error) {
        console.error(`❌ Error fetching /api/learner/progress/${programId}:`, error);
        return { success: false, error: error.message };
    }
};

export const validateCertificationsEndpoint = async () => {
    try {
        const response = await fetch('/api/learner/certifications', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ /api/learner/certifications endpoint works');
        console.log('Response data:', data);

        return { success: true, data };
    } catch (error) {
        console.error('❌ Error fetching /api/learner/certifications:', error);
        return { success: false, error: error.message };
    }
};

export const validateTimeAnalyticsEndpoint = async () => {
    try {
        const response = await fetch('/api/learner/time-analytics', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ /api/learner/time-analytics endpoint works');
        console.log('Response data:', data);

        return { success: true, data };
    } catch (error) {
        console.error('❌ Error fetching /api/learner/time-analytics:', error);
        return { success: false, error: error.message };
    }
};

export const validateAllEndpoints = async () => {
    console.log('🔍 Starting endpoint validation...\n');

    const results = {};

    // Test performance endpoint
    results.performance = await validateLearnerPerformanceEndpoint();
    console.log('');

    // Test progress endpoint
    results.progress = await validateLearnerProgressEndpoint();
    console.log('');

    // Test certifications endpoint
    results.certifications = await validateCertificationsEndpoint();
    console.log('');

    // Test time analytics endpoint
    results.timeAnalytics = await validateTimeAnalyticsEndpoint();
    console.log('');

    // Test progress detail endpoint (with first program ID if available)
    if (results.progress.success && results.progress.data.programs.length > 0) {
        const firstProgramId = results.progress.data.programs[0].id;
        results.progressDetail = await validateLearnerProgressDetailEndpoint(firstProgramId);
    }

    // Summary
    console.log('='.repeat(50));
    console.log('📊 VALIDATION SUMMARY\n');

    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;

    console.log(`✅ Endpoints working: ${successCount}/${totalCount}`);
    
    for (const [key, result] of Object.entries(results)) {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${key}`);
    }

    const allSuccessful = Object.values(results).every(r => r.success);
    console.log('\n' + (allSuccessful ? '✅ All endpoints validated!' : '❌ Some endpoints failed!'));

    return allSuccessful;
};

// Export validator function untuk digunakan di console
if (typeof window !== 'undefined') {
    window.validateLearnerAnalytics = validateAllEndpoints;
    console.log('💡 Tip: Run validateLearnerAnalytics() in console to test all endpoints');
}
