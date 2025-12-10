---
layout: post
title:  "A Verified DateTime Library for Dafny"
author: Jerry Zhou, Yuyang Liu, Jules Wang
date:   2025-12-08 09:00:00 +0000
categories: standard-libraries
---

# DateTime Library

Date and time handling is one of the most error-prone areas in software development.

From leap year calculations to timezone transitions, temporal data presents edge cases that can corrupt application logic. This becomes critical in verification languages like Dafny, where correctness is mathematically proven.

We built `Std.LocalDateTime` and `Std.ZonedDateTime`, comprehensive modules providing timezone-agnostic and timezone-aware date-time operations with full formal verification. This post covers:

* design principles behind safe temporal arithmetic,
* validation and bounded integer types,
* timezone handling and DST resolution,
* parsing and formatting with formal contracts,
* epoch-based arithmetic for reliable calculations,
* verification challenges we solved.


## Design principles

Our design balances mathematical precision with real-world complexity:

1. **Safety through types:** Bounded integer types (`int32`, `uint8`, `uint16`) prevent overflow while maintaining verification guarantees.

2. **Explicit validation:** Every instance must satisfy validity predicates, checking leap years, month boundaries, time constraints, and (for zoned times) offset bounds.

3. **Immutability:** Pure functions like `WithYear`, `WithMonth` return new validated instances instead of mutation.

4. **Epoch-based arithmetic:** Date arithmetic converts to epoch milliseconds, performs calculation, then converts back—avoiding calendar complexity.

5. **Parse-don't-validate:** Parsing functions return `Result<T, string>`, forcing explicit error handling.

6. **First-class DST semantics (ZonedDateTime):** Ambiguity is explicit: we model states Unique | Overlap | Gap and take a preference for resolution. No hidden heuristics.


## The core datatypes and validation

### LocalDateTime: Timezone-agnostic

The `LocalDateTime` datatype represents a calendar date and wall-clock time without timezone information:

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

predicate IsValidLocalDateTime(dt: LocalDateTime)
{
  DTUtils.IsValidDateTime(dt.year, dt.month, dt.day,
    dt.hour, dt.minute, dt.second, dt.millisecond)
}
{% endhighlight %}

This checks month boundaries (1-12), days within each month (including leap years), time ranges (0-23 hours, 0-59 minutes), and supports leap seconds.

### ZonedDateTime: Timezone-aware

The `ZonedDateTime` datatype adds timezone context through a zone identifier and explicit offset:

{% highlight dafny %}
datatype ZonedDateTime = ZonedDateTime(
    local: LDT.LocalDateTime,
    zoneId: string,
    offsetMinutes: int
)

predicate IsValidZonedDateTime(zd: ZonedDateTime)
{
  LDT.IsValidLocalDateTime(zd.local) &&
  -18*60 <= zd.offsetMinutes <= 18*60 &&
  0 <= |zd.zoneId|
}

{% endhighlight %}

We cap offsets at ±18 hours (1080 minutes) to align with practical timezone limits. Every function requires valid input and ensures valid output.


## Construction and DST resolution

### LocalDateTime: Simple construction

LocalDateTime construction validates components and returns a Result:

{% highlight dafny %}
function Of(year: int32, month: uint8, day: uint8,
           hour: uint8, minute: uint8, second: uint8,
           millisecond: uint16): Result<LocalDateTime, string>
{
  if DTUtils.IsValidDateTime(year, month, day, hour, minute, second, millisecond) then
    Success(FromComponents(year, month, day, hour, minute, second, millisecond))
  else
    Failure(DTUtils.GetValidationError(year, month, day, hour, minute, second, millisecond))
}
{% endhighlight %}

### ZonedDateTime: DST-aware construction

ZonedDateTime construction requires DST ambiguity resolution. We represent the outcome explicitly:

{% highlight dafny %}
datatype Status = StatusUnique | StatusOverlap | StatusGap
type Preference = int
const PREFER_EARLIER: Preference := -1
const PREFER_LATER:   Preference :=  1
const SHIFT_FORWARD:  Preference :=  0
{% endhighlight %}

The constructor uses a single extern to perform platform-aware resolution:

{% highlight dafny %}
function {:extern "ZonedDateTimeImpl.__default", "ResolveLocal"} {:axiom}
ResolveLocalImpl(zoneId: string,
                year: int32, month: uint8, day: uint8,
                hour: uint8, minute: uint8, second: uint8, millisecond: uint16,
                preference: int) : seq
// returns [status, offsetMinutes, normYear, normMonth, normDay,
//          normHour, normMinute, normSecond, normMillisecond]
ensures |ResolveLocalImpl(zoneId, year, month, day, hour, minute,
                         second, millisecond, preference)| == 9
{% endhighlight %}

We wrap it in a verified `Of` that produces a ZonedDateTime and the Status:

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

On **Overlap** (clocks set back, two valid instants for the same "wall time"):

* `PREFER_EARLIER` picks the earlier UTC instant (the first occurrence),
* `PREFER_LATER` picks the later UTC instant (the second occurrence).

On **Gap** (clocks jump forward, a "wall time" doesn't exist):

* `SHIFT_FORWARD` moves forward to the next valid minute.

These rules are implemented once in the extern and reflected in verified postconditions inside Dafny.


## Immutable transformations

### LocalDateTime transformations

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

### ZonedDateTime transformations

ZonedDateTime provides similar transformations, but they must account for timezone context. When changing date components, the offset may need to be recalculated if the new date falls in a different DST regime:

{% highlight dafny %}
function WithYear(zd: ZonedDateTime, newYear: int32,
                 preference: Preference): (Result<ZonedDateTime, string>, Status)
  requires IsValidZonedDateTime(zd)
{
  var newLocal := LDT.WithYear(zd.local, newYear);
  Of(zd.zoneId, newLocal, preference)
}
{% endhighlight %}


## Parsing with validation

### LocalDateTime parsing

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

### ZonedDateTime parsing

ZonedDateTime parsing is stricter, requiring explicit offset suffixes:

{% highlight dafny %}
datatype ParseFormat =
  | ISO8601      // yyyy-MM-ddTHH:mm:ss.fffZ or yyyy-MM-ddTHH:mm:ss.fff±HH:mm
  | DateOnly     // yyyy-MM-ddZ or yyyy-MM-dd±HH:mm

function Parse(text: string, format: ParseFormat): Result<ZonedDateTime, string>
{
    match format {
        case ISO8601 => ParseISO8601(text)
        case DateOnly => ParseDateOnly(text)
    }
}

// Offset suffix: "Z" or "±HH:mm"
function ParseOffsetMinutesSuffix(suffix: string): Result<int, string>
{
    if |suffix| == 1 && suffix[0] == 'Z' then Success(0)
    else if |suffix| == 6 && (suffix[0] == '+' || suffix[0] == '-') && suffix[3] == ':' then
        …
    else Failure("Invalid offset: expected 'Z' or ±HH:mm")
}
{% endhighlight %}

ISO-8601 zoned format: `yyyy-MM-ddTHH:mm:ss.fffZ` or `yyyy-MM-ddTHH:mm:ss.fff±HH:mm` (length 24 or 29, with a 3-digit millisecond component and an explicit Z/offset suffix). Offset suffixes are validated and range-checked (±18:00, with 18:xx disallowed).


## Epoch-based arithmetic

We avoid calendar arithmetic complexity by converting to epoch milliseconds, performing math, then converting back. This provides consistency, simplicity, and verifiability.

### LocalDateTime arithmetic

For timezone-agnostic times, we convert to epoch milliseconds in a "floating" reference frame:

{% highlight dafny %}
function Plus(dt: LocalDateTime, millisToAdd: int): Result<LocalDateTime, string>
  requires IsValidLocalDateTime(dt)
{
  var epochMillisResult := DTUtils.ToEpochTimeMilliseconds(
    dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.millisecond);
  if epochMillisResult.Failure? then
    Failure(epochMillisResult.error)
  else
    var newEpochMillis := epochMillisResult.value + millisToAdd;
    var components := DTUtils.FromEpochTimeMillisecondsFunc(newEpochMillis);
    if IsValidComponentRange(components) &&
       DTUtils.IsValidDateTime(components[0], components[1] as uint8,
                               components[2] as uint8, components[3] as uint8,
                               components[4] as uint8, components[5] as uint8,
                               components[6] as uint16) then
      Success(FromSequenceComponents(components))
    else
      Failure("Result date/time is out of valid range")
}
{% endhighlight %}

All convenience methods delegate to this core function:

{% highlight dafny %}
function PlusDays(dt: LocalDateTime, days: int): Result<LocalDateTime, string>
{
  Plus(dt, days * (MILLISECONDS_PER_DAY as int))
}
{% endhighlight %}

### ZonedDateTime arithmetic: The critical difference

For timezone-aware times, epoch conversion accounts for the UTC offset. This is where ZonedDateTime gets more complex and interesting:

{% highlight dafny %}
function ToEpochTimeMilliseconds(year: int32, month: uint8, day: uint8,
                                hour: uint8, minute: uint8, second: uint8,
                                millisecond: uint16, offsetMinutes: int)
: Result<int, string>
{
    var localEpochResult := DTUtils.ToEpochTimeMilliseconds(
        year, month, day, hour, minute, second, millisecond);
    if localEpochResult.Failure? then
        Failure(localEpochResult.error)
    else
        var offsetMillis := offsetMinutes * 60 * 1000;
        var utcEpoch := localEpochResult.value - offsetMillis;
        Success(utcEpoch)
}
{% endhighlight %}

When adding time to a ZonedDateTime, we:
1. Convert the zoned time to UTC epoch milliseconds (accounting for offset)
2. Add the duration in milliseconds
3. Convert back to local components
4. Re-resolve the local time in the timezone (in case we crossed a DST boundary)

{% highlight dafny %}
function PlusDays(dt: ZonedDateTime, n: int): Result<ZonedDateTime, string>
  requires IsValidZonedDateTime(dt)
{
    var millisToAdd := n * (MILLISECONDS_PER_DAY as int);
    var epochResult := ToEpochTimeMilliseconds(
        dt.local.year, dt.local.month, dt.local.day,
        dt.local.hour, dt.local.minute, dt.local.second, dt.local.millisecond,
        dt.offsetMinutes);

    if epochResult.Failure? then
        Failure(epochResult.error)
    else
        var newEpoch := epochResult.value + millisToAdd;
        FromEpochTimeMilliseconds(dt.zoneId, newEpoch)
}
{% endhighlight %}

## Comparison

Both types provide lexicographic ordering and three-way comparison (-1, 0, 1).

### LocalDateTime comparison

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

### ZonedDateTime comparison

ZonedDateTime comparison must account for timezone offsets. Two times are equal if they represent the same instant in UTC:

{% highlight dafny %}
function Compare(zd1: ZonedDateTime, zd2: ZonedDateTime): Result<int, string>
  requires IsValidZonedDateTime(zd1) && IsValidZonedDateTime(zd2)
{
    var epoch1Result := ToEpochTimeMilliseconds(
        zd1.local.year, zd1.local.month, zd1.local.day,
        zd1.local.hour, zd1.local.minute, zd1.local.second, zd1.local.millisecond,
        zd1.offsetMinutes);
    var epoch2Result := ToEpochTimeMilliseconds(
        zd2.local.year, zd2.local.month, zd2.local.day,
        zd2.local.hour, zd2.local.minute, zd2.local.second, zd2.local.millisecond,
        zd2.offsetMinutes);

    if epoch1Result.Failure? then
        Failure(epoch1Result.error)
    else if epoch2Result.Failure? then
        Failure(epoch2Result.error)
    else
        var e1 := epoch1Result.value;
        var e2 := epoch2Result.value;
        Success(if e1 < e2 then -1 else if e1 > e2 then 1 else 0)
}
{% endhighlight %}


## Formatting

### LocalDateTime formatting

{% highlight dafny %}
datatype DateFormat =
  | ISO8601                    // yyyy-MM-ddTHH:mm:ss.fff
  | DateOnly                   // yyyy-MM-dd
  | TimeOnly                   // HH:mm:ss
  | DateSlashDDMMYYYY          // dd/MM/yyyy

function Format(dt: LocalDateTime, format: DateFormat): string
  requires IsValidLocalDateTime(dt)
{
    match format
        case ISO8601 => ToString(dt)
        case DateOnly => /* ... */
        case TimeOnly => /* ... */
        case DateSlashDDMMYYYY => /* ... */
}
{% endhighlight %}

### ZonedDateTime formatting

ZonedDateTime formatting always includes an explicit offset suffix:

{% highlight dafny %}
datatype DateFormat = ISO8601 | DateOnly

function ToStringSuffix(dt: ZonedDateTime): string
requires IsValidZonedDateTime(dt)
{
    if dt.offsetMinutes == 0 then "Z"
    else
        var absOffset := if dt.offsetMinutes < 0 then -dt.offsetMinutes else dt.offsetMinutes;
        var hh := absOffset / 60;
        var mm := absOffset % 60;
        var sign := if dt.offsetMinutes < 0 then "-" else "+";
        sign + (if hh < 10 then "0" + OfInt(hh) else OfInt(hh)) + ":" +
        (if mm < 10 then "0" + OfInt(mm) else OfInt(mm))
}

function Format(dt: ZonedDateTime, format: DateFormat): string
requires IsValidZonedDateTime(dt)
{
    match format
        case ISO8601 => LDT.ToString(dt.local) + ToStringSuffix(dt)
        case DateOnly =>
            var (y,m,d,,,,) := LDT.ToIntComponents(dt.local);
            OfInt(y) + "-" + DTUtils.PadWithZeros(m,2) + "-" +
            DTUtils.PadWithZeros(d,2) + ToStringSuffix(dt)
}
{% endhighlight %}


## Testing and integration

### LocalDateTime tests

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

### ZonedDateTime tests

ZonedDateTime tests document DST behavior explicitly:

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

### Integration with Duration

Both modules integrate with the Duration library for rich temporal arithmetic:

{% highlight dafny %}
function PlusDuration(dt: LocalDateTime, duration: Duration.Duration): Result<LocalDateTime, string>
{
  var totalMillis := (duration.seconds as int) * (MILLISECONDS_PER_SECOND as int) +
                     (duration.millis as int);
  Plus(dt, totalMillis)
}
{% endhighlight %}


## Platform interoperability

The only platform-dependent parts are:

* **ResolveLocal** — resolve a local wall clock time in zoneId with preference; detect Unique/Overlap/Gap; return (offset, normalized components).
* **NowZoned** — get current local components and the current offset.
* **GetNowZoneId** — get the system's local timezone ID.
* **Date-time ↔ epoch conversions** — provided by shared DateTime utilities.

In the reference .NET implementation:

* Gap shifts forward to the next valid minute when preference == SHIFT_FORWARD.
* Overlap compares UTC instants and chooses earlier/later based on the preference—robust for positive and negative offsets.
* TimeZoneInfo.Local.Id is used for the zone ID; cross-platform deployments should mind Windows vs. IANA identifiers.

## Looking ahead

The LocalDateTime and ZonedDateTime modules provide timezone-agnostic and timezone-aware temporal operations with formal verification guarantees. Future enhancements could include:

- **Calendar operations** for business days and holidays
- **Period arithmetic** with configurable overflow behavior
- **Format extensibility** for custom patterns and locales
- **Named-zone normalization** across platforms (Windows ↔ IANA)
- **Richer parsing/formatting** with token patterns and variable fractional seconds

These modules demonstrate how formal verification makes traditionally error-prone domains like date-time handling both safer and more reliable, while maintaining performance and usability.

Our hope is that these modules make time and timezone work boring—in the best possible way. *If it compiles and verifies, you can trust it.*


## The Duration companion library

Durations appear in nearly every timestamp-based calculation—from retries to billing intervals and performance metrics. The challenge isn't simple arithmetic; it's handling overflow, unit conversions, and composing time intervals reliably without losing precision or correctness.

The `Std.Duration` module provides a focused, practical companion to LocalDateTime and ZonedDateTime, handling time intervals with millisecond precision and strong specifications.

### Core representation

{% highlight dafny %}
datatype Duration = Duration(
    seconds: int,
    millis: int
)

function ToTotalMilliseconds(d: Duration): int
{
    (d.seconds * MILLISECONDS_PER_SECOND_INT) + d.millis
}

function FromMilliseconds(ms: int): Duration
{
    var secondsValue := ms / MILLISECONDS_PER_SECOND_INT;
    var millisValue := ms % MILLISECONDS_PER_SECOND_INT;
    Duration(secondsValue, millisValue)
}
{% endhighlight %}

By normalizing through total milliseconds, we ensure consistent handling. This internal representation provides the foundation for all subsequent operations.

### Arithmetic operations

All duration arithmetic routes through milliseconds to prevent overflow and maintain precision:

{% highlight dafny %}
function Plus(d1: Duration, d2: Duration): Duration
requires d1.seconds < DURATION_SECONDS_BOUND
{
    var ms1 := ToTotalMilliseconds(d1);
    var ms2 := ToTotalMilliseconds(d2);
    var sum := ms1 + ms2;
    FromMilliseconds(sum)
}

function Minus(d1: Duration, d2: Duration): Duration
requires ToTotalMilliseconds(d1) >= ToTotalMilliseconds(d2)
{
    var ms1 := ToTotalMilliseconds(d1);
    var ms2 := ToTotalMilliseconds(d2);
    FromMilliseconds(ms1 - ms2)
}
{% endhighlight %}

### Parsing and formatting

Duration parsing follows ISO-8601: `PTxHyMz.wS` (for example, `PT2H30M45.500S` means 2 hours, 30 minutes, 45.5 seconds). Formatting produces the canonical representation with all components explicit.

### Integration with date-time

Duration composes naturally with both LocalDateTime and ZonedDateTime:

{% highlight dafny %}
function EpochDifference(epoch1: int, epoch2: int): Duration
{
    var diff := if epoch1 >= epoch2 then (epoch1 - epoch2) as int
                else (epoch2 - epoch1) as int;
    FromMilliseconds(diff)
}
{% endhighlight %}

This enables seamless calculation of time deltas across date-time boundaries without precision loss.

## Acknowledgments

We would like to extend our sincere gratitude to **Robin Salkeld**, **Olivier**, and **Michael**, our points of contact and mentors at AWS. Their guidance on API design, performance optimization, and proof stability was instrumental in bringing these libraries to the Dafny community.