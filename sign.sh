#!/bin/sh
# Sign the Firefox extension via addons.mozilla.org using web-ext inside
# Docker. Credentials are read from .env (see .env.example).
# The signed .xpi is placed in dist/ (tracked in git), latest version only.
set -eu
cd "$(dirname "$0")"

if [ ! -f .env ]; then
    echo "Missing .env — copy .env.example and fill in your AMO API credentials." >&2
    exit 1
fi

./build.sh

docker run --rm \
    -v "$PWD":/src -w /src \
    --env-file .env \
    node:22-alpine \
    npx --yes web-ext@8 sign \
        --channel=unlisted \
        --source-dir=/src/build/firefox \
        --artifacts-dir=/src/web-ext-artifacts

version=$(grep -o '"version": *"[^"]*"' firefox/manifest.json | cut -d'"' -f4)
mkdir -p dist
rm -f dist/*.xpi
mv "$(ls -t web-ext-artifacts/*.xpi | head -1)" "dist/env-url-toggle-$version.xpi"
echo "Signed: dist/env-url-toggle-$version.xpi"
