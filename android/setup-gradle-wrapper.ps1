$ErrorActionPreference = 'Stop'
$gradleVersion = '8.13'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$cacheRoot = Join-Path $env:USERPROFILE '.gradle\momin-bootstrap'
$installRoot = Join-Path $cacheRoot "gradle-$gradleVersion"
$archive = Join-Path $cacheRoot "gradle-$gradleVersion-bin.zip"
$gradleBat = Join-Path $installRoot 'bin\gradle.bat'

if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    $studioCandidates = @(
        (Join-Path $env:ProgramFiles 'Android\Android Studio\jbr'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Android Studio\jbr'),
        (Join-Path $env:ProgramFiles 'Android\Android Studio\jre')
    )
    foreach ($candidate in $studioCandidates) {
        if (Test-Path (Join-Path $candidate 'bin\java.exe')) { $env:JAVA_HOME = $candidate; break }
    }
}
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    $java = Get-Command java.exe -ErrorAction SilentlyContinue
    if (-not $java) { throw 'Java 17 was not found. Install Android Studio or set JAVA_HOME to a JDK 17 folder, then retry.' }
    $javaPath = (Resolve-Path $java.Source).Path
    $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $javaPath)
}
New-Item -ItemType Directory -Force -Path $cacheRoot | Out-Null
if (-not (Test-Path $gradleBat)) {
    Write-Host "Downloading Gradle $gradleVersion..."
    Invoke-WebRequest -Uri "https://services.gradle.org/distributions/gradle-$gradleVersion-bin.zip" -OutFile $archive
    if (Test-Path $installRoot) { Remove-Item -Recurse -Force $installRoot }
    Expand-Archive -Path $archive -DestinationPath $cacheRoot -Force
}
if (-not (Test-Path $gradleBat)) { throw "Gradle was not found at $gradleBat after extraction." }
Push-Location $projectRoot
try {
    Write-Host 'Generating Gradle wrapper files for the Android project...'
    & $gradleBat wrapper --gradle-version $gradleVersion --distribution-type bin
    if ($LASTEXITCODE -ne 0) { throw "Gradle wrapper generation failed (exit code $LASTEXITCODE)." }
    Write-Host 'Done. Open this folder in Android Studio and allow Gradle sync to finish.'
} finally { Pop-Location }
