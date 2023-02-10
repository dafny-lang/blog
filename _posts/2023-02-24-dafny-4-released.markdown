---
layout: post
title:  "Dafny 4 is released!"
date:   2023-02-08 00:00:01 +0100
---
After 13 years of research and development, 5400+ commits made by [72 contributors](https://github.com/dafny-lang/dafny/graphs/contributors), the Dafny team is grateful to annouce [the release of Dafny 4](https://github.com/dafny-lang/dafny/releases)!

Dafny is a programming language with verification integrated.
Dafny lets you write both high-performing code and high-level mathematical specifications in a unique unified syntax that seems familiar for both professional developers and mathematicians.
Like a genious but gentle colleague who reviews your code and give you feedback, Dafny checks _statically_ if what you think is correct is
actually correct. If you have tried it, you know how awkwardly confident
it feels when Dafny gives you an all-green gutter.


The most notorious change of Dafny 4 compared to Dafny 3 is that _functions are now compiled by default_. Having in mind the repeating awkwardness `function method` for new users, we decided that, compiled functions are simply declared as `function` and non-compiled functions as `ghost function`.

You can visit the [migration guide](https://github.com/dafny-lang/ide-vscode/wiki/Quick-migration-guide-from-Dafny-3.X-to-Dafny-4.0) to get to know the few breaking changes.
But besides these minor differences, Dafny 4 is the celebration of various achievements in both the Dafny language and editing environments.
This blog post will walk through some of these notable achievements.

# Better visual verification feedback

Check out what the experience writing Dafny 4 looks like in Visual Studio code.
In the following animated screenshot where we fix a hybrid specification-friendly Fibonacci method with its attached high-performant implementation, you can see the following features we implemented:
* [Gutter icons](https://dafny.org/latest/DafnyRef/DafnyRef#sec-gutter-highlights) to indicate per-line verification status.
  Useful to understand what's next without having to look at the diagnostic window! When it turns green, you know you're done.
* [Hover messages](https://github.com/dafny-lang/dafny/pull/1946) that contain the following information:
  * Error link: Link to documentation about how to fix verification errors (on 'Error')
  * Resource usage (87K RU): How much resources Dafny used to verify the [assertion batch](https://dafny.org/latest/DafnyRef/DafnyRef#sec-assertion-batches)
  * How much assertions there are in the current function
  * Positive feedback messages to indicate you what Dafny proved under the caret
  * And much more not shown (help when verification is slow, slowest batches when hovering the function name)

![Fixing a high-performant part of a typical function-by-method in Dafny, using visual verification feedback](/blog/images/Dafny4IDEFeatures.gif)

TODO: A screenshot about test runs

# Command-line improvement

In Dafny 3, we had plethora of command-line flags that offered a great flexibility but were sometimes awkwards. Everyone remembers thinking "What does `/compilation:3` mean?" or "How do I spill out my code"

TODO

## Support for newer version of Z3

TODO

## Testing and Auditing

TODO

## Formatter

TODO

# TODO Other sections.