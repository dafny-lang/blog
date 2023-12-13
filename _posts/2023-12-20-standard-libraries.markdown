---
layout: post
title:  "Dafny Standard Libraries"
date:   2023-11-20 18:00:00 +0100
author: Robin Salkeld
---

I am an engineer and I love Dafny. 

TODO: preamble
* Intro to Dafny, basic points to back up design later.
* Dafny not a great match for a coding competition where speed is paramount.

The requirements for the first puzzle boil down to:

> The newly-improved calibration document consists of lines of text; each line originally contained a specific **calibration value** that the Elves now need to recover. On each line, the calibration value can be found by combining the **first digit** and the **last digit** (in that order) to form a single **two-digit number**.
>
> ...
>
> Consider your entire calibration document. What is the sum of all of the calibration values?

No problem, we can handle this.

To ensure full backwards compatibility for existing Dafny projects,
Dafny 4.4 doesn't make the standard libraries available by default:
they 

Now for the actual code. Let's start from the bottom-up:
we're clearly going to need a function to extract the calibration value as a number from a single line of text.

```dafny
function CalibrationValue(line: string): nat {
  ...
}
```

How do we find the first and last digits?
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
and we don't actually KNOW that every line contains at least one digit.

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

Let's see how much of our `CalibrationValue` function we can write now.
We can import the `Std.Collections.Seq` module into the top-level, default module
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


function CalibrationValue(line: string): nat {
  var firstDigitIndex :- Seq.IndexByOption(line, /* hmm... */);
  var lastDigitIndex :- Seq.LastIndexByOption(line, /* hmm... */);

  var resultAsString := [line[firstDigitIndex], line[lastDigitIndex]];

  ...
}
```

We'll ignore for now 



But let's pause for a second, because something very cool happened we may not have even noticed:
there's a precondition on `ToNat`: `forall c <- str :: DecimalConversion.IsDigitChar(c)`.
In other words, `str` has to be a string with only digits.
That's why the return type of `ToNat` is just `nat`
and not something like a `Wrappers.Option<nat>` or a `Wrappers.Result<nat, string>`,
because it always succeeds in parsing the string.

How does Dafny know that `resultStr` is always parsable as a non-negative integer?
Because it actually **knows** that `Seq.IndexByOption` and `Seq.LastIndexByOption`
returns the index of an element that satisfies the "by" predicate,
and therefore deduces that `[line[firstDigitIndex]] + [line[lastDigitIndex]]`
is a string that only contains digits.
I don't know about you but I think that's super cool.






So now we just have to feed the actual puzzle input into our Dafny code.
Let's assume we've downloaded the puzzle to `input.txt`.
How the heck do we read this with Dafny?

Good news! There's a standard library for that too: `Std.FileIO`.
The implementation of this library is especially interesting
because it has to rely on utilities the languages Dafny compiles to.

FileIO:
* Particularly useful for testing Dafny code against each backend, used by ESDK and DB ESDK

* Points about libraries plural, not part of the language itself, may be split up and relocated later, especially once we support packages better.
* JSON
* Implementation
  * doo files
  * project files
* Something about future optimizations, especially w.r.t. wrappers

Install Dafny 4.4, take the standard libraries for a test drive, 
and [let us know](https://github.com/dafny-lang/dafny/issues/new/choose) if you run into speed bumps.
Even better, if you have your own spiffy reusable Dafny code you keep in your back pocket,
[cut us a PR](https://github.com/dafny-lang/dafny/blob/master/CONTRIBUTING.md) and get it into the standard libraries!