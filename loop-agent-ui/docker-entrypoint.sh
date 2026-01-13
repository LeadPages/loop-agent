#!/bin/sh
set -e

# Fix permissions on volume mount if it exists and we're root
if [ "$(id -u)" = "0" ] && [ -d "/loop-data" ]; then
  chown -R nextjs:nodejs /loop-data
  exec su-exec nextjs:nodejs node server.js
else
  exec node server.js
fi
