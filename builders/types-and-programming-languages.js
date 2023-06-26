const help = `
 * \`./<this script.js> <fileName.markdown> <target.js>\`
 * Extract all the code from the file, and generate the associated JavaScript source.
 * 
 * Options:
 * 
 *   --no-verify    Just compile without verification
 *   --regenerate   Regenerates <target.js>
 *                  so that running the script without \`--regenerate\` works.
 *   --watch        Watches the file for changes and regenerates
 *                  the outputs if necessary. Automatically sets
 *                  --regenerate to true
 *   --help         Prints this message
`;

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/*
First, we need to parse with regular expressions instances of the following pattern 
{% highlight .* %}
CODE TO EXTRACT
{% endhighlight %}

What we will then do is
1) Convert all the remaining to comments
2) Run Dafny verify on it, verify that the error code is 0
3) Compile the file to JavaScript

If --regenerate is set, we replace the previous source
IF 
If an opening tag is missing its closing tag, we should detect it and report an error in both cases.
*/

var start_highlight  = '\\\{% highlight.*%\\\}';
var end_highlight = '\\\{% endhighlight %\\\}';
var fileContents = {};

Main();
function Main() {
  var {regenerate, fileName, fileTarget, watch} = ProcessArgs();
  if(watch) {
    RunAndAgainIfModified(fileName, () => {
      ProcessOneFile(fileName, fileTarget, true);
    });
  } else {
    var exit_code = ProcessOneFile(fileName, fileTarget, regenerate);
    process.exit(exit_code);
  }
}

function ProcessOneFile(fileName, fileTarget, regenerate,) {
  var fileContent = fs.readFileSync(fileName, 'utf8');
  if(fileContent == fileContents[fileName]) {
    return;
  } else {
    fileContents[fileName] = fileContent;
  }
  if(fileContent == null || fileContent == "") {
    return;
  }
  var dafnyEquivalent = DafnyEquivalent(fileName, fileContent);
  console.log("Verifying and building...");
  var exit_code = RunCommands(dafnyEquivalent, regenerate, fileTarget);
  if(!regenerate || exit_code == 2) {
    if(regenerate) {
      console.log("Could not regenerate outputs because of one error. See above");
    }
    return exit_code;
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
  var fileTarget = files[1];
  // test if file exists

  if (!fs.existsSync(fileName)) {
    console.log("Input file does not exist: " + fileName);
    process.exit(1);
  }
  if (fileTarget == null) {
    console.log("Target file not provided");
    process.exit(1);
  }

  return {
    regenerate,
    fileName,
    fileTarget,
    watch
  };
}

function DafnyEquivalent(fileName, fileContent) {
  var newFileContent = "/*" + fileContent
  .replace(new RegExp(start_highlight, "g"), start_highlight + "*/")
  .replace(new RegExp(end_highlight, "g"), "/*" + end_highlight)
  + "*/";
  return newFileContent;
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

function RunCommands(code, regenerate, fileTarget) {
  var exit_code = 0;
  var tmpFile = "typesprogramminglanguage.dfy";
  var buildFile = `${tmpFile}.build.js`;
  var outFile = fileTarget;
  var command = `dafny build --target:js --output ${buildFile} ${tmpFile}`;

  try {
    fs.writeFileSync(tmpFile, code, "utf-8");
    console.log(execSync(command).toString().trim());
  } catch(e) {
    exit_code = 2; // Error
    console.log(e.stdout.toString().trim());
  } finally {
    fs.unlinkSync(tmpFile);
  }
  if(!fs.existsSync(buildFile)) {
    console.log(`Build file ${buildFile} does not exist`);
    exit_code = 2;
    return exit_code;
  }
  var buildContent = fs.readFileSync(buildFile, "utf-8");
  if(fs.existsSync(outFile)) {
    var outContent = fs.readFileSync(outFile, "utf-8");
  } else {
    var outContent = "";
  }
  fs.unlinkSync(buildFile);

  if (buildContent != outContent) {
    exit_code = 1;
    if(!regenerate) {
      console.log(`Output is not up to date`);
      exit_code = 2;
    } else {
      fs.writeFileSync(outFile, buildContent, "utf-8");
    }
  }
  return exit_code;
}