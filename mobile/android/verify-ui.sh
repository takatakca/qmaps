#!/bin/sh
set -eu
result=$(adb shell am instrument -w -r ca.qmaps.mobile.test/ca.qmaps.mobile.test.JourneyInstrumentation)
printf '%s\n' "$result"
printf '%s\n' "$result" | grep -q 'qmaps_result=passed'
