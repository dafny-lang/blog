---
layout: post
title:  "Teaching Programming Languages and Security Through Verification: How We Use Dafny to Make Type Systems Click"
author: Bryan Parno
date:   2025-07-03 18:00:00 +0100
---

Or: How to help students actually understand those intimidating inference rules.

## The Challenge: Making PL Theory Accessible

Every spring, I teach 40-80 students about secure software systems. Most are master's students with little to no programming languages background. 
Historically, by the time we reached the unit on type systems and verification, I could see their eyes glazing over as we went through slide after slide of inference rules.
Judging by exams, many struggled to read the inference rules or connect them with their implications for the language.
Indeed, it's challenging to make fundamental concepts (e.g., type safety, non-interference, and formal semantics) actually stick with students 
who need to understand them but don't have the theoretical background to connect with them.

Then, four years ago, we tried something different: we started teaching these concepts through Dafny, alongside the traditional mathematical presentations. 
The results have been very encouraging.

## What We're Teaching 

Our course covers the full spectrum of software security techniques, from runtime defenses like control-flow integrity to architectural approaches like hardware 
isolation. The verification and type systems unit comes at the end, meaning that we have less than a quarter of the semester to cover some pretty deep material.

The core concepts we aim to get across include:
- **Type system basics**: Inference rules, formal language definitions, type safety
- **Verification fundamentals**: Hoare logic, weakest preconditions, loop invariants
- **Security properties**: Non-interference for confidentiality (and briefly, integrity)

We ground all of this in "Mini-C," a deliberately simplified language with just integers, booleans, basic arithmetic, memory operations, and control flow. To 
connect to security, Mini-C also supports reading public and secret values and printing output.

## Introducing a Dafny Perspective 

In our Dafny-based version of the unit, instead of just showing mathematical definitions, we now show both the traditional inference rules and their Dafny implementations.

For example, after showing Mini-C's syntax (in the form of a BNF grammar) on a slide, the next slide shows the actual Dafny datatypes that represent the AST. When we talk about operational semantics, students see both the inference rules and the Dafny functions that implement them (e.g., for expression evaluation).

This isn't just about making things "more concrete"; it's about giving students two complementary ways to understand the same concepts. Some students connect 
better with the mathematical notation, others with the executable code, and many benefit from seeing both perspectives.

## An "Aha!" Moment with Security Types

To connect all of this back to security concepts,
we introduce and then formalize the notion of non-interference
(i.e., the idea that secret input values should not influence public output values).
We extend Mini-C with security types (simplified to High and Low
for class purposes), augmenting both our mathematical and Dafny
formalism.


One of my favorite teaching moments comes when we're discussing the rules for security type systems. We show students this code:
```dafny
if x == 1 { 
  y := 1; 
} else { 
  y := 0; 
}
```
where x is a Low (public) variable and y is High (secret). Intuitively, this should be fine from a secrecy standpoint; we're only changing secret outputs based on public inputs. But our initial set of strict security typing rules reject it!

We then propose adding a rule that allows High commands to be "lowered" to Low commands. But how do we know it's actually safe to add this rule? 

"This is why we prove things", I tell them. "Proofs let us be confident that our optimizations don't break security." The proof itself becomes a homework 
assignment, and suddenly they're motivated to work through the details.

## Scaffolding Assignments To Build Understanding

We've learned that throwing students into the deep end of programming language theory and verification doesn't work. 
Instead, we use carefully structured assignments that build confidence and understanding step by step.

**Assignment 1**: Dafny warm-up using the  Dafny-based [*Program Proofs*](https://a.co/d/aQF3pvQ) textbook to practice reasoning about weakest preconditions, datatypes, specifications, and inductive proofs.

**Assignment 2**: Two problems that bridge from simple verification to program-level reasoning. First, the students implement and verify a primality checker against a specification they've been given. Second, they take a complex existing program with an English-level specification, formalize the specification in Dafny, and prove the program meets the specification (without changing the program itself).

**Assignment 3**: The big one, our Mini-C formalization.  Rather than asking the students to start from scratch, they're asked to fill in carefully chosen gaps in the code and proofs we provide. They 
implement semantics for conditionals and I/O, complete typing rules for binary expressions, and prove the corresponding portions of type safety.  The pattern repeats for security: they implement security typing rules, and then prove non-interference properties. 

To further tie the course concepts together, the students revisit the notion of
dynamic taint tracking introduced in the first quarter of the class.  With
similar scaffolding as above, they complete the implementation in Dafny of a
dynamic taint tracker and prove that it too enforces a non-interference property.

## Testing and Debugging Support

To help the students succeed, we provide them with ways to test their work as they go, especially when implementing the semantics and typing rules. Getting stuck on a proof when your implementation is broken is incredibly frustrating.

We include "unit test" lemmas throughout the development, such as this one, which should succeed if the student's implementation is correct.
```dafny
var e := BinaryOp(Leq, Var(x), Int(3));
var s := map[x := I(2)];
assert EvalExpr(e, s).ESuccess?;   
assert EvalExpr(e, s).v.b == true;

var c := Concat(PrintS("Hello"), PrintS("World"));
assert EvalCommand(s, c).Success?;
assert EvalCommand(s, c).io.output == io.output + ["Hello", "World"];
```
We also have a number of private tests that run as part of our autograder, so the students can check their progress as they go.

To make the whole process feel more concrete, 
we provide students with an ANTLR-generated Mini-C parser 
so they can run their implementations on actual Mini-C programs. 

## The Security Implications of Verification

To tie everything back to security, we end with a fun challenge: for extra credit, students can try to craft Mini-C programs that leak secret data despite our proven non-interference guarantees.

This drives home a crucial point about the gap between formal models and real systems. Yes, we proved non-interference—but what exactly did we prove, and what assumptions did we make?

## What We've Learned About Using Dafny

**The Good** 
1. Students adapt to Dafny syntax pretty well, and the VS Code plugin provides great support. 
2. Given the students' quiz and test scores, the combination of mathematical and executable presentations of the programming language concepts appears to significantly improve comprehension. 
3. Student anecdotal feedback is generally positive, both on how the verification helps them understand the concepts, and how the unit ties together many themes from the course.

**The Challenges**
1. Some students still struggle with function vs. method syntax, sequences vs. arrays, and remembering those colons in assignment statements.
2. In designing our assignments, we carefully avoid Dafny's less predictable/unstable features, such as non-linear arithmetic, real numbers, and quantifiers. We avoid quantifiers in lemmas, for example, by passing in and returning concrete values, which suffices for all of the Mini-C activities. In one offering of the course, another instructor made the mistake of introducing a homework problem that involved proving the correctness of an algorithm for sorting real numbers, rather than integers, and proof instability proved to be a significant problem for the students.
3. Every year, something changes in how Dafny compiles to C#, breaking our parser integration, so we budget time for these repairs when preparing the assignment. 

The Pragmatic Reality: Using Dafny requires more setup work than traditional PL courses, but the payoff in student understanding makes it worthwhile.

## Student Voices

The feedback speaks for itself:

> I learned a lot about how to write Dafny. It helps me get a different mindset of writing software.

> It is a hard thing to achieve and a tedious process however it is very useful to verify software as you can catch bugs that can lead to incorrect results or security issues. It was also very interesting to understand how type safe languages are verified to be this way. Overall, it was eye-opening.       

> I have learnt a lot in this Dafny assignment. One of the biggest things I've learnt is how specific and detailed you have to be for things to hold as post conditions. The stronger the post condition the tighter the verification for your code is.  Furthermore, I hadn't really thought about loop invariants the way they are set up in Dafny. Other classes have had similar concepts for loop invariants, however Dafny was about making them as strong as possible to have the ensures hold.  Overall it was really cool to learn this method of verifying software.

> I liked working with Dafny and being assured that the written code works as intended.  Looking back, it was helpful to correlate and prove the results with types and taint tracking. This assignment tied verification with side channel attacks as well, which was insightful to learn with a practical example how verified code can be misused.

Of course, not everyone loves the experience:

> It is quite difficult to verify software at a small scale, and it can get very frustrating very quickly.  Verifying software is valuable but time consuming.  Also Dafny is particularly hard to debug (can't rely on the go-to print statements). I would not recommend any startup to use Dafny, but rather rely on other software security techniques such as fuzzing, static analysis, or writing in a type-safe language like Rust. 

> Honestly, one of the things I learned is that the verification may be somewhat opaque, and it may not be clear to you, as the programmer, how the system knows that a certain statement implies another one. I also got good practice tracing back my code.

But even the frustrated students often acknowledge the value:

> It is very tedious and sometimes annoying. However, it teaches me as a programmer how to prove and look at code differently to better understand its intended purpose. Likewise, I really liked how we implemented taint analysis which connected what we learned now to a previous lecture. I appreciated the need for thorough logic because I feel like I now view code in a different and less careless light.   

## The Bottom Line

Teaching PL theory to students without PL backgrounds is hard. But by grounding abstract concepts in Dafny code, we can make these ideas accessible without dumbing them down. Students leave with both theoretical understanding and practical experience with verification tools.

The key insight? Don't choose between mathematical rigor and practical implementation—use both. Let students see how the beautiful theory connects to working code, and suddenly those intimidating inference rules start to make sense.