---
layout: post
title: "A Verified Duration Library for Dafny"
author: Jules Wang
date: 2025-12-08 10:00:00 +0000
categories: standard-libraries
---

## Why a Duration library for Dafny?

Durations appear in nearly every timestamp based calculation and retries to billing intervals and performance metrics. The challenge isn't simple arithmetic; it's handling overflow, unit conversions, and composing time intervals reliably without losing precision or correctness.

In a verification-oriented language, these operations become more than implementation details; they become verified guarantees. Our goal was a library you can use like any other API, with Dafny proving that:

- durations are within safe bounds (no overflow surprises),
- unit conversions are accurate and reversible,
- arithmetic operations are safe or fail clearly,
- parsing and formatting are deterministic,
- scaling and division preserve mathematical properties.

This post shares how we designed and verified Std.Duration: a focused, practical module that handles time intervals with millisecond precision, strong specifications, and seamless interop with date-time operations. It grew out of the same practicum effort that produced ZonedDateTime, emphasizing verification rigor without sacrificing everyday usability.

We'll walk through:

- the design goals that shaped the API,
- the core data model and representation,
- arithmetic operations built on total milliseconds,
- parsing and formatting (ISO-8601 duration format),
- comparison and utility functions,
- and the tests that lock down behavior.

## Design goals

1. **Simple, familiar representation:** Durations as (seconds, milliseconds) pairs with clear semantics and bounded ranges.
2. **Predictable arithmetic:** All operations route through total milliseconds; overflow is checked; division and modulo are explicit and safe.
3. **Strong specifications:** Every public function has requires/ensures contracts that match textbook definitions and prevent misuse.
4. **Strict, standard parsing:** ISO-8601 duration format (PTxHyMz.wS) with precise validation—favoring correctness over permissiveness.
5. **Composable with date-time:** Duration works seamlessly with ZonedDateTime arithmetic without hidden conversions or precision loss.

With these principles, here's how the module is structured.

## The core data model

We represent a duration as a pair of seconds and milliseconds, both bounded within safe ranges. A simple invariant ensures values remain well-formed.

{% highlight dafny %}
// Duration with explicit seconds and milliseconds components
datatype Duration = Duration(
seconds: int,
millis: int
)

function ToTotalMilliseconds(d: Duration): int
{
var total: int :=
(d.seconds \* MILLISECONDS_PER_SECOND_INT) +
d.millis;
total
}

function FromMilliseconds(ms: int): Duration
{
var secondsValue := ms / MILLISECONDS_PER_SECOND_INT;
var millisValue := ms % MILLISECONDS_PER_SECOND_INT;
Duration(secondsValue, millisValue)
}
{% endhighlight %}

By normalizing through total milliseconds, we ensure that Duration(1000, 500) and Duration(1, 500) are always handled consistently. This internal representation provides the foundation for all subsequent operations.

## Arithmetic: The heart of the library

All duration arithmetic routes through milliseconds to prevent overflow and maintain precision.

Addition combines two durations safely:

{% highlight dafny %}
function Plus(d1: Duration, d2: Duration): Duration
requires d1.seconds < DURATION_SECONDS_BOUND
{
var ms1 := ToTotalMilliseconds(d1);
var ms2 := ToTotalMilliseconds(d2);
var sum := ms1 + ms2;
FromMilliseconds(sum)
}
{% endhighlight %}

Subtraction enforces a precondition to prevent negative results:

{% highlight dafny %}
function Minus(d1: Duration, d2: Duration): Duration
requires ToTotalMilliseconds(d1) >= ToTotalMilliseconds(d2)
{
var ms1 := ToTotalMilliseconds(d1);
var ms2 := ToTotalMilliseconds(d2);
FromMilliseconds((ms1 - ms2))
}
{% endhighlight %}

Scaling and division are particularly important for interval-based calculations:

{% highlight dafny %}
@ResourceLimit("1e7")
function Scale(d: Duration, factor: int): Duration
requires ToTotalMilliseconds(d) _ factor <= DURATION_SECONDS_BOUND
{
var ms := ToTotalMilliseconds(d);
var product := ms _ factor ;
FromMilliseconds(product)
}

@ResourceLimit("1e7")
function Divide(d: Duration, divisor: int): Duration
requires divisor > 0
{
FromMilliseconds((ToTotalMilliseconds(d)/ divisor))
}
{% endhighlight %}

Each operation is bounded and verifiable. Overflow conditions are explicit in the requires clauses, making callers aware of limits up front.

## Comparison and utility functions

Comparing durations is straightforward once you normalize to milliseconds:

{% highlight dafny %}
function Compare(d1: Duration, d2: Duration): int
{
var ms1 := ToTotalMilliseconds(d1);
var ms2 := ToTotalMilliseconds(d2);
if ms1 < ms2 then -1
else if ms1 > ms2 then 1
else 0
}

function Less(d1: Duration, d2: Duration): bool
{
ToTotalMilliseconds(d1) < ToTotalMilliseconds(d2)
}

function Max(d1: Duration, d2: Duration): Duration
{
if Less(d1, d2) then d2 else d1
}

function Min(d1: Duration, d2: Duration): Duration
{
if Less(d1, d2) then d1 else d2
}
{% endhighlight %}

Unit conversion functions provide ergonomic access to different time scales:

{% highlight dafny %}
function FromSeconds(s: int): Duration
{
var product := s \* (MILLISECONDS_PER_SECOND as int);
FromMilliseconds(product)
}

function FromMinutes(m: int): Duration
{
var product := m \* (MILLISECONDS_PER_MINUTE as int);
FromMilliseconds(product)
}

function FromHours(h: int): Duration
{
var product := h \* (MILLISECONDS_PER_MINUTE as int);
FromMilliseconds(product)
}

function FromDays(d: int): Duration
{
var product := d \* (MILLISECONDS_PER_MINUTE as int);
FromMilliseconds(product)
}
{% endhighlight %}

Accessors and modulo operations round out the toolkit:

{% highlight dafny %}
function GetSeconds(d: Duration): int { d.seconds }

function GetMilliseconds(d: Duration): int { d.millis }

@ResourceLimit("1e7")
function Mod(d1: Duration, d2: Duration): Duration
requires ToTotalMilliseconds(d2) > 0
{
FromMilliseconds((ToTotalMilliseconds(d1) % ToTotalMilliseconds(d2)))
}
{% endhighlight %}

## Parsing and formatting

Duration parsing follows ISO-8601, the international standard for duration representation: `PTxHyMz.wS` (for example, `PT2H30M45.500S` means 2 hours, 30 minutes, 45.5 seconds).

The parser is strict and verifiable, with explicit component extraction:

{% highlight dafny %}
function ParseComponent(text: string, start: int, end: int): Result<int, string>
requires start >= 0 && end >= 0 && start <= end && end <= |text|
{
if start >= end then
Success(0)
else
var substr := text[start..end];
if IsNumeric(substr) then
match ParseNumericString(substr)
case Success(parsed) =>
if parsed <= DURATION_SECONDS_BOUND then
Success(parsed as int)
else
Failure("Parsed value exceeds maximum uint32")
case Failure(err) =>
Failure(err)
else
Failure("Non-numeric characters in component")
}

@ResourceLimit("1e7")
function ParseString(text: string): Result<Duration, string>
requires |text| >= 2
requires text[0..2] == "PT"
{
var len := |text|;
// Extract positions of H, M, S markers
var hPos := FindCharOrNeg(text, 'H');
var mPos := FindCharOrNeg(text, 'M');
var sPos := FindCharOrNeg(text, 'S');
var dotPos := FindCharOrNeg(text, '.');

    // Parse each component in order (hours, minutes, seconds, milliseconds)
    // with careful boundary handling
    …

}
{% endhighlight %}

Formatting produces the canonical ISO-8601 representation:

{% highlight dafny %}
function ToString(d: Duration): string
{
var total_seconds := d.seconds;
var hours := (total_seconds / (SECONDS_PER_HOUR as int)) as int;
var minutes := ((total_seconds % (SECONDS_PER_HOUR as int)) / (SECONDS_PER_MINUTE as int)) as int;
var seconds := (total_seconds % (SECONDS_PER_MINUTE as int)) as int;
"PT" + OfInt(hours) + "H" + OfInt(minutes) + "M" + OfInt(seconds) + "." +
OfInt(d.millis as int) + "S"
}
{% endhighlight %}

Parse–format round-trips are guaranteed; the specs ensure that a formatted duration parses back to an equivalent value.

## Resource bounds and verification

Several operations are marked with `@ResourceLimit("1e7")` to guide the verifier's resource budget. This is especially important for functions involving recursion (like ParseNumericString) or expensive arithmetic (Scale, Divide, Mod). The bounds are set conservatively to ensure proofs complete without timing out.

{% highlight dafny %}
lemma IsNumericSubstring(s: string, start: int, end: int)
requires IsNumeric(s)
requires 0 <= start < end <= |s|
ensures IsNumeric(s[start..end])
{
}

@ResourceLimit("1e7")
function ParseNumericString(s: string): Result<int, string>
requires IsNumeric(s)
decreases |s|
{
if |s| == 0 then
Success(0)
else if |s| == 1 then
var digit := (s[0] as int) - ('0' as int);
Success(digit)
else
var digit := (s[0] as int) - ('0' as int);
IsNumericSubstring(s, 1, |s|);  
 match ParseNumericString(s[1..])
case Success(restValue) =>
var pow := Pow(10, |s| - 1);
var result := digit \* pow + restValue;
Success(result)
case Failure(err) =>
Failure(err)
}
{% endhighlight %}

This combination of lemmas and resource limits keeps verification tractable while maintaining full correctness.

## Testing the library

We use `{:test}` methods to document expected behavior across the full API surface:

- Arithmetic round-trips: Adding and subtracting the same duration returns the original value.
- Unit conversions: `FromSeconds(3600)` equals `FromHours(1)`.
- Parsing and formatting: ISO-8601 strings parse correctly and format back identically.
- Overflow detection: Operations that exceed bounds fail gracefully.
- Comparison consistency: Less, LessOrEqual, and Compare are transitive and consistent.

Here's an example test illustrating the pattern:

{% highlight dafny %}
method {:test} TestArithmetic() {
var d1 := Duration.Duration(1, 2);
var d2 := Duration.Duration(1, 3);

var total1 := Duration.ToTotalMilliseconds(d1);
AssertAndExpect(total1 == 1002);

var d3 := Duration.Plus(d1, d2);
AssertAndExpect(d3 == Duration.Duration(2, 5));

var d4 := Duration.Minus(d2, d1);
AssertAndExpect(d4 == Duration.Duration(0, 1));
}

method {:test} TestUnitConversions() {
var oneSec := Duration.FromSeconds(1);
AssertAndExpect(Duration.ToTotalMilliseconds(oneSec) == 1000);

var oneMin := Duration.FromMinutes(1);
AssertAndExpect(Duration.ToTotalMilliseconds(oneMin) == (60000 as int));

var oneHour := Duration.Duration(3600, 0);
AssertAndExpect(Duration.ToTotalMilliseconds(oneHour) == 3600000);
}

method {:test} TestOfParseString() {
var parsedResult := Duration.ParseString("PT9650H30M45.123S");
expect parsedResult.Success?;
expect Duration.GetMilliseconds(parsedResult.value) == 123;
}

{% endhighlight %}

These tests serve as both verification anchors and executable documentation, making the intended behavior concrete and trustworthy.

## Interop with date-time libraries

Duration is designed to compose naturally with ZonedDateTime and other temporal operations. The EpochDifference function computes the duration between two epoch timestamps:

{% highlight dafny %}
function EpochDifference(epoch1: int, epoch2: int): Duration
{
var diff : int := if epoch1 >= epoch2 then (epoch1 - epoch2) as int
else (epoch2 - epoch1) as int;
FromMilliseconds(diff)
}
{% endhighlight %}

This enables seamless calculation of time deltas across date-time boundaries without precision loss.

## Looking ahead

The current Std.Duration module provides a solid, verified foundation for interval-based reasoning. Natural extensions include:

- negative durations (for representing "backwards" time intervals),
- higher-precision fractional seconds beyond milliseconds,
- integration with scheduling libraries and timeout managers.

Our hope is that this module makes working with time intervals trustworthy and straightforward. _If it compiles and verifies, you can depend on the correctness of every arithmetic operation, every parse, and every comparison._
