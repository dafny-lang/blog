---
layout: post
title:  "A Verified DateTime for Dafny"
author: Jerry Zhou, Yuyang Liu, Jules Wang
date:   2025-12-08 09:00:00 +0000
categories: standard-libraries
---

# Local Date Time Library

Date and time handling is one of the most error-prone areas in software development.

From leap year calculations to parsing failures, temporal data presents edge cases that can corrupt application logic. This becomes critical in verification languages like Dafny, where correctness is mathematically proven.

We built `Std.LocalDateTime`, a comprehensive module providing timezone-agnostic date-time operations with full formal verification. This post covers:

* design principles behind safe temporal arithmetic,
* validation and bounded integer types,
* parsing and formatting with formal contracts,
* epoch-based arithmetic for reliable calculations,
* verification challenges we solved.


## Design principles

Our design balances mathematical precision with real-world complexity:

1. **Safety through types:** Bounded integer types (`int32`, `uint8`, `uint16`) prevent overflow while maintaining verification guarantees.

2. **Explicit validation:** Every LocalDateTime instance must satisfy `IsValidLocalDateTime(dt)`, checking leap years, month boundaries, and time constraints.

3. **Immutability:** Pure functions like `WithYear`, `WithMonth` return new validated instances instead of mutation.

4. **Epoch-based arithmetic:** Date arithmetic converts to epoch milliseconds, performs calculation, then converts back—avoiding calendar complexity.

5. **Parse-don't-validate:** Parsing functions return `Result<LocalDateTime, string>`, forcing explicit error handling.


## The core datatype and validation

The `LocalDateTime` datatype uses bounded integer types for safety:

{% highlight dafny %}
datatype LocalDateTime = LocalDateTime(
  year: int32,
  month: uint8,
  day: uint8,
  hour: uint8,
  minute: uint8,
  second: uint8,
  millisecond: uint16
)
{% endhighlight %}

Bounded types prevent overflow while the validation predicate ensures semantic correctness:

{% highlight dafny %}
predicate IsValidLocalDateTime(dt: LocalDateTime)
{
  DTUtils.IsValidDateTime(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.millisecond)
}
{% endhighlight %}

This checks month boundaries (1-12), days within each month (including leap years), time ranges (0-23 hours, 0-59 minutes), and supports leap seconds. Every function requires valid input and ensures valid output—creating a **verification firewall**.

{% highlight dafny %}
function Of(year: int32, month: uint8, day: uint8, hour: uint8, minute: uint8, second: uint8, millisecond: uint16): Result<LocalDateTime, string>
{
  if DTUtils.IsValidDateTime(year, month, day, hour, minute, second, millisecond) then
    Success(FromComponents(year, month, day, hour, minute, second, millisecond))
  else
    Failure(DTUtils.GetValidationError(year, month, day, hour, minute, second, millisecond))
}
{% endhighlight %}


## Immutable transformations

LocalDateTime provides transformation functions with **defensive clamping**:

{% highlight dafny %}
function WithYear(dt: LocalDateTime, newYear: int32): LocalDateTime
  requires IsValidLocalDateTime(dt) && MIN_YEAR <= newYear <= MAX_YEAR
  ensures IsValidLocalDateTime(WithYear(dt, newYear))
{
  var newDay := DTUtils.ClampDay(newYear, dt.month, dt.day);
  FromComponents(newYear, dt.month, newDay, dt.hour, dt.minute, dt.second, dt.millisecond)
}
{% endhighlight %}

`ClampDay` ensures validity: February 29th, 2020 becomes February 28th, 2021 when changing to a non-leap year. This prevents invalid dates while maintaining predictable behavior.


## Parsing with validation

Parsing uses algebraic data types and explicit validation steps:

{% highlight dafny %}
datatype ParseFormat =
  | ISO8601       // yyyy-MM-ddTHH:mm:ss.fff
  | DateOnly      // yyyy-MM-dd

function Parse(text: string, format: ParseFormat): Result<LocalDateTime, string>
{
  match format {
    case ISO8601 => ParseISO8601(text)
    case DateOnly => ParseDateOnly(text)
  }
}
{% endhighlight %}

The ISO8601 parser validates in layers: length, separators, numeric components, range, and semantic validity. Each step provides descriptive error messages for malformed input.


## Epoch-based arithmetic

We avoid calendar arithmetic complexity by converting to epoch milliseconds, performing math, then converting back:

{% highlight dafny %}
function Plus(dt: LocalDateTime, millisToAdd: int): Result<LocalDateTime, string>
  requires IsValidLocalDateTime(dt)
{
  var epochMillisResult := DTUtils.ToEpochTimeMilliseconds(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.millisecond);
  if epochMillisResult.Failure? then
    Failure(epochMillisResult.error)
  else
    var newEpochMillis := epochMillisResult.value + millisToAdd;
    var components := DTUtils.FromEpochTimeMillisecondsFunc(newEpochMillis);
    if IsValidComponentRange(components) && DTUtils.IsValidDateTime(components[0], components[1] as uint8, components[2] as uint8, components[3] as uint8, components[4] as uint8, components[5] as uint8, components[6] as uint16) then
      Success(FromSequenceComponents(components))
    else
      Failure("Result date/time is out of valid range")
}
{% endhighlight %}

This provides consistency (same operation always gives same result), simplicity (fewer edge cases), and verifiability (Dafny reasons about integers easily). All convenience methods delegate to this core function:

{% highlight dafny %}
function PlusDays(dt: LocalDateTime, days: int): Result<LocalDateTime, string>
{
  Plus(dt, days * (MILLISECONDS_PER_DAY as int))
}
{% endhighlight %}


## Comparison 

Lexicographic ordering compares components by significance and provides three-way comparison (-1, 0, 1):

{% highlight dafny %}
function CompareLocal(dt1: LocalDateTime, dt2: LocalDateTime): int
{
  if dt1.year != dt2.year then
    if dt1.year < dt2.year then -1 else 1
  else if dt1.month != dt2.month then
    if dt1.month < dt2.month then -1 else 1
  // ... continues for all components
  else
    0
}
{% endhighlight %}

All comparison predicates (`IsBefore`, `IsAfter`, `IsEqual`) delegate to this single function, simplifying verification.

## Formatting

Formatting supports multiple output formats through algebraic data types:

{% highlight dafny %}
datatype DateFormat =
  | ISO8601                    // yyyy-MM-ddTHH:mm:ss.fff
  | DateOnly                   // yyyy-MM-dd
  | TimeOnly                   // HH:mm:ss
  | DateSlashDDMMYYYY          // dd/MM/yyyy
{% endhighlight %}


## Testing and integration

The module includes comprehensive tests using Dafny's `{:test}` attribute:

{% highlight dafny %}
method {:test} TestOfFunctionValidCases()
{
  var result1 := LDT.Of(2023, 6, 15, 14, 30, 45, 123);
  if result1.Success? {
    var dt1 := result1.value;
    AssertAndExpect(dt1.year == 2023 && dt1.month == 6 && dt1.day == 15);
    AssertAndExpect(LDT.IsValidLocalDateTime(dt1));
  }

  var leapYearResult := LDT.Of(2020, 2, 29, 0, 0, 0, 0);
  expect leapYearResult.Success?;
}
{% endhighlight %}

Integration with Duration enables rich temporal arithmetic:

{% highlight dafny %}
function PlusDuration(dt: LocalDateTime, duration: Duration.Duration): Result<LocalDateTime, string>
{
  var totalMillis := (duration.seconds as int) * (MILLISECONDS_PER_SECOND as int) + (duration.millis as int);
  Plus(dt, totalMillis)
}
{% endhighlight %}

## Looking ahead

The LocalDateTime module provides timezone-agnostic temporal operations with formal verification guarantees. Future enhancements could include:

- **Timezone-aware operations** with ZonedDateTime
- **Calendar operations** for business days and holidays  
- **Period arithmetic** with configurable overflow behavior
- **Format extensibility** for custom patterns and locales

This module demonstrates how formal verification makes traditionally error-prone domains like date-time handling both safer and more reliable, while maintaining performance and usability.

The LocalDateTime module is available in Dafny's standard libraries, providing verified temporal operations you can trust.

# Zoned Date Time Library

## Why a Zoned Date Time library for Dafny?

Dates and times appear in every system—from logs and audits to scheduling and billing. The tricky parts aren’t addition and subtraction; they’re the edge conditions: “spring-forward” gaps, “fall-back” overlaps, offset limits, and differences across platforms.

In a verification-oriented language, these aren’t just test cases; they’re contracts. Our goal was a library you can call like a normal API, with Dafny proving that:

* inputs are within domain (no divide-by-zero-style surprises),
* conversions are range-checked,
* DST resolution follows explicit rules,
* arithmetic is safe or fails clearly.

This post shares how we designed and verified Std.ZonedDateTime: a small, practical module that handles local times, time-zones, and DST corner cases with clear specifications and platform interop. It grew out of a practicum project where we paired verification discipline with everyday developer ergonomics.

We’ll walk through:

* the goals that shaped the API,
* the core data model and constructors,
* how we resolve DST gaps/overlaps with explicit preferences,
* parsing/formatting (strict ISO-8601 with offsets),
* arithmetic built on epoch milliseconds,
* and the tests that made the behavior easy to trust.


## Design goals

1. **Familiar API, small surface area:** Construction (Now, Of), accessors (GetYear…), updates (WithYear…), arithmetic (Plus*, Minus*), parsing and formatting (Parse, Format).
2. **First-class DST semantics:** Ambiguity is explicit: we model states Unique | Overlap | Gap and take a preference for resolution. No hidden heuristics.
3. **Strong, readable specs:** Every public function has requires/ensures that match the textbook meaning (valid ranges, offset bounds, well-formed results).
4. **Strict, predictable parsing:** ISO-8601 with Z or ±HH:mm only, and precise length checks—favoring verifiability over permissive parsing.
5. **Lean interop, reliable arithmetic:** Arithmetic runs on epoch milliseconds via extern hooks; DST resolution delegates to the host platform through a single verified boundary.

With those principles, here’s how the module is structured.

## The core data model

We capture a local timestamp, its zone identifier, and the offset in minutes. A simple validity predicate keeps everything in range.

{% highlight dafny %}
// Zoned date-time with an explicit offset (minutes from UTC)
datatype ZonedDateTime = ZonedDateTime(
    local: LDT.LocalDateTime,
    zoneId: string,
    offsetMinutes: int
)

// Basic invariant: valid local components, bounded offset, non-negative zoneId length
predicate IsValidZonedDateTime(zd: ZonedDateTime)
{
    LDT.IsValidLocalDateTime(zd.local) &&
    -1860 <= zd.offsetMinutes <= 1860 &&
    0 <= |zd.zoneId|
}
{% endhighlight %}

We cap offsets at ±18:00 to align with practical time-zone limits.

## Constructing instances: Now and Of

Now() queries the host for both the local components and the current offset; Of(zoneId, local, preference) resolves a local date-time in a specific zone, taking the DST preference into account.

We represent the DST resolution outcome explicitly:

{% highlight dafny %}
datatype Status = StatusUnique | StatusOverlap | StatusGap
type Preference = int
const PREFER_EARLIER: Preference := -1
const PREFER_LATER:   Preference :=  1
const SHIFT_FORWARD:  Preference :=  0
{% endhighlight %}

The constructor uses a single extern to perform platform-aware resolution:

{% highlight dafny %}
function {:extern “ZonedDateTimeImpl.__default”, “ResolveLocal”} {:axiom}
ResolveLocalImpl(zoneId: string,
year: int32, month: uint8, day: uint8,
hour: uint8, minute: uint8, second: uint8, millisecond: uint16,
preference: int) : seq
// returns [status, offsetMinutes, normYear, normMonth, normDay, normHour, normMinute, normSecond, normMillisecond]
ensures |ResolveLocalImpl(zoneId, year, month, day, hour, minute, second, millisecond, preference)| == 9
{% endhighlight %}

We wrap it in a verified Of that produces a ZonedDateTime and the Status:

{% highlight dafny %}
function Of(zoneId: string, local: LDT.LocalDateTime, preference: Preference)
: (Result<ZonedDateTime, string>, Status)
requires LDT.IsValidLocalDateTime(local)
{
    // Calls ResolveLocalImpl and builds a normalized ZonedDateTime
    // Status: 0=Unique, 1=Overlap, 2=Gap
    …
}
{% endhighlight %}

### What the preferences mean

On Overlap (clocks set back, two valid instants for the same “wall time”):

* PREFER_EARLIER picks the earlier UTC instant (the first occurrence),
* PREFER_LATER picks the later UTC instant (the second occurrence).

On Gap (clocks jump forward, a “wall time” doesn’t exist):

* SHIFT_FORWARD moves forward to the next valid minute.

These rules are implemented once in the extern and reflected in verified postconditions inside Dafny. There’s no ambiguity at the call site, and tests document the behavior.

## Parsing and formatting

We keep parsing strict and verifiable:

* ISO-8601 zoned: yyyy-MM-ddTHH:mm:ss.fffZ or yyyy-MM-ddTHH:mm:ss.fff±HH:mm (length 24 or 29, with a 3-digit millisecond component and an explicit Z/offset suffix)
* Date-only: yyyy-MM-ddZ or yyyy-MM-dd±HH:mm (time defaults to 00:00:00.000)

Offset suffixes are validated and range-checked (±18:00, with 18:xx disallowed).

{% highlight dafny %}
// Parse dispatch
function Parse(text: string, format: ParseFormat): Result<ZonedDateTime, string>
{
    match format {
        case ISO8601 => ParseISO8601(text)
        case DateOnly => ParseDateOnly(text)
    }
}

// Offset suffix: “Z” or “±HH:mm”
function ParseOffsetMinutesSuffix(suffix: string): Result<int, string>
{
    if |suffix| == 1 && suffix[0] == ‘Z’ then Success(0)
    else if |suffix| == 6 && (suffix[0] == ‘+’ || suffix[0] == ‘-’) && suffix[3] == ‘:’ then
    …
    else Failure(“Invalid offset: expected ‘Z’ or ±HH:mm”)
}
{% endhighlight %}

Formatting mirrors parsing and always prints an explicit suffix:

{% highlight dafny %}
datatype DateFormat = ISO8601 | DateOnly

function ToStringSuffix(dt: ZonedDateTime): string
requires IsValidZonedDateTime(dt)
{
    if dt.offsetMinutes == 0 then “Z”
    else
        var absOffset := if dt.offsetMinutes < 0 then -dt.offsetMinutes else dt.offsetMinutes;
        var hh := absOffset / 60;
        var mm := absOffset % 60;
        var sign := if dt.offsetMinutes < 0 then “-” else “+”;
        sign + (if hh < 10 then “0” + OfInt(hh) else OfInt(hh)) + “:” +
        (if mm < 10 then “0” + OfInt(mm) else OfInt(mm))
}

function Format(dt: ZonedDateTime, format: DateFormat): string
requires IsValidZonedDateTime(dt)
{
    match format
        case ISO8601 => LDT.ToString(dt.local) + ToStringSuffix(dt)
        case DateOnly =>
        var (y,m,d,,,,) := LDT.ToIntComponents(dt.local);
        OfInt(y) + “-” + DTUtils.PadWithZeros(m,2) + “-” + DTUtils.PadWithZeros(d,2) + ToStringSuffix(dt)
}
{% endhighlight %}

## Arithmetic via epoch milliseconds

All arithmetic goes through epoch milliseconds.

Extern hooks convert between (Y,M,D,h,m,s,ms,offset) and epoch milliseconds. We wrap them in a safe API:

{% highlight dafny %}
function ToEpochTimeMilliseconds(year: int32, month: uint8, day: uint8,
hour: uint8, minute: uint8, second: uint8,
millisecond: uint16, offsetMinutes: int)
: Result<int, string> { … }

// Adds days/hours/minutes/seconds/milliseconds or a duration; returns Failure on overflow.
function PlusDays(dt: ZonedDateTime, n: int): Result<ZonedDateTime, string> { … }
function MinusMinutes(dt: ZonedDateTime, n: int): Result<ZonedDateTime, string> { … }
function PlusDuration(dt: ZonedDateTime, millis: int): Result<ZonedDateTime, string> { … }
{% endhighlight %}

This “epoch core + verified wrappers” pattern keeps proofs small and behavior predictable.

## Interop boundary (C# externs)

The only platform-dependent parts are:
* ResolveLocal — resolve a local wall clock time in zoneId with preference; detect Unique/Overlap/Gap; return (offset, normalized components).
* NowZoned — get current local components and the current offset.
* GetNowZoneId — get the system’s local time-zone ID.
* Date-time ↔ epoch conversions (provided by a shared DateTime implementation).

In the reference .NET implementation:
* Gap shifts forward to the next valid minute when preference == SHIFT_FORWARD.
* Overlap compares UTC instants and chooses earlier/later based on the preference—robust for positive and negative offsets.
* TimeZoneInfo.Local.Id is used for the zone ID; cross-platform deployments should mind Windows vs. IANA identifiers.

## Testing the library

We use `{:test}` methods as executable documentation, covering:

* Gap (spring-forward) resolution with SHIFT_FORWARD: e.g., 2025-03-09 02:15 in PST8PDT normalizes to 03:00, offset -07:00, status Gap.
* Parsing success/failure paths (strict lengths, suffixes, numeric checks, offset range).
* Formatting round-trips for ISO-8601 and date-only.
* Arithmetic round-trips over epoch, including overflow failures.

Here’s a shortened overlap example to illustrate the style:

{% highlight dafny %}
method {:test} TestOfFunctionGapCase()
{
    var zoneId: string := "PST8PDT";
    var localA := LDT.LocalDateTime(2025, 3, 9, 2, 15, 0, 0);
    var pairA := ZDT.Of(zoneId, localA, ZDT.SHIFT_FORWARD);
    if pairA.0.Success? {
        var zdtA := pairA.0.value;
        AssertAndExpect(ZDT.IsValidZonedDateTime(zdtA));
        expect pairA.1 == ZDT.StatusGap;
        expect zdtA.offsetMinutes == -420; // PDT offset

        var format := ZDT.Format(pairA.0.value, ZDT.DateFormat.ISO8601);
        expect format == "2025-03-09T03:00:00.000-07:00";
    }
}
{% endhighlight %}

These tests both demonstrate usage and lock down behavior so downstream users can depend on it.

## Acknowledgments

We would like to extend our sincere gratitude to **Robin Salkeld**, **Olivier**, and **Michael**, our points of contact and mentors at AWS. Their guidance on API design, performance optimization, and proof stability was instrumental in bringing this library to the Dafny community.

## Looking ahead

The current Std.ZonedDateTime focuses on predictable, verifiable operations. Natural extensions include:

* richer parsing/formatting (token patterns, variable fractional seconds),
* named-zone normalization across platforms (Windows ↔ IANA).

Our hope is that this module makes time-zone work boring—in the best possible way. *If it compiles and verifies, you can trust it*.


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
