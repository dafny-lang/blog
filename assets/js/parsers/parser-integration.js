/**
 * Generic Parser Integration
 * This file discovers and initializes parser demos from HTML classes/data attributes
 * This is a static file that can be edited as needed
 */

// Helper function to convert Dafny strings to JavaScript strings
function FromDafnyString(s) {
    return s.toVerbatimString();
}

// Helper function to convert JavaScript strings to Dafny strings
function ToDafnyString(s) {
    return _dafny.Seq.UnicodeFromString(s);
}

// Helper function to convert Dafny identifier names to JavaScript compiled names
// Dafny encodes underscores as double underscores in JavaScript compilation
function toDafnyCompiledName(dafnyName) {
    return dafnyName.replace(/_/g, '__');
}

// Helper function to check if a value is a Dafny string (sequence of characters)
function isDafnyString(value) {
    return value && 
           typeof value === 'object' && 
           value.constructor && 
           value.constructor.name === 'Seq' &&
           value.toVerbatimString !== undefined;
}

// Custom toString function that converts Dafny strings to readable format
function smartDafnyToString(value) {
    if (typeof value === 'string') {
        return value;
    }
    
    if (isDafnyString(value)) {
        return '"' + FromDafnyString(value) + '"';
    }
    
    // Handle arrays/tuples
    if (Array.isArray(value)) {
        const convertedItems = value.map(item => smartDafnyToString(item));
        return '(' + convertedItems.join(', ') + ')';
    }
    
    // Handle objects with properties
    if (value && typeof value === 'object') {
        // Check if it's a tuple-like structure with numeric indices
        const keys = Object.keys(value);
        const isNumericKeys = keys.every(key => !isNaN(parseInt(key)));
        
        if (isNumericKeys && keys.length > 0) {
            // Treat as tuple
            const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
            const convertedItems = sortedKeys.map(key => smartDafnyToString(value[key]));
            return '(' + convertedItems.join(', ') + ')';
        }
    }
    
    // Fall back to default Dafny toString
    return _dafny.toString(value);
}

// Wrapper function for the parser snippets using the generic Parse method
function parseWithSnippet(parserName, input) {
    try {
        // Convert Dafny name to JavaScript compiled name (underscores become double underscores)
        const compiledName = toDafnyCompiledName(parserName);
        
        // Get the parser from the compiled Dafny module
        const parser = ParserSnippets.__default[compiledName];
        if (!parser) {
            return 'Error: Unknown parser: ' + parserName + ' (compiled as: ' + compiledName + ')';
        }

        // Use the generic Parse method (convert JS string to Dafny string)
        const result = ParserSnippets.__default.ParseJS(parser, ToDafnyString(input));

        // Handle the Result<(T, string)> type
        if (result.is_Success) {
            const [value, remaining] = result.dtor_value;
            // Use smartDafnyToString for the parsed value (handles Dafny strings in complex structures)
            const valueStr = typeof value === 'string' ? value : smartDafnyToString(value);
            // Use FromDafnyString for the remaining input (always a string)
            const remainingStr = typeof remaining === 'string' ? remaining : FromDafnyString(remaining);
            return `Parsed: ${valueStr}\nRemaining: "${remainingStr}"`;
        } else {
            const errorStr = typeof result.dtor_error === 'string' ? result.dtor_error : FromDafnyString(result.dtor_error);
            return errorStr;
        }
    } catch (error) {
        return 'Error: ' + error.message;
    }
}

// Wrapper function for S-expression parser
function parseSExpr(input) {
    try {
        const result = SExprParser.__default.ParseSExprJS(ToDafnyString(input));
        // Convert Dafny string result to JavaScript string
        return FromDafnyString(result);
    } catch (error) {
        return 'Error: ' + error.message;
    }
}



// Initialize the main S-expression demo (the compelling demo at the top)
function initializeMainSExprDemo() {
    const input = document.getElementById('input-area');
    const parseButton = document.getElementById('parse-button');
    const outputArea = document.getElementById('output-area');
    const errorDisplay = document.getElementById('error-display');

    if (!input || !parseButton || !outputArea) {
        return; // Main demo not found on this page
    }

    // Set default example if not already set
    if (!input.value) {
        input.value = "(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1)))))";
    }

    function runParser() {
        try {
            const inputValue = input.value;
            if (!inputValue.trim()) {
                if (errorDisplay) errorDisplay.textContent = 'Please enter an S-expression';
                outputArea.textContent = '';
                return;
            }

            if (errorDisplay) errorDisplay.textContent = '';
            
            // Add parsing animation to output area
            outputArea.classList.add('parsing');
            parseButton.disabled = true;
            parseButton.textContent = 'Parsing...';

            setTimeout(() => {
                try {
                    const result = parseSExpr(inputValue);
                    // For the main demo, just show the formatted result or error
                    outputArea.textContent = result;
                    if (errorDisplay) errorDisplay.textContent = '';
                } catch (parseError) {
                    if (errorDisplay) errorDisplay.textContent = 'Parse Error: ' + parseError.message;
                    outputArea.textContent = '';
                } finally {
                    // Remove parsing animation
                    outputArea.classList.remove('parsing');
                    parseButton.disabled = false;
                    parseButton.textContent = 'Parse & Format';
                }
            }, 10);
        } catch (err) {
            if (errorDisplay) errorDisplay.textContent = 'Error: ' + err.message;
            outputArea.textContent = '';
            outputArea.classList.remove('parsing');
            parseButton.disabled = false;
            parseButton.textContent = 'Parse & Format';
        }
    }

    parseButton.addEventListener('click', runParser);

    // Initialize with current input
    runParser();
}

// Initialize all parser examples when the page loads
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the main S-expression demo separately
    initializeMainSExprDemo();
    
    // Initialize building block demos
    document.querySelectorAll('.demo-container').forEach(container => {
        initializeBuildingBlockDemo(container);
    });
});

// Initialize building block demos (the educational examples)
function initializeBuildingBlockDemo(container) {
    // Look for building block demo elements
    const input = container.querySelector('textarea, input[type="text"]');
    const parseButton = container.querySelector('button[id$="-parse-button"]');
    const parsedSpan = container.querySelector('[id$="-parsed"]');
    const remainingSpan = container.querySelector('[id$="-remaining"]');
    const selector = container.querySelector('select');

    // Only initialize if this looks like a building block demo
    if (input && parseButton && parsedSpan && remainingSpan) {
        initializeSnippetDemo(container, input, parseButton, parsedSpan, remainingSpan, selector);
    }
}

// Initialize a parser snippet demo (simple parsers)
function initializeSnippetDemo(container, input, parseButton, parsedSpan, remainingSpan, selector) {
    // Try to determine parser name from context
    let parserName = getParserNameFromContext(container);

    function runParser() {
        try {
            let actualParserName = parserName;

            // Handle dynamic parser selection
            if (selector) {
                actualParserName = selector.value;
            }

            if (!actualParserName) {
                parsedSpan.textContent = 'Error: Could not determine parser name';
                remainingSpan.textContent = '';
                return;
            }

            const result = parseWithSnippet(actualParserName, input.value);
            const resultParts = result.split('\n');

            if (resultParts.length >= 2) {
                const parsedMatch = resultParts[0].match(/Parsed: (.*)/);
                const remainingMatch = resultParts[1].match(/Remaining: (.*)/);

                if (parsedMatch && remainingMatch) {
                    parsedSpan.textContent = parsedMatch[1];
                    remainingSpan.textContent = remainingMatch[1];
                } else {
                    parsedSpan.textContent = result;
                    remainingSpan.textContent = '';
                }
            } else {
                parsedSpan.textContent = result;
                remainingSpan.textContent = '';
            }
        } catch (error) {
            parsedSpan.textContent = 'Error: ' + error.message;
            remainingSpan.textContent = '';
        }
    }

    parseButton.addEventListener('click', runParser);

    if (selector) {
        selector.addEventListener('change', runParser);
    }

    // Initialize with current input
    runParser();
}



// Helper function to extract parser names from const definitions in parser-definition code blocks
function extractParserNamesFromContent(container) {
    const parserNames = [];

    // Look for parser-definition code blocks near this container
    // First, try to find them in the same parent section
    let searchRoot = container.parentElement;
    while (searchRoot && !searchRoot.querySelector('pre code.parser-definition')) {
        searchRoot = searchRoot.parentElement;
        // Don't search beyond reasonable bounds
        if (searchRoot === document.body) break;
    }

    if (!searchRoot) {
        searchRoot = document;
    }

    // Find all parser-definition code blocks in the search area
    const codeBlocks = searchRoot.querySelectorAll('pre code.parser-definition');

    for (const codeBlock of codeBlocks) {
        const textContent = codeBlock.textContent;

        // Look for const definitions: const ParserName := ...
        const constRegex = /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:=/g;
        let match;

        while ((match = constRegex.exec(textContent)) !== null) {
            parserNames.push(match[1]);
        }
    }

    return parserNames;
}

// Helper function to determine parser name from container context
function getParserNameFromContext(container) {
    // Look for the first pre/code block before this container
    let currentElement = container.previousElementSibling;

    while (currentElement) {
        // Check if this element is a pre block with code
        const codeBlock = currentElement.tagName === 'PRE' ?
            currentElement.querySelector('code.parser-definition') :
            null;

        if (codeBlock) {
            // Extract parser name from this specific code block
            const textContent = codeBlock.textContent;
            const constRegex = /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:=/;
            const match = constRegex.exec(textContent);

            if (match) {
                return match[1];
            }
        }

        currentElement = currentElement.previousElementSibling;
    }

    // If no preceding code block found, fall back to searching parent elements
    let parent = container.parentElement;
    while (parent && parent !== document.body) {
        const codeBlock = parent.querySelector('pre code.parser-definition');
        if (codeBlock) {
            const textContent = codeBlock.textContent;
            const constRegex = /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:=/;
            const match = constRegex.exec(textContent);

            if (match) {
                return match[1];
            }
        }
        parent = parent.parentElement;
    }

    console.warn('No parser definition found before container:', container);
    return null;
}


