---
layout: post
title:  "A Verified DateTime for Dafny"
author: Jerry Zhou, Yuyang Liu, Jules Wang
date:   2025-12-08 09:00:00 +0000
categories: standard-libraries
---
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
