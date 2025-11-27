# PowerShell test script for Flask service
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    text = "Coffee reduces the risk of heart disease"
} | ConvertTo-Json

try {
    Write-Host "Testing Flask /verify endpoint..."
    $response = Invoke-RestMethod -Uri "http://localhost:5000/verify" -Method Post -Headers $headers -Body $body
    Write-Host "✅ Success!"
    Write-Host "Response: $($response | ConvertTo-Json)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
}