#!/usr/bin/env bash
set -e

echo "Setting up iojs"
curl https://raw.githubusercontent.com/creationix/nvm/v0.25.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install iojs
nvm alias default iojs
nvm use iojs

echo "Installing webpack"
npm install -g webpack

echo "Starting redis"
sudo service redis-server start
