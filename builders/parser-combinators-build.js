#!/usr/bin/env node

/**
 * Build script for parser combinators blog post
 * This script extracts Dafny snippets from HTML, compiles them to JavaScript, and sets up the integration
 * 
 * CODE SYNCHRONIZATION SYSTEM:
 * ============================
 * This system ensures that code examples in the blog post stay in sync with actual working Dafny code,
 * preventing documentation drift and ensuring examples remain compilable.
 * 
 * How it works:
 * 1. Automatic Code Injection: Extracts snippets from assets/js/parsers/SExprParser.dfy
 * 2. Injection Markers: HTML uses <!-- INJECT:SNIPPET_NAME --> markers that get replaced
 * 3. Build Process: Injection → Parser extraction → LoC counting → Compilation
 * 4. Verification: All code is guaranteed to compile since it's extracted from working files
 * 
 * Benefits:
 * - Always up-to-date code examples
 * - Version-safe (Dafny upgrades automatically reflected)
 * - Compilation tested (extracted from working code)
 * - Zero maintenance (no manual sync needed)
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
  parserSnippetsTemplate: 'assets/js/parsers/ParserSnippetsTemplate.dfy',
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
 * Shared utility: Process SExpr code injection on HTML content
 * @param {string} htmlContent
 * @returns {string}
 */
function processSExprCodeInjection(htmlContent) {
  if (!fileExists(config.sexprParser)) {
    error(`SExprParser.dfy not found: ${config.sexprParser}`);
  }

  const dafnyContent = fs.readFileSync(config.sexprParser, 'utf8');

  // Extract datatype definition
  const datatypeMatch = dafnyContent.match(/datatype SExpr =\s*\n((?:\s*\|[^\n]*\n)*)/);
  if (datatypeMatch) {
    // Format the datatype definition with proper indentation
    const lines = datatypeMatch[1].trim().split('\n');
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        return '  ' + trimmed; // Indent variant lines
      }
      return trimmed;
    });
    const datatypeDefinition = `datatype SExpr =\n${formattedLines.join('\n')}`;
    htmlContent = htmlContent.replace(
      /<!-- INJECT:SEXPR_DATATYPE -->/g,
      `<pre><code>${escapeHtml(datatypeDefinition)}</code></pre>`
    );
  }

  // Extract complete parser combinators section (all 20 lines) using LOC markers
  const parserCombinatorsMatch = dafnyContent.match(/\/\/ LOC_MARKER_START: PARSER_COMBINATORS\s*\n([\s\S]*?)\/\/ LOC_MARKER_END: PARSER_COMBINATORS/);
  if (parserCombinatorsMatch) {
    // Preserve indentation by only trimming trailing whitespace
    const parserCombinatorsCode = parserCombinatorsMatch[1].replace(/\s+$/, '');
    // Replace using the data-parser attribute marker (much more reliable)
    htmlContent = htmlContent.replace(
      /<code data-parser="sexpr-main">[\s\S]*?<\/code>/,
      `<code data-parser="sexpr-main">${escapeHtml(parserCombinatorsCode)}</code>`
    );
  }

  // Extract ToString method from the actual Dafny file (if needed for HTML injection)
  const toStringMatch = dafnyContent.match(/function ToString\(indent: string := ""\): string \{([\s\S]*?)(?=\n\s*function|\n\s*method|\n\s*\})/);
  if (toStringMatch) {
    const toStringMethod = `function ToString(indent: string := ""): string {\n${toStringMatch[1].trim()}\n}`;
    htmlContent = htmlContent.replace(
      /<!-- INJECT:SEXPR_TOSTRING -->/g,
      `<pre><code>${escapeHtml(toStringMethod)}</code></pre>`
    );
  }

  return htmlContent;
}

/**
 * Shared utility: Generate ParserSnippets.dfy content
 * @param {string} htmlContent
 * @returns {string}
 */
function generateParserSnippetsContent(htmlContent) {
  // Read the template file
  if (!fileExists(config.parserSnippetsTemplate)) {
    error(`ParserSnippetsTemplate.dfy not found: ${config.parserSnippetsTemplate}`);
  }

  let snippetsContent = fs.readFileSync(config.parserSnippetsTemplate, 'utf8');

  const parserBlockRegex = /<pre><code[^>]*class="parser-definition"[^>]*>(.*?)<\/code><\/pre>/gs;
  const extractedParsers = [];
  let match;

  while ((match = parserBlockRegex.exec(htmlContent)) !== null) {
    let codeBlock = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/=&gt;/g, '=>')
      .trim();

    // Extract all const definitions from this code block (supporting multiline)
    const constRegex = /(const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::\s*B<string>\s*)?:=\s*((?:[^;]|;(?!\s*const\s))*?)(?=\s*(?:const\s|$)))/gs;
    let constMatch;
    let found = false;

    while ((constMatch = constRegex.exec(codeBlock)) !== null) {
      const parserName = constMatch[2];
      let fullDefinition = constMatch[1].trim();

      // Clean up the definition - remove extra whitespace and normalize
      fullDefinition = fullDefinition
        .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
        .replace(/\s*\|\|\s*/g, ' || ')  // Normalize || operators
        .replace(/\s*=>\s*/g, ' => ')    // Normalize => operators
        .replace(/\s*,\s*/g, ', ')       // Normalize commas
        .trim();

      extractedParsers.push({ name: parserName, definition: fullDefinition });
      found = true;
    }
    if(!found) {
      console.log("Not found in " + codeBlock);
    }
  }

  if (extractedParsers.length === 0) {
    error('No parser definitions found in HTML file');
  }

  // Generate the parser definitions
  const parserDefinitions = extractedParsers.map(parser =>
    `  // Parser: ${parser.name}\n  ${parser.definition}`
  ).join('\n\n');

  // Replace the injection marker with actual parser definitions
  return snippetsContent.replace(
    /\s*\/\/ INJECT_PARSERS_HERE.*$/m,
    '\n' + parserDefinitions + '\n'
  );
}

/**
 * Shared utility: Update HTML with LoC information
 * @param {string} htmlContent
 * @param {{parserCombinators: number, datatypesAndHelpers: number}} locCounts
 * @returns {string}
 */
function updateHtmlWithLocContent(htmlContent, locCounts) {
  let updatedContent = htmlContent;

  // Update parser combinators LoC
  updatedContent = updatedContent.replace(
    /<span id="parser-combinators-loc">\d+<\/span>/g,
    `<span id="parser-combinators-loc">${locCounts.parserCombinators}</span>`
  );

  // Update datatypes and helpers LoC
  updatedContent = updatedContent.replace(
    /<span id="datatypes-helpers-loc">\d+<\/span>/g,
    `<span id="datatypes-helpers-loc">${locCounts.datatypesAndHelpers}</span>`
  );

  return updatedContent;
}

/**
 * Extract and inject code snippets from SExprParser.dfy into HTML
 */
function injectSExprCodeSnippets() {
  log('Injecting SExpr code snippets from actual Dafny file...');

  if (!fileExists(config.htmlFile)) {
    error(`HTML file not found: ${config.htmlFile}`);
  }

  const htmlContent = fs.readFileSync(config.htmlFile, 'utf8');
  const updatedHtmlContent = processSExprCodeInjection(htmlContent);

  // Write the updated HTML back
  fs.writeFileSync(config.htmlFile, updatedHtmlContent);
  log('Successfully injected SExpr code snippets into HTML');

  // Note: SExprParser.dfy verification is handled during the compilation step
  // Individual verification requires standard libraries setup which may not be available
  log('✓ SExprParser.dfy code injection completed - will be verified during compilation');
}

/**
 * Helper function to escape HTML entities
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  const snippetsContent = generateParserSnippetsContent(htmlContent);

  // Write the snippets file
  fs.writeFileSync(config.parserSnippets, snippetsContent);

  // Count parsers for logging
  const parserCount = (snippetsContent.match(/\/\/ Parser:/g) || []).length;
  const parserNames = [...snippetsContent.matchAll(/\/\/ Parser: (\w+)/g)].map(match => match[1]);

  log(`Generated ${config.parserSnippets} with ${parserCount} parsers: ${parserNames.join(', ')}`);
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
 * Count lines of code between markers in SExprParser.dfy
 * @returns {{datatypesAndHelpers: number, parserCombinators: number}}
 */
function countLinesOfCode() {
  log('Counting lines of code in SExprParser.dfy...');

  if (!fileExists(config.sexprParser)) {
    error(`SExprParser.dfy not found: ${config.sexprParser}`);
  }

  const content = fs.readFileSync(config.sexprParser, 'utf8');
  const lines = content.split('\n');

  let datatypesAndHelpersCount = 0;
  let parserCombinatorsCount = 0;
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for section markers first
    if (trimmedLine.includes('LOC_MARKER_START: DATATYPES_AND_HELPERS')) {
      currentSection = 'datatypes';
      continue;
    } else if (trimmedLine.includes('LOC_MARKER_END: DATATYPES_AND_HELPERS')) {
      currentSection = null;
      continue;
    } else if (trimmedLine.includes('LOC_MARKER_START: PARSER_COMBINATORS')) {
      currentSection = 'combinators';
      continue;
    } else if (trimmedLine.includes('LOC_MARKER_END: PARSER_COMBINATORS')) {
      currentSection = null;
      continue;
    }

    // Skip empty lines and comment-only lines when counting
    if (trimmedLine === '' || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine === '*/') {
      continue;
    }

    // Count lines in current section
    if (currentSection === 'datatypes') {
      datatypesAndHelpersCount++;
    } else if (currentSection === 'combinators') {
      parserCombinatorsCount++;
    }
  }

  log(`Lines of code - Datatypes and helpers: ${datatypesAndHelpersCount}, Parser combinators: ${parserCombinatorsCount}`);

  return {
    datatypesAndHelpers: datatypesAndHelpersCount,
    parserCombinators: parserCombinatorsCount
  };
}

/**
 * Update a specific span marker in HTML content
 * @param {string} htmlContent - The HTML content to update
 * @param {string} spanId - The ID of the span to update
 * @param {number} value - The new value to set
 * @param {string} description - Description for logging
 * @returns {{content: string, updated: boolean}} - Updated content and success flag
 */
function updateSpanMarker(htmlContent, spanId, value, description) {
  const pattern = new RegExp(`<span id="${spanId}">\\d+</span>`);
  const replacement = `<span id="${spanId}">${value}</span>`;

  if (pattern.test(htmlContent)) {
    const updatedContent = htmlContent.replace(pattern, replacement);
    log(`Updated ${description}: ${value}`);
    return { content: updatedContent, updated: true };
  } else {
    log(`Warning: Could not find ${spanId} span marker in HTML file`);
    return { content: htmlContent, updated: false };
  }
}

/**
 * Update the HTML file with LoC information using span markers
 * @param {{datatypesAndHelpers: number, parserCombinators: number}} locCounts
 */
function updateHtmlWithLocInfo(locCounts) {
  log('Updating HTML file with LoC information...');

  if (!fileExists(config.htmlFile)) {
    error(`HTML file not found: ${config.htmlFile}`);
  }

  const htmlContent = fs.readFileSync(config.htmlFile, 'utf8');
  const updatedHtmlContent = updateHtmlWithLocContent(htmlContent, locCounts);

  // Check if anything was actually updated
  if (htmlContent !== updatedHtmlContent) {
    fs.writeFileSync(config.htmlFile, updatedHtmlContent);
    log(`Successfully updated HTML file with LoC information: ${locCounts.parserCombinators} parser combinator lines, ${locCounts.datatypesAndHelpers} datatype/helper lines`);
  } else {
    log(`LoC information already up to date: ${locCounts.parserCombinators} parser combinator lines, ${locCounts.datatypesAndHelpers} datatype/helper lines`);
  }
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
  const command = `${config.dafnyPath} translate js --standard-libraries --include-runtime --output:${outputFile} ${config.sexprParser} ${config.parserSnippets}`;
  log("Running " + command);
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

  // Step 1: Inject SExpr code snippets from actual Dafny file into HTML
  injectSExprCodeSnippets();

  // Step 2: Extract Dafny snippets from HTML and create ParserSnippets.dfy
  extractDafnySnippets();

  // Step 3: Count lines of code and update HTML
  const locCounts = countLinesOfCode();
  updateHtmlWithLocInfo(locCounts);

  // Step 4: Compile all Dafny files together to share runtime and avoid conflicts
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

/**
 * String version of injectSExprCodeSnippets for check mode
 * @param {string} htmlContent
 * @returns {string}
 */
function injectSExprCodeSnippetsToString(htmlContent) {
  if (!fileExists(config.sexprParser)) {
    error(`SExprParser.dfy not found: ${config.sexprParser}`);
  }

  const dafnyContent = fs.readFileSync(config.sexprParser, 'utf8');

  // Extract datatype definition
  const datatypeMatch = dafnyContent.match(/datatype SExpr =\s*\n((?:\s*\|[^\n]*\n)*)/);
  if (datatypeMatch) {
    // Format the datatype definition with proper indentation
    const lines = datatypeMatch[1].trim().split('\n');
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        return '  ' + trimmed; // Indent variant lines
      }
      return trimmed;
    });
    const datatypeDefinition = `datatype SExpr =\n${formattedLines.join('\n')}`;
    htmlContent = htmlContent.replace(
      /<!-- INJECT:SEXPR_DATATYPE -->/g,
      `<pre><code>${escapeHtml(datatypeDefinition)}</code></pre>`
    );
  }

  // Extract main parser definition (simplified for readability)
  const parserMatch = dafnyContent.match(/const parserSExpr: B<SExpr> :=\s*\n\s*Rec\(\(SExpr: B<SExpr>\) =>\s*\n([\s\S]*?)(?=\s*\)\s*const|\s*\)\s*\/\/)/);
  if (parserMatch) {
    const parserDefinition = `const parserSExpr: B<SExpr> :=\n  Rec((SExpr: B<SExpr>) =>\n${parserMatch[1].trim()}\n  )`;
    htmlContent = htmlContent.replace(
      /<!-- INJECT:SEXPR_PARSER -->/g,
      `<pre><code>${escapeHtml(parserDefinition)}</code></pre>`
    );
  }

  // Extract ToString method from the actual Dafny file (if needed for HTML injection)
  const toStringMatch = dafnyContent.match(/function ToString\(indent: string := ""\): string \{([\s\S]*?)(?=\n\s*function|\n\s*method|\n\s*\})/);
  if (toStringMatch) {
    const toStringMethod = `function ToString(indent: string := ""): string {\n${toStringMatch[1].trim()}\n}`;
    htmlContent = htmlContent.replace(
      /<!-- INJECT:SEXPR_TOSTRING -->/g,
      `<pre><code>${escapeHtml(toStringMethod)}</code></pre>`
    );
  }

  return htmlContent;
}

/**
 * String version of updateHtmlWithLocInfo for check mode
 * @param {string} htmlContent
 * @param {{parserCombinators: number, datatypesHelpers: number}} locCounts
 * @returns {string}
 */
function updateHtmlWithLocInfoToString(htmlContent, locCounts) {
  let updatedContent = htmlContent;

  // Update parser combinators LoC
  updatedContent = updatedContent.replace(
    /<span id="parser-combinators-loc">\d+<\/span>/g,
    `<span id="parser-combinators-loc">${locCounts.parserCombinators}</span>`
  );

  // Update datatypes and helpers LoC
  updatedContent = updatedContent.replace(
    /<span id="datatypes-helpers-loc">\d+<\/span>/g,
    `<span id="datatypes-helpers-loc">${locCounts.datatypesAndHelpers}</span>`
  );

  return updatedContent;
}

/**
 * Check mode - verify files would be identical without overwriting
 */
function checkMode() {
  log('Build script for parser combinators blog post (CHECK MODE)');
  log('==========================================================');
  log('Verifying that generated files would match existing files...');

  // Check prerequisites
  checkDafnyCompiler();

  if (!fileExists(config.sexprParser)) {
    error(`SExprParser.dfy not found: ${config.sexprParser}`);
  }

  let allMatch = true;
  const mismatches = [];

  // Step 1: Check if HTML injection would change the file
  const originalHtml = fs.readFileSync(config.htmlFile, 'utf8');
  const tempHtml = processSExprCodeInjection(originalHtml);
  if (originalHtml !== tempHtml) {
    allMatch = false;
    mismatches.push(`${config.htmlFile} - SExpr code injection would modify file`);
  }

  // Step 2: Check if ParserSnippets.dfy would be different
  const generatedSnippets = generateParserSnippetsContent(tempHtml);
  if (fileExists(config.parserSnippets)) {
    const existingSnippets = fs.readFileSync(config.parserSnippets, 'utf8');
    if (existingSnippets !== generatedSnippets) {
      allMatch = false;
      mismatches.push(`${config.parserSnippets} - Generated content differs from existing file`);
    }
  } else {
    allMatch = false;
    mismatches.push(`${config.parserSnippets} - File does not exist`);
  }

  // Step 3: Check if LoC counts would change HTML
  const locCounts = countLinesOfCode();
  const htmlWithLoc = updateHtmlWithLocContent(tempHtml, locCounts);
  if (tempHtml !== htmlWithLoc) {
    allMatch = false;
    mismatches.push(`${config.htmlFile} - LoC information would be updated`);
  }

  // Step 4: Check if compiled JS would be different (this is expensive, so we skip it in check mode)
  // The assumption is that if the Dafny source files haven't changed, the JS output won't change

  // Report results
  if (allMatch) {
    log('✓ All files are up to date - no changes needed');
    process.exit(0);
  } else {
    log('✗ Files would be modified:');
    mismatches.forEach(mismatch => log(`  - ${mismatch}`));
    log('');
    log('Run without --check to update the files');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isCheckMode = args.includes('--check');

// Run the appropriate function
if (require.main === module) {
  try {
    if (isCheckMode) {
      checkMode();
    } else {
      main();
    }
  } catch (err) {
    error(`Unexpected error: ${err.message}`);
  }
}