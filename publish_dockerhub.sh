#!/bin/bash
set -e
set -x

# I added DOCKER_HUB_PASSWORD as a secret on Github repo

TAG=$1


docker build --tag xrchat/server .
echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

docker tag xrchat/server xrchat/server:latest
docker push xrchat/server:latest

docker tag xrchat/server xrchat/server:${TAG}
docker push xrchat/server:${TAG}