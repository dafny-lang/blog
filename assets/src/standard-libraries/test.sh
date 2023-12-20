#!/bin/bash

set -e

if command -v dafny > /dev/null 2>&1
then
  echo 
  echo "*** Verification/testing of the standard libraries blog post"
else
    echo "Verification/testing requires dafny to be installed"
    exit 1
fi

cd "$(dirname "$0")"

dafny run dfyconfig.toml > actual-output.txt
diff expected-output.txt actual-output.txt
