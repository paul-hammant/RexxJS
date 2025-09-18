#!/bin/bash

set -e

cd core/
npx jest
./rexxt tests/dogfood/*
cd ..

# Iterate over each subdirectory in extras/functions and run tests
for dir in extras/functions/*/; do
  dirname=$(basename "$dir")
  if [ "$dirname" = "r-inspired" ] || [ "$dirname" = "scipy-inspired" ]; then
    # Handle directories with subdirectories (r-inspired, scipy-inspired)
    for subdir in "$dir"*/; do
      if [ -d "$subdir" ]; then
        echo "Running tests in $subdir"
        cd "$subdir"
        if [ -f "package.json" ]; then
          npm test
        fi
        if ls *test.rexx 1> /dev/null 2>&1; then
          ../../../core/rexxt *test.rexx
        fi
        cd - > /dev/null
      fi
    done
  else
    # Handle other function directories normally
    cd "$dir"
    # Skip empty directories
    if [ "$(ls -A .)" ]; then
      npx jest
      if ls *test.rexx 1> /dev/null 2>&1; then
        ../../core/rexxt *test.rexx
      fi
    else
      echo "Skipping empty directory: $dir"
    fi
    cd - > /dev/null
  fi
done
