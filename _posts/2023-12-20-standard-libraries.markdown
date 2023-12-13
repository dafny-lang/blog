---
layout: post
title:  "Dafny Standard Libraries"
date:   2023-11-20 18:00:00 +0100
author: Robin Salkeld
---

I am an engineer and I love Dafny. 

TODO: preamble
* Intro to Dafny, basic points to back up design later.
* Intro to adventofcode.com, nice way to close out the year etc.
* Dafny not a great match for a coding competition where speed is paramount,
  but this is a great example of how the standard libraries make common tasks so much easier.
* Other blog posts by my esteemed colleagues (link others) show how to prove interesting properties,
  but this one is focussing more on how to get things done and support those proof efforts etc.

The requirements for the first puzzle boil down to:

> The newly-improved calibration document consists of lines of text; each line originally contained a specific **calibration value** that the Elves now need to recover. On each line, the calibration value can be found by combining the **first digit** and the **last digit** (in that order) to form a single **two-digit number**.
>
> ...
>
> Consider your entire calibration document. What is the sum of all of the calibration values?

No problem, we can handle this.

## Getting started

To ensure full backwards compatibility for existing Dafny projects,
Dafny 4.4 doesn't make the standard libraries available by default:
they are enabled by a `--standard-libraries` option to the `dafny` CLI.
But we can do better than that:
we can use a Dafny project file to indicate we want to use the standard libraries,
which will let the Dafny IDE understand that dependency.

TODO: set up VS Code extension

Create a new directory with an empty `solution.dfy` file and a `dfyconfig.toml` file with these contents:

```toml
[options]
standard-libraries = true
```

Now for the actual code. Let's start from the bottom-up:
we're clearly going to need a function to extract the calibration value as a number from a single line of text.

```dafny
function CalibrationValue(line: string): nat {
  // ...
}
```

How do we find the first and last digits?

## Sequences and Wrappers

Having a look at the [top-level index of Dafny standard libraries](https://github.com/dafny-lang/dafny/tree/master/Source/DafnyStandardLibraries),
we notice there's a `Std.Collections` library with [a submodule for `Seq`](https://github.com/dafny-lang/dafny/blob/master/Source/DafnyStandardLibraries/src/Std/Collections/Seq.dfy), and sure enough, there are functions like `IndexOf` and `LastIndexOf`. Perfect!

Or perhaps you were distracted by the `Std.Strings` module, where you might expect these utilities to live.
But in Dafny, strings are really nothing more than sequences of characters:
the type `string` is just an alias for `seq<char>`.
This means many typical string operations are provided as general sequence operations instead.
Don't worry, we'll get to that library in a moment.

Let's consider for a moment how you might want to use a function like `IndexOf` in general.
Finding the index of an element in a sequence will certainly not always succeed,
since the sequence might not contain the element.
In most standard libraries, a function like `IndexOf` may return an invalid sentinel index value,
like the length of the sequence or `-`.
But often you actually know the element is in the sequence
because of the way the rest of the program is structured.
Perhaps you just added the element to a list and then sorted it.
Because of the invariants of sorting, you know the element is still in there.
The great thing about Dafny is that it can actually understand this kind of reasoning,
and know when it is safe to assume an operation will succeed.

Therefore a common pattern in the Dafny standard libraries
is to have two different versions of a function or method:
a partial version with preconditions,
and a complete version that may not succeed.
The `Std.Wrappers` library provides a few extremely common datatypes for this:
`Option<T>`, for a value that may not exist,
and `Result<T, E>`, for the result of an operation that may fail with an error value instead.
The `Seq` library and most of the other libraries use these datatypes all over the place
in order to define partial operations.

In our specific case, there is both an `IndexOf` function,
which requires the element is present in the sequence and returns a `nat` that is always a valid index in the sequence,
and `IndexOfOption`, which produces an `Option<nat>` instead of a `nat`.
The latter is the better match for our situation,
since we're eventually going to read our puzzle input from a file on disk,
and we don't actually **know** that every line contains at least one digit.

Note that in general we could get by with only the partial version of all these operations,
since we could always just explicitly check the precondition first
before invoking the operation.
The downside of that approach, though, is that there's a performance cost:
you end up iterating through the sequence twice, once to check if the element is there
and then again to actually fetch the element.

Finally, in our case we're not looking for a specific concrete element,
we're looking for any digit.
In other words, we want to find the first and last index of elements
that satisfy a particular predicate.
Fortunately `Seq` has us covered here too,
and the two functions we actually want to use are `IndexByOption` and `LastIndexByOption`.

## Strings and Numbers

Let's see how much of our `CalibrationValue` function we can write now.
We can import the `Std.Collections.Seq` module into the default top-level module
with an `import` statement.
In most Dafny codebases you'll see `import opened` statements,
especially for very common modules like `Std.Wrappers`:
these statements make the contents of the imported module directly available
in the importing module.
That lets you say things like `Some(42)` and `None`
rather than `Wrappers.Some(42)` and `Wrappers.None`.
For this exercide I'm just using `import` statements
so it's more obvious when we're using things from the standard libraries.

```dafny
import Std.Collections.Seq

function CalibrationValue(line: string): nat {
  var firstDigitIndex := Seq.IndexByOption(line, /* hmm... */);
  var lastDigitIndex := Seq.LastIndexByOption(line, /* hmm... */);

  var resultAsString := [line[firstDigitIndex], line[lastDigitIndex]];

  // Still need to parse the result as a number...
}
```

Progress! We'll figure out what to pass for the second arguments on the first two lines in a moment.
First, how do we convert our `resultAsString` to a number, more specifically a `nat`?
This is more specifically an operation on strings rather than generic sequences.
That means **now** we can open our `Std.Strings` present, 
and see that it contains a shiny new `ToNat` function!

```dafny
import Std.Collections.Seq
import Std.Strings

function CalibrationValue(line: string): nat {
  var firstDigitIndex := Seq.IndexByOption(line, /* hmm... */);
  var lastDigitIndex := Seq.LastIndexByOption(line, /* hmm... */);

  var resultAsString := [line[firstDigitIndex], line[lastDigitIndex]];

  Strings.ToNat(resultStr)
}
```

Even better, digging into the implementation of `ToNat` leads us to what we need
to plug the holes we skipped over:
the `Strings.DecimalConversion.IsDigitChar` predicate tells us if a character is a digit.

```dafny
import Std.Collections.Seq
import Std.Strings
import Std.Strings.DecimalConversion

function CalibrationValue(line: string): nat {
  var firstDigitIndex := Seq.IndexByOption(line, DecimalConversion.IsDigitChar);
  var lastDigitIndex := Seq.LastIndexByOption(line, DecimalConversion.IsDigitChar);

  var resultAsString := [line[firstDigitIndex], line[lastDigitIndex]];

  Strings.ToNat(resultStr)
}
```

Before we pat ourselves on the back too hard, though,
we notice this program doesn't typecheck yet:
`firstDigitIndex` and `lastDigitIndex` are not plain `nat` values but `Option<nat>` values.
And if we think about that a bit more,
it means our `CalibrationValue` function **also** needs to produce an `Option<nat>`
instead of a `nat`, because if `line` doesn't contain any digits
we can't succeed in producing a calibration value either.

Thankfully another nice thing about `Std.Wrappers` is that the types in that module
are [*failure-compatible types*](https://dafny.org/dafny/DafnyRef/DafnyRef#sec-failure-compatible-types).
That means they can be used with the `:-` "elephant operator", which is a convenient way to propogate failure.
Let's change our return type, change the two regular `:=` assignment operators to elephants instead,
and wrap up our result as an `Option<nat>` so it matches our new return type:

```dafny
import Std.Collections.Seq
import Std.Strings
import Std.Strings.DecimalConversion
import Std.Wrappers

function CalibrationValue(line: string): Wrappers.Option<nat> {
  var firstDigitIndex :- Seq.IndexByOption(line, DecimalConversion.IsDigitChar);
  var lastDigitIndex :- Seq.LastIndexByOption(line, DecimalConversion.IsDigitChar);

  var resultAsString := [line[firstDigitIndex], line[lastDigitIndex]];

  Wrappers.Some(Strings.ToNat(resultAsString))
}
```

Now if either attempt to find a digit fails,
the execution of the function body will immediately stop,
and that failure will become the result of the whole function.
At this point we have a valid Dafny program, and the IDE should reward our hard work
with [a festive green gutter](https://dafny.org/blog/2023/04/19/making-verification-compelling-visual-verification-feedback-for-dafny)
to indicate that it verifies successfully too!

But let's pause for a second, because something very cool happened we may not have even noticed:
there's a precondition on `ToNat(str)`: `forall c <- str :: DecimalConversion.IsDigitChar(c)`.
In other words, `str` has to be a string with only digits.
That's why the return type of `ToNat` is just `nat`
and not something like a `Wrappers.Option<nat>` or a `Wrappers.Result<nat, string>`,
because it always succeeds in parsing the string.

How does Dafny know that `resultStr` is always parsable as a non-negative integer?
Because of the post-conditions of `Seq.IndexByOption` and `Seq.LastIndexByOption`,
Dafny actually **knows** that they return the indexes of elements that satisfy the "by" predicate,
and therefore deduces that `[line[firstDigitIndex], line[lastDigitIndex]]`
is a string that only contains digits.
I don't know about you but I think that's super cool.

## Bits and Bytes

So now that we've solved the most interesting bit of the puzzle,
we just have to feed the actual puzzle input into our Dafny code.
Let's assume we've downloaded the puzzle to `input.txt` in the current directory.
How the heck do we read this with Dafny?

Good news! There's a standard library for that too: `Std.FileIO`.
This one is very basic for now, explicitly meant for simple cases of reading and writing
file data for these kinds of use cases, rather than modelling entire file systems.
Here's our first attempt at a reusable utility for reading Advent of Code puzzle input
(because after all we have another month's worth of puzzles to solve!)

```dafny
// Just the imports we need for this snippet.
import Std.FileIO
import Std.Wrappers

method ReadPuzzleInput() returns (input: Wrappers.Result<string, string>) {
  input := FileIO.ReadBytesFromFile("input.txt");
}
```

Note that `FileIO.ReadBytesFromFile` is a `method` rather than a `function`,
and so `ReadPuzzleInput` has to be as well.
A `function` has to behave like a pure mathematical function
in order for Dafny to reason about the behavior of programs:
it has to produce the same output every time it is given the same input.
This is clearly not true for an operation to read the contents of a file,
so `ReadBytesFromFile` has to be a method, which is allowed to behave non-deterministically.

Again we have a typechecking error: we want to get the puzzle input as a string,
but `ReadBytesFromFile` produces bytes, more specifically a `seq<bv8>`.
`bv8` is short for "bit vector of length 8", equivalent to a byte.
We need to convert the bytes to characters somehow.

Realistically, we'd assume that the puzzle input is in ASCII and just convert every byte directly
to its corresponding character.
But let's pretend we're writing Real Code for the moment so I can show off the `Std.Unicode` library;
hey you never know, later puzzles might have proper UTF8 content!

```dafny
import Std.BoundedInts
import Std.FileIO
import Std.Unicode.UnicodeStringsWithUnicodeChar
import Std.Wrappers

method ReadPuzzleInput() returns (input: Wrappers.Result<string, string>) {
  var bytesAsBVs :- FileIO.ReadBytesFromFile("input.txt");
  
  var bytes := seq(|bytesAsBVs|, i requires 0 <= i < |bytesAsBVs| => bytesAsBVs[i] as BoundedInts.uint8);
  input := UnicodeStringsWithUnicodeChar.FromUTF8Checked(bytes).ToResult("Invalid UTF8");
}
```

A few notes:

* The `UnicodeStringsWithUnicodeChar` module is named that way to emphasize that it is only
  correct to use with the `--unicode-char:true` mode, which is [on by default in Dafny 4.x](https://dafny.org/blog/2023/03/03/dafny-4-released/#unicode-strings). 
* The `FromUTF8Checked` function takes in a `seq<uint8>`, where `uint8` is a `newtype` definition from `Std.BoundedInts`.
  This library defines lots of common fixed-bit-width integer types that the Dafny compiler will map to
  the native integer types of the target language for improved efficiency and memory usage.
* Because `bv8` is a distinct type from `uint8`, we have to explicitly convert between them.
  This is a side effect of the Dafny standard libraries having multiple independent contributions from various
  projects, and you can expect future versions of Dafny to provide more versions of common utilities
  to make combining things a bit smoother.
* `FromUTF8Checked` returns an `Option<string>`, but `FileIO.ReadBytesFrom` returns a `Result<seq<bv8>, string>`.
  To unify with a common result type, we use `Option.ToResult` to convert the former value to a `Result`,
  which is a handy and common trick. See [the documentation for `Std.Wrappers`](https://github.com/dafny-lang/dafny/blob/master/Source/DafnyStandardLibraries/src/Std/Wrappers.md) for more details.

## Sprinting to the Finish

Now let's put it all together and write our main method:

```dafny
method Main() {
  var input :- expect ReadPuzzleInput();

  var lines := Seq.Split(s, '\n');

  var calibrationValues :- expect Seq.MapWithResult(CalibrationValue, lines);

  var total := Seq.FoldLeft((x, y) => x + y, 0, calibrationValues);
  print total, "\n";
}
```

We've used one more trick with failure-compatible types in this method:
`:- expect`, a variation on the elephant operator to make "assign or halt" statements.
`ReadPuzzleInput` returns a `Result`, but if it fails there's nothing more we can do
in the main method than printing an error and exiting.
`:- expect` means that if the right-hand side of the statement is a failure,
Dafny will immediately halt and print the failure value to the console.
This is particularly valuable for writing tests in Dafny.
Note also that the `Seq` library continues to work hard for us,
splitting the input into lines,
mapping our `CalibrationValue` function over the sequence of lines,
and summing the results into the final answer.
`MapWithResult` is a short-circuiting variation of `Map` where the mapped function can fail.

If we put the sample input from the puzzle description into `input.txt`
(not the actual puzzle input - I draw the line at publishing the answer in this blog post,
you're just going to have to run the solution yourself to get that!),
we can run our project and get...

```dafny
% dafny run dfyconfig.toml

Dafny program verifier finished with 3 verified, 0 errors
142
```

Huzzah! We have a working solution to the first puzzle in less than 40 lines of Dafny code
(see below for the complete program),
all thanks to the Dafny standard libraries.

```dafny
import Std.BoundedInts
import Std.Collections.Seq
import Std.FileIO
import Std.Strings.DecimalConversion
import Std.Unicode.UnicodeStringsWithUnicodeChar
import Std.Wrappers
 
method Main() {
  var input :- expect ReadPuzzleInput();

  var lines := Seq.Split(input, '\n');

  var calibrationValues :- expect Seq.MapWithResult(CalibrationValue, lines);

  var total := Seq.FoldLeft((x, y) => x + y, 0, calibrationValues);
  print total, "\n";
}

method ReadPuzzleInput() returns (input: Wrappers.Result<string, string>) {
  var bytesAsBVs :- FileIO.ReadBytesFromFile("input.txt");
  var bytes := seq(|bytesAsBVs|, i requires 0 <= i < |bytesAsBVs| => bytesAsBVs[i] as BoundedInts.uint8);
  
  input := UnicodeStringsWithUnicodeChar.FromUTF8Checked(bytes).ToResult("Invalid UTF8");
}

function CalibrationValue(line: string): Wrappers.Result<nat, string> {
  var firstDigitIndex :- Seq.IndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");
  var lastDigitIndex :- Seq.LastIndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");

  var resultStr := [line[firstDigitIndex], line[lastDigitIndex]];

  Wrappers.Success(DecimalConversion.ToNat(resultStr))
}
```

## Looking ahead

TODO: parting thoughts

* Points about "libraries" plural, not part of the language itself, may be split up and relocated later, especially once we support packages better.
* Mention JSON, ESDK/DB ESDK test vector runner
* Specs to evolve over time
* Implementation notes
  * A bit about doo files and safe separate verification
  * Will support attaching source/documentation to doo files soon too
  * Point to supporting third-party libraries better soon
  * Tested for all five supported backends
* Something about future optimizations, especially w.r.t. wrappers

## Until next year

TODO: connect

Install Dafny 4.4, take the standard libraries for a test drive, 
and [let us know](https://github.com/dafny-lang/dafny/issues/new/choose) if you run into speed bumps.
Even better, if you have your own spiffy reusable Dafny code you keep in your back pocket,
[cut us a PR](https://github.com/dafny-lang/dafny/blob/master/CONTRIBUTING.md) and get it into the standard libraries!

## TODOS

* Improve section headers?
* Stronger indication of which code snippets are incomplete/expected to error? (ala Rust book)
* Get syntax highlighting working on snippets (pandoc not working yet)
