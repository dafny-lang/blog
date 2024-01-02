#!/bin/bash

set -e

if command -v dafny > /dev/null 2>&1
then
  echo
  echo "*** Verification of the clear specification blog post"
else
    echo "Verification requires dafny to be installed"
    exit 1
fi

./extract.pl ../../../_posts/2023-08-15-clear-specification-and-implementation.markdown > clear-spec.dfy

dafny verify clear-spec.dfy
