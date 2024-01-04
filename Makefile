# make check:
#   Steps to verify that the blog posts are not broken
# 
# make generate:
#   Steps to regenerate blog posts so that they are not broken
#
# make watch-X: (there can be multiple similar)
#   Continuously rebuilds the blog post labelled X for development
default: check

check:
	node builders/verification-compelling-verify.js _includes/verification-compelling-intro.html
	assets/src/brittleness/verify.sh
	assets/src/test-generation/verify.sh
	assets/src/insertion-sort/verify.sh
	assets/src/proof-dependencies/verify.sh
	assets/src/brittleness/verify.sh
	assets/src/teaching-material/verify.sh
	assets/src/standard-libraries/test.sh
	assets/src/semantics-of-regular-expressions/verify.sh
	(cd assets/src/clear-specification-and-implementation && ./verify.sh)

generate:
	node builders/verification-compelling-verify.js --regenerate _includes/verification-compelling-intro.html
	python3 builders/madoko-gen.py insertion-sort --check
	python3 builders/madoko-gen.py proof-dependencies --check
	python3 builders/madoko-gen.py brittleness --check
	python3 builders/madoko-gen.py teaching-dafny --check
# Can't use --check on this one because it requires an extra option (--standard-libraries).
# But standard-libraries/test.sh will verify the source and more anyway.
	python3 builders/madoko-gen.py standard-libraries

watch-compelling:
	node builders/verification-compelling-verify.js --watch _includes/verification-compelling-intro.html

watch-types:
	node builders/types-and-programming-languages.js --watch _posts/2023-07-14-types-and-programming-languages.markdown assets/js/types-and-programming-languages.dfy.js
