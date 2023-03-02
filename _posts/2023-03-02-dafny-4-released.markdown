---
layout: post
title:  "Dafny 4 is released"
date:   2023-03-02 00:59:59 +0000
---
![Dafny Logo](/blog/assets/images/logo.jpg)

Today, we are excited to announce the release of Dafny [4.0](https://github.com/dafny-lang/dafny/releases/tag/v4.0.0), a major release for the Dafny open-source programming language and automated reasoning tool!

[**Dafny**](https://dafny.org) is a verification-aware programming language that has native support for capturing specifications and is equipped with a static program verifier. By blending sophisticated automated reasoning with familiar programming idioms and tools, Dafny empowers you to write provably correct code w.r.t. its specifications. In addition to a verification engine to check implementations against specifications, the Dafny ecosystem includes several compilers (C#, Java, JavaScript, Go, Python) that help you integrate Dafny into your existing workflows. The Dafny ecosystem also supports you with a Visual Studio Code [extension](https://marketplace.visualstudio.com/items?itemName=dafny-lang.ide-vscode), powered by an LSP implementation, and a code formatter. Dafny is used in academia for teaching and research, as well as in industry, such as by teams at Amazon (e.g. [AWS Encryption SDK](https://github.com/aws/aws-encryption-sdk-dafny)).

**New Book!** The new book [_Program Proofs_](https://mitpress.mit.edu/9780262546232/program-proofs/) by Dafny creator, Rustan Leino, teaches you how to prove programs correct and uses Dafny throughout. It will be released by MIT Press in just a few days.

For additional information on Dafny, please see:
* [Manual Installation](https://github.com/dafny-lang/dafny/wiki/INSTALL) (or using the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=dafny-lang.ide-vscode))
* [Dafny Reference Manual](https://dafny.org/latest/DafnyRef/DafnyRef)
* [Dafny on GitHub](https://github.com/dafny-lang/dafny)

## Dafny 4.0 Release Highlights
We have added a lot of exciting new features and enhancements to the Dafny language and ecosystem since Dafny 3.0. Here are some of the recent highlights. Some of these features have been available in prior releases, but are now enabled by default in 4.0.

### Better visual verification feedback
Dafny has always fused together programming and verification, placing both of them in the IDE. In Dafny 4.0, we have added a large number of visual enhancements to the IDE, giving you more feedback than ever, without you having to search through menus to get it.
In the animated screenshot, where we repair a performant but incorrect implementation for a specification-friendly Fibonacci function, you can see the following features we implemented:
* [Gutter icons](https://dafny.org/latest/DafnyRef/DafnyRef#sec-gutter-highlights) to indicate per-line verification status.
  They help understanding what's next without having to look at the diagnostic window. When it turns green, you know you're done.
* [Hover widget](https://github.com/dafny-lang/dafny/pull/1946) that contain the following information:
  * Error link: Link to documentation about how to fix verification errors (on `Error`)
  * Resource usage: How much resources Dafny used to verify the [assertion batch](https://dafny.org/latest/DafnyRef/DafnyRef#sec-assertion-batches)
  * How many assertions there are in the current function
  * Positive feedback messages to indicate you what Dafny proved under the hood
  * And much more not shown here (help when verification is slow, slowest batches when hovering the function name)

![Fixing a performant part of a function-by-method in Dafny, using visual verification feedback](/blog/assets/images/Dafny4IDEFeatures.gif)

### Command Line Interface enhancements
Dafny’s command line interface (CLI) has been fully revamped. The CLI is now POSIX compliant. Many of the existing options have been simplified and their names and values have been made more intuitive. Options related to common use cases are now grouped under commands. For example, `dafny run MyProgram.dfy` will verify, compile, and run `MyProgram`. The number of relevant options per command is small making it easy for users to get an overview of what a command can do, and preventing users from applying invalid combinations of options. Options that are only useful for debugging the internals of the Dafny language are hidden by default.

### Code formatter
The Dafny CLI and IDE are now able to automatically format Dafny code. Use `dafny format` to try this out on the CLI. The CLI has an option to check whether any automatic formatting can be applied, which is useful for gating against merging incorrectly formatted code. This first version of automatic formatting will correct indentation style mistakes but leaves line breaks untouched.

### Unicode strings
Dafny previously encoded all strings in UTF-16, but just as in Java and C#, it was possible to have invalid sequences of data according to the Unicode standard. In Dafny 4.0, the built-in character type now represents Unicode scalar values, just as it does in more recent programming languages that use UTF-8 such as Go and Rust. You can also now use arbitrary characters in character and string literals, where previously only ASCII characters were supported without escape sequences.

### Auditor
Every verified program ensures the stated correctness goals subject to a set of assumptions. In many cases, these assumptions can be scattered throughout a program, and some may even be implicit. The new `dafny audit` command will identify assumptions a Dafny program makes, explicitly or implicitly, and that therefore may constrain the context in which the proven claims are valid. This includes, for example, explicit `assume` statements, externally-defined methods with postconditions, and code for which verification has explicitly been disabled.

### Runtime checking of external code contracts
To help improve confidence in the correctness of one of the forms of assumption reported by `dafny audit`, Dafny can now emit runtime checks that validate the contracts on externally-defined code. The `--test-assumptions Externs` flag to the compiler enables these checks. If one of these checks fails, it behaves in the same way as a failing `expect` statement.

### Python compiler
Dafny previously had full support for compiling to C#, Java, Go, and JavaScript. Recently, we have added full support for generating Python code.

### Z3 version upgrade
Internally, the Dafny verifier is built on the Boogie intermediate verification language, which in turn uses a satisfiability-modulo-theories (SMT) solver. Dafny 4.0 contains an upgrade for the recommended default version of the Z3 SMT solver from 4.8.5 to 4.12.1, which is currently the latest version of Z3. In fact, Dafny is now fully compatible with *all* Z3 versions from 4.8.5 through 4.12.1 (and possibly other versions). The binary distributions ship with Z3 4.12.1, used by default, along with 4.8.5 for backward compatibility. To use a Z3 version other than the one that ships with Dafny, use the `--solver-path=path/to/z3` or `/proverOpt:PROVER_PATH=path/to/z3` flags to specify the location of an alternate binary.

### Standard libraries for Dafny developers
Shared standard libraries that have stability, verification, usability, cross-platform support, and packaging characteristics are on our roadmap. What functionality do you need in a library? What library support would you like to see? What characteristics would fit your working style? We’d like to hear your feedback and ideas. Please log your requests and ideas on [GitHub](https://github.com/dafny-lang/libraries/issues).

### Support for Testing
Dafny provides experimental support for writing unit tests akin to popular unit testing and mocking frameworks that are available for mainstream programming languages. For example, you can now use the `:test` annotation to tag your unit tests in Dafny. Then, the Dafny to C# compiler seamlessly compiles such Dafny tests into XUnit tests that can be executed on the compiled Dafny program. Similarly, there is now a `:synthesize` annotation for mocking.

Dafny supports an experimental feature for automatic test generation for statement-level code coverage. The tests contain runtime checks compiled directly from (non-ghost) postconditions. Compared to prior versions, Dafny 4.0 can generate tests both for methods and functions with support for all basic types, collections, algebraic datatypes, class types, and type parameters as well as limited support for traits, function types, and tuples. To invoke test generation using the new command line interface, execute `dafny generate-tests`. For more information please read this [README](https://github.com/dafny-lang/dafny/blob/master/Source/DafnyTestGeneration/README.md).

### New language features
Compared to Dafny 3.0, Dafny 4.0 includes the following language improvements:
* `for` loops,
* `continue` statements,
* parameter passing via name bindings,
* parameter default values,
* `function by method` declarations,
* ghost tuples,
* ghost allocation of class instances,
* ghost datatype constructors,
* `<-` syntax for quantified variables,
* disjunctive `case ... | ... =>` patterns,
* opaque constants, and
* command-line arguments access from `Main`.

### Documentation
The language reference manual has been updated for all features in version 4.0. We have also improved the wording of error messages, and we added an [error catalog](https://dafny.org/latest/HowToFAQ/Errors) where you can get more information and helpful hints about error messages.

## Backward compatibility considerations

### Functions compiled by default
If you’ve used Dafny before, the first change you’ll notice is how functions are declared in Dafny 4.0. Dafny distinguishes *methods*, which consist of code with possible side effects, from *functions*, which, unlike the “functions” in C or JavaScript, are like mathematical functions without side effects—you evaluate a function twice in Dafny and you’ll get the same value. Functions in Dafny were first used mostly in specifications, so they were by default *ghost*, which means the compiler erases them. However, because so many Dafny programs find functions to be useful also in compiled code, we have simplified how functions are declared. In Dafny 4.0, use the keyword `function` to declare a compiled function and use the keywords `ghost function` to declare a ghost function.

### Z3 version upgrade
In some cases, code that verifies with Dafny 3.x and Z3 4.8.5 (the previous default) may fail to verify with Dafny 4.0 and Z3 4.12.1. If you encounter this issue, you can consider temporarily switching to using Z3 4.8.5 until you are ready to modify your proofs to make them less sensitive to solver changes. To improve the long-term maintainability of proofs, and compatibility with this and future solver upgrades, please see the [section on verification debugging in the reference manual](https://dafny.org/latest/DafnyRef/DafnyRef#sec-verification-debugging).

For the full list of backward compatibility changes with Dafny 4.0, visit the [migration guide](https://github.com/dafny-lang/ide-vscode/wiki/Quick-migration-guide-from-Dafny-3.X-to-Dafny-4.0).

## Thanks!

We are grateful for the contributions of the Dafny community! Thank you for the bug reports, questions, discussions, and code contributions, which are helping to strengthen Dafny and its ecosystem.

--_The Dafny maintainers_
