#!/bin/sh
# Assemble installable extension directories: build/firefox and build/chrome.
# Shared code lives in src/; each browser directory contributes its manifest
# and any browser-specific files on top.
set -eu
cd "$(dirname "$0")"

for target in firefox chrome; do
    rm -rf "build/$target"
    mkdir -p "build/$target"
    cp src/* "build/$target/"
    cp "$target"/* "build/$target/"
done

echo "Built build/firefox and build/chrome"
