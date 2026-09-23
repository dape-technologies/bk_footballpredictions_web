#!/usr/bin/env bash
set -Eeuo pipefail

app_root=${1:?Application root is required}
stage_name=${2:?Stage name is required}

if [[ "$app_root" != /home/*/* || "$stage_name" != .deploy-frontend-* ]]; then
  echo "Refusing unsafe deployment paths." >&2
  exit 1
fi

stage="$app_root/$stage_name"
current="$app_root/frontend_dist"
previous="$app_root/.frontend-previous"

test -f "$stage/index.html"
test -f "$stage/manifest.webmanifest"

rm -rf -- "$previous"
if [[ -d "$current" ]]; then
  mv -- "$current" "$previous"
fi

if ! mv -- "$stage" "$current"; then
  if [[ -d "$previous" ]]; then
    mv -- "$previous" "$current"
  fi
  exit 1
fi

mkdir -p "$app_root/tmp"
touch "$app_root/tmp/restart.txt"
