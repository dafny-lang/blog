const help = `
 * \`./verify.js <fileName.markdown>\`
 * Verifies that all the outputs are correct (useful for CI)
 * 
 * Options:
 * 
 *   --regenerate   Regenerates all the outputs within the file
 *                    so that running just \`verify.js\` would work
 *   --watch          Watches the file for changes and regenerates
 *                    the outputs if necessary. Automatically sets
 *                    -- regenerate to true
 *   --help           Prints this message
`;

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/*
First, we need to parse with regular expressions instances of the following pattern 
<div class="step">
...
<div class="file" name="euclidian.dfy">
CODE TO EXTRACT
</div><!--.file-->
... <span class='command'>COMMAND TO RUN</span><!--.command-->
...
<pre class="output">
OUTPUT_OF_COMMAND
</pre><!--.output-->
</div><!--.step-->
...
What we will then do is, to extract the code and the command,
and then run the command and compare the output with the output we have in the file.
If --regenerate is set, then we will also perfom in-file replacement of OUTPUT_OF_COMMAND
If an opening tag is missing its closing tag, we should detect it and report an error in both cases.
*/

var step_header = '<div_class_=_"step">';
//var stepRegexSimplified = /<div_class_=_"step">.*?<div_class_=_"file"_name="(.*?)">\n?(?:\{%_highlight dafny_%\}\n?)?(.*?)(?:\{%_endhighlight_%\}\n)?<\/div><!--\.file-->.*?<span_class_=_'command'>(.*?)<\/span><!--\.command-->.*?<pre_class_=_"output">(.*?)<\/pre><!--\.output-->.*?<\/div><!--\.step-->/gms;
var stepRegexString =
  '('+step_header+'.*?'+
  '<div_class_=_"file"_name="(.*?)">'+
  '_(?:\{%_highlight [^%]*?%\}_)?'+
  '(.*?)'+ // CODE TO EXTRACT
  '(?:\{%_endhighlight_%\}_)?<\/div><!--\.file-->.*?'+
  '<span_class_=_"command">'+
  '(.*?)'+ // COMMAND TO RUN
  '<\/span><!--\.command-->.*?'+
  '<pre_class_=_"output">(?:\r?\n|\r(?!\n)))'+
  '(.*?)'+ // OUTPUT OF COMMAND
  '((?:\r?\n|\r(?!\n))<\/pre><!--\.output-->.*?'+
  '<\/div><!--\.step-->)'
stepRegexString = stepRegexString.replace(/_/g, "\\s*").replace(/(\{|\})/g, "\\$1");
var stepRegex = new RegExp(stepRegexString, "gms");
var fileContents = {};

Main();
function Main() {
  var {regenerate, fileName, watch} = ProcessArgs();
  if(watch) {
    RunAndAgainIfModified(fileName, () => {
      ProcessOneFile(fileName, true);
    });
  } else {
    var exit_code = ProcessOneFile(fileName, regenerate);
    process.exit(exit_code);
  }
}

function ProcessOneFile(fileName, regenerate,) {
  var fileContent = fs.readFileSync(fileName, 'utf8');
  var steps = ExtractSteps(fileName, fileContent);
  if(steps == null || steps.length == 0) {
    return 1;
  }
  var exit_code = RunCommands(steps, regenerate, fileName, fileContent);
  if(!regenerate || exit_code == 2) {
    if(regenerate) {
      console.log("Could not regenerate outputs because of one error. See above");
    }
    return exit_code;
  } else {
    return RegenerateOutput(steps, fileName, fileContent);
  }
}

// Listens to changes to a particular file
function RunAndAgainIfModified(fileName, callbackWhenChanged) {
  callbackWhenChanged();
  console.log(`Watching ${fileName} for changes...`);
  fs.watch(fileName, (eventType, filename) => {
    callbackWhenChanged();
  });
}

function ProcessArgs() {
  var realArgs = process.argv.slice(2);
  var options = realArgs.filter(arg => arg.startsWith("--"));
  var files = realArgs.filter(arg => !arg.startsWith("--"));

  if (options.indexOf("--help") >= 0) {
    console.log(help);
    process.exit(0);
  }
  if(files.length == 0) {
    console.log(help);
    process.exit(1);
  }
  var regenerate = (options.indexOf("--regenerate") >= 0);
  var watch = (options.indexOf("--watch") >= 0);
  var fileName = files[0];
  // test if file exists

  if (!fs.existsSync(fileName)) {
    console.log("File does not exist: " + fileName);
    process.exit(1);
  }

  return {
    regenerate,
    fileName,
    watch
  };
}

function ExtractSteps(fileName, fileContent) {
  var steps = [];

  var match;

  var stepIndices = {};

  while (match = stepRegex.exec(fileContent)) {
    var step = {
      index: match.index,
      before_output: match[1],
      tmpFile: match[2],
      code: match[3],
      command: match[4],
      current_output: match[5],
      after_output: match[6],
      entire_match: match[0]
    };
    stepIndices[match.index] = true;
    steps.push(step);
  }
  // Quick verify that all the steps were parsed

  if (steps.length == 0) {
    console.log("No steps found in " + fileName + " whose content is '"+ fileContent+"'");
    return;
  }

  var headerStepRegex = new RegExp(step_header.replace(/_/g, "\\s*"), "gms");
  var headerMatch;

  while (headerMatch = headerStepRegex.exec(fileContent)) {
    if(!(headerMatch.index in stepIndices)) {
      // Uh oh this step did not parse correctly
      // Extract the line from the position
      console.log("Step not parsed correctly at line " + getLineAt(fileContent, headerMatch.index));
      process.exit(0);
    }
  }
  return steps;
}

function getLineAt(fileContent, index) {
  return fileContent.substring(0, index).split("\n").length + 1;
}
function canonicalNewlines(text) {
  return text.replace(/\r?\n|\r(?!\n)/g, "\n")
}
// Now, run the commands
function clearLastThreeLines() {
  process.stdout.clearLine(1) // from cursor to end
  process.stdout.moveCursor(0, -1) // up one line
  process.stdout.clearLine(1) // from cursor to end
  process.stdout.moveCursor(0, -2) // up one line
  process.stdout.clearLine(1) // from cursor to end
}

function GetContentChanged(fileName, fileContent) {
  if(fileName in fileContents) {
    var startIndex = 0;
    while(startIndex < fileContent.length && startIndex < fileContents[fileName].length &&
          fileContent[startIndex] == fileContents[fileName][startIndex]) {
      startIndex++;
    }
    var postIndexPrev = fileContents[fileName].length - 1;
    var postIndex = fileContent.length - 1;
    while(postIndex >= 0 && postIndex >= startIndex && postIndexPrev >= 0 && postIndexPrev >= startIndex &&
          fileContent[postIndex] == fileContents[fileName][postIndexPrev]) {
      postIndex--;
      postIndexPrev--;
    }
    return {startIndex, postIndex, postIndexPrev};
  } else {
    return {startIndex: 0, postIndex: fileContent.length - 1, postIndexPrev: fileContent.length - 1};
  }
}

function RunCommands(steps, regenerate, fileName, fileContent) {
  var exit_code = 0;
  // Run only the commands that might have changed.
  var {startIndex, postIndex, postIndexPrev} = GetContentChanged(fileName, fileContent);
  console.log({startIndex, postIndex, postIndexPrev});
  console.log("Running commands that might have changed...");
  console.log("");
  console.log("");
  console.log("");
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var line = getLineAt(fileContent, step.index);
    var tmpFile = step.tmpFile;
    // Write the code to a file
    var code = step.code;
    // Run the command
    var command = step.command.replace(/dafny (\w+)/, "dafny $1 --use-basename-for-filename");
    clearLastThreeLines();
    var barlength = 40;
    var perten = Math.ceil(barlength*(i + 1)/steps.length);
    console.log((`[${"=".repeat(perten)}${" ".repeat(barlength - perten)}] `) +
                `${i + 1}/${steps.length} steps\nLine ${line}, File ${tmpFile})\n`+
                `> ${command}`);
    // if there is an overlap between
    // [startIndex, postIndex] and [step.index, step.index + step.entire_match.length]
    if( (startIndex <= step.index && step.index <= postIndex) ||
        (step.index <= startIndex && startIndex <= step.index + step.entire_match.length) ) {
      try {
        fs.writeFileSync(tmpFile, code);
        var output = canonicalNewlines(execSync(command).toString().trim());
      } catch(e) {
        var output = canonicalNewlines(e.stdout.toString().trim());
      } finally {
        fs.unlinkSync(tmpFile);
      }
    } else {
      var output = step.current_output;
    }

    // Compare the output
    var current_output = canonicalNewlines(step.current_output);
    step.newOutput = output;
    if (current_output != output) {
      exit_code = 1;
      if(!regenerate) {
        console.log(`Step ${i} at line ${line} did not match`);
        console.log("Expected:\n" + current_output);
        console.log("Actual run:\n" + output);
        exit_code = 2;
      }
    }
  }
  return exit_code;
}

function RegenerateOutput(steps, fileName, fileContent) {
  if(fileContents[fileName] == fileContent) {
    console.log("File is up to date");
    return true;
  }
  var newFileContent = "";
  var lastIndex = 0;
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var preOutput = step.before_output;
    var newOutput = step.newOutput;
    var postOutput = step.after_output;
    //console.log("step extracted", step);
    var index = step.index;
    newFileContent += fileContent.substring(lastIndex, index);
    newFileContent += preOutput;
    newFileContent += newOutput;
    newFileContent += postOutput;
    lastIndex = index + preOutput.length + step.current_output.length + postOutput.length;
  }
  newFileContent += fileContent.substring(lastIndex);
  // Atomic read-and-replace
  if(fs.readFileSync(fileName) == fileContent) {
    if(newFileContent != fileContent) {
      fs.writeFileSync(fileName, newFileContent);
      console.log("File regenerated");
    } else {
      console.log("File's recomputation did not make any change");
    }
    fileContents[fileName] = newFileContent;
    return true;
  } else { // The file was changed in the meanwhile
    console.log("File was modified externally, aborting");
    return false;
  }
}
