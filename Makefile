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

generate:
	node builders/verification-compelling-verify.js --regenerate _includes/verification-compelling-intro.html

watch-compelling:
	node builders/verification-compelling-verify.js --watch _includes/verification-compelling-intro.html

watch-types:
	node builders/types-and-programming-languages.js --watch _posts/2023-06-30-types-and-programming-languages.markdown assets/js/types-and-programming-languages.dfy.js