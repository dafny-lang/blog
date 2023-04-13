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