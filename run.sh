#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -d "$DIR/dist" ]; then
  echo "Building..."
  cd "$DIR" && npm run build
fi
node "$DIR/dist/index.js" "$@"
