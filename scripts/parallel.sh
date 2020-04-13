#!/bin/bash
set -eu

pids=""
for cmd in "$@"; do {
  # echo $cmd
  eval $cmd &
  pids+="$! ";
} done

trap "kill $pids" SIGINT
wait $pids