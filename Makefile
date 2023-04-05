# make check:
#   Steps to verify that the blog posts are not broken
# 
# make generate:
#   Steps to regenerate blog posts so that they are not broken
#
# make watch-X: (there can be multiple similar)
#   Continuously rebuilds the blog post labelled X for development.
default: check

check:
	node builders/addictive-verification-verify.js _posts/2023-04-12-making-verification-addictive-visual-verification-feedback-for-dafny.markdown

generate:
	node builders/addictive-verification-verify.js --regenerate _posts/2023-04-12-making-verification-addictive-visual-verification-feedback-for-dafny.markdown

watch-addictive:
	node builders/addictive-verification-verify.js --watch _posts/2023-04-12-making-verification-addictive-visual-verification-feedback-for-dafny.markdown