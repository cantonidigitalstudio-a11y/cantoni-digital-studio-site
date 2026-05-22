#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="/Users/emanuelecantoni/Library/Application Support/Google/Chrome"
SRC_PROFILE="Profile 18"
DST_ROOT="/Volumes/Lexar/playwright-profiles/cantoni-gmail"

mkdir -p "$DST_ROOT/Default"

rm -rf "$DST_ROOT/Default"
mkdir -p "$DST_ROOT/Default"

rsync -a \
  --delete \
  --exclude='Singleton*' \
  --exclude='LOCK' \
  --exclude='lockfile' \
  --exclude='*.lock' \
  --exclude='Crashpad' \
  --exclude='ShaderCache' \
  --exclude='GrShaderCache' \
  --exclude='GraphiteDawnCache' \
  --exclude='Local Traces' \
  --exclude='Code Cache' \
  --exclude='GPUCache' \
  --exclude='DawnCache' \
  "$SRC_ROOT/$SRC_PROFILE/" \
  "$DST_ROOT/Default/"

cp "$SRC_ROOT/Local State" "$DST_ROOT/Local State"
touch "$DST_ROOT/First Run"
rm -f "$DST_ROOT/SingletonLock" "$DST_ROOT/SingletonSocket" "$DST_ROOT/SingletonCookie"

echo "SOURCE_PROFILE=$SRC_PROFILE"
echo "DESTINATION_ROOT=$DST_ROOT"
echo "DEFAULT_PROFILE_READY=yes"
