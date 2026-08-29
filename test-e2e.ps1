$BASE = "http://localhost:3001/api"

# Helper function to make API calls
function Call-API {
    param([string]$Method, [string]$Path, [hashtable]$Body = $null, [string]$Cookie = $null)
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($Cookie) { $headers["Cookie"] = $Cookie }
    
    $params = @{
        Uri     = "$BASE$Path"
        Method  = $Method
        Headers = $headers
    }
    
    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }
    
    $response = Invoke-WebRequest @params -UseBasicParsing -ErrorAction SilentlyContinue
    if ($null -eq $response) {
        $response = Invoke-WebRequest @params -UseBasicParsing
    }
    
    $result = @{
        status = $response.StatusCode
        data   = ($response.Content | ConvertFrom-Json)
        cookie = $null
    }
    
    if ($response.Headers['Set-Cookie']) {
        $result.cookie = ($response.Headers['Set-Cookie'] -split ";")[0]
    }
    
    return $result
}

Write-Host "=== E2E Test: Admin Invite → Notification → Submission ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Register admin with all required fields
Write-Host "1. Register admin..." -ForegroundColor Yellow
$adminReg = @{
    email        = "eyad.bassem98@hotmail.com"
    password     = "admin12345"
    fullName     = "Admin User"
    phone        = "+201001234567"
    dob          = "1990-01-01"
    gender       = "M"
    address      = "Cairo, Egypt"
    height       = "180"
    weight       = "80"
    phoneCountry = "EG"
}
$res = Call-API POST /register $adminReg
Write-Host "   Status: $($res.status) $(if($res.data.error) { "✗ $($res.data.error)" } else { "✓" })" -ForegroundColor $(if($res.data.error) { "Red" } else { "Green" })
Write-Host ""

# Step 2: Admin login
Write-Host "2. Admin login..." -ForegroundColor Yellow
$res = Call-API POST /login @{
    email    = "eyad.bassem98@hotmail.com"
    password = "admin12345"
}
Write-Host "   Status: $($res.status) $(if($res.data.error) { "✗" } else { "✓" })" -ForegroundColor $(if($res.data.error) { "Red" } else { "Green" })
$adminCookie = $res.cookie
Write-Host ""

# Step 3: Test admin dashboard access
Write-Host "3. Admin accesses dashboard..." -ForegroundColor Yellow
$res = Call-API GET /admin/dashboard $null $adminCookie
Write-Host "   Status: $($res.status) $(if($res.data.error) { "✗" } else { "✓ ($($res.data.users.length) users, $($res.data.submissions.length) submissions)" })" -ForegroundColor $(if($res.data.error) { "Red" } else { "Green" })
Write-Host ""

# Step 4: Register client with all required fields
Write-Host "4. Register client..." -ForegroundColor Yellow
$clientReg = @{
    email        = "client@test.com"
    password     = "client12345"
    fullName     = "Test Client"
    phone        = "+201009876543"
    dob          = "1995-05-15"
    gender       = "F"
    address      = "Giza, Egypt"
    height       = "165"
    weight       = "65"
    phoneCountry = "EG"
}
$res = Call-API POST /register $clientReg
Write-Host "   Status: $($res.status) $(if($res.data.error) { "✗" } else { "✓" })" -ForegroundColor $(if($res.data.error) { "Red" } else { "Green" })
$clientId = $res.data.user.id
Write-Host ""

# Step 5: Admin sends invite
Write-Host "5. Admin sends invite to client..." -ForegroundColor Yellow
$res = Call-API POST /admin/assign-form @{
    userId        = $clientId
    assignmentKey = "nutrition-assessment"
} $null $adminCookie
Write-Host "   Status: $($res.status) $(if($res.data.error) { "✗" } else { "✓" })" -ForegroundColor $(if($res.data.error) { "Red" } else { "Green" })
Write-Host ""

# Step 6: Client login and check notifications
Write-Host "6. Client login and check notifications..." -ForegroundColor Yellow
$res = Call-API POST /login @{
    email    = "client@test.com"
    password = "client12345"
}
$clientCookie = $res.cookie
$res = Call-API GET /notifications $null $clientCookie
$unread = @($res.data.notifications | Where-Object { -not $_.isRead })
Write-Host "   Status: $($res.status) $(if($res.data.error) { "✗" } else { "✓ ($($unread.Count) notifications)" })" -ForegroundColor $(if($res.data.error) { "Red" } else { "Green" })
if ($unread.Count -gt 0) {
    Write-Host "   → '$($unread[0].title)': $($unread[0].message)" -ForegroundColor Cyan
}
Write-Host ""

# Step 7: Client submits form
Write-Host "7. Client submits form..." -ForegroundColor Yellow
$res = Call-API POST /assignments @{
    assignmentKey = "nutrition-assessment"
    answers       = @{ dietary_habits = "balanced"; goal = "weight loss" }
    summary       = "Completed nutrition assessment"
} $null $clientCookie
Write-Host "   Status: $($res.status) $(if($res.data.error) { "✗" } else { "✓" })" -ForegroundColor $(if($res.data.error) { "Red" } else { "Green" })
Write-Host ""

# Step 8: Admin views completed forms
Write-Host "8. Admin views completed forms..." -ForegroundColor Yellow
$res = Call-API GET /admin/dashboard $null $adminCookie
$submissions = @($res.data.submissions)
Write-Host "   Status: $($res.status) $(if($res.data.error) { "✗" } else { "✓ ($($submissions.Count) submissions)" })" -ForegroundColor $(if($res.data.error) { "Red" } else { "Green" })
if ($submissions.Count -gt 0) {
    Write-Host "   → $($submissions[0].fullName) completed: $($submissions[0].assignmentTitle)" -ForegroundColor Cyan
    Write-Host "   → Summary: $($submissions[0].summary)" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "=== ✓ E2E Flow Complete ===" -ForegroundColor Green
