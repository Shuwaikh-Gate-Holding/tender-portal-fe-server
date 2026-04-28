<#
.SYNOPSIS
Automates building a Docker image locally, packaging Nginx, transferring everything to an offline Linux server, and deploying via docker compose.
#>

# ==========================================
# CONFIGURATION (Verify these match your setup)
# ==========================================
$ImageName = "tender-portal-fe-server-app:latest"
$TarFile = "tender-fe-server.tar"
$NginxTarFile = "nginx.tar"
$NginxConfig = "./nginx/nginx.conf"
$ComposeFile = "docker-compose.yml"

$SshUser = "aliasgar"
$SshHost = "192.168.11.65"
$SshPort = "21213"
$RemoteDir = "/home/aliasgar/projects/tender-portal/tender-portal-fe-server"
# ==========================================

$ErrorActionPreference = "Stop"

Write-Host "Step 1: Building app and pulling Nginx on Windows..." -ForegroundColor Cyan

# Build your frontend app
docker build -t $ImageName .
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

# Pull the lightweight Nginx image
docker pull nginx:alpine
if ($LASTEXITCODE -ne 0) { Write-Host "Failed to pull Nginx image!" -ForegroundColor Red; exit 1 }


Write-Host "`nStep 2: Saving the images to .tar files..." -ForegroundColor Cyan

docker save -o $TarFile $ImageName
if ($LASTEXITCODE -ne 0) { Write-Host "Docker save failed for App!" -ForegroundColor Red; exit 1 }

docker save -o $NginxTarFile nginx:alpine
if ($LASTEXITCODE -ne 0) { Write-Host "Docker save failed for Nginx!" -ForegroundColor Red; exit 1 }


Write-Host "`nStep 3: Transferring files to Linux server ($SshHost)..." -ForegroundColor Cyan
Write-Host "This might take a minute depending on image size." -ForegroundColor DarkGray

# We send the App tar, Nginx tar, Nginx config, and the Compose file all at once
scp -P $SshPort $TarFile $NginxTarFile $NginxConfig $ComposeFile "${SshUser}@${SshHost}:${RemoteDir}/"
if ($LASTEXITCODE -ne 0) { Write-Host "SCP transfer failed!" -ForegroundColor Red; exit 1 }


Write-Host "`nStep 4: Loading and starting the containers on Linux..." -ForegroundColor Cyan

# This SSH command navigates to the folder, loads BOTH tar files, and starts compose
$SshCommand = "cd $RemoteDir ; sudo docker load -i $TarFile ; sudo docker load -i $NginxTarFile ; sudo docker compose up -d"

# Notice the -t flag is still here to allow the sudo password prompt!
ssh -t -p $SshPort "${SshUser}@${SshHost}" $SshCommand
if ($LASTEXITCODE -ne 0) { Write-Host "Deployment on Linux failed!" -ForegroundColor Red; exit 1 }


Write-Host "`nStep 5: Cleaning up local .tar files..." -ForegroundColor Cyan
Remove-Item -Path $TarFile -Force
Remove-Item -Path $
