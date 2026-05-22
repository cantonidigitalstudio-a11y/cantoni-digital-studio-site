#!/usr/bin/env bash
set -euo pipefail

DEVICE_IP="${1:-${SAMSUNG_ADB_IP:-192.168.1.221}}"
DEVICE_PORT="${SAMSUNG_ADB_PORT:-5555}"
DEVICE="${DEVICE_IP}:${DEVICE_PORT}"

echo "target=${DEVICE}"

if ping -c 1 -W 1000 "$DEVICE_IP" >/dev/null 2>&1; then
  echo "network=reachable"
else
  echo "network=unreachable"
  echo "hint=Samsung control session is unreachable at this IP. Wake the phone or refresh the ADB TCP session via USB/trusted debugging, then rerun."
  exit 2
fi

if nc -vz -G 3 "$DEVICE_IP" "$DEVICE_PORT" >/dev/null 2>&1; then
  echo "adb_port=open"
else
  echo "adb_port=closed"
  echo "hint=Wireless debugging TCP port is not accepting connections. Re-enable ADB over TCP from a trusted session or USB."
  exit 3
fi

adb start-server >/dev/null
adb disconnect "$DEVICE" >/dev/null 2>&1 || true
adb connect "$DEVICE" >/dev/null

state="$(adb devices | awk -v d="$DEVICE" '$1 == d { print $2 }')"
if [ "$state" != "device" ]; then
  echo "adb_state=${state:-missing}"
  echo "hint=ADB reached the phone but did not enter device state."
  exit 4
fi

adb -s "$DEVICE" shell svc power stayon true >/dev/null 2>&1 || true
adb -s "$DEVICE" shell settings put global wifi_sleep_policy 2 >/dev/null 2>&1 || true
adb -s "$DEVICE" shell settings put global stay_on_while_plugged_in 7 >/dev/null 2>&1 || true
adb -s "$DEVICE" shell input keyevent 224 >/dev/null 2>&1 || true

model="$(adb -s "$DEVICE" shell getprop ro.product.model | tr -d '\r')"
ip_addr="$(adb -s "$DEVICE" shell ip -f inet addr show wlan0 | awk '/inet / { print $2; exit }' | tr -d '\r')"
tcp_port="$(adb -s "$DEVICE" shell getprop service.adb.tcp.port | tr -d '\r')"
wifi_sleep="$(adb -s "$DEVICE" shell settings get global wifi_sleep_policy | tr -d '\r')"
stay_on="$(adb -s "$DEVICE" shell settings get global stay_on_while_plugged_in | tr -d '\r')"

echo "adb_state=device"
echo "model=${model}"
echo "wlan0=${ip_addr}"
echo "tcp_port=${tcp_port}"
echo "wifi_sleep_policy=${wifi_sleep}"
echo "stay_on_while_plugged_in=${stay_on}"
