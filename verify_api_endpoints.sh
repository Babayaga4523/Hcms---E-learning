#!/bin/bash
# Quick API Endpoint Validation Script

echo "🔍 Checking API Endpoints..."
echo ""

BASE_URL="http://127.0.0.1:8000"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo "Testing: $description"
    echo "  Endpoint: $BASE_URL$endpoint"
    
    # Try to reach the endpoint
    response=$(curl -s -X $method \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -w "\n%{http_code}" \
        "$BASE_URL$endpoint" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        echo "  ✅ Response: $http_code"
    elif [ "$http_code" = "405" ]; then
        echo "  ⚠️  Method not allowed (405) - endpoint exists but use different HTTP method"
    else
        echo "  ❌ Response: $http_code"
    fi
    echo ""
}

# Test key endpoints
test_endpoint "GET" "/api/compliance/dashboard" "Compliance Dashboard"
test_endpoint "GET" "/api/departments/tree" "Department Tree"
test_endpoint "GET" "/api/users" "Users List"
test_endpoint "GET" "/api/roles" "Roles List"

echo "✅ Endpoint verification complete!"
echo ""
echo "Note: 401/403 responses are expected if not authenticated"
echo "Note: 405 means endpoint exists but requires different HTTP method"
