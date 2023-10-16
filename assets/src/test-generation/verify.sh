#!/bin/bash

set -e

if command -v dafny > /dev/null 2>&1
then
  echo 
  echo "*** Verification of the test generation blog post"
else
    echo "Verification requires dafny to be installed"
    exit 1
fi

cd "$(dirname "$0")"

rm -rf tests*
rm -rf reports

echo "*** Generating 2 block based tests for the original example..."
dafny generate-tests Block chess.dfy > tests-block.dfy
dafny test tests-block.dfy > tests-block-results.txt

echo "*** Generating 3 path based tests for the original example..."
dafny generate-tests Path chess.dfy > tests-path.dfy
dafny test tests-path.dfy > tests-path-results.txt

echo "*** Generating a coverage report for the Threatens predicate..."
dafny generate-tests Block --coverage-report:reports chessWithQuantifiers.dfy 1> /dev/null

echo "*** Generating path based tests with a lot of inlining (takes a few minutes)..."
dafny generate-tests Path chessWithQuantifiers.dfy > tests-a-lot.dfy
dafny test tests-a-lot.dfy > tests-a-lot-results.txt

for file in `ls *.dfy`
do 
  echo "Verifying $file..." 
  dafny verify $file
done