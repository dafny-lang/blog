---
layout: post
title:  "Statistics Library"
author: Bhavesh Bhatia and Tanay Mathur
date:   2025-12-01 22:30:00 +0100
---

## Why We Built a Statistics Library

This all started with a Carnegie Mellon University practicum project in which our team was required to work with Amazon Web Services to contribute to Dafny’s growing ecosystem. From the very beginning, we were working closely with mentors who have been actively improving Dafny as a language and making it more and more comprehensive. We kind of got a front row seat to how formal verification is used in real time projects. Thus, it became more than a project for us, it became our chance to understand how industrial  verified code is designed, reviewed, and maintained.

Dafny itself made this journey both challenging and exciting. It is a programming language that combines implementation, specification, and proofs into one consistent workflow. Instead of relying on tests or assumptions, Dafny allows you to clearly state what your code should do and what it intends to achieve and then automatically checks that it is correct. This approach benefits engineers in avoiding subtle bugs, and researchers exploring provable guarantees.

During our early weeks, supported continuously by our sponsors Robin, Mikael and Olivier, we were learning how to structure proofs, write meaningful specifications, and understand Dafny’s verification model. We started with very basic code examples, following the tutorials and programs that our sponsors had provided. These included small exercises like checking simple conditions on a function’s output, writing loops with clear invariants and then going deep into the understanding of standard libraries and assertions. These early examples helped us understand how Dafny verifies mathematical correctness, how specifications guide the implementation, and how even simple concepts require comprehensive reasoning. Working through all this step by step made the language feel much more natural and showed us how powerful the verification strategies can be when used properly.

As we gained confidence, we began to see how important well-designed and reusable libraries are for the overall Dafny experience. We felt that many of the  programs  needed reusable components, but in Dafny you have to prove their properties every time you reimplement them. This made us appreciate how helpful it is when those common blocks already exist in a standard library. As we started studying the existing standard libraries and read Robin’s blog, we understood how much thought, clarity, and structure go into these modules. Looking at the code helped us learn the style and expectations for contributions, and it also showed us how strong standard libraries make Dafny easier and more practical for everyone.

As we explored these libraries, we also noticed that a number of everyday tasks in real programs involve basic statistical ideas such as averages, middle values, comparisons, and simple measures of variation. These operations are common in many projects, yet every user would have to write and prove them separately in their own projects. This was where we felt that such frequently used functions should be part of the standard libraries, just like other core components. This is what led us to focus on building a verified Statistics library that provides clear, simple, and dependable implementations of these common operations.

We wanted to start with the very basic statistical functions that are used more often, such as mean, median, mode, deviation, variance, and range. Our main goal was to ensure that each function was fully verified, handled edge cases cleanly, and was easy for users to call without worrying about the underlying proofs. With this approach, we hoped to create a small but reliable set of tools that would make everyday numerical tasks in Dafny simpler and more dependable.

