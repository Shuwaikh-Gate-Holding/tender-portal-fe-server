#!/bin/bash

# ==========================================
# CONFIGURATION (Verify these match your setup)
# ==========================================
IMAGE_NAME="tender-portal-fe-server-app:latest"
TAR_FILE="tender-fe-server.tar"
NGINX_TAR_FILE="nginx.tar"
NGINX_CONFIG="./nginx/nginx.conf"
COMPOSE_FILE="docker-compose.yml"

SSH_USER="aliasgar"
SSH_HOST="192.168.11.65"
SSH_PORT="21213"
REMOTE_DIR="/home/aliasgar/projects/tender-portal/tender-portal-fe-server"
# ==========================================

set -e

echo "Step 1: Building app and pulling Nginx on macOS..."
echo "-----------------------------------------------"

# Build frontend app
docker build -t $IMAGE_NAME .

# Pull lightweight Nginx image
docker pull nginx:alpine


echo ""
echo "Step 2: Saving Docker images to .tar files..."
echo "-----------------------------------------------"

docker save -o $TAR_FILE $IMAGE_NAME
docker save -o $NGINX_TAR_FILE nginx:alpine


echo ""
echo "Step 3: Transferring files to Linux server ($SSH_HOST)..."
echo "This might take a minute depending on image size."
echo "-----------------------------------------------"

# scp -P $SSH_PORT \
#     $TAR_FILE \
#     $NGINX_TAR_FILE \
#     $NGINX_CONFIG \
#     $COMPOSE_FILE \
#     "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"


# echo ""
# echo "Step 4: Loading images and starting containers on Linux..."
# echo "-----------------------------------------------"

# SSH_COMMAND="cd $REMOTE_DIR && \
# sudo docker load -i $TAR_FILE && \
# sudo docker load -i $NGINX_TAR_FILE && \
# sudo docker compose up -d"

# ssh -t -p $SSH_PORT "${SSH_USER}@${SSH_HOST}" "$SSH_COMMAND"


# echo ""
# echo "Step 5: Cleaning up local .tar files..."
# echo "-----------------------------------------------"

# rm -f $TAR_FILE
# rm -f $NGINX_TAR_FILE


# echo ""
# echo "✅ Deployment completed successfully!"