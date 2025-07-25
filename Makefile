# Makefile for compiling Dafny code to JavaScript and setting up the blog post

# Paths
DAFNY_PATH ?= dafny
DAFNY_SRC_DIR = src/parsers
JS_OUTPUT_DIR = assets/js
SITE_JS_DIR = _site/assets/js

# Dafny source files
SEXPR_PARSER = $(DAFNY_SRC_DIR)/SExprParser.dfy

# JavaScript output files
SEXPR_PARSER_JS = $(JS_OUTPUT_DIR)/sexpr-parser.js
PARSER_EXAMPLES_JS = $(JS_OUTPUT_DIR)/parser-examples.js

# Default target
all: build-js

# Build JavaScript files
build-js:
	@echo "Building JavaScript files..."
	@node builders/parser-combinators-build.js

# Build parser combinators specifically
parser-combinators:
	@echo "Building parser combinators..."
	@node builders/parser-combinators-build.js

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	@rm -rf $(JS_OUTPUT_DIR)/*.js
	@rm -rf $(SITE_JS_DIR)/*.js

# Build the Jekyll site
jekyll:
	@echo "Building Jekyll site..."
	@bundle exec jekyll build --future

# Serve the Jekyll site
serve:
	@echo "Starting Jekyll server..."
	@bundle exec jekyll serve --future

# Full build and serve
build: build-js jekyll serve

.PHONY: all build-js parser-combinators clean jekyll serve build