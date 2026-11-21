#!/bin/sh
set -eu
attempt=1
while [ "$attempt" -le 15 ]; do
  adb shell uiautomator dump /sdcard/qmaps-ui.xml >/dev/null 2>&1 || true
  if adb shell cat /sdcard/qmaps-ui.xml 2>/dev/null | grep -q 'Découvrir'; then
    echo 'QMAPS discovery visible'
    exit 0
  fi
  sleep 2
  attempt=$((attempt + 1))
done
adb shell dumpsys activity activities | grep -E 'mResumedActivity|topResumedActivity' || true
adb logcat -b crash -d -t 35
exit 1
