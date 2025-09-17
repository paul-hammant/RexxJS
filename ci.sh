#!/bin/bash
cd core/
npx jest
./rexxt tests/dogfood/*

# Iterate over each subdirectory in extras/functions and run tests
for dir in ../extras/functions/*/; do
  cd "$dir"
  npx jest
  cd -
done
