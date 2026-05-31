$base = "http://localhost:6133"
$results = [System.Collections.Generic.List[object]]::new()

function Add-Result($name, $ok, $detail) {
    $results.Add([PSCustomObject]@{ Test = $name; Result = $(if ($ok) { "PASS" } else { "FAIL" }); Detail = $detail })
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [string]$Token = $null
    )
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        $params = @{
            Method      = $Method
            Uri         = $Uri
            Headers     = $headers
            ErrorAction = "Stop"
        }
        if ($null -ne $Body) {
            $params["ContentType"] = "application/json"
            $params["Body"] = ($Body | ConvertTo-Json -Compress)
        }
        $resp = Invoke-WebRequest @params
        $json = $null
        if ($resp.Content) {
            try { $json = $resp.Content | ConvertFrom-Json } catch { $json = $resp.Content }
        }
        return @{ Status = [int]$resp.StatusCode; Body = $json; Raw = $resp.Content }
    }
    catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $text = $reader.ReadToEnd()
            $reader.Close()
            $json = $null
            if ($text) { try { $json = $text | ConvertFrom-Json } catch { } }
            return @{ Status = [int]$resp.StatusCode; Body = $json; Raw = $text }
        }
        return @{ Status = 0; Body = $null; Raw = $_.Exception.Message }
    }
}

Write-Host "=== BlogApi Local Tests ===" -ForegroundColor Cyan
Write-Host "Base: $base"
Write-Host ""

try {
    $sw = Invoke-WebRequest -Uri "$base/swagger/index.html" -UseBasicParsing
    Add-Result "Swagger" ($sw.StatusCode -eq 200) "HTTP $($sw.StatusCode)"
}
catch {
    Add-Result "Swagger" $false $_.Exception.Message
    $results | Format-Table -AutoSize
    exit 1
}

$adminLogin = Invoke-Api POST "$base/api/auth/login" @{ username = "admin"; password = "Admin123!" }
Add-Result "Admin login" ($adminLogin.Status -eq 200 -and $adminLogin.Body.token) "HTTP $($adminLogin.Status)"
$adminToken = $adminLogin.Body.token

$posts = Invoke-Api GET "$base/api/posts?page=1&pageSize=3"
Add-Result "GET /api/posts paged" ($posts.Status -eq 200 -and $posts.Body.items) "total=$($posts.Body.totalCount) HTTP $($posts.Status)"

$page0 = Invoke-Api GET "$base/api/posts?page=0&pageSize=10"
Add-Result "page=0 -> 400" ($page0.Status -eq 400) "HTTP $($page0.Status)"

$suffix = Get-Random -Minimum 1000 -Maximum 9999
$userB = "testuser$suffix"
$reg = Invoke-Api POST "$base/api/auth/register" @{ username = $userB; email = "$userB@test.local"; password = "Test123!" }
Add-Result "Register user" ($reg.Status -eq 200 -and $reg.Body.token) "$userB HTTP $($reg.Status)"
$tokenB = $reg.Body.token

$postId = $null
if ($posts.Body.items -and @($posts.Body.items).Count -gt 0) {
    $postId = $posts.Body.items[0].id
}
if (-not $postId) {
    $newPost = Invoke-Api POST "$base/api/posts" @{ title = "Test $suffix"; content = "content"; categoryId = 1; tagIds = @() } $adminToken
    $postId = $newPost.Body.id
    Invoke-Api POST "$base/api/posts/$postId/publish" $null $adminToken | Out-Null
}
Add-Result "Published post available" ($null -ne $postId) "postId=$postId"

$noAuth = Invoke-Api POST "$base/api/posts/$postId/comments" @{ content = "anon" }
Add-Result "POST comment without auth -> 401" ($noAuth.Status -eq 401) "HTTP $($noAuth.Status)"

$c1 = Invoke-Api POST "$base/api/posts/$postId/comments" @{ content = "good post $suffix" } $tokenB
Add-Result "POST comment" ($c1.Status -in 200, 201) "id=$($c1.Body.id) HTTP $($c1.Status)"
$commentId = $c1.Body.id

$c2 = Invoke-Api POST "$base/api/posts/$postId/comments" @{ content = "agree"; parentId = $commentId } $tokenB
Add-Result "Reply with parentId" ($c2.Status -in 200, 201) "id=$($c2.Body.id) HTTP $($c2.Status)"
$replyId = $c2.Body.id

$tree = Invoke-Api GET "$base/api/posts/$postId/comments"
$hasReplies = $false
foreach ($node in @($tree.Body)) {
    if ($node.id -eq $commentId) {
        foreach ($r in @($node.replies)) {
            if ($r.id -eq $replyId) { $hasReplies = $true }
        }
    }
}
Add-Result "GET nested replies" ($tree.Status -eq 200 -and $hasReplies) "roots=$((@($tree.Body)).Count)"

$draft = Invoke-Api POST "$base/api/posts" @{ title = "Draft $suffix"; content = "x"; categoryId = 1; tagIds = @() } $tokenB
$draftComment = Invoke-Api POST "$base/api/posts/$($draft.Body.id)/comments" @{ content = "bad" } $tokenB
Add-Result "Comment on Draft fails" ($draftComment.Status -ge 400) "HTTP $($draftComment.Status)"

$userA = "testuserA$suffix"
$regA = Invoke-Api POST "$base/api/auth/register" @{ username = $userA; email = "$userA@test.local"; password = "Test123!" }
$tokenA = $regA.Body.token
$cA = Invoke-Api POST "$base/api/posts/$postId/comments" @{ content = "comment by A" } $tokenA
$commentAId = $cA.Body.id
$forbidden = Invoke-Api DELETE "$base/api/comments/$commentAId" $null $tokenB
Add-Result "User B delete A comment -> 403" ($forbidden.Status -eq 403) "HTTP $($forbidden.Status)"

$del = Invoke-Api DELETE "$base/api/comments/$commentAId" $null $tokenA
Add-Result "Delete own comment" ($del.Status -in 200, 204) "HTTP $($del.Status)"
$afterDel = Invoke-Api GET "$base/api/posts/$postId/comments"
$stillVisible = $false
foreach ($node in @($afterDel.Body)) {
    if ($node.id -eq $commentAId) { $stillVisible = $true }
    foreach ($r in @($node.replies)) {
        if ($r.id -eq $commentAId) { $stillVisible = $true }
    }
}
Add-Result "Soft delete hidden in GET" (-not $stillVisible) "deletedId=$commentAId"

$delAdmin = Invoke-Api DELETE "$base/api/comments/$replyId" $null $adminToken
Add-Result "Admin delete any comment" ($delAdmin.Status -in 200, 204) "HTTP $($delAdmin.Status)"

Write-Host ""
Write-Host "--- Sample: comment tree ---" -ForegroundColor Yellow
($tree.Body | ConvertTo-Json -Depth 5)
Write-Host ""

$results | Format-Table -AutoSize
$passed = ($results | Where-Object Result -eq "PASS").Count
$failed = ($results | Where-Object Result -eq "FAIL").Count
Write-Host "TOTAL: $passed passed, $failed failed / $($results.Count)" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -gt 0) { exit 1 }
