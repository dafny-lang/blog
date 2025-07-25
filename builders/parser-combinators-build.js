#!/usr/bin/env node

/**
 * Build script for parser combinators blog post
 * This script extracts Dafny snippets from HTML, compiles them to JavaScript, and sets up the integration
 * @template T
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  dafnyPath: 'dafny',
  jsOutputDir: 'assets/js/parsers',
  includesDir: '_includes',
  htmlFile: '_includes/parser-combinators.html',
  parserSnippets: 'assets/js/parsers/ParserSnippets.dfy',
  sexprParser: 'assets/js/parsers/SExprParser.dfy'
};

// Utility functions with generic types
/**
 * @param {string} message
 */
function log(message) {
  console.log(message);
}

/**
 * @param {string} message
 */
function error(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * @param {string} command
 * @param {string} errorMessage
 * @returns {string}
 */
function runCommand(command, errorMessage) {
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return result.trim();
  } catch (err) {
    console.error(`${errorMessage}`);
    console.error(`Command: ${command}`);
    if (err.stdout) {
      console.error('STDOUT:', err.stdout);
    }
    if (err.stderr) {
      console.error('STDERR:', err.stderr);
    }
    console.error('Exit code:', err.status);
    process.exit(1);
  }
}

/**
 * @returns {boolean}
 */
function checkDafnyCompiler() {
  log('Checking for Dafny compiler...');
  try {
    const version = runCommand(`${config.dafnyPath} --version`, 'Failed to check Dafny version');
    log(`Dafny compiler found: ${version}`);
    return true;
  } catch (err) {
    error(`Dafny compiler not found in PATH.
Please install Dafny and ensure it's available in your PATH.
You can download Dafny from: https://github.com/dafny-lang/dafny/releases

Note: This build script requires Dafny to be properly installed in the PATH.`);
  }
}

/**
 * Extract Dafny parser definitions from HTML and generate ParserSnippets.dfy
 */
function extractDafnySnippets() {
  log('Extracting Dafny snippets from HTML...');

  if (!fileExists(config.htmlFile)) {
    error(`HTML file not found: ${config.htmlFile}`);
  }

  const htmlContent = fs.readFileSync(config.htmlFile, 'utf8');

  // Extract code blocks with parser-definition class
  const parserBlockRegex = /<pre><code[^>]*class="parser-definition"[^>]*>(.*?)<\/code><\/pre>/gs;
  /** @type {Array<{name: string, definition: string}>} */
  const extractedParsers = [];
  /** @type {string[]} */
  const parserNames = [];
  let match;

  while ((match = parserBlockRegex.exec(htmlContent)) !== null) {
    let codeBlock = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    // Extract all const definitions from this code block
    const lines = codeBlock.split('\n');
    const constLines = lines.filter(line => line.trim().startsWith('const '));

    for (const constLine of constLines) {
      const constMatch = constLine.match(/const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:=\s*(.+)/);
      if (constMatch) {
        const parserName = constMatch[1];
        const parserDef = constMatch[2];

        extractedParsers.push({ name: parserName, definition: parserDef });
        parserNames.push(parserName);
      }
    }
  }

  if (extractedParsers.length === 0) {
    error('No parsers found with class="parser-definition"');
  }

  // Generate the Dafny module
  let snippetsContent = `/*
 * Parser Snippets in Dafny
 * This file is auto-generated from the HTML file
 * DO NOT EDIT DIRECTLY
 */
module ParserSnippets {
  import opened Std.Parsers.StringBuilders

`;

  // Add the extracted parser definitions
  for (const parser of extractedParsers) {
    snippetsContent += `  // Parser: ${parser.name}\n`;
    snippetsContent += `  const ${parser.name} := ${parser.definition}\n\n`;
  }

  // Add generic result type and parse method
  snippetsContent += `  // Generic result type for parser results
  datatype Result<T> = 
    | Success(value: T)
    | Failure(error: string)

  // Generic parse method that works with any parser
  method {:extern "ParserSnippets", "ParseJS"} 
  Parse<T>(parser: B<T>, input: string) returns (result: Result<(T, string)>)
  {
    var parseResult := parser.Apply(input);
    match parseResult {
      case ParseSuccess(value, remaining) =>
        result := Success((value, InputToString(remaining)));
      case ParseFailure(_, _) =>
        result := Failure(FailureToString(input, parseResult));
    }
  }
}
`;

  // Write the snippets file
  fs.writeFileSync(config.parserSnippets, snippetsContent);
  log(`Generated ${config.parserSnippets} with ${extractedParsers.length} parsers: ${parserNames.join(', ')}`);
}

/**
 * @param {string} filePath
 */
function fixDuplicateConstructors(filePath) {
  log(`Fixing duplicate constructors in ${filePath}...`);

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fixedLines = [];

  let inClass = false;
  let constructorCount = 0;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track if we're inside a class
    if (/\s*\$module\.\w+\s*=\s*class\s+\w+\s*\{/.test(line)) {
      inClass = true;
      constructorCount = 0;
      braceCount = 1;
      fixedLines.push(line);
      continue;
    }

    // Track braces to know when we exit the class
    if (inClass) {
      braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (braceCount <= 0) {
        inClass = false;
        constructorCount = 0;
      }
    }

    // Check for constructor method definitions (not constructor calls)
    if (inClass && /^\s*constructor\s*\(/.test(line)) {
      constructorCount++;
      if (constructorCount > 1) {
        // Comment out duplicate constructor
        fixedLines.push('    // DUPLICATE CONSTRUCTOR: ' + line.trim());

        // Skip lines until we find the closing brace of this constructor
        let j = i + 1;
        let constructorBraceCount = 1;
        while (j < lines.length && constructorBraceCount > 0) {
          const nextLine = lines[j];
          constructorBraceCount += (nextLine.match(/\{/g) || []).length - (nextLine.match(/\}/g) || []).length;
          fixedLines.push('    // ' + nextLine.trim());
          j++;
        }
        // Skip the processed lines
        i = j - 1;
        continue;
      }
    }

    fixedLines.push(line);
  }

  // Write the fixed content back
  fs.writeFileSync(filePath, fixedLines.join('\n'));
  log(`Fixed duplicate constructors in ${filePath}`);
}

/**
 * Fix browser compatibility issues in generated JavaScript
 * @param {string} filePath
 */
function fixBrowserCompatibility(filePath) {
  log(`Fixing browser compatibility in ${filePath}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  
  // All require() calls will be handled by the require() mock in the HTML
  // Only remove Node.js specific code that can't be mocked
  
  // Remove or stub other Node.js specific code
  content = content.replace(/_dafny\.HandleHaltExceptions\([^)]+\);/g, '// Removed Node.js specific halt exception handling');
  
  fs.writeFileSync(filePath, content);
  log(`Fixed browser compatibility in ${filePath}`);
}

/**
 * Compile all Dafny files together to share runtime and avoid conflicts
 */
function compileAllDafnyFiles() {
  log('Compiling all Dafny files together...');

  // Check if all required files exist
  if (!fileExists(config.sexprParser)) {
    error(`Dafny file not found: ${config.sexprParser}`);
  }
  if (!fileExists(config.parserSnippets)) {
    error(`Dafny file not found: ${config.parserSnippets}`);
  }

  // Compile all files together in a single command
  const outputFile = `${config.jsOutputDir}/parsers-combined.js`;
  const command = `${config.dafnyPath} translate js --no-verify --standard-libraries --include-runtime --output:${outputFile} ${config.sexprParser} ${config.parserSnippets}`;
  runCommand(command, `Failed to compile Dafny files`);

  // Fix duplicate constructors
  fixDuplicateConstructors(outputFile);
  
  // Fix browser compatibility issues
  fixBrowserCompatibility(outputFile);
  
  // Clean up .dtr files
  const dtrFile = outputFile.replace('.js', '-js.dtr');
  if (fileExists(dtrFile)) {
    fs.unlinkSync(dtrFile);
    log(`Removed ${dtrFile}`);
  }
  
  log(`Generated combined JavaScript file: ${outputFile}`);
}



/**
 * Main build function
 */
function main() {
  log('Build script for parser combinators blog post');
  log('================================================');

  // Check prerequisites
  checkDafnyCompiler();

  if (!fileExists(config.sexprParser)) {
    error(`SExprParser.dfy not found: ${config.sexprParser}`);
  }

  // Create necessary directories
  log('Creating directories...');
  ensureDir(config.jsOutputDir);

  // Step 1: Extract Dafny snippets from HTML and create ParserSnippets.dfy
  extractDafnySnippets();

  // Step 2: Compile all Dafny files together to share runtime and avoid conflicts
  compileAllDafnyFiles();

  // Success message
  log('');
  log('Build pipeline completed successfully!');
  log('Generated files:');
  log(`  - ${config.jsOutputDir}/parsers-combined.js`);
  log('Static files:');
  log(`  - ${config.jsOutputDir}/parser-integration.js (static)`);
  log(`  - ${config.jsOutputDir}/bignumber.js (static)`);
  log('');
  log('Jekyll will automatically serve these files from /blog/assets/js/parsers/');
}

// Run the main function
if (require.main === module) {
  try {
    main();
  } catch (err) {
    error(`Unexpected error: ${err.message}`);
  }
}