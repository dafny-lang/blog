---
layout: post
title:  "A Verified Statistics Library for Dafny"
author: Bhavesh Bhatia and Tanay Mathur
date:   2025-12-1 09:00:00 +0000
---

What looks simple in code often becomes interesting the moment you try to prove it.

That is one of the most important things we discovered in our work with Dafny. This all started with a Carnegie Mellon University practicum project where our group was assigned to work with Amazon Web Services to contribute to Dafny’s growing ecosystem. From the very beginning, we were collaborating closely with mentors who were actively shaping Dafny as a language, refining its libraries, and expanding its capabilities. It felt like getting a front-row seat to how formal verification is used in real projects and how verified code is designed, reviewed, and maintained at an industrial standard.

During our early weeks, with steady support from our sponsors, we were learning how to structure proofs, write clear specifications, and work with Dafny’s verification model. We practiced with simple examples, checking conditions, writing loops with invariants, and studying how the standard libraries were written. As we dug deeper into these libraries and read through the posts and code our sponsors shared, we realized how much easier Dafny becomes when commonly used components are already available and verified. Instead of re-proving the same properties in every project, developers can rely on these modules and focus on the actual logic they want to build. That idea became an important part of how we approached our own work.

## Why a statistics library for Dafny?

Statistics shows up everywhere in software.

We compute averages in dashboards, use standard deviation to measure volatility, and rely on things like medians and percentiles to make decisions. These functions look simple on paper, but they are surprisingly easy to get subtly wrong in code: off–by–one errors, missing preconditions, incorrect handling of empty inputs, or inconsistent behaviour across implementations.

In a language like Dafny, where the whole point is to prove that code behaves as intended, it felt natural to ask:

* What would a small, well–designed, fully verified Statistics library look like in Dafny’s standard library?

This post tells the story of how we designed and implemented Std.Statistics — a new module that provides mathematically defined, formally verified statistical functions such as Mean, VariancePopulation, VarianceSample, Median, Mode, and Range, together with some supporting helpers for standard deviation and approximate comparisons.

We will walk through:

* the design goals of the library,
- how the functions are implemented and verified,
- how we deal with real numbers and square roots,
- and what we learned from iterating on the implementation with reviewers and sponsors.

---

## Design goals

As we began shaping the library, we tried to keep a small set of principles in mind, simple to explain, practical for users, and easy for Dafny to verify:

1. *Simple, familiar interface*  
   The functions should look like the ones people already know:
   Sum, Mean, VariancePopulation, VarianceSample, StdDevPopulation, StdDevSample, Median, Mode, and Range.
   Our goal was to make each one predictable and easy to call without any extra effort.

2. *Clear preconditions*  
   We wanted every function to be within its specified domain, with preconditions that match how the function is mathematically defined. For example:

   - Mean and VariancePopulation require `|s| > 0`
   - VarianceSample and StdDevSample require `|s| > 1`,
   - Median and Range require `|s| > 0`.

3. *Textbook-style definitions as specification*  
   Our implementations follow the exact formulas used in statistics.

   - **Population variance**: average of squared differences from the mean.  
   - **Sample variance**: same idea, but divided by (n − 1) instead of n.  
   - **Mode**: the value that appears most frequently in the sequence.

4. *Built-in guarantees like non-negativity*  
   Variance and standard deviation should never be negative. Instead of trusting that fact, we wanted Dafny to prove it, we wanted Dafny to prove this property. This is enforced through helper functions that carry explicit ensures-clauses.

5. *Reasonable performance*  
   While the first priority is correctness, we still aimed to avoid unnecessarily slow algorithms. In particular, we paid attention to the implementation of Mode, which can easily become quadratic if not implemented effectively.

With those goals in mind, let’s look at how the library is structured.

---

## Building block: summing a sequence

Many statistical quantities are built on top of a simple primitive: the sum of a sequence.

In Std.Statistics, we expose:

{% highlight dafny %}
module Std.Statistics {
  import opened ExternalMath
  import opened Collections.Seq

  // A function to sum the elements of a sequence
  function Sum(s: seq<real>): real
  {
    SumHelper(s, 0.0)
  }

  // Tail-recursive helper
  function {:tailrecursion} SumHelper(s: seq<real>, acc: real): real
    decreases s
  {
    if |s| == 0 then acc
    else SumHelper(s[1..], acc + s[0])
  }
}
{% endhighlight %}

We chose a tail–recursive helper SumHelper with an accumulator so that the definition remains structurally recursive and executable, while still being easy to reason about.

Even though Sum itself has no precondition (an empty sequence sums to 0.0), this helper becomes the foundation for the rest of the library.

---

## Mean: the simplest average

The mean of a non–empty sequence is defined as the sum divided by its length:

{% highlight dafny %}
function Mean(s: seq<real>): real
  requires |s| > 0
{
  Sum(s) / (|s| as real)
}
{% endhighlight %}

The precondition `|s| > 0` does two important things:

- it prevents division by zero, and  
- it mirrors the mathematical definition, which assumes at least one data point.

From a user’s perspective, the function does exactly what they expect — but from Dafny’s perspective, the precondition ensures that the function is total and safe to use whenever the caller can prove the sequence is non–empty.

---

## From mean to variance

To compute variance, we need to sum the squared differences from the mean. We represent that with a helper function:

{% highlight dafny %}
function SumSquaredDifferences(s: seq<real>, avg: real): real
  ensures SumSquaredDifferences(s, avg) >= 0.0
{
  if |s| == 0 then
    0.0
  else
    var diff := s[0] - avg;
    diff * diff + SumSquaredDifferences(s[1..], avg)
}
{% endhighlight %}

The key property is built right into the specification:

* SumSquaredDifferences(s, avg) >= 0.0

Dafny proves this automatically by induction over s, using the fact that diff * diff is always non–negative and the base case returns 0.0.

With this helper in place, the variance definitions are straightforward:

{% highlight dafny %}
function VariancePopulation(s: seq<real>): real
  requires |s| > 0
  ensures VariancePopulation(s) >= 0.0
{
  var avg := Mean(s);
  SumSquaredDifferences(s, avg) / (|s| as real)
}

function VarianceSample(s: seq<real>): real
  requires |s| > 1
  ensures VarianceSample(s) >= 0.0
{
  var avg := Mean(s);
  SumSquaredDifferences(s, avg) / ((|s| - 1) as real)
}
{% endhighlight %}

Again, the specifications reflect the mathematical and statistical expectations:

- Population variance divides by n.
- Sample variance divides by n - 1.
- Both are guaranteed to be non–negative.

The proof of non–negativity comes from the fact that:

- the numerator (sum of squared differences) is non–negative, and
- the denominator is a positive real because of the preconditions on `|s|`.

---

## Standard deviation and external square root

Standard deviation is defined as the square root of variance. Dafny does not provide a built–in verified square root, so we introduce a small ExternalMath module:

{% highlight dafny %}
module ExternalMath {
  function {:extern}{:axiom} Sqrt(x: real): real
    requires x >= 0.0
    ensures Sqrt(x) >= 0.0
    ensures x - 0.0000001 <= Sqrt(x) * Sqrt(x) <= x + 0.0000001
}
{% endhighlight %}

This function is marked {:extern} and {:axiom}, meaning:

- it is supplied by the target platform at runtime, and
- we assume (axiomatically) that it behaves like a reasonable square root function, within a small tolerance.

Using Sqrt, we define:

{% highlight dafny %}
function StdDevPopulation(s: seq<real>): real
  requires |s| > 0
  ensures StdDevPopulation(s) >= 0.0
{
  ExternalMath.Sqrt(VariancePopulation(s))
}

function StdDevSample(s: seq<real>): real
  requires |s| > 1
  ensures StdDevSample(s) >= 0.0
{
  ExternalMath.Sqrt(VarianceSample(s))
}
{% endhighlight %}

The main properties we care about here are:

- standard deviation is non–negative, and  
- squaring the result brings us back close to the variance, within the tolerance of the external square root.

In our test suite, we often compare *variances* instead of standard deviations directly. For example, we check that:

- StdDevPopulation(data)^2 is “near” 2.0 for a simple dataset, and  
- StdDevSample(data)^2 is “near” 2.5.

---

## Working with approximate equality

Because we are dealing with real values and an approximate square root, we need a way to talk about “near equality”. We introduce a simple absolute–value–based helper:

{% highlight dafny %}
function RealAbs(x: real): real
  ensures RealAbs(x) >= 0.0
{
  if x >= 0.0 then x else -x
}

function AreNear(a: real, b: real, epsilon: real): bool
  requires epsilon >= 0.0
{
  RealAbs(a - b) <= epsilon
}
{% endhighlight %}

We use AreNear in our tests to assert that squared standard deviations match the expected variances within a small epsilon. This reflects the reality of numerical computations while still letting us state meaningful, machine–checkable properties.

---

## Order statistics: median and range

Beyond mean and variance, a statistics library should also provide basic order statistics such as median and range. Since Dafny’s standard collections already provide a merge sort (MergeSortBy), we reuse it rather than re–implement ordering ourselves.

The median is defined as:

{% highlight dafny %}
function Median(a: seq<real>): real
  requires |a| > 0
{
  var sorted := MergeSortBy((x: real, y: real) => x <= y, a);
  if |a| % 2 == 1 then
    sorted[|a|/2]
  else
    (sorted[|a|/2 - 1] + sorted[|a|/2]) / 2.0
}
{% endhighlight %}

A few things to note:

- We sort using a simple x <= y comparison on real.
- For odd lengths, the median is the middle element.
- For even lengths, we average the two middle elements.

One nice aspect of this definition is that it works equally well whether the input sequence is initially sorted or not. Our tests include both kinds of cases:

- [3.0, 1.0, 2.0] → 2.0  
- [4.0, 2.0, 3.0, 1.0] → (2.0 + 3.0) / 2.0  
- [1.0, 2.0, 3.0, 4.0] → same result as above

The Range function is defined in a similar spirit: sort the sequence and subtract the minimum from the maximum.

{% highlight dafny %}
function Range(s: seq<real>): real
  requires |s| > 0
  ensures Range(s) >= 0.0
{
  var sorted := MergeSortBy((x: real, y: real) => x <= y, s);
  sorted[|s| - 1] - sorted[0]
}
{% endhighlight %}

The postcondition Range(s) >= 0.0 follows from the non–decreasing nature of the sorted sequence.

---

## Computing mode in linear time

The *mode* of a dataset is the value that occurs most frequently. A naive implementation might, for each element, count how many times it appears in the sequence, leading to quadratic behaviour.

In our first attempt, we tried a recursive definition that compared counts directly with Count(s, v), but it was not ideal from a performance or verification standpoint. After feedback from reviewers and sponsors, we refactored the design into two steps:

1. Build a *frequency table*: a map<real,int> from values to counts.  
2. Scan through the sequence once, keeping track of the best value seen so far.

The frequency table is built with a tail–recursive function:

{% highlight dafny %}
function {:tailrecursion} FrequencyTable(
  s: seq<real>,
  m: map<real, int> := map[]
): map<real, int>
  ensures m.Keys <= FrequencyTable(s, m).Keys
  ensures forall x :: x in s ==> x in FrequencyTable(s, m)
{
  if s == [] then
    m
  else
    var key := s[0];
    var newM :=
      if key in m then
        m[key := m[key] + 1]
      else
        m[key := 1];
    FrequencyTable(s[1..], newM)
}
{% endhighlight %}

The postconditions tell us:

- the keys of the original map are preserved, and  
- any element of s will appear as a key in the resulting map.

Given this frequency map, we compute the mode by scanning the sequence:

{% highlight dafny %}
function {:tailrecursion} ModeHelper(
  freq: map<real,int>,
  keys: seq<real>,
  best: real,
  i: nat
): real
  requires forall x :: x in keys ==> x in freq
  requires best in keys
  decreases |keys| - i
{
  if i >= |keys| then best
  else
    var next := keys[i];
    var newBest :=
      if freq[next] > freq[best] then next else best;
    ModeHelper(freq, keys, newBest, i + 1)
}
{% endhighlight %}

The public Mode function simply ties everything together:

{% highlight dafny %}
function Mode(s: seq<real>): real
  requires |s| > 0
{
  var freq := FrequencyTable(s);
  var keys := s;
  var best := s[0];

  var result :=
    if |keys| == 1 then best
    else
      ModeHelper(freq, keys, best, 0);

  result
}
{% endhighlight %}

This design has a few advantages:

- It runs in *O(n)* time: one pass to build the frequency map and one pass to find the best.  
- It naturally supports *deterministic tie–breaking*: if two values have the same frequency, the one encountered first in the sequence remains the mode.
- The preconditions make verification smoother: ModeHelper assumes that every keys[i] is a key in freq, which is guaranteed by the FrequencyTable postcondition.

Our tests cover several scenarios, including:

- a clear unique mode ([1.0, 2.0, 2.0, 3.0] → 2.0),  
- multiple occurrences ([5.0, 5.0, 7.0, 7.0, 7.0, 9.0] → 7.0),  
- a single–element sequence ([42.0] → 42.0),  
- ties ([6.0, 6.0, 4.0, 4.0] → 6.0 in our deterministic design).

---

## Testing the library

Dafny’s {:test} attribute and our small test helper module let us write executable tests that also serve as documentation.

Here is an excerpt from our test suite:

{% highlight dafny %}
method {:test} TestMean() {
  AssertAndExpect(Mean([1.0, 2.0, 3.0, 4.0, 5.0]) == 3.0);
  AssertAndExpect(Mean([1.5, 2.5, 3.5]) == 2.5);
  AssertAndExpect(Mean([100.0]) == 100.0);
  AssertAndExpect(Mean([-10.0, 0.0, 10.0, 20.0]) == 5.0);
}

method {:test} TestVariance_DataSet1() {
  var data := [1.0, 2.0, 3.0, 4.0, 5.0];
  AssertAndExpect(VariancePopulation(data) == 2.0);
  AssertAndExpect(VarianceSample(data) == 2.5);
}

method {:test} TestStandardDeviation_DataSet1() {
  var eps := 0.000001;
  var data := [1.0, 2.0, 3.0, 4.0, 5.0];
  AssertAndExpect(AreNear(
    StdDevPopulation(data) * StdDevPopulation(data),
    2.0, eps));
  AssertAndExpect(AreNear(
    StdDevSample(data) * StdDevSample(data),
    2.5, eps));
}
{% endhighlight %}

We also test Median and Range with both sorted and unsorted inputs, different sizes, and edge cases such as single–element sequences.

These tests are not a substitute for formal proofs — Dafny already proves the specifications — but they provide an extra layer of confidence and serve as concrete usage examples for future users of the library.

---

## Lessons learned

Designing a statistics library in Dafny taught us a few interesting lessons:

- *Clear specifications guide the design.*  
  Writing down properties like “variance is always non–negative” or “median requires a non–empty sequence” helped shape the implementation and made the code easier to verify.

- *External functions need carefully chosen axioms.*  
  For Sqrt, we had to strike a balance between realism and simplicity. The axioms are not a full formalization of real–number square root, but they are strong enough for our use–cases and simple enough for the verifier.

- *Performance and verification can coexist.*  
  Our initial mode implementation was simple but potentially quadratic. Refactoring it into a frequency map plus a linear scan improved performance and made the behaviour easier to reason about, especially with explicit preconditions and postconditions on the helper functions.

- *Tests make the library approachable.*  
  Even in a verification–first language, executable tests are a great way for new users to see how functions behave with real data.

---

## Looking ahead

The current Std.Statistics module focuses on core, widely used operations. In the future, it could be extended with:

- covariance and correlation,
- z–scores and normalization helpers,
- higher–order utilities for working with sequences of records (e.g., extracting numeric fields).

Our hope is that this library lowers the barrier for Dafny users who need basic statistical functionality, while preserving Dafny’s promise: *if it compiles and verifies, you can trust it*.

If you are using Dafny and would like to see more functionality in Std.Statistics, or if you have ideas about how to specify and verify more advanced statistical concepts, we would be very happy to hear from you.