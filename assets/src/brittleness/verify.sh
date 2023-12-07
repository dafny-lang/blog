#!/bin/bash

set -e

if command -v dafny > /dev/null 2>&1
then
  echo 
  echo "*** Verification of the brittleness blog post"
else
    echo "Verification requires dafny to be installed"
    exit 1
fi

cd "$(dirname "$0")"

(dafny verify RationalAdd.dfy > RationalAdd.dfy.out) || true
diff RationalAdd.dfy.out RationalAdd.dfy.expect
rm -f RationalAdd.dfy.out
dafny verify TriangleSum.dfy
