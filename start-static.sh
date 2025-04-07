#!/bin/bash

# Run the static server which uses the already built client
export NODE_ENV=production
node dist/static-server.js
