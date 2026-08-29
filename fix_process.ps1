
$files = @(
  "src\integrations\supabase\client.ts",
  "src\integrations\supabase\client.server.ts",
  "src\integrations\supabase\auth-middleware.ts"
)
foreach ($f in $files) {
  $content = Get-Content $f -Raw
  $content = $content -replace "process\.env", "(typeof process !== 'undefined' ? process.env : {})"
  Set-Content $f -Value $content
}
