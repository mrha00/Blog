$base = "http://localhost:6133"
$script:results = New-Object System.Collections.Generic.List[object]

function Add-Result($name, $ok, $detail) {
    $script:results.Add([PSCustomObject]@{ Test = $name; Result = $(if ($ok) { "PASS" } else { "FAIL" }); Detail = $detail })
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
    param(
        [string]$Uri,
        [string]$FilePath,
        [string]$Token = $null
    )
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
    $fileName = [System.IO.Path]::GetFileName($FilePath)
    $enc = [System.Text.Encoding]::UTF8
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: application/octet-stream",
        "",
        $null,
        "--$boundary--",
        ""
    )
    $ms = New-Object System.IO.MemoryStream
    for ($i = 0; $i -lt $bodyLines.Length; $i++) {
        if ($null -eq $bodyLines[$i]) {
            $ms.Write($fileBytes, 0, $fileBytes.Length)
            $ms.Write($enc.GetBytes("`r`n"), 0, 2)
        }
        else {
            $line = $bodyLines[$i] + "`r`n"
            $ms.Write($enc.GetBytes($line), 0, $enc.GetByteCount($line))
        }
    }
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

Write-Host "=== BlogApi Phase 6 Tests ===" -ForegroundColor Cyan

$tmpdir = Join-Path $env:TEMP "blogapi-phase6"
New-Item -ItemType Directory -Force -Path $tmpdir | Out-Null

# Minimal valid 1x1 PNG
$pngPath = Join-Path $tmpdir "test.png"
$pngBytes = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
[System.IO.File]::WriteAllBytes($pngPath, $pngBytes)

$fakeJpg = Join-Path $tmpdir "fake.jpg"
[System.IO.File]::WriteAllBytes($fakeJpg, [byte[]](0x4D, 0x5A, 0x90, 0x00))

$adminLogin = Invoke-Api POST "$base/api/auth/login" @{ username = "admin"; password = "Admin123!" }
$adminToken = $adminLogin.Body.token
Add-Result "Admin login" ($adminLogin.Status -eq 200 -and $adminToken) "HTTP $($adminLogin.Status)"

$noAuthUpload = Upload-File "$base/api/upload" $pngPath
Add-Result "Upload without token -> 401" ($noAuthUpload.Status -eq 401) "HTTP $($noAuthUpload.Status)"

$upload = Upload-File "$base/api/upload" $pngPath $adminToken
$url = $upload.Body.data.url
Add-Result "Upload png with token" ($upload.Status -eq 200 -and $url) "HTTP $($upload.Status) url=$url"
Add-Result "Upload ApiResponse format" ($upload.Body.code -eq 200 -and $upload.Body.message) "code=$($upload.Body.code)"

$static = Invoke-WebRequest -Uri "$base$url" -UseBasicParsing
Add-Result "Static file accessible" ($static.StatusCode -eq 200) "HTTP $($static.StatusCode)"

$fakeUpload = Upload-File "$base/api/upload" $fakeJpg $adminToken
Add-Result "Fake jpg (exe header) -> 400" ($fakeUpload.Status -eq 400) "HTTP $($fakeUpload.Status)"

$posts = Invoke-Api GET "$base/api/posts?page=1&pageSize=1"
$postId = $posts.Body.items[0].id
$before = Invoke-Api GET "$base/api/posts/$postId"

$newTitle = "Updated Phase6 $(Get-Random)"
Invoke-Api PUT "$base/api/posts/$postId" @{
    title      = $newTitle
    content    = $before.Body.content
    summary    = $before.Body.summary
    categoryId = 1
    tagIds     = @()
    coverUrl   = $url
} $adminToken | Out-Null
$updated = Invoke-Api GET "$base/api/posts/$postId"
Add-Result "Cache invalidated after PUT" ($updated.Body.title -eq $newTitle) "title=$($updated.Body.title)"

# ViewCount: use a freshly published post to avoid IP throttle cache from prior runs
$newPost = Invoke-Api POST "$base/api/posts" @{
    title      = "ViewCount Test $(Get-Random)"
    content    = "content"
    categoryId = 1
    tagIds     = @()
} $adminToken
$viewPostId = $newPost.Body.id
Invoke-Api POST "$base/api/posts/$viewPostId/publish" $null $adminToken | Out-Null
$vcFirst = (Invoke-Api GET "$base/api/posts/$viewPostId").Body.viewCount
for ($i = 0; $i -lt 9; $i++) {
    Invoke-Api GET "$base/api/posts/$viewPostId" | Out-Null
}
$vcLast = (Invoke-Api GET "$base/api/posts/$viewPostId").Body.viewCount
Add-Result "ViewCount +1 per IP (10 GETs on new post)" ($vcFirst -eq 1 -and $vcLast -eq 1) "first=$vcFirst last=$vcLast"

Write-Host ""
$script:results | Format-Table -AutoSize
$passed = ($script:results | Where-Object Result -eq "PASS").Count
$failed = ($script:results | Where-Object Result -eq "FAIL").Count
Write-Host "TOTAL: $passed passed, $failed failed / $($script:results.Count)" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
if ($failed -gt 0) { exit 1 }
