#!/bin/bash
cd core/
npx jest
./rexxt tests/dogfood/*
cd../extras/functions/excel
npx jest
