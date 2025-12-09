---
layout: post
title:  "A Verified Statistics Library for Dafny"
author: Bhavesh Bhatia and Tanay Mathur
date:   2025-12-01 09:00:00 +0000
categories: standard-libraries
---

What looks simple in code often becomes interesting the moment you try to prove it.

That is one of the most important things we discovered in our work with Dafny. This all started with a Carnegie Mellon University practicum project where our group was assigned to work with Amazon Web Services to contribute to Dafny’s growing ecosystem. From the very beginning, we were collaborating closely with mentors who were actively shaping Dafny as a language, refining its libraries, and expanding its capabilities. It felt like getting a front-row seat to how formal verification is used in real projects and how verified code is designed, reviewed, and maintained at an industrial standard.

During our early weeks, with steady support from our sponsors, we were learning how to structure proofs, write clear specifications, and work with Dafny’s verification model. We practiced with simple examples, checking conditions, writing loops with invariants, and studying how the standard libraries were written. As we dug deeper into these libraries and read through the posts and code our sponsors shared, we realized how much easier Dafny becomes when commonly used components are already available and verified. Instead of re-proving the same properties in every project, developers can rely on these modules and focus on the actual logic they want to build. That idea became an important part of how we approached our own work.

## Why a statistics library for Dafny?

Statistics shows up everywhere in software.

We compute averages in dashboards, use standard deviation to measure volatility, and rely on things like medians and percentiles to make decisions. These functions look simple on paper, but they are surprisingly easy to get subtly wrong in code: off–by–one errors, missing preconditions, incorrect handling of empty inputs, or inconsistent behaviour across implementations.

In a language like Dafny, where the whole point is to prove that code behaves as intended, it felt natural to ask:

* What would a small, well–designed, fully verified Statistics library look like in Dafny’s standard library?

This post tells the story of how we designed and implemented `Std.Statistics`, which is a new module that provides mathematically-defined, formally-verified statistical functions such as `Mean`, `VariancePopulation`, `VarianceSample`, `Median`, `Mode`, and `Range`, together with some supporting helpers for standard deviation and approximate comparisons.

We will walk through:

* the design goals of the library,
* how the functions are implemented and verified,
* how we deal with real numbers and square roots,
* and what we learned from iterating on the implementation with reviewers and sponsors.


## Design goals

As we began shaping the library, we tried to keep a small set of principles in mind, simple to explain, practical for users, and easy for Dafny to verify:

1. **Simple, familiar interface:** The functions should look like the ones people already know: Sum, Mean, VariancePopulation, VarianceSample, StdDevPopulation, StdDevSample, Median, Mode, and Range. Our goal was to make each one predictable and easy to call without any extra effort.

2. **Clear preconditions:** We wanted every function to be within its specified domain, with preconditions that match how the function is mathematically defined. For example:
   - Mean and VariancePopulation require `|s| > 0`
   - VarianceSample and StdDevSample require `|s| > 1`
   - Median and Range require `|s| > 0`.

3. **Textbook-style definitions as specification:** Our implementations follow the exact formulas used in statistics.
   - **Population variance**: average of squared differences from the mean.
   - **Sample variance**: same idea, but divided by N - 1 instead of N.
   - **Mode**: the value that appears most frequently in the sequence.

4. **Built-in guarantees like non-negativity:** Variance and standard deviation should never be negative. Instead of trusting that fact, we wanted Dafny to prove this property. This is enforced through helper functions that carry explicit `ensures` clauses, such as `ensures VariancePopulation(s) >= 0.0`.

5. **Reasonable performance:** While the first priority is correctness, we still aimed to avoid unnecessarily slow algorithms. In particular, we paid attention to the implementation of Mode, which can easily become quadratic if not implemented effectively.

With those goals in mind, let’s look at how the library is structured.


## Building the Foundation: Sum and Mean

Every statistical library starts with the same humble beginning: adding numbers together. While this seems trivial, in a verification language, how you implement a loop matters immensely for both proof stability and runtime performance.

### 1. The Summation Strategy
We define `Sum` not as a monolithic loop, but as a wrapper around a **tail-recursive helper**.

{% highlight dafny %}
  // A function to sum the elements of a sequence
  function Sum(s: seq<real>): real
  {
    SumHelper(s, 0.0)
  }

  // Helper function for Sum with the required attribute
  function {:tailrecursion} SumHelper(s: seq<real>, acc: real): real
    decreases s
  {
    if |s| == 0 then acc
    else SumHelper(s[1..], acc + s[0])
  }
{% endhighlight %}

**Why do it this way?**
If we wrote a standard recursive function (e.g., `s[0] + Sum(s[1..])`), the call stack would grow with the size of the dataset. By using an accumulator (`acc`) and the `{:tailrecursion}` attribute, we tell the Dafny compiler to optimize this into a highly efficient `while` loop in the generated C#, Java, or Go code. This ensures that calculating the sum of a million data points won't cause a stack overflow.

### 2. The Mean (and the Safety of Division)
Once we have the sum, the mean is simply the sum divided by the count.

{% highlight dafny %}
  // A function to compute the mean (average) as a real number
  function Mean(s: seq<real>): real
    requires |s| > 0
  {
    Sum(s) / (|s| as real)
  }
{% endhighlight %}

Here, Dafny’s verification engine shines. In many languages, passing an empty list to an average function results in a runtime crash (Division by Zero) or returns `NaN`.

In `Std.Statistics`, we enforce safety at the specification level. The precondition `requires |s| > 0` acts as a contract: you simply *cannot* compile code that calls `Mean` with an empty list. The compiler forces you to handle the empty case upstream, eliminating a common class of bugs before the code ever runs.


## The Dispersion Chain: From Differences to Deviation

Calculating how "spread out" data is involves a chain of dependencies. To get the Standard Deviation, you need the Variance. To get the Variance, you need the Sum of Squared Differences.

We structured the library to mirror this mathematical dependency tree, verifying each step along the way.

### 3. The Helper: SumSquaredDifferences
Variance is defined as the average of the squared differences from the mean. To keep our main functions clean, we extracted the heavy lifting into a helper function.

{% highlight dafny %}
  // A helper function to calculate the sum of squared differences from a given mean
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

**The Critical Proof:**
Notice the postcondition: `ensures ... >= 0.0`.
Dafny proves this automatically. It knows that any real number squared (`diff * diff`) is non-negative, and the sum of non-negative numbers is also non-negative. This small proof is the cornerstone of the entire library's safety as without it, we couldn't guarantee that Variance is positive, and we couldn't safely take the square root later.

### 4. Variance: Population vs. Sample
A frequent source of statistical errors is using the wrong divisor.
* **Population Variance** divides by N (used when you have the entire dataset).
* **Sample Variance** divides by N - 1 (used to correct bias when estimating from a sample).

We implemented both to avoid ambiguity.

{% highlight dafny %}
  // A function to calculate Population Variance
  function VariancePopulation(s: seq<real>): real
    requires |s| > 0
    ensures VariancePopulation(s) >= 0.0
  {
    var avg := Mean(s);
    SumSquaredDifferences(s, avg) / (|s| as real)
  }

  // A function to calculate Sample Variance
  function VarianceSample(s: seq<real>): real
    requires |s| > 1
    ensures VarianceSample(s) >= 0.0
  {
    var avg := Mean(s);
    (SumSquaredDifferences(s, avg)) / ((|s| - 1) as real)
  }
{% endhighlight %}

Because our helper `SumSquaredDifferences` is proven non-negative, Dafny automatically verifies that `VariancePopulation` and `VarianceSample` are also non-negative. Note that `VarianceSample` requires `|s| > 1`, because dividing by N - 1 where N is 1 would cause a division by zero!

### 5. Standard Deviation
 Finally, we arrive at Standard Deviation, which is the square root of the Variance. Since Dafny doesn't have a built-in square root, we define an `extern` function in a separate module.

{% highlight dafny %}
  // A function to calculate Population Standard Deviation
  function StdDevPopulation(s: seq<real>): real
    requires |s| > 0
    ensures StdDevPopulation(s) >= 0.0
  {
    ExternalMath.Sqrt(VariancePopulation(s))
  }

  // A function to calculate Sample Standard Deviation
  function StdDevSample(s: seq<real>): real
    requires |s| > 1
    ensures StdDevSample(s) >= 0.0
  {
    ExternalMath.Sqrt(VarianceSample(s))
  }
{% endhighlight %}

This is where the chain of proofs pays off.
1.  `ExternalMath.Sqrt(x)` requires `x >= 0.0`.
2.  `VarianceSample` guarantees it returns a value `>= 0.0`.
3.  Therefore, `StdDevSample` is verified safe without any extra runtime checks.

### 6. Testing with "AreNear"
Working with floating-point numbers means dealing with tiny precision errors. (1.0 / 3.0) * 3.0 isn't always exactly 1.0. To make our tests robust, we included a helper for approximate equality.

{% highlight dafny %}
  // Function to calculate the absolute value of a real number
  function RealAbs(x: real): real
    ensures RealAbs(x) >= 0.0
  {
    if x >= 0.0 then x else -x
  }

  // Function to check if two real numbers are close within a given tolerance.
  function AreNear(a: real, b: real, epsilon: real): bool
    requires epsilon >= 0.0
  {
    RealAbs(a - b) <= epsilon
  }
{% endhighlight %}

We use this extensively in our test suite (`TestStatistics.dfy`) to ensure that our verified logic holds up against real-world floating-point arithmetic.



## Order statistics: median and range

Beyond mean and variance, a statistics library should also provide basic order statistics such as median and range. Since Dafny’s standard collections already provide a merge sort ([MergeSortBy](https://github.com/dafny-lang/dafny/blob/68fb5ed04006b9be9601695d3d74687bbe3800b4/Source/DafnyStandardLibraries/src/Std/Collections/Seq.dfy#L1041)), we reuse it rather than re–implement ordering ourselves . This is exactly the kind of situation where strong libraries make a difference: instead of proving sorting correctness again, we can build directly on a verified component and focus on the statistical logic itself.

The median is defined as:

{% highlight dafny %}
  // Median of a non-empty sequence of real numbers
  function Median(a: seq<real>): real
    requires |a| > 0
  {
    // Existing merge sort utilized
    var sorted := MergeSortBy((x: real, y: real) => x <= y, a);
    if |a| % 2 == 1 then
      sorted[|a|/2]
    else
      (sorted[|a|/2 - 1] + sorted[|a|/2]) / 2.0
  }
{% endhighlight %}

A few things to note:
- We sort using a simple `x <= y` comparison on real.
- For odd lengths, the median is the middle element.
- For even lengths, we average the two middle elements.

The `Range` function is defined in a similar way: sort the sequence and subtract the minimum from the maximum.

{% highlight dafny %}
  // The function for calcluating range for a sequence which is the max element - min element
  function Range(s: seq<real>): real
    requires |s| > 0
    ensures Range(s) >= 0.0
  {
    var sorted := MergeSortBy((x: real, y: real) => x <= y, s);
    sorted[|s| - 1] - sorted[0]
  }
{% endhighlight %}

This section clearly shows how important these reusable components become and we hope that the statistics library becomes useful for our Dafny community in the same way.

## Computing mode in linear time

The *mode* of a dataset is the value that occurs most frequently. A naive implementation might, for each element, count how many times it appears in the sequence, leading to quadratic behaviour.

In our first attempt, we tried a recursive definition that compared counts directly, but it was not ideal from a performance or verification standpoint. After feedback from reviewers and sponsors, we refactored the design into two steps:

1. Build a *frequency table*: a `map<real,int>` from values to counts.
2. Scan through the sequence once, keeping track of the best value seen so far.

The frequency table is built with a tail–recursive function:

{% highlight dafny %}
  // The function to get a map to store the occurences of elements
  function {:tailrecursion} FrequencyTable(s: seq<real>, m: map<real, int> := map[]): map<real, int>
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

You remember our first line, What looks simple in code often becomes interesting the moment you try to prove it. This is one of the cases where we faced such an issue. Our FrequencyTable function seemed simple: take a sequence and build a map counting occurrences.
Now , Formally, we wanted Dafny to verify:

{% highlight dafny %}
ensures forall x :: x in s ==> x in FrequencyTable(s, m)
{% endhighlight %}

But this postcondition would not verify, even though the implementation was correct.

After some debugging and a very helpful review from our sponsor Robin, we realized the issue:
our specification never told Dafny how the accumulator m relates to the output.
Nothing guaranteed that keys already present in m must still appear in the final map.

The missing piece was a single line:

{% highlight dafny %}
ensures m.Keys <= FrequencyTable(s, m).Keys
{% endhighlight %}

This states that the result must at least preserve all existing keys.
With this, Dafny finally had enough structure to prove the main postcondition, and the entire function verified cleanly, a perfect example of how small specification details matter deeply when writing verified code.

Given this frequency map, we compute the mode by scanning the sequence with `ModeHelper` and tying everything together in the public `Mode` function:

{% highlight dafny %}
  // Helper function to calculate mode
  function {:tailrecursion} ModeHelper(freq: map<real,int>, keys: seq<real>, best: real, i: nat): real
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

  // Final mode function that calls the frequencytable and modehelper
  function Mode(s: seq<real>): real
    requires |s| > 0
  {
    var freq := FrequencyTable(s);
    var keys := s;
    var best := s[0];
    var i := 0;


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
- The preconditions make verification smoother: `ModeHelper` assumes that every `keys[i]` is a key in `freq`, which is guaranteed by the `FrequencyTable` postcondition.


## Testing the library

Dafny’s `{:test}` attribute and our small test helper module let us write executable tests that also serve as documentation.

Here is an excerpt from our test suite:

{% highlight dafny %}
  method {:test} TestMean() {
    AssertAndExpect(Mean([1.0, 2.0, 3.0, 4.0, 5.0]) == 3.0);
    AssertAndExpect(Mean([1.5, 2.5, 3.5]) == 2.5);
    AssertAndExpect(Mean([100.0]) == 100.0);
    AssertAndExpect(Mean([-10.0, 0.0, 10.0, 20.0]) == 5.0);
  }

  method {:test} TestStandardDeviation_DataSet1() {
    var eps := 0.000001;
    var data := [1.0, 2.0, 3.0, 4.0, 5.0];
    AssertAndExpect(AreNear(StdDevPopulation(data) * StdDevPopulation(data), 2.0, eps));
    AssertAndExpect(AreNear(StdDevSample(data) * StdDevSample(data), 2.5, eps));
  }

  method {:test} {:rlimit 50000} Test_Median_Odd_Case() {
    AssertAndExpect(Median([3.0, 1.0, 2.0]) == 2.0);
  }

  // Testcase for median in even case
  method {:test} {:rlimit 1000000} Test_Median_Even_Case() {
    AssertAndExpect(Median([4.0, 2.0, 3.0, 1.0]) == (2.0 + 3.0) / 2.0);
  }

  method {:test} Test_Mode() {
    expect Mode([1.0, 2.0, 2.0, 3.0]) == 2.0;
  }

  // Testcase for checking mode with multiple occurences for multiple elements
  method {:test} Test_Mode_Multiple() {
    expect Mode([5.0, 5.0, 7.0, 7.0, 7.0, 9.0]) == 7.0;
  }

  method {:test}  {:rlimit 50000} Test_Range() {
    AssertAndExpect(Range([1.0, 3.0, 5.0]) == 4.0);
  }
{% endhighlight %}


These tests are not a substitute for formal proofs, Dafny already proves the specifications but they provide an extra layer of confidence and serve as concrete usage examples for future users of the library.

They also show how simple it is to work with the module: you can call Mean, Median, VariancePopulation, Mode, and the rest just like any normal function without worrying about the underlying proofs. In that sense, the tests double as a quick “how to use this library” guide while demonstrating its correctness on real data.


## Acknowledgments

We would like to extend our sincere gratitude to **Robin Salkeld**, **Olivier Bouissou**, and **Mikael Mayer**, our points of contact and mentors at AWS. Their guidance on API design, performance optimization, and proof stability was instrumental in bringing this library to the Dafny community.

## Looking ahead

The current `Std.Statistics` module focuses on core, widely used operations. In the future, it could be extended with:

- covariance and correlation,
- z–scores and normalization helpers,
- higher–order utilities for working with sequences of records.

Our hope is that this library lowers the barrier for Dafny users who need basic statistical functionality, while preserving Dafny’s promise: *if it compiles and verifies, you can trust it*.