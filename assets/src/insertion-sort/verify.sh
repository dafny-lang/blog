#!/bin/bash

set -e

if command -v dafny > /dev/null 2>&1
then
  echo 
  echo "*** Verification of the insertion sort blog post"
else
    echo "Verification requires dafny to be installed"
    exit 1
fi

cd "$(dirname "$0")"

for file in `ls *.dfy`
do 
  echo "Verifying $file..." 
  dafny verify $file
done