# BlogApi 全流程回归（总览第七节 24 步）
param(
    [string]$Base = "http://localhost:6133"
)

$script:results = New-Object System.Collections.Generic.List[object]
$suffix = Get-Random -Minimum 10000 -Maximum 99999

function Add-Result($step, $name, $ok, $detail) {
    $script:results.Add([PSCustomObject]@{
        Step   = $step
        Test   = $name
        Result = $(if ($ok) { "PASS" } else { "FAIL" })
        Detail = $detail
    })
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
        if ($resp.Content) { try { $json = $resp.Content | ConvertFrom-Json } catch { } }
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

function Upload-File {
    param([string]$Uri, [string]$FilePath, [string]$Token = $null)
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
    $fileName = [System.IO.Path]::GetFileName($FilePath)
    $enc = [System.Text.Encoding]::UTF8
    $ms = New-Object System.IO.MemoryStream
    foreach ($line in @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
            "Content-Type: application/octet-stream",
            ""
        )) {
        $bytes = $enc.GetBytes($line + "`r`n")
        $ms.Write($bytes, 0, $bytes.Length)
    }
    $ms.Write($fileBytes, 0, $fileBytes.Length)
    $ms.Write($enc.GetBytes("`r`n--$boundary--`r`n"), 0, $enc.GetByteCount("`r`n--$boundary--`r`n"))
    $headers = @{ "Content-Type" = "multipart/form-data; boundary=$boundary" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        $resp = Invoke-WebRequest -Method POST -Uri $Uri -Headers $headers -Body $ms.ToArray() -ErrorAction Stop
        $json = $null
        if ($resp.Content) { try { $json = $resp.Content | ConvertFrom-Json } catch { } }
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

Write-Host "=== BlogApi 24-Step Regression ===" -ForegroundColor Cyan
Write-Host "Base: $Base"
Write-Host ""

$tmpdir = Join-Path $env:TEMP "blogapi-regression"
New-Item -ItemType Directory -Force -Path $tmpdir | Out-Null
$pngPath = Join-Path $tmpdir "test.png"
$pngBytes = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
[System.IO.File]::WriteAllBytes($pngPath, $pngBytes)

$userA = "testuser$suffix"
$userB = "testuserB$suffix"
$catName = "TechCat$suffix"

# 1-3 Auth
$reg = Invoke-Api POST "$Base/api/auth/register" @{ username = $userA; email = "$userA@test.local"; password = "Test123!" }
Add-Result 1 "POST register testuser" ($reg.Status -eq 200 -and $reg.Body.token) "HTTP $($reg.Status)"

$loginA = Invoke-Api POST "$Base/api/auth/login" @{ username = $userA; password = "Test123!" }
$tokenA = $loginA.Body.token
Add-Result 2 "POST login testuser" ($loginA.Status -eq 200 -and $tokenA) "HTTP $($loginA.Status)"

$loginAdmin = Invoke-Api POST "$Base/api/auth/login" @{ username = "admin"; password = "Admin123!" }
$tokenAdmin = $loginAdmin.Body.token
Add-Result 3 "POST login admin" ($loginAdmin.Status -eq 200 -and $tokenAdmin) "HTTP $($loginAdmin.Status)"

# 4-6 Categories/Tags
$cat = Invoke-Api POST "$Base/api/categories" @{ name = $catName; description = "regression" } $tokenAdmin
$catId = $cat.Body.id
Add-Result 4 "POST category (Admin)" ($cat.Status -in 200, 201 -and $catId) "id=$catId HTTP $($cat.Status)"

$tag1 = Invoke-Api POST "$Base/api/tags" @{ name = "CSharp$suffix" } $tokenAdmin
$tag2 = Invoke-Api POST "$Base/api/tags" @{ name = "EFCore$suffix" } $tokenAdmin
$tagIds = @($tag1.Body.id, $tag2.Body.id) | Where-Object { $_ }
Add-Result 5 "POST tags x2 (Admin)" ($tag1.Status -in 200, 201 -and $tag2.Status -in 200, 201) "ids=$($tagIds -join ',')"

$cats = Invoke-Api GET "$Base/api/categories"
$hasCat = @($cats.Body) | Where-Object { $_.name -eq $catName }
Add-Result 6 "GET categories contains new" ($cats.Status -eq 200 -and $hasCat) "HTTP $($cats.Status)"

# 7-15 Posts
$upload = Upload-File "$Base/api/upload" $pngPath $tokenA
$coverUrl = $upload.Body.data.url
Add-Result 7 "POST upload" ($upload.Status -eq 200 -and $coverUrl) "url=$coverUrl"

$postTitle = "Regression Post $suffix"
$create = Invoke-Api POST "$Base/api/posts" @{
    title      = $postTitle
    content    = "body"
    summary    = "sum"
    categoryId = $catId
    tagIds     = $tagIds
    coverUrl   = $coverUrl
} $tokenA
$postId = $create.Body.id
Add-Result 8 "POST post draft" ($create.Status -in 200, 201 -and $postId) "id=$postId"

$list1 = Invoke-Api GET "$Base/api/posts?page=1&pageSize=50"
$inList1 = @($list1.Body.items) | Where-Object { $_.id -eq $postId }
Add-Result 9 "GET posts excludes draft" ($list1.Status -eq 200 -and -not $inList1) "HTTP $($list1.Status)"

$pub = Invoke-Api POST "$Base/api/posts/$postId/publish" $null $tokenA
Add-Result 10 "POST publish" ($pub.Status -eq 200) "HTTP $($pub.Status)"

$list2 = Invoke-Api GET "$Base/api/posts?page=1&pageSize=50"
$inList2 = @($list2.Body.items) | Where-Object { $_.id -eq $postId }
Add-Result 11 "GET posts includes published" ($list2.Status -eq 200 -and $inList2) "HTTP $($list2.Status)"

$kw = Invoke-Api GET "$Base/api/posts?keyword=Regression&page=1&pageSize=50"
$kwHit = @($kw.Body.items) | Where-Object { $_.id -eq $postId }
Add-Result 12 "GET posts keyword" ($kw.Status -eq 200 -and $kwHit) "HTTP $($kw.Status)"

$byCat = Invoke-Api GET "$Base/api/posts?categoryId=$catId&page=1&pageSize=50"
$catHit = @($byCat.Body.items) | Where-Object { $_.id -eq $postId }
Add-Result 13 "GET posts categoryId" ($byCat.Status -eq 200 -and $catHit) "HTTP $($byCat.Status)"

$put = Invoke-Api PUT "$Base/api/posts/$postId" @{
    title      = "$postTitle Updated"
    content    = "body2"
    summary    = "sum2"
    categoryId = $catId
    tagIds     = $tagIds
    coverUrl   = $coverUrl
} $tokenA
Add-Result 14 "PUT post (owner)" ($put.Status -eq 200) "HTTP $($put.Status)"

$regB = Invoke-Api POST "$Base/api/auth/register" @{ username = $userB; email = "$userB@test.local"; password = "Test123!" }
$tokenB = $regB.Body.token
$putB = Invoke-Api PUT "$Base/api/posts/$postId" @{
    title      = "hack"
    content    = "x"
    summary    = "x"
    categoryId = $catId
    tagIds     = @()
} $tokenB
Add-Result 15 "User B PUT same post -> 403" ($putB.Status -eq 403) "HTTP $($putB.Status)"

# 16-20 Comments
$c1 = Invoke-Api POST "$Base/api/posts/$postId/comments" @{ content = "top comment" } $tokenA
$commentId = $c1.Body.id
Add-Result 16 "POST top comment" ($c1.Status -in 200, 201 -and $commentId) "id=$commentId"

$c2 = Invoke-Api POST "$Base/api/posts/$postId/comments" @{ content = "reply"; parentId = $commentId } $tokenA
$replyId = $c2.Body.id
Add-Result 17 "POST reply" ($c2.Status -in 200, 201 -and $replyId) "id=$replyId"

$tree = Invoke-Api GET "$Base/api/posts/$postId/comments"
$nested = $false
foreach ($n in @($tree.Body)) {
    if ($n.id -eq $commentId) {
        foreach ($r in @($n.replies)) { if ($r.id -eq $replyId) { $nested = $true } }
    }
}
Add-Result 18 "GET nested comments" ($tree.Status -eq 200 -and $nested) "HTTP $($tree.Status)"

$delOwn = Invoke-Api DELETE "$Base/api/comments/$commentId" $null $tokenA
Add-Result 19 "DELETE own comment" ($delOwn.Status -in 200, 204) "HTTP $($delOwn.Status)"

$cOther = Invoke-Api POST "$Base/api/posts/$postId/comments" @{ content = "B cannot delete" } $tokenA
$otherId = $cOther.Body.id
$delOther = Invoke-Api DELETE "$Base/api/comments/$otherId" $null $tokenB
Add-Result 20 "User B DELETE others -> 403" ($delOther.Status -eq 403) "HTTP $($delOther.Status)"

# 21-24 Boundary
$catUser = Invoke-Api POST "$Base/api/categories" @{ name = "BadCat$suffix"; description = "x" } $tokenA
Add-Result 21 "User POST category -> 403" ($catUser.Status -eq 403) "HTTP $($catUser.Status)"

$delCat = Invoke-Api DELETE "$Base/api/categories/$catId" $null $tokenAdmin
Add-Result 22 "DELETE category with posts -> 400" ($delCat.Status -eq 400) "HTTP $($delCat.Status)"

$noAuthUp = Upload-File "$Base/api/upload" $pngPath
Add-Result 23 "Upload without token -> 401" ($noAuthUp.Status -eq 401) "HTTP $($noAuthUp.Status)"

$nf = Invoke-Api GET "$Base/api/posts/99999"
Add-Result 24 "GET post 99999 -> 404" ($nf.Status -eq 404) "HTTP $($nf.Status)"

Write-Host ""
$script:results | Format-Table Step, Result, Test, Detail -AutoSize
$passed = ($script:results | Where-Object Result -eq "PASS").Count
$failed = ($script:results | Where-Object Result -eq "FAIL").Count
Write-Host ""
Write-Host "TOTAL: $passed / 24 passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
if ($failed -gt 0) { exit 1 }
