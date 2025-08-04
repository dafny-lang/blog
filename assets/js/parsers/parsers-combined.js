// Dafny program the_program compiled into JavaScript
// Copyright by the contributors to the Dafny Project
// SPDX-License-Identifier: MIT

const BigNumber = require('bignumber.js');
BigNumber.config({ MODULO_MODE: BigNumber.EUCLID })
let _dafny = (function() {
  let $module = {};
  $module.areEqual = function(a, b) {
    if (typeof a === 'string' && b instanceof _dafny.Seq) {
      // Seq.equals(string) works as expected,
      // and the catch-all else block handles that direction.
      // But the opposite direction doesn't work; handle it here.
      return b.equals(a);
    } else if (typeof a === 'number' && BigNumber.isBigNumber(b)) {
      // This conditional would be correct even without the `typeof a` part,
      // but in most cases it's probably faster to short-circuit on a `typeof`
      // than to call `isBigNumber`. (But it remains to properly test this.)
      return b.isEqualTo(a);
    } else if (typeof a !== 'object' || a === null || b === null) {
      return a === b;
    } else if (BigNumber.isBigNumber(a)) {
      return a.isEqualTo(b);
    } else if (a._tname !== undefined || (Array.isArray(a) && a.constructor.name == "Array")) {
      return a === b;  // pointer equality
    } else {
      return a.equals(b);  // value-type equality
    }
  }
  $module.toString = function(a) {
    if (a === null) {
      return "null";
    } else if (typeof a === "number") {
      return a.toFixed();
    } else if (BigNumber.isBigNumber(a)) {
      return a.toFixed();
    } else if (a._tname !== undefined) {
      return a._tname;
    } else {
      return a.toString();
    }
  }
  $module.escapeCharacter = function(cp) {
    let s = String.fromCodePoint(cp.value)
    switch (s) {
      case '\n': return "\\n";
      case '\r': return "\\r";
      case '\t': return "\\t";
      case '\0': return "\\0";
      case '\'': return "\\'";
      case '\"': return "\\\"";
      case '\\': return "\\\\";
      default: return s;
    };
  }
  $module.NewObject = function() {
    return { _tname: "object" };
  }
  $module.InstanceOfTrait = function(obj, trait) {
    return obj._parentTraits !== undefined && obj._parentTraits().includes(trait);
  }
  $module.Rtd_bool = class {
    static get Default() { return false; }
  }
  $module.Rtd_char = class {
    static get Default() { return 'D'; }  // See CharType.DefaultValue in Dafny source code
  }
  $module.Rtd_codepoint = class {
    static get Default() { return new _dafny.CodePoint('D'.codePointAt(0)); }
  }
  $module.Rtd_int = class {
    static get Default() { return BigNumber(0); }
  }
  $module.Rtd_number = class {
    static get Default() { return 0; }
  }
  $module.Rtd_ref = class {
    static get Default() { return null; }
  }
  $module.Rtd_array = class {
    static get Default() { return []; }
  }
  $module.ZERO = new BigNumber(0);
  $module.ONE = new BigNumber(1);
  $module.NUMBER_LIMIT = new BigNumber(0x20).multipliedBy(0x1000000000000);  // 2^53
  $module.Tuple = class Tuple extends Array {
    constructor(...elems) {
      super(...elems);
    }
    toString() {
      return "(" + arrayElementsToString(this) + ")";
    }
    equals(other) {
      if (this === other) {
        return true;
      }
      for (let i = 0; i < this.length; i++) {
        if (!_dafny.areEqual(this[i], other[i])) {
          return false;
        }
      }
      return true;
    }
    static Default(...values) {
      return Tuple.of(...values);
    }
    static Rtd(...rtdArgs) {
      return {
        Default: Tuple.from(rtdArgs, rtd => rtd.Default)
      };
    }
  }
  $module.Set = class Set extends Array {
    constructor() {
      super();
    }
    static get Default() {
      return Set.Empty;
    }
    toString() {
      return "{" + arrayElementsToString(this) + "}";
    }
    static get Empty() {
      if (this._empty === undefined) {
        this._empty = new Set();
      }
      return this._empty;
    }
    static fromElements(...elmts) {
      let s = new Set();
      for (let k of elmts) {
        s.add(k);
      }
      return s;
    }
    contains(k) {
      for (let i = 0; i < this.length; i++) {
        if (_dafny.areEqual(this[i], k)) {
          return true;
        }
      }
      return false;
    }
    add(k) {  // mutates the Set; use only during construction
      if (!this.contains(k)) {
        this.push(k);
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.length !== other.length) {
        return false;
      }
      for (let e of this) {
        if (!other.contains(e)) {
          return false;
        }
      }
      return true;
    }
    get Elements() {
      return this;
    }
    Union(that) {
      if (this.length === 0) {
        return that;
      } else if (that.length === 0) {
        return this;
      } else {
        let s = Set.of(...this);
        for (let k of that) {
          s.add(k);
        }
        return s;
      }
    }
    Intersect(that) {
      if (this.length === 0) {
        return this;
      } else if (that.length === 0) {
        return that;
      } else {
        let s = new Set();
        for (let k of this) {
          if (that.contains(k)) {
            s.push(k);
          }
        }
        return s;
      }
    }
    Difference(that) {
      if (this.length == 0 || that.length == 0) {
        return this;
      } else {
        let s = new Set();
        for (let k of this) {
          if (!that.contains(k)) {
            s.push(k);
          }
        }
        return s;
      }
    }
    IsDisjointFrom(that) {
      for (let k of this) {
        if (that.contains(k)) {
          return false;
        }
      }
      return true;
    }
    IsSubsetOf(that) {
      if (that.length < this.length) {
        return false;
      }
      for (let k of this) {
        if (!that.contains(k)) {
          return false;
        }
      }
      return true;
    }
    IsProperSubsetOf(that) {
      if (that.length <= this.length) {
        return false;
      }
      for (let k of this) {
        if (!that.contains(k)) {
          return false;
        }
      }
      return true;
    }
    get AllSubsets() {
      return this.AllSubsets_();
    }
    *AllSubsets_() {
      // Start by putting all set elements into a list, but don't include null
      let elmts = Array.of(...this);
      let n = elmts.length;
      let which = new Array(n);
      which.fill(false);
      let a = [];
      while (true) {
        yield Set.of(...a);
        // "add 1" to "which", as if doing a carry chain.  For every digit changed, change the membership of the corresponding element in "a".
        let i = 0;
        for (; i < n && which[i]; i++) {
          which[i] = false;
          // remove elmts[i] from a
          for (let j = 0; j < a.length; j++) {
            if (_dafny.areEqual(a[j], elmts[i])) {
              // move the last element of a into slot j
              a[j] = a[-1];
              a.pop();
              break;
            }
          }
        }
        if (i === n) {
          // we have cycled through all the subsets
          break;
        }
        which[i] = true;
        a.push(elmts[i]);
      }
    }
  }
  $module.MultiSet = class MultiSet extends Array {
    constructor() {
      super();
    }
    static get Default() {
      return MultiSet.Empty;
    }
    toString() {
      let s = "multiset{";
      let sep = "";
      for (let e of this) {
        let [k, n] = e;
        let ks = _dafny.toString(k);
        while (!n.isZero()) {
          n = n.minus(1);
          s += sep + ks;
          sep = ", ";
        }
      }
      s += "}";
      return s;
    }
    static get Empty() {
      if (this._empty === undefined) {
        this._empty = new MultiSet();
      }
      return this._empty;
    }
    static fromElements(...elmts) {
      let s = new MultiSet();
      for (let e of elmts) {
        s.add(e, _dafny.ONE);
      }
      return s;
    }
    static FromArray(arr) {
      let s = new MultiSet();
      for (let e of arr) {
        s.add(e, _dafny.ONE);
      }
      return s;
    }
    cardinality() {
      let c = _dafny.ZERO;
      for (let e of this) {
        let [k, n] = e;
        c = c.plus(n);
      }
      return c;
    }
    clone() {
      let s = new MultiSet();
      for (let e of this) {
        let [k, n] = e;
        s.push([k, n]);  // make sure to create a new array [k, n] here
      }
      return s;
    }
    findIndex(k) {
      for (let i = 0; i < this.length; i++) {
        if (_dafny.areEqual(this[i][0], k)) {
          return i;
        }
      }
      return this.length;
    }
    get(k) {
      let i = this.findIndex(k);
      if (i === this.length) {
        return _dafny.ZERO;
      } else {
        return this[i][1];
      }
    }
    contains(k) {
      return !this.get(k).isZero();
    }
    add(k, n) {
      let i = this.findIndex(k);
      if (i === this.length) {
        this.push([k, n]);
      } else {
        let m = this[i][1];
        this[i] = [k, m.plus(n)];
      }
    }
    update(k, n) {
      let i = this.findIndex(k);
      if (i < this.length && this[i][1].isEqualTo(n)) {
        return this;
      } else if (i === this.length && n.isZero()) {
        return this;
      } else if (i === this.length) {
        let m = this.slice();
        m.push([k, n]);
        return m;
      } else {
        let m = this.slice();
        m[i] = [k, n];
        return m;
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      }
      for (let e of this) {
        let [k, n] = e;
        let m = other.get(k);
        if (!n.isEqualTo(m)) {
          return false;
        }
      }
      return this.cardinality().isEqualTo(other.cardinality());
    }
    get Elements() {
      return this.Elements_();
    }
    *Elements_() {
      for (let i = 0; i < this.length; i++) {
        let [k, n] = this[i];
        while (!n.isZero()) {
          yield k;
          n = n.minus(1);
        }
      }
    }
    get UniqueElements() {
      return this.UniqueElements_();
    }
    *UniqueElements_() {
      for (let e of this) {
        let [k, n] = e;
        if (!n.isZero()) {
          yield k;
        }
      }
    }
    Union(that) {
      if (this.length === 0) {
        return that;
      } else if (that.length === 0) {
        return this;
      } else {
        let s = this.clone();
        for (let e of that) {
          let [k, n] = e;
          s.add(k, n);
        }
        return s;
      }
    }
    Intersect(that) {
      if (this.length === 0) {
        return this;
      } else if (that.length === 0) {
        return that;
      } else {
        let s = new MultiSet();
        for (let e of this) {
          let [k, n] = e;
          let m = that.get(k);
          if (!m.isZero()) {
            s.push([k, m.isLessThan(n) ? m : n]);
          }
        }
        return s;
      }
    }
    Difference(that) {
      if (this.length === 0 || that.length === 0) {
        return this;
      } else {
        let s = new MultiSet();
        for (let e of this) {
          let [k, n] = e;
          let d = n.minus(that.get(k));
          if (d.isGreaterThan(0)) {
            s.push([k, d]);
          }
        }
        return s;
      }
    }
    IsDisjointFrom(that) {
      let intersection = this.Intersect(that);
      return intersection.cardinality().isZero();
    }
    IsSubsetOf(that) {
      for (let e of this) {
        let [k, n] = e;
        let m = that.get(k);
        if (!n.isLessThanOrEqualTo(m)) {
          return false;
        }
      }
      return true;
    }
    IsProperSubsetOf(that) {
      return this.IsSubsetOf(that) && this.cardinality().isLessThan(that.cardinality());
    }
  }
  $module.CodePoint = class CodePoint {
    constructor(value) {
      this.value = value
    }
    equals(other) {
      if (this === other) {
        return true;
      }
      return this.value === other.value
    }
    isLessThan(other) {
      return this.value < other.value
    }
    isLessThanOrEqual(other) {
      return this.value <= other.value
    }
    toString() {
      return "'" + $module.escapeCharacter(this) + "'";
    }
    static isCodePoint(i) {
      return (
        (_dafny.ZERO.isLessThanOrEqualTo(i) && i.isLessThan(new BigNumber(0xD800))) ||
        (new BigNumber(0xE000).isLessThanOrEqualTo(i) && i.isLessThan(new BigNumber(0x11_0000))))
    }
  }
  $module.Seq = class Seq extends Array {
    constructor(...elems) {
      super(...elems);
    }
    static get Default() {
      return Seq.of();
    }
    static Create(n, init) {
      return Seq.from({length: n}, (_, i) => init(new BigNumber(i)));
    }
    static UnicodeFromString(s) {
      return new Seq(...([...s].map(c => new _dafny.CodePoint(c.codePointAt(0)))))
    }
    toString() {
      return "[" + arrayElementsToString(this) + "]";
    }
    toVerbatimString(asLiteral) {
      if (asLiteral) {
        return '"' + this.map(c => _dafny.escapeCharacter(c)).join("") + '"';
      } else {
        return this.map(c => String.fromCodePoint(c.value)).join("");
      }
    }
    static update(s, i, v) {
      if (typeof s === "string") {
        let p = s.slice(0, i);
        let q = s.slice(i.toNumber() + 1);
        return p.concat(v, q);
      } else {
        let t = s.slice();
        t[i] = v;
        return t;
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.length !== other.length) {
        return false;
      }
      for (let i = 0; i < this.length; i++) {
        if (!_dafny.areEqual(this[i], other[i])) {
          return false;
        }
      }
      return true;
    }
    static contains(s, k) {
      if (typeof s === "string") {
        return s.includes(k);
      } else {
        for (let x of s) {
          if (_dafny.areEqual(x, k)) {
            return true;
          }
        }
        return false;
      }
    }
    get Elements() {
      return this;
    }
    get UniqueElements() {
      return _dafny.Set.fromElements(...this);
    }
    static Concat(a, b) {
      if (typeof a === "string" || typeof b === "string") {
        // string concatenation, so make sure both operands are strings before concatenating
        if (typeof a !== "string") {
          // a must be a Seq
          a = a.join("");
        }
        if (typeof b !== "string") {
          // b must be a Seq
          b = b.join("");
        }
        return a + b;
      } else {
        // ordinary concatenation
        let r = Seq.of(...a);
        r.push(...b);
        return r;
      }
    }
    static JoinIfPossible(x) {
      try { return x.join(""); } catch(_error) { return x; }
    }
    static IsPrefixOf(a, b) {
      if (b.length < a.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!_dafny.areEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    static IsProperPrefixOf(a, b) {
      if (b.length <= a.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!_dafny.areEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
  }
  $module.Map = class Map extends Array {
    constructor() {
      super();
    }
    static get Default() {
      return Map.of();
    }
    toString() {
      return "map[" + this.map(maplet => _dafny.toString(maplet[0]) + " := " + _dafny.toString(maplet[1])).join(", ") + "]";
    }
    static get Empty() {
      if (this._empty === undefined) {
        this._empty = new Map();
      }
      return this._empty;
    }
    findIndex(k) {
      for (let i = 0; i < this.length; i++) {
        if (_dafny.areEqual(this[i][0], k)) {
          return i;
        }
      }
      return this.length;
    }
    get(k) {
      let i = this.findIndex(k);
      if (i === this.length) {
        return undefined;
      } else {
        return this[i][1];
      }
    }
    contains(k) {
      return this.findIndex(k) < this.length;
    }
    update(k, v) {
      let m = this.slice();
      m.updateUnsafe(k, v);
      return m;
    }
    // Similar to update, but make the modification in-place.
    // Meant to be used in the map constructor.
    updateUnsafe(k, v) {
      let m = this;
      let i = m.findIndex(k);
      m[i] = [k, v];
      return m;
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.length !== other.length) {
        return false;
      }
      for (let e of this) {
        let [k, v] = e;
        let w = other.get(k);
        if (w === undefined || !_dafny.areEqual(v, w)) {
          return false;
        }
      }
      return true;
    }
    get Keys() {
      let s = new _dafny.Set();
      for (let e of this) {
        let [k, v] = e;
        s.push(k);
      }
      return s;
    }
    get Values() {
      let s = new _dafny.Set();
      for (let e of this) {
        let [k, v] = e;
        s.add(v);
      }
      return s;
    }
    get Items() {
      let s = new _dafny.Set();
      for (let e of this) {
        let [k, v] = e;
        s.push(_dafny.Tuple.of(k, v));
      }
      return s;
    }
    Merge(that) {
      let m = that.slice();
      for (let e of this) {
        let [k, v] = e;
        let i = m.findIndex(k);
        if (i == m.length) {
          m[i] = [k, v];
        }
      }
      return m;
    }
    Subtract(keys) {
      if (this.length === 0 || keys.length === 0) {
        return this;
      }
      let m = new Map();
      for (let e of this) {
        let [k, v] = e;
        if (!keys.contains(k)) {
          m[m.length] = e;
        }
      }
      return m;
    }
  }
  $module.newArray = function(initValue, ...dims) {
    return { dims: dims, elmts: buildArray(initValue, ...dims) };
  }
  $module.BigOrdinal = class BigOrdinal {
    static get Default() {
      return _dafny.ZERO;
    }
    static IsLimit(ord) {
      return ord.isZero();
    }
    static IsSucc(ord) {
      return ord.isGreaterThan(0);
    }
    static Offset(ord) {
      return ord;
    }
    static IsNat(ord) {
      return true;  // at run time, every ORDINAL is a natural number
    }
  }
  $module.BigRational = class BigRational {
    static get ZERO() {
      if (this._zero === undefined) {
        this._zero = new BigRational(_dafny.ZERO);
      }
      return this._zero;
    }
    constructor (n, d) {
      // requires d === undefined || 1 <= d
      this.num = n;
      this.den = d === undefined ? _dafny.ONE : d;
      // invariant 1 <= den || (num == 0 && den == 0)
    }
    static get Default() {
      return _dafny.BigRational.ZERO;
    }
    // We need to deal with the special case `num == 0 && den == 0`, because
    // that's what C#'s default struct constructor will produce for BigRational. :(
    // To deal with it, we ignore `den` when `num` is 0.
    toString() {
      if (this.num.isZero() || this.den.isEqualTo(1)) {
        return this.num.toFixed() + ".0";
      }
      let answer = this.dividesAPowerOf10(this.den);
      if (answer !== undefined) {
        let n = this.num.multipliedBy(answer[0]);
        let log10 = answer[1];
        let sign, digits;
        if (this.num.isLessThan(0)) {
          sign = "-"; digits = n.negated().toFixed();
        } else {
          sign = ""; digits = n.toFixed();
        }
        if (log10 < digits.length) {
          let digitCount = digits.length - log10;
          return sign + digits.slice(0, digitCount) + "." + digits.slice(digitCount);
        } else {
          return sign + "0." + "0".repeat(log10 - digits.length) + digits;
        }
      } else {
        return "(" + this.num.toFixed() + ".0 / " + this.den.toFixed() + ".0)";
      }
    }
    isPowerOf10(x) {
      if (x.isZero()) {
        return undefined;
      }
      let log10 = 0;
      while (true) {  // invariant: x != 0 && x * 10^log10 == old(x)
        if (x.isEqualTo(1)) {
          return log10;
        } else if (x.mod(10).isZero()) {
          log10++;
          x = x.dividedToIntegerBy(10);
        } else {
          return undefined;
        }
      }
    }
    dividesAPowerOf10(i) {
      let factor = _dafny.ONE;
      let log10 = 0;
      if (i.isLessThanOrEqualTo(_dafny.ZERO)) {
        return undefined;
      }

      // invariant: 1 <= i && i * 10^log10 == factor * old(i)
      while (i.mod(10).isZero()) {
        i = i.dividedToIntegerBy(10);
       log10++;
      }

      while (i.mod(5).isZero()) {
        i = i.dividedToIntegerBy(5);
        factor = factor.multipliedBy(2);
        log10++;
      }
      while (i.mod(2).isZero()) {
        i = i.dividedToIntegerBy(2);
        factor = factor.multipliedBy(5);
        log10++;
      }

      if (i.isEqualTo(_dafny.ONE)) {
        return [factor, log10];
      } else {
        return undefined;
      }
    }
    toBigNumber() {
      if (this.num.isZero() || this.den.isEqualTo(1)) {
        return this.num;
      } else if (this.num.isGreaterThan(0)) {
        return this.num.dividedToIntegerBy(this.den);
      } else {
        return this.num.minus(this.den).plus(1).dividedToIntegerBy(this.den);
      }
    }
    isInteger() {
      return this.equals(new _dafny.BigRational(this.toBigNumber(), _dafny.ONE));
    }
    // Returns values such that aa/dd == a and bb/dd == b.
    normalize(b) {
      let a = this;
      let aa, bb, dd;
      if (a.num.isZero()) {
        aa = a.num;
        bb = b.num;
        dd = b.den;
      } else if (b.num.isZero()) {
        aa = a.num;
        dd = a.den;
        bb = b.num;
      } else {
        let gcd = BigNumberGcd(a.den, b.den);
        let xx = a.den.dividedToIntegerBy(gcd);
        let yy = b.den.dividedToIntegerBy(gcd);
        // We now have a == a.num / (xx * gcd) and b == b.num / (yy * gcd).
        aa = a.num.multipliedBy(yy);
        bb = b.num.multipliedBy(xx);
        dd = a.den.multipliedBy(yy);
      }
      return [aa, bb, dd];
    }
    compareTo(that) {
      // simple things first
      let asign = this.num.isZero() ? 0 : this.num.isLessThan(0) ? -1 : 1;
      let bsign = that.num.isZero() ? 0 : that.num.isLessThan(0) ? -1 : 1;
      if (asign < 0 && 0 <= bsign) {
        return -1;
      } else if (asign <= 0 && 0 < bsign) {
        return -1;
      } else if (bsign < 0 && 0 <= asign) {
        return 1;
      } else if (bsign <= 0 && 0 < asign) {
        return 1;
      }
      let [aa, bb, dd] = this.normalize(that);
      if (aa.isLessThan(bb)) {
        return -1;
      } else if (aa.isEqualTo(bb)){
        return 0;
      } else {
        return 1;
      }
    }
    equals(that) {
      return this.compareTo(that) === 0;
    }
    isLessThan(that) {
      return this.compareTo(that) < 0;
    }
    isAtMost(that) {
      return this.compareTo(that) <= 0;
    }
    plus(b) {
      let [aa, bb, dd] = this.normalize(b);
      return new BigRational(aa.plus(bb), dd);
    }
    minus(b) {
      let [aa, bb, dd] = this.normalize(b);
      return new BigRational(aa.minus(bb), dd);
    }
    negated() {
      return new BigRational(this.num.negated(), this.den);
    }
    multipliedBy(b) {
      return new BigRational(this.num.multipliedBy(b.num), this.den.multipliedBy(b.den));
    }
    dividedBy(b) {
      let a = this;
      // Compute the reciprocal of b
      let bReciprocal;
      if (b.num.isGreaterThan(0)) {
        bReciprocal = new BigRational(b.den, b.num);
      } else {
        // this is the case b.num < 0
        bReciprocal = new BigRational(b.den.negated(), b.num.negated());
      }
      return a.multipliedBy(bReciprocal);
    }
  }
  $module.EuclideanDivisionNumber = function(a, b) {
    if (0 <= a) {
      if (0 <= b) {
        // +a +b: a/b
        return Math.floor(a / b);
      } else {
        // +a -b: -(a/(-b))
        return -Math.floor(a / -b);
      }
    } else {
      if (0 <= b) {
        // -a +b: -((-a-1)/b) - 1
        return -Math.floor((-a-1) / b) - 1;
      } else {
        // -a -b: ((-a-1)/(-b)) + 1
        return Math.floor((-a-1) / -b) + 1;
      }
    }
  }
  $module.EuclideanDivision = function(a, b) {
    if (a.isGreaterThanOrEqualTo(0)) {
      if (b.isGreaterThanOrEqualTo(0)) {
        // +a +b: a/b
        return a.dividedToIntegerBy(b);
      } else {
        // +a -b: -(a/(-b))
        return a.dividedToIntegerBy(b.negated()).negated();
      }
    } else {
      if (b.isGreaterThanOrEqualTo(0)) {
        // -a +b: -((-a-1)/b) - 1
        return a.negated().minus(1).dividedToIntegerBy(b).negated().minus(1);
      } else {
        // -a -b: ((-a-1)/(-b)) + 1
        return a.negated().minus(1).dividedToIntegerBy(b.negated()).plus(1);
      }
    }
  }
  $module.EuclideanModuloNumber = function(a, b) {
    let bp = Math.abs(b);
    if (0 <= a) {
      // +a: a % bp
      return a % bp;
    } else {
      // c = ((-a) % bp)
      // -a: bp - c if c > 0
      // -a: 0 if c == 0
      let c = (-a) % bp;
      return c === 0 ? c : bp - c;
    }
  }
  $module.ShiftLeft = function(b, n) {
    return b.multipliedBy(new BigNumber(2).exponentiatedBy(n));
  }
  $module.ShiftRight = function(b, n) {
    return b.dividedToIntegerBy(new BigNumber(2).exponentiatedBy(n));
  }
  $module.RotateLeft = function(b, n, w) {  // truncate(b << n) | (b >> (w - n))
    let x = _dafny.ShiftLeft(b, n).mod(new BigNumber(2).exponentiatedBy(w));
    let y = _dafny.ShiftRight(b, w - n);
    return x.plus(y);
  }
  $module.RotateRight = function(b, n, w) {  // (b >> n) | truncate(b << (w - n))
    let x = _dafny.ShiftRight(b, n);
    let y = _dafny.ShiftLeft(b, w - n).mod(new BigNumber(2).exponentiatedBy(w));;
    return x.plus(y);
  }
  $module.BitwiseAnd = function(a, b) {
    let r = _dafny.ZERO;
    const m = _dafny.NUMBER_LIMIT;  // 2^53
    let h = _dafny.ONE;
    while (!a.isZero() && !b.isZero()) {
      let a0 = a.mod(m);
      let b0 = b.mod(m);
      r = r.plus(h.multipliedBy(a0 & b0));
      a = a.dividedToIntegerBy(m);
      b = b.dividedToIntegerBy(m);
      h = h.multipliedBy(m);
    }
    return r;
  }
  $module.BitwiseOr = function(a, b) {
    let r = _dafny.ZERO;
    const m = _dafny.NUMBER_LIMIT;  // 2^53
    let h = _dafny.ONE;
    while (!a.isZero() && !b.isZero()) {
      let a0 = a.mod(m);
      let b0 = b.mod(m);
      r = r.plus(h.multipliedBy(a0 | b0));
      a = a.dividedToIntegerBy(m);
      b = b.dividedToIntegerBy(m);
      h = h.multipliedBy(m);
    }
    r = r.plus(h.multipliedBy(a | b));
    return r;
  }
  $module.BitwiseXor = function(a, b) {
    let r = _dafny.ZERO;
    const m = _dafny.NUMBER_LIMIT;  // 2^53
    let h = _dafny.ONE;
    while (!a.isZero() && !b.isZero()) {
      let a0 = a.mod(m);
      let b0 = b.mod(m);
      r = r.plus(h.multipliedBy(a0 ^ b0));
      a = a.dividedToIntegerBy(m);
      b = b.dividedToIntegerBy(m);
      h = h.multipliedBy(m);
    }
    r = r.plus(h.multipliedBy(a | b));
    return r;
  }
  $module.BitwiseNot = function(a, bits) {
    let r = _dafny.ZERO;
    let h = _dafny.ONE;
    for (let i = 0; i < bits; i++) {
      let bit = a.mod(2);
      if (bit.isZero()) {
        r = r.plus(h);
      }
      a = a.dividedToIntegerBy(2);
      h = h.multipliedBy(2);
    }
    return r;
  }
  $module.Quantifier = function(vals, frall, pred) {
    for (let u of vals) {
      if (pred(u) !== frall) { return !frall; }
    }
    return frall;
  }
  $module.PlusChar = function(a, b) {
    return String.fromCharCode(a.charCodeAt(0) + b.charCodeAt(0));
  }
  $module.UnicodePlusChar = function(a, b) {
    return new _dafny.CodePoint(a.value + b.value);
  }
  $module.MinusChar = function(a, b) {
    return String.fromCharCode(a.charCodeAt(0) - b.charCodeAt(0));
  }
  $module.UnicodeMinusChar = function(a, b) {
    return new _dafny.CodePoint(a.value - b.value);
  }
  $module.AllBooleans = function*() {
    yield false;
    yield true;
  }
  $module.AllChars = function*() {
    for (let i = 0; i < 0x10000; i++) {
      yield String.fromCharCode(i);
    }
  }
  $module.AllUnicodeChars = function*() {
    for (let i = 0; i < 0xD800; i++) {
      yield new _dafny.CodePoint(i);
    }
    for (let i = 0xE0000; i < 0x110000; i++) {
      yield new _dafny.CodePoint(i);
    }
  }
  $module.AllIntegers = function*() {
    yield _dafny.ZERO;
    for (let j = _dafny.ONE;; j = j.plus(1)) {
      yield j;
      yield j.negated();
    }
  }
  $module.IntegerRange = function*(lo, hi) {
    if (lo === null) {
      while (true) {
        hi = hi.minus(1);
        yield hi;
      }
    } else if (hi === null) {
      while (true) {
        yield lo;
        lo = lo.plus(1);
      }
    } else {
      while (lo.isLessThan(hi)) {
        yield lo;
        lo = lo.plus(1);
      }
    }
  }
  $module.SingleValue = function*(v) {
    yield v;
  }
  $module.HaltException = class HaltException extends Error {
    constructor(message) {
      super(message)
    }
  }
  $module.HandleHaltExceptions = function(f) {
    try {
      f()
    } catch (e) {
      if (e instanceof _dafny.HaltException) {
        process.stdout.write("[Program halted] " + e.message + "\n")
        process.exitCode = 1
      } else {
        throw e
      }
    }
  }
  $module.FromMainArguments = function(args) {
    var a = [...args];
    a.splice(0, 2, args[0] + " " + args[1]);
    return a;
  }
  $module.UnicodeFromMainArguments = function(args) {
    return $module.FromMainArguments(args).map(_dafny.Seq.UnicodeFromString);
  }
  return $module;

  // What follows are routines private to the Dafny runtime
  function buildArray(initValue, ...dims) {
    if (dims.length === 0) {
      return initValue;
    } else {
      let a = Array(dims[0].toNumber());
      let b = Array.from(a, (x) => buildArray(initValue, ...dims.slice(1)));
      return b;
    }
  }
  function arrayElementsToString(a) {
    // like `a.join(", ")`, but calling _dafny.toString(x) on every element x instead of x.toString()
    let s = "";
    let sep = "";
    for (let x of a) {
      s += sep + _dafny.toString(x);
      sep = ", ";
    }
    return s;
  }
  function BigNumberGcd(a, b){  // gcd of two non-negative BigNumber's
    while (true) {
      if (a.isZero()) {
        return b;
      } else if (b.isZero()) {
        return a;
      }
      if (a.isLessThan(b)) {
        b = b.modulo(a);
      } else {
        a = a.modulo(b);
      }
    }
  }
})();
// Dafny program systemModulePopulator.dfy compiled into JavaScript
let _System = (function() {
  let $module = {};

  $module.nat = class nat {
    constructor () {
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _0_x = (__source);
      return (_dafny.ZERO).isLessThanOrEqualTo(_0_x);
    }
  };

  return $module;
})(); // end of module _System
/*******************************************************************************
*  Copyright by the contributors to the Dafny Project
*  SPDX-License-Identifier: MIT
*******************************************************************************/

var Std_Concurrent = Std_Concurrent || {};
var Std_FileIOInternalExterns = Std_FileIOInternalExterns || {};
Std_FileIOInternalExterns.__default = (function() {
  const buffer = require("buffer");
  const fs = require("fs");
  const nodePath = require("path");

  let $module = {};

  /**
   * Attempts to read all bytes from the file at the given `path`, and returns an array of the following values:
   *
   *   - `isError`: true iff an error was thrown during path string conversion or when reading the file
   *   - `bytesRead`: the sequence of bytes from the file, or an empty sequence if `isError` is true
   *   - `errorMsg`: the error message of the thrown error if `isError` is true, or an empty sequence otherwise
   *
   * We return these values individually because `Result` is not defined in the runtime but instead in library code.
   * It is the responsibility of library code to construct an equivalent `Result` value.
   */
  $module.INTERNAL__ReadBytesFromFile = function(path) {
    const emptySeq = _dafny.Seq.of();
    try {
      const readOpts = { encoding: null };  // read as buffer, not string
      const pathStr = path.toVerbatimString(false)
      const buf = fs.readFileSync(pathStr, readOpts);
      const readBytes = _dafny.Seq.from(buf.valueOf(), byte => new BigNumber(byte));
      return [false, readBytes, emptySeq];
    } catch (e) {
      const errorMsg = _dafny.Seq.UnicodeFromString(e.stack);
      return [true, emptySeq, errorMsg];
    }
  }

  /**
   * Attempts to write all given `bytes` to the file at the given `path`, creating nonexistent parent directories as necessary,
   * and returns an array of the following values:
   *
   *   - `isError`: true iff an error was thrown during path string conversion or when writing to the file
   *   - `errorMsg`: the error message of the thrown error if `isError` is true, or an empty sequence otherwise
   *
   * We return these values individually because `Result` is not defined in the runtime but instead in library code.
   * It is the responsibility of library code to construct an equivalent `Result` value.
   */
  $module.INTERNAL__WriteBytesToFile = function(path, bytes) {
    try {
      const buf = buffer.Buffer.from(bytes);
      const pathStr = path.toVerbatimString(false)
      createParentDirs(pathStr);
      fs.writeFileSync(pathStr, buf);  // no need to specify encoding because data is a Buffer
      return [false, _dafny.Seq.of()];
    } catch (e) {
      const errorMsg = _dafny.Seq.from(e.stack);
      return [true, errorMsg];
    }
  }

  /**
   * Creates the nonexistent parent directory(-ies) of the given path.
   */
  const createParentDirs = function(path) {
    const parentDir = nodePath.dirname(nodePath.normalize(path));
    fs.mkdirSync(parentDir, { recursive: true });
  };

  return $module;
})();
let Std_Wrappers = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Wrappers._default";
    }
    _parentTraits() {
      return [];
    }
    static Need(condition, error) {
      if (condition) {
        return Std_Wrappers.OutcomeResult.create_Pass_k();
      } else {
        return Std_Wrappers.OutcomeResult.create_Fail_k(error);
      }
    };
  };

  $module.Option = class Option {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_None() {
      let $dt = new Option(0);
      return $dt;
    }
    static create_Some(value) {
      let $dt = new Option(1);
      $dt.value = value;
      return $dt;
    }
    get is_None() { return this.$tag === 0; }
    get is_Some() { return this.$tag === 1; }
    get dtor_value() { return this.value; }
    toString() {
      if (this.$tag === 0) {
        return "Wrappers.Option.None";
      } else if (this.$tag === 1) {
        return "Wrappers.Option.Some" + "(" + _dafny.toString(this.value) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.value, other.value);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Wrappers.Option.create_None();
    }
    static Rtd() {
      return class {
        static get Default() {
          return Option.Default();
        }
      };
    }
    IsFailure() {
      let _this = this;
      return (_this).is_None;
    };
    PropagateFailure() {
      let _this = this;
      return Std_Wrappers.Option.create_None();
    };
    Extract() {
      let _this = this;
      return (_this).dtor_value;
    };
    GetOr(_$$_default) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Some) {
          let _0_v = (_source0).value;
          return _0_v;
        }
      }
      {
        return _$$_default;
      }
    };
    ToResult(error) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Some) {
          let _0_v = (_source0).value;
          return Std_Wrappers.Result.create_Success(_0_v);
        }
      }
      {
        return Std_Wrappers.Result.create_Failure(error);
      }
    };
    ToOutcome(error) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Some) {
          let _0_v = (_source0).value;
          return Std_Wrappers.Outcome.create_Pass();
        }
      }
      {
        return Std_Wrappers.Outcome.create_Fail(error);
      }
    };
    Map(rewrap) {
      let _this = this;
      return (rewrap)(_this);
    };
  }

  $module.Result = class Result {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Success(value) {
      let $dt = new Result(0);
      $dt.value = value;
      return $dt;
    }
    static create_Failure(error) {
      let $dt = new Result(1);
      $dt.error = error;
      return $dt;
    }
    get is_Success() { return this.$tag === 0; }
    get is_Failure() { return this.$tag === 1; }
    get dtor_value() { return this.value; }
    get dtor_error() { return this.error; }
    toString() {
      if (this.$tag === 0) {
        return "Wrappers.Result.Success" + "(" + _dafny.toString(this.value) + ")";
      } else if (this.$tag === 1) {
        return "Wrappers.Result.Failure" + "(" + _dafny.toString(this.error) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.value, other.value);
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.error, other.error);
      } else  {
        return false; // unexpected
      }
    }
    static Default(_default_R) {
      return Std_Wrappers.Result.create_Success(_default_R);
    }
    static Rtd(rtd$_R) {
      return class {
        static get Default() {
          return Result.Default(rtd$_R.Default);
        }
      };
    }
    IsFailure() {
      let _this = this;
      return (_this).is_Failure;
    };
    PropagateFailure() {
      let _this = this;
      return Std_Wrappers.Result.create_Failure((_this).dtor_error);
    };
    Extract() {
      let _this = this;
      return (_this).dtor_value;
    };
    GetOr(_$$_default) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Success) {
          let _0_s = (_source0).value;
          return _0_s;
        }
      }
      {
        let _1_e = (_source0).error;
        return _$$_default;
      }
    };
    ToOption() {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Success) {
          let _0_s = (_source0).value;
          return Std_Wrappers.Option.create_Some(_0_s);
        }
      }
      {
        let _1_e = (_source0).error;
        return Std_Wrappers.Option.create_None();
      }
    };
    ToOutcome() {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Success) {
          let _0_s = (_source0).value;
          return Std_Wrappers.Outcome.create_Pass();
        }
      }
      {
        let _1_e = (_source0).error;
        return Std_Wrappers.Outcome.create_Fail(_1_e);
      }
    };
    Map(rewrap) {
      let _this = this;
      return (rewrap)(_this);
    };
    MapFailure(reWrap) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Success) {
          let _0_s = (_source0).value;
          return Std_Wrappers.Result.create_Success(_0_s);
        }
      }
      {
        let _1_e = (_source0).error;
        return Std_Wrappers.Result.create_Failure((reWrap)(_1_e));
      }
    };
  }

  $module.Outcome = class Outcome {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Pass() {
      let $dt = new Outcome(0);
      return $dt;
    }
    static create_Fail(error) {
      let $dt = new Outcome(1);
      $dt.error = error;
      return $dt;
    }
    get is_Pass() { return this.$tag === 0; }
    get is_Fail() { return this.$tag === 1; }
    get dtor_error() { return this.error; }
    toString() {
      if (this.$tag === 0) {
        return "Wrappers.Outcome.Pass";
      } else if (this.$tag === 1) {
        return "Wrappers.Outcome.Fail" + "(" + _dafny.toString(this.error) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.error, other.error);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Wrappers.Outcome.create_Pass();
    }
    static Rtd() {
      return class {
        static get Default() {
          return Outcome.Default();
        }
      };
    }
    IsFailure() {
      let _this = this;
      return (_this).is_Fail;
    };
    PropagateFailure() {
      let _this = this;
      return _this;
    };
    ToOption(r) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Pass) {
          return Std_Wrappers.Option.create_Some(r);
        }
      }
      {
        let _0_e = (_source0).error;
        return Std_Wrappers.Option.create_None();
      }
    };
    ToResult(r) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Pass) {
          return Std_Wrappers.Result.create_Success(r);
        }
      }
      {
        let _0_e = (_source0).error;
        return Std_Wrappers.Result.create_Failure(_0_e);
      }
    };
    Map(rewrap) {
      let _this = this;
      return (rewrap)(_this);
    };
    MapFailure(rewrap, _$$_default) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Pass) {
          return Std_Wrappers.Result.create_Success(_$$_default);
        }
      }
      {
        let _0_e = (_source0).error;
        return Std_Wrappers.Result.create_Failure((rewrap)(_0_e));
      }
    };
    static Need(condition, error) {
      if (condition) {
        return Std_Wrappers.Outcome.create_Pass();
      } else {
        return Std_Wrappers.Outcome.create_Fail(error);
      }
    };
  }

  $module.OutcomeResult = class OutcomeResult {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Pass_k() {
      let $dt = new OutcomeResult(0);
      return $dt;
    }
    static create_Fail_k(error) {
      let $dt = new OutcomeResult(1);
      $dt.error = error;
      return $dt;
    }
    get is_Pass_k() { return this.$tag === 0; }
    get is_Fail_k() { return this.$tag === 1; }
    get dtor_error() { return this.error; }
    toString() {
      if (this.$tag === 0) {
        return "Wrappers.OutcomeResult.Pass'";
      } else if (this.$tag === 1) {
        return "Wrappers.OutcomeResult.Fail'" + "(" + _dafny.toString(this.error) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.error, other.error);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Wrappers.OutcomeResult.create_Pass_k();
    }
    static Rtd() {
      return class {
        static get Default() {
          return OutcomeResult.Default();
        }
      };
    }
    IsFailure() {
      let _this = this;
      return (_this).is_Fail_k;
    };
    PropagateFailure() {
      let _this = this;
      return Std_Wrappers.Result.create_Failure((_this).dtor_error);
    };
  }
  return $module;
})(); // end of module Std_Wrappers
let Std_Relations = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Relations
let Std_Math = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Math._default";
    }
    _parentTraits() {
      return [];
    }
    static Min(a, b) {
      if ((a).isLessThan(b)) {
        return a;
      } else {
        return b;
      }
    };
    static Min3(a, b, c) {
      return Std_Math.__default.Min(a, Std_Math.__default.Min(b, c));
    };
    static Max(a, b) {
      if ((a).isLessThan(b)) {
        return b;
      } else {
        return a;
      }
    };
    static Max3(a, b, c) {
      return Std_Math.__default.Max(a, Std_Math.__default.Max(b, c));
    };
    static Abs(a) {
      if ((a).isLessThan(_dafny.ZERO)) {
        return (_dafny.ZERO).minus(a);
      } else {
        return a;
      }
    };
  };
  return $module;
})(); // end of module Std_Math
let Std_Collections_Seq = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Collections.Seq._default";
    }
    _parentTraits() {
      return [];
    }
    static First(xs) {
      return (xs)[_dafny.ZERO];
    };
    static DropFirst(xs) {
      return (xs).slice(_dafny.ONE);
    };
    static Last(xs) {
      return (xs)[(new BigNumber((xs).length)).minus(_dafny.ONE)];
    };
    static DropLast(xs) {
      return (xs).slice(0, (new BigNumber((xs).length)).minus(_dafny.ONE));
    };
    static ToArray(xs) {
      let a = [];
      let _init0 = ((_0_xs) => function (_1_i) {
        return (_0_xs)[_1_i];
      })(xs);
      let _nw0 = Array((new BigNumber((xs).length)).toNumber());
      for (let _i0_0 = 0; _i0_0 < new BigNumber(_nw0.length); _i0_0++) {
        _nw0[_i0_0] = _init0(new BigNumber(_i0_0));
      }
      a = _nw0;
      return a;
    }
    static ToSet(xs) {
      return function () {
        let _coll0 = new _dafny.Set();
        for (const _compr_0 of (xs).Elements) {
          let _0_x = _compr_0;
          if (_dafny.Seq.contains(xs, _0_x)) {
            _coll0.add(_0_x);
          }
        }
        return _coll0;
      }();
    };
    static IndexOf(xs, v) {
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if (_dafny.areEqual((xs)[_dafny.ZERO], v)) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = (_0___accumulator).plus(_dafny.ONE);
          let _in0 = (xs).slice(_dafny.ONE);
          let _in1 = v;
          xs = _in0;
          v = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static IndexOfOption(xs, v) {
      return Std_Collections_Seq.__default.IndexByOption(xs, ((_0_v) => function (_1_x) {
        return _dafny.areEqual(_1_x, _0_v);
      })(v));
    };
    static IndexByOption(xs, p) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return Std_Wrappers.Option.create_None();
      } else if ((p)((xs)[_dafny.ZERO])) {
        return Std_Wrappers.Option.create_Some(_dafny.ZERO);
      } else {
        let _0_o_k = Std_Collections_Seq.__default.IndexByOption((xs).slice(_dafny.ONE), p);
        if ((_0_o_k).is_Some) {
          return Std_Wrappers.Option.create_Some(((_0_o_k).dtor_value).plus(_dafny.ONE));
        } else {
          return Std_Wrappers.Option.create_None();
        }
      }
    };
    static LastIndexOf(xs, v) {
      TAIL_CALL_START: while (true) {
        if (_dafny.areEqual((xs)[(new BigNumber((xs).length)).minus(_dafny.ONE)], v)) {
          return (new BigNumber((xs).length)).minus(_dafny.ONE);
        } else {
          let _in0 = (xs).slice(0, (new BigNumber((xs).length)).minus(_dafny.ONE));
          let _in1 = v;
          xs = _in0;
          v = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static LastIndexOfOption(xs, v) {
      return Std_Collections_Seq.__default.LastIndexByOption(xs, ((_0_v) => function (_1_x) {
        return _dafny.areEqual(_1_x, _0_v);
      })(v));
    };
    static LastIndexByOption(xs, p) {
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return Std_Wrappers.Option.create_None();
        } else if ((p)((xs)[(new BigNumber((xs).length)).minus(_dafny.ONE)])) {
          return Std_Wrappers.Option.create_Some((new BigNumber((xs).length)).minus(_dafny.ONE));
        } else {
          let _in0 = (xs).slice(0, (new BigNumber((xs).length)).minus(_dafny.ONE));
          let _in1 = p;
          xs = _in0;
          p = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static Remove(xs, pos) {
      return _dafny.Seq.Concat((xs).slice(0, pos), (xs).slice((pos).plus(_dafny.ONE)));
    };
    static RemoveValue(xs, v) {
      if (!_dafny.Seq.contains(xs, v)) {
        return xs;
      } else {
        let _0_i = Std_Collections_Seq.__default.IndexOf(xs, v);
        return _dafny.Seq.Concat((xs).slice(0, _0_i), (xs).slice((_0_i).plus(_dafny.ONE)));
      }
    };
    static Insert(xs, a, pos) {
      return _dafny.Seq.Concat(_dafny.Seq.Concat((xs).slice(0, pos), _dafny.Seq.of(a)), (xs).slice(pos));
    };
    static Reverse(xs) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if (_dafny.areEqual(xs, _dafny.Seq.of())) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((xs)[(new BigNumber((xs).length)).minus(_dafny.ONE)]));
          let _in0 = (xs).slice(_dafny.ZERO, (new BigNumber((xs).length)).minus(_dafny.ONE));
          xs = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static Repeat(v, length) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((length).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of(v));
          let _in0 = v;
          let _in1 = (length).minus(_dafny.ONE);
          v = _in0;
          length = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static Unzip(xs) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Tuple.of(_dafny.Seq.of(), _dafny.Seq.of());
      } else {
        let _let_tmp_rhs0 = Std_Collections_Seq.__default.Unzip(Std_Collections_Seq.__default.DropLast(xs));
        let _0_a = (_let_tmp_rhs0)[0];
        let _1_b = (_let_tmp_rhs0)[1];
        return _dafny.Tuple.of(_dafny.Seq.Concat(_0_a, _dafny.Seq.of((Std_Collections_Seq.__default.Last(xs))[0])), _dafny.Seq.Concat(_1_b, _dafny.Seq.of((Std_Collections_Seq.__default.Last(xs))[1])));
      }
    };
    static Zip(xs, ys) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_dafny.Seq.of(), _0___accumulator);
        } else {
          _0___accumulator = _dafny.Seq.Concat(_dafny.Seq.of(_dafny.Tuple.of(Std_Collections_Seq.__default.Last(xs), Std_Collections_Seq.__default.Last(ys))), _0___accumulator);
          let _in0 = Std_Collections_Seq.__default.DropLast(xs);
          let _in1 = Std_Collections_Seq.__default.DropLast(ys);
          xs = _in0;
          ys = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static Max(xs) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ONE)) {
        return (xs)[_dafny.ZERO];
      } else {
        return Std_Math.__default.Max((xs)[_dafny.ZERO], Std_Collections_Seq.__default.Max((xs).slice(_dafny.ONE)));
      }
    };
    static Min(xs) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ONE)) {
        return (xs)[_dafny.ZERO];
      } else {
        return Std_Math.__default.Min((xs)[_dafny.ZERO], Std_Collections_Seq.__default.Min((xs).slice(_dafny.ONE)));
      }
    };
    static Flatten(xs) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, (xs)[_dafny.ZERO]);
          let _in0 = (xs).slice(_dafny.ONE);
          xs = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static FlattenReverse(xs) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_dafny.Seq.of(), _0___accumulator);
        } else {
          _0___accumulator = _dafny.Seq.Concat(Std_Collections_Seq.__default.Last(xs), _0___accumulator);
          let _in0 = Std_Collections_Seq.__default.DropLast(xs);
          xs = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static Join(seqs, separator) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((seqs).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else if ((new BigNumber((seqs).length)).isEqualTo(_dafny.ONE)) {
          return _dafny.Seq.Concat(_0___accumulator, (seqs)[_dafny.ZERO]);
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.Concat((seqs)[_dafny.ZERO], separator));
          let _in0 = (seqs).slice(_dafny.ONE);
          let _in1 = separator;
          seqs = _in0;
          separator = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static Split(s, delim) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        let _1_i = Std_Collections_Seq.__default.IndexOfOption(s, delim);
        if ((_1_i).is_Some) {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((s).slice(0, (_1_i).dtor_value)));
          let _in0 = (s).slice(((_1_i).dtor_value).plus(_dafny.ONE));
          let _in1 = delim;
          s = _in0;
          delim = _in1;
          continue TAIL_CALL_START;
        } else {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of(s));
        }
      }
    };
    static SplitOnce(s, delim) {
      let _0_i = Std_Collections_Seq.__default.IndexOfOption(s, delim);
      return _dafny.Tuple.of((s).slice(0, (_0_i).dtor_value), (s).slice(((_0_i).dtor_value).plus(_dafny.ONE)));
    };
    static SplitOnceOption(s, delim) {
      let _0_valueOrError0 = Std_Collections_Seq.__default.IndexOfOption(s, delim);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_i = (_0_valueOrError0).Extract();
        return Std_Wrappers.Option.create_Some(_dafny.Tuple.of((s).slice(0, _1_i), (s).slice((_1_i).plus(_dafny.ONE))));
      }
    };
    static Map(f, xs) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((f)((xs)[_dafny.ZERO])));
          let _in0 = f;
          let _in1 = (xs).slice(_dafny.ONE);
          f = _in0;
          xs = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static MapPartialFunction(f, xs) {
      return Std_Collections_Seq.__default.Map(f, xs);
    };
    static MapWithResult(f, xs) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return Std_Wrappers.Result.create_Success(_dafny.Seq.of());
      } else {
        let _0_valueOrError0 = (f)((xs)[_dafny.ZERO]);
        if ((_0_valueOrError0).IsFailure()) {
          return (_0_valueOrError0).PropagateFailure();
        } else {
          let _1_head = (_0_valueOrError0).Extract();
          let _2_valueOrError1 = Std_Collections_Seq.__default.MapWithResult(f, (xs).slice(_dafny.ONE));
          if ((_2_valueOrError1).IsFailure()) {
            return (_2_valueOrError1).PropagateFailure();
          } else {
            let _3_tail = (_2_valueOrError1).Extract();
            return Std_Wrappers.Result.create_Success(_dafny.Seq.Concat(_dafny.Seq.of(_1_head), _3_tail));
          }
        }
      }
    };
    static Filter(f, xs) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, (((f)((xs)[_dafny.ZERO])) ? (_dafny.Seq.of((xs)[_dafny.ZERO])) : (_dafny.Seq.of())));
          let _in0 = f;
          let _in1 = (xs).slice(_dafny.ONE);
          f = _in0;
          xs = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static FoldLeft(f, init, xs) {
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return init;
        } else {
          let _in0 = f;
          let _in1 = (f)(init, (xs)[_dafny.ZERO]);
          let _in2 = (xs).slice(_dafny.ONE);
          f = _in0;
          init = _in1;
          xs = _in2;
          continue TAIL_CALL_START;
        }
      }
    };
    static FoldRight(f, xs, init) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return init;
      } else {
        return (f)((xs)[_dafny.ZERO], Std_Collections_Seq.__default.FoldRight(f, (xs).slice(_dafny.ONE), init));
      }
    };
    static MergeSortBy(lessThanOrEq, a) {
      if ((new BigNumber((a).length)).isLessThanOrEqualTo(_dafny.ONE)) {
        return a;
      } else {
        let _0_splitIndex = _dafny.EuclideanDivision(new BigNumber((a).length), new BigNumber(2));
        let _1_left = (a).slice(0, _0_splitIndex);
        let _2_right = (a).slice(_0_splitIndex);
        let _3_leftSorted = Std_Collections_Seq.__default.MergeSortBy(lessThanOrEq, _1_left);
        let _4_rightSorted = Std_Collections_Seq.__default.MergeSortBy(lessThanOrEq, _2_right);
        return Std_Collections_Seq.__default.MergeSortedWith(_3_leftSorted, _4_rightSorted, lessThanOrEq);
      }
    };
    static MergeSortedWith(left, right, lessThanOrEq) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((left).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, right);
        } else if ((new BigNumber((right).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, left);
        } else if ((lessThanOrEq)((left)[_dafny.ZERO], (right)[_dafny.ZERO])) {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((left)[_dafny.ZERO]));
          let _in0 = (left).slice(_dafny.ONE);
          let _in1 = right;
          let _in2 = lessThanOrEq;
          left = _in0;
          right = _in1;
          lessThanOrEq = _in2;
          continue TAIL_CALL_START;
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((right)[_dafny.ZERO]));
          let _in3 = left;
          let _in4 = (right).slice(_dafny.ONE);
          let _in5 = lessThanOrEq;
          left = _in3;
          right = _in4;
          lessThanOrEq = _in5;
          continue TAIL_CALL_START;
        }
      }
    };
    static All(s, p) {
      return _dafny.Quantifier(_dafny.IntegerRange(_dafny.ZERO, new BigNumber((s).length)), true, function (_forall_var_0) {
        let _0_i = _forall_var_0;
        return !(((_dafny.ZERO).isLessThanOrEqualTo(_0_i)) && ((_0_i).isLessThan(new BigNumber((s).length)))) || ((p)((s)[_0_i]));
      });
    };
    static AllNot(s, p) {
      return _dafny.Quantifier(_dafny.IntegerRange(_dafny.ZERO, new BigNumber((s).length)), true, function (_forall_var_0) {
        let _0_i = _forall_var_0;
        return !(((_dafny.ZERO).isLessThanOrEqualTo(_0_i)) && ((_0_i).isLessThan(new BigNumber((s).length)))) || (!((p)((s)[_0_i])));
      });
    };
    static Partitioned(s, p) {
      TAIL_CALL_START: while (true) {
        if (_dafny.areEqual(s, _dafny.Seq.of())) {
          return true;
        } else if ((p)((s)[_dafny.ZERO])) {
          let _in0 = (s).slice(_dafny.ONE);
          let _in1 = p;
          s = _in0;
          p = _in1;
          continue TAIL_CALL_START;
        } else {
          return Std_Collections_Seq.__default.AllNot((s).slice(_dafny.ONE), p);
        }
      }
    };
  };

  $module.Slice = class Slice {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Slice(data, start, end) {
      let $dt = new Slice(0);
      $dt.data = data;
      $dt.start = start;
      $dt.end = end;
      return $dt;
    }
    get is_Slice() { return this.$tag === 0; }
    get dtor_data() { return this.data; }
    get dtor_start() { return this.start; }
    get dtor_end() { return this.end; }
    toString() {
      if (this.$tag === 0) {
        return "Seq.Slice.Slice" + "(" + _dafny.toString(this.data) + ", " + _dafny.toString(this.start) + ", " + _dafny.toString(this.end) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.data, other.data) && _dafny.areEqual(this.start, other.start) && _dafny.areEqual(this.end, other.end);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Collections_Seq.Slice.create_Slice(_dafny.Seq.of(), _dafny.ZERO, _dafny.ZERO);
    }
    static Rtd() {
      return class {
        static get Default() {
          return Slice.Default();
        }
      };
    }
    View() {
      let _this = this;
      return ((_this).dtor_data).slice((_this).dtor_start, (_this).dtor_end);
    };
    Length() {
      let _this = this;
      return ((_this).dtor_end).minus((_this).dtor_start);
    };
    At(i) {
      let _this = this;
      return ((_this).dtor_data)[((_this).dtor_start).plus(i)];
    };
    Drop(firstIncludedIndex) {
      let _this = this;
      return Std_Collections_Seq.Slice.create_Slice((_this).dtor_data, ((_this).dtor_start).plus(firstIncludedIndex), (_this).dtor_end);
    };
    Sub(firstIncludedIndex, lastExcludedIndex) {
      let _this = this;
      return Std_Collections_Seq.Slice.create_Slice((_this).dtor_data, ((_this).dtor_start).plus(firstIncludedIndex), ((_this).dtor_start).plus(lastExcludedIndex));
    };
  }
  return $module;
})(); // end of module Std_Collections_Seq
let Std_Collections_Array = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Collections.Array._default";
    }
    _parentTraits() {
      return [];
    }
    static BinarySearch(a, key, less) {
      let r = Std_Wrappers.Option.Default();
      let _0_lo;
      let _1_hi;
      let _rhs0 = _dafny.ZERO;
      let _rhs1 = new BigNumber((a).length);
      _0_lo = _rhs0;
      _1_hi = _rhs1;
      while ((_0_lo).isLessThan(_1_hi)) {
        let _2_mid;
        _2_mid = _dafny.EuclideanDivision((_0_lo).plus(_1_hi), new BigNumber(2));
        if ((less)(key, (a)[_2_mid])) {
          _1_hi = _2_mid;
        } else if ((less)((a)[_2_mid], key)) {
          _0_lo = (_2_mid).plus(_dafny.ONE);
        } else {
          r = Std_Wrappers.Option.create_Some(_2_mid);
          return r;
        }
      }
      r = Std_Wrappers.Option.create_None();
      return r;
      return r;
    }
  };
  return $module;
})(); // end of module Std_Collections_Array
let Std_Collections_Imap = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Collections.Imap._default";
    }
    _parentTraits() {
      return [];
    }
    static Get(m, x) {
      if ((m).contains(x)) {
        return Std_Wrappers.Option.create_Some((m).get(x));
      } else {
        return Std_Wrappers.Option.create_None();
      }
    };
  };
  return $module;
})(); // end of module Std_Collections_Imap
let Std_Functions = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Functions
let Std_Collections_Iset = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Collections_Iset
let Std_Collections_Map = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Collections.Map._default";
    }
    _parentTraits() {
      return [];
    }
    static Get(m, x) {
      if ((m).contains(x)) {
        return Std_Wrappers.Option.create_Some((m).get(x));
      } else {
        return Std_Wrappers.Option.create_None();
      }
    };
    static ToImap(m) {
      return function () {
        let _coll0 = new _dafny.Map();
        for (const _compr_0 of (m).Keys.Elements) {
          let _0_x = _compr_0;
          if ((m).contains(_0_x)) {
            _coll0.push([_0_x,(m).get(_0_x)]);
          }
        }
        return _coll0;
      }();
    };
    static RemoveKeys(m, xs) {
      return (m).Subtract(xs);
    };
    static Remove(m, x) {
      let _0_m_k = function () {
        let _coll0 = new _dafny.Map();
        for (const _compr_0 of (m).Keys.Elements) {
          let _1_x_k = _compr_0;
          if (((m).contains(_1_x_k)) && (!_dafny.areEqual(_1_x_k, x))) {
            _coll0.push([_1_x_k,(m).get(_1_x_k)]);
          }
        }
        return _coll0;
      }();
      return _0_m_k;
    };
    static Restrict(m, xs) {
      return function () {
        let _coll0 = new _dafny.Map();
        for (const _compr_0 of (xs).Elements) {
          let _0_x = _compr_0;
          if (((xs).contains(_0_x)) && ((m).contains(_0_x))) {
            _coll0.push([_0_x,(m).get(_0_x)]);
          }
        }
        return _coll0;
      }();
    };
    static Union(m, m_k) {
      return (m).Merge(m_k);
    };
  };
  return $module;
})(); // end of module Std_Collections_Map
let Std_Collections_Multiset = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Collections_Multiset
let Std_Collections_Set = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Collections.Set._default";
    }
    _parentTraits() {
      return [];
    }
    static ExtractFromSingleton(s) {
      return function (_let_dummy_0) {
        let _0_x = undefined;
        L_ASSIGN_SUCH_THAT_0: {
          for (const _assign_such_that_0 of (s).Elements) {
            _0_x = _assign_such_that_0;
            if ((s).contains(_0_x)) {
              break L_ASSIGN_SUCH_THAT_0;
            }
          }
          throw new Error("assign-such-that search produced no value");
        }
        return _0_x;
      }(0);
    };
    static Map(f, xs) {
      let _0_ys = function () {
        let _coll0 = new _dafny.Set();
        for (const _compr_0 of (xs).Elements) {
          let _1_x = _compr_0;
          if ((xs).contains(_1_x)) {
            _coll0.add((f)(_1_x));
          }
        }
        return _coll0;
      }();
      return _0_ys;
    };
    static Filter(f, xs) {
      let _0_ys = function () {
        let _coll0 = new _dafny.Set();
        for (const _compr_0 of (xs).Elements) {
          let _1_x = _compr_0;
          if (((xs).contains(_1_x)) && ((f)(_1_x))) {
            _coll0.add(_1_x);
          }
        }
        return _coll0;
      }();
      return _0_ys;
    };
    static SetRange(a, b) {
      let _0___accumulator = _dafny.Set.fromElements();
      TAIL_CALL_START: while (true) {
        if ((a).isEqualTo(b)) {
          return (_dafny.Set.fromElements()).Union(_0___accumulator);
        } else {
          _0___accumulator = (_0___accumulator).Union(_dafny.Set.fromElements(a));
          let _in0 = (a).plus(_dafny.ONE);
          let _in1 = b;
          a = _in0;
          b = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static SetRangeZeroBound(n) {
      return Std_Collections_Set.__default.SetRange(_dafny.ZERO, n);
    };
  };
  return $module;
})(); // end of module Std_Collections_Set
let Std_Collections_Tuple = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Collections.Tuple._default";
    }
    _parentTraits() {
      return [];
    }
    static T2__0() {
      return function (_0_lr) {
        return (_0_lr)[0];
      };
    };
    static T2__1() {
      return function (_0_lr) {
        return (_0_lr)[1];
      };
    };
  };
  return $module;
})(); // end of module Std_Collections_Tuple
let Std_Collections = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Collections
let Std_Ordinal = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Ordinal._default";
    }
    _parentTraits() {
      return [];
    }
    static Max(a, b) {
      if ((a).isLessThan(b)) {
        return b;
      } else {
        return a;
      }
    };
  };
  return $module;
})(); // end of module Std_Ordinal
let Std_Termination = (function() {
  let $module = {};


  $module.TerminationMetric = class TerminationMetric {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_TMBool(boolValue) {
      let $dt = new TerminationMetric(0);
      $dt.boolValue = boolValue;
      return $dt;
    }
    static create_TMNat(natValue) {
      let $dt = new TerminationMetric(1);
      $dt.natValue = natValue;
      return $dt;
    }
    static create_TMChar(charValue) {
      let $dt = new TerminationMetric(2);
      $dt.charValue = charValue;
      return $dt;
    }
    static create_TMOrdinal(ordinalValue) {
      let $dt = new TerminationMetric(3);
      $dt.ordinalValue = ordinalValue;
      return $dt;
    }
    static create_TMObject(objectValue) {
      let $dt = new TerminationMetric(4);
      $dt.objectValue = objectValue;
      return $dt;
    }
    static create_TMSeq(seqValue) {
      let $dt = new TerminationMetric(5);
      $dt.seqValue = seqValue;
      return $dt;
    }
    static create_TMSet(setValue) {
      let $dt = new TerminationMetric(6);
      $dt.setValue = setValue;
      return $dt;
    }
    static create_TMTuple(base, first, second) {
      let $dt = new TerminationMetric(7);
      $dt.base = base;
      $dt.first = first;
      $dt.second = second;
      return $dt;
    }
    static create_TMTop() {
      let $dt = new TerminationMetric(8);
      return $dt;
    }
    static create_TMSucc(original) {
      let $dt = new TerminationMetric(9);
      $dt.original = original;
      return $dt;
    }
    get is_TMBool() { return this.$tag === 0; }
    get is_TMNat() { return this.$tag === 1; }
    get is_TMChar() { return this.$tag === 2; }
    get is_TMOrdinal() { return this.$tag === 3; }
    get is_TMObject() { return this.$tag === 4; }
    get is_TMSeq() { return this.$tag === 5; }
    get is_TMSet() { return this.$tag === 6; }
    get is_TMTuple() { return this.$tag === 7; }
    get is_TMTop() { return this.$tag === 8; }
    get is_TMSucc() { return this.$tag === 9; }
    get dtor_boolValue() { return this.boolValue; }
    get dtor_natValue() { return this.natValue; }
    get dtor_charValue() { return this.charValue; }
    get dtor_ordinalValue() { return this.ordinalValue; }
    get dtor_objectValue() { return this.objectValue; }
    get dtor_seqValue() { return this.seqValue; }
    get dtor_setValue() { return this.setValue; }
    get dtor_base() { return this.base; }
    get dtor_first() { return this.first; }
    get dtor_second() { return this.second; }
    get dtor_original() { return this.original; }
    toString() {
      if (this.$tag === 0) {
        return "Termination.TerminationMetric.TMBool" + "(" + _dafny.toString(this.boolValue) + ")";
      } else if (this.$tag === 1) {
        return "Termination.TerminationMetric.TMNat" + "(" + _dafny.toString(this.natValue) + ")";
      } else if (this.$tag === 2) {
        return "Termination.TerminationMetric.TMChar" + "(" + _dafny.toString(this.charValue) + ")";
      } else if (this.$tag === 3) {
        return "Termination.TerminationMetric.TMOrdinal" + "(" + _dafny.toString(this.ordinalValue) + ")";
      } else if (this.$tag === 4) {
        return "Termination.TerminationMetric.TMObject" + "(" + _dafny.toString(this.objectValue) + ")";
      } else if (this.$tag === 5) {
        return "Termination.TerminationMetric.TMSeq" + "(" + _dafny.toString(this.seqValue) + ")";
      } else if (this.$tag === 6) {
        return "Termination.TerminationMetric.TMSet" + "(" + _dafny.toString(this.setValue) + ")";
      } else if (this.$tag === 7) {
        return "Termination.TerminationMetric.TMTuple" + "(" + _dafny.toString(this.base) + ", " + _dafny.toString(this.first) + ", " + _dafny.toString(this.second) + ")";
      } else if (this.$tag === 8) {
        return "Termination.TerminationMetric.TMTop";
      } else if (this.$tag === 9) {
        return "Termination.TerminationMetric.TMSucc" + "(" + _dafny.toString(this.original) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && this.boolValue === other.boolValue;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.natValue, other.natValue);
      } else if (this.$tag === 2) {
        return other.$tag === 2 && _dafny.areEqual(this.charValue, other.charValue);
      } else if (this.$tag === 3) {
        return other.$tag === 3 && _dafny.areEqual(this.ordinalValue, other.ordinalValue);
      } else if (this.$tag === 4) {
        return other.$tag === 4 && this.objectValue === other.objectValue;
      } else if (this.$tag === 5) {
        return other.$tag === 5 && _dafny.areEqual(this.seqValue, other.seqValue);
      } else if (this.$tag === 6) {
        return other.$tag === 6 && _dafny.areEqual(this.setValue, other.setValue);
      } else if (this.$tag === 7) {
        return other.$tag === 7 && _dafny.areEqual(this.base, other.base) && _dafny.areEqual(this.first, other.first) && _dafny.areEqual(this.second, other.second);
      } else if (this.$tag === 8) {
        return other.$tag === 8;
      } else if (this.$tag === 9) {
        return other.$tag === 9 && _dafny.areEqual(this.original, other.original);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Termination.TerminationMetric.create_TMBool(false);
    }
    static Rtd() {
      return class {
        static get Default() {
          return TerminationMetric.Default();
        }
      };
    }
  }
  return $module;
})(); // end of module Std_Termination
let Std_Frames = (function() {
  let $module = {};


  $module.Validatable = class Validatable {
  };

  $module.GhostBox = class GhostBox {
    constructor () {
      this._tname = "Std.Frames.GhostBox";
    }
    _parentTraits() {
      return [];
    }
  };

  $module.Box = class Box {
    constructor () {
      this._tname = "Std.Frames.Box";
      this.value = undefined;
    }
    _parentTraits() {
      return [];
    }
    // DUPLICATE CONSTRUCTOR: constructor(value) {
    // let _this = this;
    // (_this).value = value;
    // return;
    // }
  };
  return $module;
})(); // end of module Std_Frames
let Std_GenericActions = (function() {
  let $module = {};


  $module.GenericAction = class GenericAction {
  };
  return $module;
})(); // end of module Std_GenericActions
let Std_BoundedInts = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.BoundedInts._default";
    }
    _parentTraits() {
      return [];
    }
    static get TWO__TO__THE__8() {
      return new BigNumber(256);
    };
    static get UINT8__MAX() {
      return 255;
    };
    static get TWO__TO__THE__16() {
      return new BigNumber(65536);
    };
    static get UINT16__MAX() {
      return 65535;
    };
    static get TWO__TO__THE__32() {
      return new BigNumber(4294967296);
    };
    static get UINT32__MAX() {
      return 4294967295;
    };
    static get TWO__TO__THE__64() {
      return new BigNumber("18446744073709551616");
    };
    static get UINT64__MAX() {
      return new BigNumber("18446744073709551615");
    };
    static get TWO__TO__THE__7() {
      return new BigNumber(128);
    };
    static get INT8__MIN() {
      return -128;
    };
    static get INT8__MAX() {
      return 127;
    };
    static get TWO__TO__THE__15() {
      return new BigNumber(32768);
    };
    static get INT16__MIN() {
      return -32768;
    };
    static get INT16__MAX() {
      return 32767;
    };
    static get TWO__TO__THE__31() {
      return new BigNumber(2147483648);
    };
    static get INT32__MIN() {
      return -2147483648;
    };
    static get INT32__MAX() {
      return 2147483647;
    };
    static get TWO__TO__THE__63() {
      return new BigNumber("9223372036854775808");
    };
    static get INT64__MIN() {
      return new BigNumber("-9223372036854775808");
    };
    static get INT64__MAX() {
      return new BigNumber("9223372036854775807");
    };
    static get NAT8__MAX() {
      return 127;
    };
    static get NAT16__MAX() {
      return 32767;
    };
    static get NAT32__MAX() {
      return 2147483647;
    };
    static get NAT64__MAX() {
      return new BigNumber("9223372036854775807");
    };
    static get TWO__TO__THE__128() {
      return new BigNumber("340282366920938463463374607431768211456");
    };
    static get TWO__TO__THE__127() {
      return new BigNumber("170141183460469231731687303715884105728");
    };
    static get TWO__TO__THE__0() {
      return _dafny.ONE;
    };
    static get TWO__TO__THE__1() {
      return new BigNumber(2);
    };
    static get TWO__TO__THE__2() {
      return new BigNumber(4);
    };
    static get TWO__TO__THE__4() {
      return new BigNumber(16);
    };
    static get TWO__TO__THE__5() {
      return new BigNumber(32);
    };
    static get TWO__TO__THE__24() {
      return new BigNumber(16777216);
    };
    static get TWO__TO__THE__40() {
      return new BigNumber(1099511627776);
    };
    static get TWO__TO__THE__48() {
      return new BigNumber(281474976710656);
    };
    static get TWO__TO__THE__56() {
      return new BigNumber("72057594037927936");
    };
    static get TWO__TO__THE__256() {
      return new BigNumber("115792089237316195423570985008687907853269984665640564039457584007913129639936");
    };
    static get TWO__TO__THE__512() {
      return new BigNumber("13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084096");
    };
  };

  $module.uint8 = class uint8 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _0_x = new BigNumber(__source);
      return ((_dafny.ZERO).isLessThanOrEqualTo(_0_x)) && ((_0_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__8));
    }
  };

  $module.uint16 = class uint16 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _1_x = new BigNumber(__source);
      return ((_dafny.ZERO).isLessThanOrEqualTo(_1_x)) && ((_1_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__16));
    }
  };

  $module.uint32 = class uint32 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _2_x = new BigNumber(__source);
      return ((_dafny.ZERO).isLessThanOrEqualTo(_2_x)) && ((_2_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__32));
    }
  };

  $module.uint64 = class uint64 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _3_x = __source;
      return ((_dafny.ZERO).isLessThanOrEqualTo(_3_x)) && ((_3_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__64));
    }
  };

  $module.uint128 = class uint128 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _4_x = __source;
      return ((_dafny.ZERO).isLessThanOrEqualTo(_4_x)) && ((_4_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__128));
    }
  };

  $module.int8 = class int8 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _5_x = new BigNumber(__source);
      return (((_dafny.ZERO).minus(Std_BoundedInts.__default.TWO__TO__THE__7)).isLessThanOrEqualTo(_5_x)) && ((_5_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__7));
    }
  };

  $module.int16 = class int16 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _6_x = new BigNumber(__source);
      return (((_dafny.ZERO).minus(Std_BoundedInts.__default.TWO__TO__THE__15)).isLessThanOrEqualTo(_6_x)) && ((_6_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__15));
    }
  };

  $module.int32 = class int32 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _7_x = new BigNumber(__source);
      return (((_dafny.ZERO).minus(Std_BoundedInts.__default.TWO__TO__THE__31)).isLessThanOrEqualTo(_7_x)) && ((_7_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__31));
    }
  };

  $module.int64 = class int64 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _8_x = __source;
      return (((_dafny.ZERO).minus(Std_BoundedInts.__default.TWO__TO__THE__63)).isLessThanOrEqualTo(_8_x)) && ((_8_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__63));
    }
  };

  $module.int128 = class int128 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _9_x = __source;
      return (((_dafny.ZERO).minus(Std_BoundedInts.__default.TWO__TO__THE__127)).isLessThanOrEqualTo(_9_x)) && ((_9_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__127));
    }
  };

  $module.nat8 = class nat8 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _10_x = new BigNumber(__source);
      return ((_dafny.ZERO).isLessThanOrEqualTo(_10_x)) && ((_10_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__7));
    }
  };

  $module.nat16 = class nat16 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _11_x = new BigNumber(__source);
      return ((_dafny.ZERO).isLessThanOrEqualTo(_11_x)) && ((_11_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__15));
    }
  };

  $module.nat32 = class nat32 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _12_x = new BigNumber(__source);
      return ((_dafny.ZERO).isLessThanOrEqualTo(_12_x)) && ((_12_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__31));
    }
  };

  $module.nat64 = class nat64 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _13_x = __source;
      return ((_dafny.ZERO).isLessThanOrEqualTo(_13_x)) && ((_13_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__63));
    }
  };

  $module.nat128 = class nat128 {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _14_x = __source;
      return ((_dafny.ZERO).isLessThanOrEqualTo(_14_x)) && ((_14_x).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__127));
    }
  };

  $module.opt__byte = class opt__byte {
    constructor () {
    }
    _parentTraits() {
      return [];
    }
    static *IntegerRange(lo, hi) {
      while (lo.isLessThan(hi)) {
        yield lo.toNumber();
        lo = lo.plus(1);
      }
    }
    static get Default() {
      return 0;
    }
    static _Is(__source) {
      let _15_c = new BigNumber(__source);
      return ((new BigNumber(-1)).isLessThanOrEqualTo(_15_c)) && ((_15_c).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__8));
    }
  };
  return $module;
})(); // end of module Std_BoundedInts
let Std_DynamicArray = (function() {
  let $module = {};


  $module.DynamicArray = class DynamicArray {
    constructor () {
      this._tname = "Std.DynamicArray.DynamicArray";
      this.size = _dafny.ZERO;
      this.capacity = _dafny.ZERO;
      this.data = [];
    }
    _parentTraits() {
      return [];
    }
    // DUPLICATE CONSTRUCTOR: constructor() {
    // let _this = this;
    // (_this).size = _dafny.ZERO;
    // (_this).capacity = _dafny.ZERO;
    // let _nw0 = Array((_dafny.ZERO).toNumber());
    // (_this).data = _nw0;
    // return;
    // }
    At(index) {
      let _this = this;
      return (_this.data)[index];
    };
    Put(index, element) {
      let _this = this;
      let _arr0 = _this.data;
      _arr0[(index)] = element;
      return;
    }
    Ensure(reserved, defaultValue) {
      let _this = this;
      let _0_newCapacity;
      _0_newCapacity = _this.capacity;
      while (((_0_newCapacity).minus(_this.size)).isLessThan(reserved)) {
        _0_newCapacity = (_this).DefaultNewCapacity(_0_newCapacity);
      }
      if ((_this.capacity).isLessThan(_0_newCapacity)) {
        (_this).Realloc(defaultValue, _0_newCapacity);
      }
      return;
    }
    PopFast() {
      let _this = this;
      (_this).size = (_this.size).minus(_dafny.ONE);
      return;
    }
    PushFast(element) {
      let _this = this;
      let _arr0 = _this.data;
      let _index0 = _this.size;
      _arr0[_index0] = element;
      (_this).size = (_this.size).plus(_dafny.ONE);
      return;
    }
    Push(element) {
      let _this = this;
      if ((_this.size).isEqualTo(_this.capacity)) {
        (_this).ReallocDefault(element);
      }
      (_this).PushFast(element);
      return;
    }
    Realloc(defaultValue, newCapacity) {
      let _this = this;
      let _0_oldData;
      let _1_oldCapacity;
      let _rhs0 = _this.data;
      let _rhs1 = _this.capacity;
      _0_oldData = _rhs0;
      _1_oldCapacity = _rhs1;
      let _init0 = ((_2_defaultValue) => function (_3___v0) {
        return _2_defaultValue;
      })(defaultValue);
      let _nw0 = Array((newCapacity).toNumber());
      for (let _i0_0 = 0; _i0_0 < new BigNumber(_nw0.length); _i0_0++) {
        _nw0[_i0_0] = _init0(new BigNumber(_i0_0));
      }
      let _rhs2 = _nw0;
      let _rhs3 = newCapacity;
      let _lhs0 = _this;
      let _lhs1 = _this;
      _lhs0.data = _rhs2;
      _lhs1.capacity = _rhs3;
      (_this).CopyFrom(_0_oldData, _1_oldCapacity);
      return;
    }
    DefaultNewCapacity(capacity) {
      let _this = this;
      if ((capacity).isEqualTo(_dafny.ZERO)) {
        return new BigNumber(8);
      } else {
        return (new BigNumber(2)).multipliedBy(capacity);
      }
    };
    ReallocDefault(defaultValue) {
      let _this = this;
      (_this).Realloc(defaultValue, (_this).DefaultNewCapacity(_this.capacity));
      return;
    }
    CopyFrom(newData, count) {
      let _this = this;
      for (const _guard_loop_0 of _dafny.IntegerRange(_dafny.ZERO, count)) {
        let _0_index = _guard_loop_0;
        if ((true) && (((_dafny.ZERO).isLessThanOrEqualTo(_0_index)) && ((_0_index).isLessThan(count)))) {
          let _arr0 = _this.data;
          _arr0[(_0_index)] = (newData)[_0_index];
        }
      }
      return;
    }
  };
  return $module;
})(); // end of module Std_DynamicArray
let Std_Actions = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Actions._default";
    }
    _parentTraits() {
      return [];
    }
    static InputsOf(history) {
      return Std_Collections_Seq.__default.Map(function (_0_e) {
        return (_0_e)[0];
      }, history);
    };
    static OutputsOf(history) {
      return Std_Collections_Seq.__default.Map(function (_0_e) {
        return (_0_e)[1];
      }, history);
    };
  };

  $module.Action = class Action {
  };

  $module.TotalActionProof = class TotalActionProof {
  };

  $module.DefaultTotalActionProof = class DefaultTotalActionProof {
    constructor () {
      this._tname = "Std.Actions.DefaultTotalActionProof";
      this._action = undefined;
    }
    _parentTraits() {
      return [Std_Actions.TotalActionProof, Std_Frames.Validatable];
    }
    get action() {
      let _this = this;
      return _this._action;
    };
  };

  $module.FunctionAction = class FunctionAction {
    constructor () {
      this._tname = "Std.Actions.FunctionAction";
      this._f = null;
    }
    _parentTraits() {
      return [Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    // DUPLICATE CONSTRUCTOR: constructor(f) {
    // let _this = this;
    // (_this)._f = f;
    // return;
    // }
    Invoke(i) {
      let _this = this;
      let o = undefined;
      o = ((_this).f)(i);
      return o;
    }
    get f() {
      let _this = this;
      return _this._f;
    };
  };

  $module.TotalFunctionActionProof = class TotalFunctionActionProof {
    constructor () {
      this._tname = "Std.Actions.TotalFunctionActionProof";
    }
    _parentTraits() {
      return [Std_Actions.TotalActionProof, Std_Frames.Validatable];
    }
  };

  $module.ComposedAction = class ComposedAction {
    constructor () {
      this._tname = "Std.Actions.ComposedAction";
      this._first = undefined;
      this._second = undefined;
    }
    _parentTraits() {
      return [Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    // DUPLICATE CONSTRUCTOR: constructor(first, second) {
    // let _this = this;
    // (_this)._first = first;
    // (_this)._second = second;
    // return;
    // }
    Invoke(i) {
      let _this = this;
      let o = undefined;
      let _0_m;
      let _out0;
      _out0 = ((_this).first).Invoke(i);
      _0_m = _out0;
      let _out1;
      _out1 = ((_this).second).Invoke(_0_m);
      o = _out1;
      return o;
    }
    get first() {
      let _this = this;
      return _this._first;
    };
    get second() {
      let _this = this;
      return _this._second;
    };
  };

  $module.ActionCompositionProof = class ActionCompositionProof {
  };
  return $module;
})(); // end of module Std_Actions
let Std_Consumers = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Consumers._default";
    }
    _parentTraits() {
      return [];
    }
    static IsTrue(b) {
      return (b) === (true);
    };
    static IsFalse(b) {
      return (b) === (false);
    };
    static WasConsumed(pair) {
      return (pair)[1];
    };
    static WasNotConsumed(pair) {
      return !((pair)[1]);
    };
  };

  $module.IConsumer = class IConsumer {
    static Accept(_this, t) {
      let _0_r;
      let _out0;
      _out0 = (_this).Invoke(t);
      _0_r = _out0;
      return;
    }
  };

  $module.ConsumerState = class ConsumerState {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_ConsumerState(consumer, capacity, history) {
      let $dt = new ConsumerState(0);
      $dt.consumer = consumer;
      $dt.capacity = capacity;
      $dt.history = history;
      return $dt;
    }
    get is_ConsumerState() { return this.$tag === 0; }
    get dtor_consumer() { return this.consumer; }
    get dtor_capacity() { return this.capacity; }
    get dtor_history() { return this.history; }
    toString() {
      if (this.$tag === 0) {
        return "Consumers.ConsumerState.ConsumerState" + "(" + _dafny.toString(this.consumer) + ", " + _dafny.toString(this.capacity) + ", " + _dafny.toString(this.history) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && this.consumer === other.consumer && _dafny.areEqual(this.capacity, other.capacity) && _dafny.areEqual(this.history, other.history);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Consumers.ConsumerState.create_ConsumerState(null, Std_Wrappers.Option.Default(), _dafny.Seq.of());
    }
    static Rtd() {
      return class {
        static get Default() {
          return ConsumerState.Default();
        }
      };
    }
  }

  $module.Consumer = class Consumer {
    static Accept(_this, t) {
      let o = false;
      let _out0;
      _out0 = (_this).Invoke(t);
      o = _out0;
      return o;
    }
  };

  $module.IgnoreNConsumer = class IgnoreNConsumer {
    constructor () {
      this._tname = "Std.Consumers.IgnoreNConsumer";
      this.consumedCount = _dafny.ZERO;
      this._n = _dafny.ZERO;
    }
    _parentTraits() {
      return [Std_Consumers.Consumer, Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Accept(t) {
      let _this = this;
      let _out1;
      _out1 = Std_Consumers.Consumer.Accept(_this, t);
      return _out1;
    }
    // DUPLICATE CONSTRUCTOR: constructor(n) {
    // let _this = this;
    // (_this)._n = n;
    // (_this).consumedCount = _dafny.ZERO;
    // return;
    // }
    Capacity() {
      let _this = this;
      return Std_Wrappers.Option.create_Some(((_this).n).minus(_this.consumedCount));
    };
    Invoke(t) {
      let _this = this;
      let r = false;
      if ((_this.consumedCount).isEqualTo((_this).n)) {
        r = false;
      } else {
        r = true;
        (_this).consumedCount = (_this.consumedCount).plus(_dafny.ONE);
      }
      return r;
    }
    get n() {
      let _this = this;
      return _this._n;
    };
  };

  $module.ArrayWriter = class ArrayWriter {
    constructor () {
      this._tname = "Std.Consumers.ArrayWriter";
      this.size = _dafny.ZERO;
      this._storage = [];
    }
    _parentTraits() {
      return [Std_Consumers.Consumer, Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Accept(t) {
      let _this = this;
      let _out2;
      _out2 = Std_Consumers.Consumer.Accept(_this, t);
      return _out2;
    }
    // DUPLICATE CONSTRUCTOR: constructor(storage) {
    // let _this = this;
    // (_this)._storage = storage;
    // (_this).size = _dafny.ZERO;
    // return;
    // }
    Capacity() {
      let _this = this;
      return Std_Wrappers.Option.create_Some((new BigNumber(((_this).storage).length)).minus(_this.size));
    };
    Invoke(t) {
      let _this = this;
      let r = false;
      if ((_this.size).isEqualTo(new BigNumber(((_this).storage).length))) {
        r = false;
      } else {
        let _index0 = _this.size;
        ((_this).storage)[_index0] = t;
        (_this).size = (_this.size).plus(_dafny.ONE);
        r = true;
      }
      return r;
    }
    get storage() {
      let _this = this;
      return _this._storage;
    };
  };

  $module.DynamicArrayWriter = class DynamicArrayWriter {
    constructor () {
      this._tname = "Std.Consumers.DynamicArrayWriter";
      this.storage = undefined;
    }
    _parentTraits() {
      return [Std_Consumers.IConsumer, Std_Actions.TotalActionProof, Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Accept(t) {
      let _this = this;
      Std_Consumers.IConsumer.Accept(_this, t);
      return ;
    }
    // DUPLICATE CONSTRUCTOR: constructor() {
    // let _this = this;
    // let _0_a;
    // let _nw0 = new Std_DynamicArray.DynamicArray();
    // _nw0.constructor();
    // _0_a = _nw0;
    // (_this).storage = _0_a;
    // return;
    // }
    Invoke(t) {
      let _this = this;
      let r = _dafny.Tuple.Default();
      (_this.storage).Push(t);
      r = _dafny.Tuple.of();
      return r;
    }
  };

  $module.FoldingConsumer = class FoldingConsumer {
    constructor () {
      this._tname = "Std.Consumers.FoldingConsumer";
      this.value = undefined;
      this._f = undefined;
    }
    _parentTraits() {
      return [Std_Consumers.IConsumer, Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Accept(t) {
      let _this = this;
      Std_Consumers.IConsumer.Accept(_this, t);
      return ;
    }
    // DUPLICATE CONSTRUCTOR: constructor(init, f) {
    // let _this = this;
    // (_this)._f = f;
    // (_this).value = init;
    // return;
    // }
    Invoke(t) {
      let _this = this;
      let r = _dafny.Tuple.Default();
      (_this).value = ((_this).f)(_this.value, t);
      r = _dafny.Tuple.of();
      return r;
    }
    get f() {
      let _this = this;
      return _this._f;
    };
  };

  $module.FoldingConsumerTotalActionProof = class FoldingConsumerTotalActionProof {
    constructor () {
      this._tname = "Std.Consumers.FoldingConsumerTotalActionProof";
    }
    _parentTraits() {
      return [Std_Actions.TotalActionProof, Std_Frames.Validatable];
    }
    // DUPLICATE CONSTRUCTOR: constructor(action) {
    // let _this = this;
    // return;
    // }
  };

  $module.SeqWriter = class SeqWriter {
    constructor () {
      this._tname = "Std.Consumers.SeqWriter";
      this.values = _dafny.Seq.of();
    }
    _parentTraits() {
      return [Std_Consumers.IConsumer, Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Accept(t) {
      let _this = this;
      Std_Consumers.IConsumer.Accept(_this, t);
      return ;
    }
    // DUPLICATE CONSTRUCTOR: constructor() {
    // let _this = this;
    // (_this).values = _dafny.Seq.of();
    // return;
    // }
    Invoke(t) {
      let _this = this;
      let r = _dafny.Tuple.Default();
      (_this).values = _dafny.Seq.Concat(_this.values, _dafny.Seq.of(t));
      r = _dafny.Tuple.of();
      return r;
    }
  };

  $module.SeqWriterTotalActionProof = class SeqWriterTotalActionProof {
    constructor () {
      this._tname = "Std.Consumers.SeqWriterTotalActionProof";
    }
    _parentTraits() {
      return [Std_Actions.TotalActionProof, Std_Frames.Validatable];
    }
  };
  return $module;
})(); // end of module Std_Consumers
let Std_Producers = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Producers._default";
    }
    _parentTraits() {
      return [];
    }
    static DefaultForEach(producer, consumer) {
      L0: {
        while (true) {
          C0: {
            let _0_t;
            let _out0;
            _out0 = (producer).Next();
            _0_t = _out0;
            if (_dafny.areEqual(_0_t, Std_Wrappers.Option.create_None())) {
              break L0;
            }
            (consumer).Accept((_0_t).dtor_value);
          }
        }
      }
      return;
    }
    static DefaultFill(producer, consumer) {
      L1: {
        let _lo0 = _dafny.ZERO;
        for (let _0_c = ((consumer).Capacity()).dtor_value; _lo0.isLessThan(_0_c); ) {
          _0_c = _0_c.minus(_dafny.ONE);
          C1: {
            let _1_t;
            let _out0;
            _out0 = (producer).Next();
            _1_t = _out0;
            if (_dafny.areEqual(_1_t, Std_Wrappers.Option.create_None())) {
              break L1;
            }
            let _2_accepted;
            let _out1;
            _out1 = (consumer).Accept((_1_t).dtor_value);
            _2_accepted = _out1;
          }
        }
      }
      return;
    }
    static IsNone(o) {
      return (o).is_None;
    };
    static IsSome(o) {
      return (o).is_Some;
    };
    static ProducedOf(outputs) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if (((new BigNumber((outputs).length)).isEqualTo(_dafny.ZERO)) || (((outputs)[_dafny.ZERO]).is_None)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of(((outputs)[_dafny.ZERO]).dtor_value));
          let _in0 = (outputs).slice(_dafny.ONE);
          outputs = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static CollectToSeq(p) {
      let s = _dafny.Seq.of();
      let _0_seqWriter;
      let _nw0 = new Std_Consumers.SeqWriter();
      _nw0.constructor();
      _0_seqWriter = _nw0;
      (p).ForEach(_0_seqWriter);
      s = _0_seqWriter.values;
      return s;
      return s;
    }
  };

  $module.IProducer = class IProducer {
    static Next(_this) {
      let r = undefined;
      let _out0;
      _out0 = (_this).Invoke(_dafny.Tuple.of());
      r = _out0;
      return r;
    }
  };

  $module.ProducesSetProof = class ProducesSetProof {
  };

  $module.FunctionalIProducer = class FunctionalIProducer {
    constructor () {
      this._tname = "Std.Producers.FunctionalIProducer";
      this.state = undefined;
      this._stepFn = undefined;
    }
    _parentTraits() {
      return [Std_Producers.IProducer, Std_Actions.TotalActionProof, Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out1;
      _out1 = Std_Producers.IProducer.Next(_this);
      return _out1;
    }
    // DUPLICATE CONSTRUCTOR: constructor(state, stepFn) {
    // let _this = this;
    // (_this).state = state;
    // (_this)._stepFn = stepFn;
    // return;
    // }
    Invoke(i) {
      let _this = this;
      let o = undefined;
      let _let_tmp_rhs0 = ((_this).stepFn)(_this.state);
      let _0_newState = (_let_tmp_rhs0)[0];
      let _1_result_k = (_let_tmp_rhs0)[1];
      (_this).state = _0_newState;
      o = _1_result_k;
      return o;
    }
    get stepFn() {
      let _this = this;
      return _this._stepFn;
    };
  };

  $module.ProducerState = class ProducerState {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_ProducerState(producer, remaining, outputs) {
      let $dt = new ProducerState(0);
      $dt.producer = producer;
      $dt.remaining = remaining;
      $dt.outputs = outputs;
      return $dt;
    }
    get is_ProducerState() { return this.$tag === 0; }
    get dtor_producer() { return this.producer; }
    get dtor_remaining() { return this.remaining; }
    get dtor_outputs() { return this.outputs; }
    toString() {
      if (this.$tag === 0) {
        return "Producers.ProducerState.ProducerState" + "(" + _dafny.toString(this.producer) + ", " + _dafny.toString(this.remaining) + ", " + _dafny.toString(this.outputs) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && this.producer === other.producer && _dafny.areEqual(this.remaining, other.remaining) && _dafny.areEqual(this.outputs, other.outputs);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Producers.ProducerState.create_ProducerState(null, Std_Wrappers.Option.Default(), _dafny.Seq.of());
    }
    static Rtd() {
      return class {
        static get Default() {
          return ProducerState.Default();
        }
      };
    }
  }

  $module.Producer = class Producer {
    static Next(_this) {
      let r = Std_Wrappers.Option.Default();
      let _out0;
      _out0 = (_this).Invoke(_dafny.Tuple.of());
      r = _out0;
      return r;
    }
  };

  $module.EmptyProducer = class EmptyProducer {
    constructor () {
      this._tname = "Std.Producers.EmptyProducer";
    }
    _parentTraits() {
      return [Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out1;
      _out1 = Std_Producers.Producer.Next(_this);
      return _out1;
    }
    // DUPLICATE CONSTRUCTOR: constructor() {
    // let _this = this;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return _dafny.ZERO;
    };
    Remaining() {
      let _this = this;
      return Std_Wrappers.Option.create_Some(_dafny.ZERO);
    };
    Invoke(t) {
      let _this = this;
      let value = Std_Wrappers.Option.Default();
      value = Std_Wrappers.Option.create_None();
      return value;
    }
    ForEach(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
  };

  $module.RepeatProducer = class RepeatProducer {
    constructor () {
      this._tname = "Std.Producers.RepeatProducer";
      this.producedCount = _dafny.ZERO;
      this._n = _dafny.ZERO;
      this._t = undefined;
    }
    _parentTraits() {
      return [Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out2;
      _out2 = Std_Producers.Producer.Next(_this);
      return _out2;
    }
    // DUPLICATE CONSTRUCTOR: constructor(n, t) {
    // let _this = this;
    // (_this)._n = n;
    // (_this)._t = t;
    // (_this).producedCount = _dafny.ZERO;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return _this.producedCount;
    };
    Remaining() {
      let _this = this;
      return Std_Wrappers.Option.create_Some(((_this).n).minus(_this.producedCount));
    };
    Invoke(i) {
      let _this = this;
      let value = Std_Wrappers.Option.Default();
      if ((_this.producedCount).isEqualTo((_this).n)) {
        value = Std_Wrappers.Option.create_None();
      } else {
        value = Std_Wrappers.Option.create_Some((_this).t);
        (_this).producedCount = (_this.producedCount).plus(_dafny.ONE);
      }
      return value;
    }
    ForEach(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
    get n() {
      let _this = this;
      return _this._n;
    };
    get t() {
      let _this = this;
      return _this._t;
    };
  };

  $module.SeqReader = class SeqReader {
    constructor () {
      this._tname = "Std.Producers.SeqReader";
      this.index = _dafny.ZERO;
      this._elements = _dafny.Seq.of();
    }
    _parentTraits() {
      return [Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out3;
      _out3 = Std_Producers.Producer.Next(_this);
      return _out3;
    }
    // DUPLICATE CONSTRUCTOR: constructor(elements) {
    // let _this = this;
    // (_this)._elements = elements;
    // (_this).index = _dafny.ZERO;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return _this.index;
    };
    Remaining() {
      let _this = this;
      return Std_Wrappers.Option.create_Some((new BigNumber(((_this).elements).length)).minus(_this.index));
    };
    Invoke(t) {
      let _this = this;
      let value = Std_Wrappers.Option.Default();
      if ((new BigNumber(((_this).elements).length)).isEqualTo(_this.index)) {
        value = Std_Wrappers.Option.create_None();
      } else {
        value = Std_Wrappers.Option.create_Some(((_this).elements)[_this.index]);
        (_this).index = (_this.index).plus(_dafny.ONE);
      }
      return value;
    }
    ForEach(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
    get elements() {
      let _this = this;
      return _this._elements;
    };
  };

  $module.ProducerOfSetProof = class ProducerOfSetProof {
  };

  $module.LimitedProducer = class LimitedProducer {
    constructor () {
      this._tname = "Std.Producers.LimitedProducer";
      this.produced = _dafny.ZERO;
      this._original = undefined;
      this._max = _dafny.ZERO;
    }
    _parentTraits() {
      return [Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out4;
      _out4 = Std_Producers.Producer.Next(_this);
      return _out4;
    }
    // DUPLICATE CONSTRUCTOR: constructor(original, max) {
    // let _this = this;
    // (_this)._original = original;
    // (_this)._max = max;
    // (_this).produced = _dafny.ZERO;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return _this.produced;
    };
    Remaining() {
      let _this = this;
      return Std_Wrappers.Option.create_Some(((_this).max).minus(_this.produced));
    };
    Invoke(t) {
      let _this = this;
      let value = Std_Wrappers.Option.Default();
      if ((_this.produced).isEqualTo((_this).max)) {
        value = Std_Wrappers.Option.create_None();
      } else {
        let _0_v;
        let _out0;
        _out0 = ((_this).original).Invoke(_dafny.Tuple.of());
        _0_v = _out0;
        value = Std_Wrappers.Option.create_Some(_0_v);
        (_this).produced = (_this.produced).plus(_dafny.ONE);
      }
      return value;
    }
    ForEach(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
    get original() {
      let _this = this;
      return _this._original;
    };
    get max() {
      let _this = this;
      return _this._max;
    };
  };

  $module.FilteredProducer = class FilteredProducer {
    constructor () {
      this._tname = "Std.Producers.FilteredProducer";
      this.producedCount = _dafny.ZERO;
      this._source = undefined;
      this._filter = function () { return false; };
    }
    _parentTraits() {
      return [Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out5;
      _out5 = Std_Producers.Producer.Next(_this);
      return _out5;
    }
    // DUPLICATE CONSTRUCTOR: constructor(source, filter) {
    // let _this = this;
    // (_this)._source = source;
    // (_this)._filter = filter;
    // (_this).producedCount = _dafny.ZERO;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return _this.producedCount;
    };
    Remaining() {
      let _this = this;
      return Std_Wrappers.Option.create_None();
    };
    Invoke(t) {
      let _this = this;
      let result = Std_Wrappers.Option.Default();
      result = Std_Wrappers.Option.create_None();
      let _0_notFirstLoop;
      _0_notFirstLoop = false;
      L2: {
        while (true) {
          C2: {
            _0_notFirstLoop = true;
            let _out0;
            _out0 = ((_this).source).Next();
            result = _out0;
            if (((result).is_None) || (((_this).filter)((result).dtor_value))) {
              break L2;
            }
          }
        }
      }
      if ((result).is_Some) {
        (_this).producedCount = (_this.producedCount).plus(_dafny.ONE);
      } else {
      }
      return result;
    }
    ForEach(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
    get source() {
      let _this = this;
      return _this._source;
    };
    get filter() {
      let _this = this;
      return _this._filter;
    };
  };

  $module.ConcatenatedProducer = class ConcatenatedProducer {
    constructor () {
      this._tname = "Std.Producers.ConcatenatedProducer";
      this._first = undefined;
      this._second = undefined;
    }
    _parentTraits() {
      return [Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out6;
      _out6 = Std_Producers.Producer.Next(_this);
      return _out6;
    }
    // DUPLICATE CONSTRUCTOR: constructor(first, second) {
    // let _this = this;
    // (_this)._first = first;
    // (_this)._second = second;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return (((_this).first).ProducedCount()).plus(((_this).second).ProducedCount());
    };
    Remaining() {
      let _this = this;
      let _0_left = ((_this).first).Remaining();
      let _1_right = ((_this).second).Remaining();
      if (((_0_left).is_Some) && ((_1_right).is_Some)) {
        return Std_Wrappers.Option.create_Some(((_0_left).dtor_value).plus((_1_right).dtor_value));
      } else {
        return Std_Wrappers.Option.create_None();
      }
    };
    Invoke(t) {
      let _this = this;
      let result = Std_Wrappers.Option.Default();
      let _out0;
      _out0 = ((_this).first).Next();
      result = _out0;
      if ((result).is_Some) {
      } else {
        let _out1;
        _out1 = ((_this).second).Next();
        result = _out1;
      }
      return result;
    }
    ForEach(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
    get first() {
      let _this = this;
      return _this._first;
    };
    get second() {
      let _this = this;
      return _this._second;
    };
  };

  $module.MappedProducer = class MappedProducer {
    constructor () {
      this._tname = "Std.Producers.MappedProducer";
      this._original = undefined;
      this._mapping = undefined;
    }
    _parentTraits() {
      return [Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out7;
      _out7 = Std_Producers.Producer.Next(_this);
      return _out7;
    }
    // DUPLICATE CONSTRUCTOR: constructor(original, mapping) {
    // let _this = this;
    // (_this)._original = original;
    // (_this)._mapping = mapping;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return ((_this).original).ProducedCount();
    };
    Remaining() {
      let _this = this;
      return Std_Wrappers.Option.create_None();
    };
    Invoke(t) {
      let _this = this;
      let result = Std_Wrappers.Option.Default();
      let _0_next;
      let _out0;
      _out0 = ((_this).original).Next();
      _0_next = _out0;
      if ((_0_next).is_Some) {
        let _1_nextValue;
        let _out1;
        _out1 = ((_this).mapping).Invoke((_0_next).dtor_value);
        _1_nextValue = _out1;
        result = Std_Wrappers.Option.create_Some(_1_nextValue);
      } else {
        result = Std_Wrappers.Option.create_None();
      }
      return result;
    }
    ForEach(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
    get original() {
      let _this = this;
      return _this._original;
    };
    get mapping() {
      let _this = this;
      return _this._mapping;
    };
  };

  $module.ProducerOfNewProducers = class ProducerOfNewProducers {
  };

  $module.OutputterOfNewProducers = class OutputterOfNewProducers {
  };

  $module.MappedProducerOfNewProducers = class MappedProducerOfNewProducers {
    constructor () {
      this._tname = "Std.Producers.MappedProducerOfNewProducers";
      this._original = undefined;
      this._mapping = undefined;
    }
    _parentTraits() {
      return [Std_Producers.ProducerOfNewProducers, Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out8;
      _out8 = Std_Producers.Producer.Next(_this);
      return _out8;
    }
    // DUPLICATE CONSTRUCTOR: constructor(original, mapping) {
    // let _this = this;
    // (_this)._original = original;
    // (_this)._mapping = mapping;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return ((_this).original).ProducedCount();
    };
    Remaining() {
      let _this = this;
      return Std_Wrappers.Option.create_None();
    };
    Invoke(t) {
      let _this = this;
      let result = Std_Wrappers.Option.Default();
      let _0_next;
      let _out0;
      _out0 = ((_this).original).Next();
      _0_next = _out0;
      if ((_0_next).is_Some) {
        let _1_nextValue;
        let _out1;
        _out1 = ((_this).mapping).Invoke((_0_next).dtor_value);
        _1_nextValue = _out1;
        result = Std_Wrappers.Option.create_Some(_1_nextValue);
      } else {
        result = Std_Wrappers.Option.create_None();
      }
      return result;
    }
    ForEach(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
    get original() {
      let _this = this;
      return _this._original;
    };
    get mapping() {
      let _this = this;
      return _this._mapping;
    };
  };

  $module.FlattenedProducer = class FlattenedProducer {
    constructor () {
      this._tname = "Std.Producers.FlattenedProducer";
      this.currentInner = Std_Wrappers.Option.Default();
      this.producedCount = _dafny.ZERO;
      this._original = undefined;
    }
    _parentTraits() {
      return [Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out9;
      _out9 = Std_Producers.Producer.Next(_this);
      return _out9;
    }
    // DUPLICATE CONSTRUCTOR: constructor(original) {
    // let _this = this;
    // (_this)._original = original;
    // (_this).currentInner = Std_Wrappers.Option.create_None();
    // (_this).producedCount = _dafny.ZERO;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return _this.producedCount;
    };
    Remaining() {
      let _this = this;
      return Std_Wrappers.Option.create_None();
    };
    Invoke(t) {
      let _this = this;
      let result = Std_Wrappers.Option.Default();
      result = Std_Wrappers.Option.create_None();
      L3: {
        while ((result).is_None) {
          C3: {
            if ((_this.currentInner).is_None) {
              let _out0;
              _out0 = ((_this).original).Invoke(_dafny.Tuple.of());
              (_this).currentInner = _out0;
              if ((_this.currentInner).is_Some) {
              } else {
                break L3;
              }
            } else {
              let _out1;
              _out1 = ((_this.currentInner).dtor_value).Next();
              result = _out1;
              if ((result).is_None) {
                let _0_oldCurrentInner;
                _0_oldCurrentInner = _this.currentInner;
                (_this).currentInner = Std_Wrappers.Option.create_None();
              } else {
              }
            }
          }
        }
      }
      if ((result).is_Some) {
        (_this).producedCount = (_this.producedCount).plus(_dafny.ONE);
      } else {
      }
      return result;
    }
    ForEach(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
    get original() {
      let _this = this;
      return _this._original;
    };
  };
  return $module;
})(); // end of module Std_Producers
let Std_ActionsExterns = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JavaCsActionsExterns._default";
    }
    _parentTraits() {
      return [];
    }
    static MakeSetReader(s) {
      let p = undefined;
      if (!(false)) {
        throw new _dafny.HaltException("DafnyStandardLibraries-js.dfy(12,4): " + (_dafny.Seq.UnicodeFromString("MakeSetReader is not implemented for this backend")).toVerbatimString(false));
      }
      return p;
    }
  };
  return $module;
})(); // end of module Std_ActionsExterns
(function() {
  let $module = Std_Concurrent;


  $module.MutableMap = class MutableMap {
    constructor () {
      this._tname = "Std.ConcurrentDafny.MutableMap";
      this.internal = _dafny.Map.Empty;
    }
    _parentTraits() {
      return [];
    }
    // DUPLICATE CONSTRUCTOR: constructor(inv) {
    // let _this = this;
    // (_this).internal = _dafny.Map.Empty.slice();
    // return;
    // }
    Keys() {
      let _this = this;
      let keys = _dafny.Set.Empty;
      keys = (_this.internal).Keys;
      return keys;
    }
    HasKey(k) {
      let _this = this;
      let used = false;
      used = ((_this.internal).Keys).contains(k);
      return used;
    }
    Values() {
      let _this = this;
      let values = _dafny.Set.Empty;
      values = (_this.internal).Values;
      return values;
    }
    Items() {
      let _this = this;
      let items = _dafny.Set.Empty;
      items = (_this.internal).Items;
      return items;
    }
    Get(k) {
      let _this = this;
      let r = Std_Wrappers.Option.Default();
      if (((_this.internal).Keys).contains(k)) {
        r = Std_Wrappers.Option.create_Some((_this.internal).get(k));
      } else {
        r = Std_Wrappers.Option.create_None();
      }
      return r;
    }
    Put(k, v) {
      let _this = this;
      (_this).internal = (_this.internal).update(k, v);
      return;
    }
    Remove(k) {
      let _this = this;
      (_this).internal = (_this.internal).Subtract(_dafny.Set.fromElements(k));
      return;
    }
    Size() {
      let _this = this;
      let c = _dafny.ZERO;
      c = new BigNumber((_this.internal).length);
      return c;
    }
  };

  $module.AtomicBox = class AtomicBox {
    constructor () {
      this._tname = "Std.ConcurrentDafny.AtomicBox";
      this.boxed = undefined;
    }
    _parentTraits() {
      return [];
    }
    // DUPLICATE CONSTRUCTOR: constructor(inv, t) {
    // let _this = this;
    // (_this).boxed = t;
    // return;
    // }
    Get() {
      let _this = this;
      let t = undefined;
      t = _this.boxed;
      return t;
    }
    Put(t) {
      let _this = this;
      (_this).boxed = t;
      return;
    }
  };

  $module.Lock = class Lock {
    constructor () {
      this._tname = "Std.ConcurrentDafny.Lock";
    }
    _parentTraits() {
      return [];
    }
    // DUPLICATE CONSTRUCTOR: constructor() {
    // let _this = this;
    // return;
    // }
    __Lock() {
      let _this = this;
      return;
    }
    Unlock() {
      let _this = this;
      return;
    }
  };
  return $module;
})(); // end of module Std_Concurrent
(function() {
  let $module = Std_FileIOInternalExterns;

  return $module;
})(); // end of module Std_FileIOInternalExterns
let Std_Unicode_Base = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Unicode.Base._default";
    }
    _parentTraits() {
      return [];
    }
    static IsInAssignedPlane(i) {
      let _0_plane = (_dafny.ShiftRight(i, (new BigNumber(16)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      return (Std_Unicode_Base.__default.ASSIGNED__PLANES).contains(_0_plane);
    };
    static get HIGH__SURROGATE__MIN() {
      return new BigNumber(55296);
    };
    static get HIGH__SURROGATE__MAX() {
      return new BigNumber(56319);
    };
    static get LOW__SURROGATE__MIN() {
      return new BigNumber(56320);
    };
    static get LOW__SURROGATE__MAX() {
      return new BigNumber(57343);
    };
    static get ASSIGNED__PLANES() {
      return _dafny.Set.fromElements(_dafny.ZERO, _dafny.ONE, new BigNumber(2), new BigNumber(3), new BigNumber(14), new BigNumber(15), new BigNumber(16));
    };
  };

  $module.CodePoint = class CodePoint {
    constructor () {
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _0_i = (__source);
      return ((_dafny.ZERO).isLessThanOrEqualTo(_0_i)) && ((_0_i).isLessThanOrEqualTo(new BigNumber(1114111)));
    }
  };

  $module.HighSurrogateCodePoint = class HighSurrogateCodePoint {
    constructor () {
    }
    static get Witness() {
      return Std_Unicode_Base.__default.HIGH__SURROGATE__MIN;
    }
    static get Default() {
      return Std_Unicode_Base.HighSurrogateCodePoint.Witness;
    }
    static _Is(__source) {
      let _1_p = (__source);
      if (Std_Unicode_Base.CodePoint._Is(_1_p)) {
        return ((Std_Unicode_Base.__default.HIGH__SURROGATE__MIN).isLessThanOrEqualTo(_1_p)) && ((_1_p).isLessThanOrEqualTo(Std_Unicode_Base.__default.HIGH__SURROGATE__MAX));
      }
      return false;
    }
  };

  $module.LowSurrogateCodePoint = class LowSurrogateCodePoint {
    constructor () {
    }
    static get Witness() {
      return Std_Unicode_Base.__default.LOW__SURROGATE__MIN;
    }
    static get Default() {
      return Std_Unicode_Base.LowSurrogateCodePoint.Witness;
    }
    static _Is(__source) {
      let _2_p = (__source);
      if (Std_Unicode_Base.CodePoint._Is(_2_p)) {
        return ((Std_Unicode_Base.__default.LOW__SURROGATE__MIN).isLessThanOrEqualTo(_2_p)) && ((_2_p).isLessThanOrEqualTo(Std_Unicode_Base.__default.LOW__SURROGATE__MAX));
      }
      return false;
    }
  };

  $module.ScalarValue = class ScalarValue {
    constructor () {
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _3_p = (__source);
      if (Std_Unicode_Base.CodePoint._Is(_3_p)) {
        return (((_3_p).isLessThan(Std_Unicode_Base.__default.HIGH__SURROGATE__MIN)) || ((Std_Unicode_Base.__default.HIGH__SURROGATE__MAX).isLessThan(_3_p))) && (((_3_p).isLessThan(Std_Unicode_Base.__default.LOW__SURROGATE__MIN)) || ((Std_Unicode_Base.__default.LOW__SURROGATE__MAX).isLessThan(_3_p)));
      }
      return false;
    }
  };

  $module.AssignedCodePoint = class AssignedCodePoint {
    constructor () {
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _4_p = (__source);
      if (Std_Unicode_Base.CodePoint._Is(_4_p)) {
        return Std_Unicode_Base.__default.IsInAssignedPlane(_4_p);
      }
      return false;
    }
  };
  return $module;
})(); // end of module Std_Unicode_Base
let Std_Arithmetic_GeneralInternals = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Arithmetic_GeneralInternals
let Std_Arithmetic_MulInternalsNonlinear = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Arithmetic_MulInternalsNonlinear
let Std_Arithmetic_MulInternals = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Arithmetic.MulInternals._default";
    }
    _parentTraits() {
      return [];
    }
    static MulPos(x, y) {
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((x).isEqualTo(_dafny.ZERO)) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = (_0___accumulator).plus(y);
          let _in0 = (x).minus(_dafny.ONE);
          let _in1 = y;
          x = _in0;
          y = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static MulRecursive(x, y) {
      if ((_dafny.ZERO).isLessThanOrEqualTo(x)) {
        return Std_Arithmetic_MulInternals.__default.MulPos(x, y);
      } else {
        return (new BigNumber(-1)).multipliedBy(Std_Arithmetic_MulInternals.__default.MulPos((new BigNumber(-1)).multipliedBy(x), y));
      }
    };
  };
  return $module;
})(); // end of module Std_Arithmetic_MulInternals
let Std_Arithmetic_Mul = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Arithmetic_Mul
let Std_Arithmetic_ModInternalsNonlinear = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Arithmetic_ModInternalsNonlinear
let Std_Arithmetic_DivInternalsNonlinear = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Arithmetic_DivInternalsNonlinear
let Std_Arithmetic_ModInternals = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Arithmetic.ModInternals._default";
    }
    _parentTraits() {
      return [];
    }
    static ModRecursive(x, d) {
      TAIL_CALL_START: while (true) {
        if ((x).isLessThan(_dafny.ZERO)) {
          let _in0 = (d).plus(x);
          let _in1 = d;
          x = _in0;
          d = _in1;
          continue TAIL_CALL_START;
        } else if ((x).isLessThan(d)) {
          return x;
        } else {
          let _in2 = (x).minus(d);
          let _in3 = d;
          x = _in2;
          d = _in3;
          continue TAIL_CALL_START;
        }
      }
    };
  };
  return $module;
})(); // end of module Std_Arithmetic_ModInternals
let Std_Arithmetic_DivInternals = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Arithmetic.DivInternals._default";
    }
    _parentTraits() {
      return [];
    }
    static DivPos(x, d) {
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((x).isLessThan(_dafny.ZERO)) {
          _0___accumulator = (_0___accumulator).plus(new BigNumber(-1));
          let _in0 = (x).plus(d);
          let _in1 = d;
          x = _in0;
          d = _in1;
          continue TAIL_CALL_START;
        } else if ((x).isLessThan(d)) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = (_0___accumulator).plus(_dafny.ONE);
          let _in2 = (x).minus(d);
          let _in3 = d;
          x = _in2;
          d = _in3;
          continue TAIL_CALL_START;
        }
      }
    };
    static DivRecursive(x, d) {
      if ((_dafny.ZERO).isLessThan(d)) {
        return Std_Arithmetic_DivInternals.__default.DivPos(x, d);
      } else {
        return (new BigNumber(-1)).multipliedBy(Std_Arithmetic_DivInternals.__default.DivPos(x, (new BigNumber(-1)).multipliedBy(d)));
      }
    };
  };
  return $module;
})(); // end of module Std_Arithmetic_DivInternals
let Std_Arithmetic_DivMod = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Arithmetic.DivMod._default";
    }
    _parentTraits() {
      return [];
    }
    static MultiplesVanish(a, b, m) {
      return ((((m).multipliedBy(a)).plus(b)).mod(m)).isEqualTo((b).mod(m));
    };
  };
  return $module;
})(); // end of module Std_Arithmetic_DivMod
let Std_Arithmetic_Power = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Arithmetic.Power._default";
    }
    _parentTraits() {
      return [];
    }
    static Pow(b, e) {
      let _0___accumulator = _dafny.ONE;
      TAIL_CALL_START: while (true) {
        if ((e).isEqualTo(_dafny.ZERO)) {
          return (_dafny.ONE).multipliedBy(_0___accumulator);
        } else {
          _0___accumulator = (_0___accumulator).multipliedBy(b);
          let _in0 = b;
          let _in1 = (e).minus(_dafny.ONE);
          b = _in0;
          e = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
  };
  return $module;
})(); // end of module Std_Arithmetic_Power
let Std_Arithmetic_Logarithm = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Arithmetic.Logarithm._default";
    }
    _parentTraits() {
      return [];
    }
    static Log(base, pow) {
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((pow).isLessThan(base)) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = (_0___accumulator).plus(_dafny.ONE);
          let _in0 = base;
          let _in1 = _dafny.EuclideanDivision(pow, base);
          base = _in0;
          pow = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
  };
  return $module;
})(); // end of module Std_Arithmetic_Logarithm
let Std_Arithmetic_Power2 = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Arithmetic.Power2._default";
    }
    _parentTraits() {
      return [];
    }
    static Pow2(e) {
      return Std_Arithmetic_Power.__default.Pow(new BigNumber(2), e);
    };
  };
  return $module;
})(); // end of module Std_Arithmetic_Power2
let Std_Strings_HexConversion = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Strings.HexConversion._default";
    }
    _parentTraits() {
      return [];
    }
    static BASE() {
      return Std_Strings_HexConversion.__default.base;
    };
    static IsDigitChar(c) {
      return (Std_Strings_HexConversion.__default.charToDigit).contains(c);
    };
    static OfDigits(digits) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if (_dafny.areEqual(digits, _dafny.Seq.of())) {
          return _dafny.Seq.Concat(_dafny.Seq.of(), _0___accumulator);
        } else {
          _0___accumulator = _dafny.Seq.Concat(_dafny.Seq.of((Std_Strings_HexConversion.__default.chars)[(digits)[_dafny.ZERO]]), _0___accumulator);
          let _in0 = (digits).slice(_dafny.ONE);
          digits = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static OfNat(n) {
      if ((n).isEqualTo(_dafny.ZERO)) {
        return _dafny.Seq.of((Std_Strings_HexConversion.__default.chars)[_dafny.ZERO]);
      } else {
        return Std_Strings_HexConversion.__default.OfDigits(Std_Strings_HexConversion.__default.FromNat(n));
      }
    };
    static IsNumberStr(str, minus) {
      return !(!_dafny.areEqual(str, _dafny.Seq.of())) || (((_dafny.areEqual((str)[_dafny.ZERO], minus)) || ((Std_Strings_HexConversion.__default.charToDigit).contains((str)[_dafny.ZERO]))) && (_dafny.Quantifier(((str).slice(_dafny.ONE)).UniqueElements, true, function (_forall_var_0) {
        let _0_c = _forall_var_0;
        return !(_dafny.Seq.contains((str).slice(_dafny.ONE), _0_c)) || (Std_Strings_HexConversion.__default.IsDigitChar(_0_c));
      })));
    };
    static OfInt(n, minus) {
      if ((_dafny.ZERO).isLessThanOrEqualTo(n)) {
        return Std_Strings_HexConversion.__default.OfNat(n);
      } else {
        return _dafny.Seq.Concat(_dafny.Seq.of(minus), Std_Strings_HexConversion.__default.OfNat((_dafny.ZERO).minus(n)));
      }
    };
    static ToNat(str) {
      if (_dafny.areEqual(str, _dafny.Seq.of())) {
        return _dafny.ZERO;
      } else {
        let _0_c = (str)[(new BigNumber((str).length)).minus(_dafny.ONE)];
        return ((Std_Strings_HexConversion.__default.ToNat((str).slice(0, (new BigNumber((str).length)).minus(_dafny.ONE)))).multipliedBy(Std_Strings_HexConversion.__default.base)).plus((Std_Strings_HexConversion.__default.charToDigit).get(_0_c));
      }
    };
    static ToInt(str, minus) {
      if (_dafny.Seq.IsPrefixOf(_dafny.Seq.of(minus), str)) {
        return (_dafny.ZERO).minus(Std_Strings_HexConversion.__default.ToNat((str).slice(_dafny.ONE)));
      } else {
        return Std_Strings_HexConversion.__default.ToNat(str);
      }
    };
    static ToNatRight(xs) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.ZERO;
      } else {
        return ((Std_Strings_HexConversion.__default.ToNatRight(Std_Collections_Seq.__default.DropFirst(xs))).multipliedBy(Std_Strings_HexConversion.__default.BASE())).plus(Std_Collections_Seq.__default.First(xs));
      }
    };
    static ToNatLeft(xs) {
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = ((Std_Collections_Seq.__default.Last(xs)).multipliedBy(Std_Arithmetic_Power.__default.Pow(Std_Strings_HexConversion.__default.BASE(), (new BigNumber((xs).length)).minus(_dafny.ONE)))).plus(_0___accumulator);
          let _in0 = Std_Collections_Seq.__default.DropLast(xs);
          xs = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static FromNat(n) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((n).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((n).mod(Std_Strings_HexConversion.__default.BASE())));
          let _in0 = _dafny.EuclideanDivision(n, Std_Strings_HexConversion.__default.BASE());
          n = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static SeqExtend(xs, n) {
      TAIL_CALL_START: while (true) {
        if ((n).isLessThanOrEqualTo(new BigNumber((xs).length))) {
          return xs;
        } else {
          let _in0 = _dafny.Seq.Concat(xs, _dafny.Seq.of(_dafny.ZERO));
          let _in1 = n;
          xs = _in0;
          n = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static SeqExtendMultiple(xs, n) {
      let _0_newLen = ((new BigNumber((xs).length)).plus(n)).minus((new BigNumber((xs).length)).mod(n));
      return Std_Strings_HexConversion.__default.SeqExtend(xs, _0_newLen);
    };
    static FromNatWithLen(n, len) {
      return Std_Strings_HexConversion.__default.SeqExtend(Std_Strings_HexConversion.__default.FromNat(n), len);
    };
    static SeqZero(len) {
      let _0_xs = Std_Strings_HexConversion.__default.FromNatWithLen(_dafny.ZERO, len);
      return _0_xs;
    };
    static SeqAdd(xs, ys) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Tuple.of(_dafny.Seq.of(), _dafny.ZERO);
      } else {
        let _let_tmp_rhs0 = Std_Strings_HexConversion.__default.SeqAdd(Std_Collections_Seq.__default.DropLast(xs), Std_Collections_Seq.__default.DropLast(ys));
        let _0_zs_k = (_let_tmp_rhs0)[0];
        let _1_cin = (_let_tmp_rhs0)[1];
        let _2_sum = ((Std_Collections_Seq.__default.Last(xs)).plus(Std_Collections_Seq.__default.Last(ys))).plus(_1_cin);
        let _let_tmp_rhs1 = (((_2_sum).isLessThan(Std_Strings_HexConversion.__default.BASE())) ? (_dafny.Tuple.of(_2_sum, _dafny.ZERO)) : (_dafny.Tuple.of((_2_sum).minus(Std_Strings_HexConversion.__default.BASE()), _dafny.ONE)));
        let _3_sum__out = (_let_tmp_rhs1)[0];
        let _4_cout = (_let_tmp_rhs1)[1];
        return _dafny.Tuple.of(_dafny.Seq.Concat(_0_zs_k, _dafny.Seq.of(_3_sum__out)), _4_cout);
      }
    };
    static SeqSub(xs, ys) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Tuple.of(_dafny.Seq.of(), _dafny.ZERO);
      } else {
        let _let_tmp_rhs0 = Std_Strings_HexConversion.__default.SeqSub(Std_Collections_Seq.__default.DropLast(xs), Std_Collections_Seq.__default.DropLast(ys));
        let _0_zs = (_let_tmp_rhs0)[0];
        let _1_cin = (_let_tmp_rhs0)[1];
        let _let_tmp_rhs1 = ((((Std_Collections_Seq.__default.Last(ys)).plus(_1_cin)).isLessThanOrEqualTo(Std_Collections_Seq.__default.Last(xs))) ? (_dafny.Tuple.of(((Std_Collections_Seq.__default.Last(xs)).minus(Std_Collections_Seq.__default.Last(ys))).minus(_1_cin), _dafny.ZERO)) : (_dafny.Tuple.of((((Std_Strings_HexConversion.__default.BASE()).plus(Std_Collections_Seq.__default.Last(xs))).minus(Std_Collections_Seq.__default.Last(ys))).minus(_1_cin), _dafny.ONE)));
        let _2_diff__out = (_let_tmp_rhs1)[0];
        let _3_cout = (_let_tmp_rhs1)[1];
        return _dafny.Tuple.of(_dafny.Seq.Concat(_0_zs, _dafny.Seq.of(_2_diff__out)), _3_cout);
      }
    };
    static get HEX__DIGITS() {
      return _dafny.Seq.UnicodeFromString("0123456789ABCDEF");
    };
    static get chars() {
      return Std_Strings_HexConversion.__default.HEX__DIGITS;
    };
    static get base() {
      return new BigNumber((Std_Strings_HexConversion.__default.chars).length);
    };
    static get charToDigit() {
      return _dafny.Map.Empty.slice().updateUnsafe(new _dafny.CodePoint('0'.codePointAt(0)),_dafny.ZERO).updateUnsafe(new _dafny.CodePoint('1'.codePointAt(0)),_dafny.ONE).updateUnsafe(new _dafny.CodePoint('2'.codePointAt(0)),new BigNumber(2)).updateUnsafe(new _dafny.CodePoint('3'.codePointAt(0)),new BigNumber(3)).updateUnsafe(new _dafny.CodePoint('4'.codePointAt(0)),new BigNumber(4)).updateUnsafe(new _dafny.CodePoint('5'.codePointAt(0)),new BigNumber(5)).updateUnsafe(new _dafny.CodePoint('6'.codePointAt(0)),new BigNumber(6)).updateUnsafe(new _dafny.CodePoint('7'.codePointAt(0)),new BigNumber(7)).updateUnsafe(new _dafny.CodePoint('8'.codePointAt(0)),new BigNumber(8)).updateUnsafe(new _dafny.CodePoint('9'.codePointAt(0)),new BigNumber(9)).updateUnsafe(new _dafny.CodePoint('a'.codePointAt(0)),new BigNumber(10)).updateUnsafe(new _dafny.CodePoint('b'.codePointAt(0)),new BigNumber(11)).updateUnsafe(new _dafny.CodePoint('c'.codePointAt(0)),new BigNumber(12)).updateUnsafe(new _dafny.CodePoint('d'.codePointAt(0)),new BigNumber(13)).updateUnsafe(new _dafny.CodePoint('e'.codePointAt(0)),new BigNumber(14)).updateUnsafe(new _dafny.CodePoint('f'.codePointAt(0)),new BigNumber(15)).updateUnsafe(new _dafny.CodePoint('A'.codePointAt(0)),new BigNumber(10)).updateUnsafe(new _dafny.CodePoint('B'.codePointAt(0)),new BigNumber(11)).updateUnsafe(new _dafny.CodePoint('C'.codePointAt(0)),new BigNumber(12)).updateUnsafe(new _dafny.CodePoint('D'.codePointAt(0)),new BigNumber(13)).updateUnsafe(new _dafny.CodePoint('E'.codePointAt(0)),new BigNumber(14)).updateUnsafe(new _dafny.CodePoint('F'.codePointAt(0)),new BigNumber(15));
    };
  };

  $module.CharSeq = class CharSeq {
    constructor () {
    }
    static get Default() {
      return _dafny.Seq.UnicodeFromString("");
    }
    static _Is(__source) {
      let _0_chars = __source;
      return (_dafny.ONE).isLessThan(new BigNumber((_0_chars).length));
    }
  };

  $module.digit = class digit {
    constructor () {
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _1_i = (__source);
      if (_System.nat._Is(_1_i)) {
        return ((_dafny.ZERO).isLessThanOrEqualTo(_1_i)) && ((_1_i).isLessThan(Std_Strings_HexConversion.__default.BASE()));
      }
      return false;
    }
  };
  return $module;
})(); // end of module Std_Strings_HexConversion
let Std_Strings_DecimalConversion = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Strings.DecimalConversion._default";
    }
    _parentTraits() {
      return [];
    }
    static BASE() {
      return Std_Strings_DecimalConversion.__default.base;
    };
    static IsDigitChar(c) {
      return (Std_Strings_DecimalConversion.__default.charToDigit).contains(c);
    };
    static OfDigits(digits) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if (_dafny.areEqual(digits, _dafny.Seq.of())) {
          return _dafny.Seq.Concat(_dafny.Seq.of(), _0___accumulator);
        } else {
          _0___accumulator = _dafny.Seq.Concat(_dafny.Seq.of((Std_Strings_DecimalConversion.__default.chars)[(digits)[_dafny.ZERO]]), _0___accumulator);
          let _in0 = (digits).slice(_dafny.ONE);
          digits = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static OfNat(n) {
      if ((n).isEqualTo(_dafny.ZERO)) {
        return _dafny.Seq.of((Std_Strings_DecimalConversion.__default.chars)[_dafny.ZERO]);
      } else {
        return Std_Strings_DecimalConversion.__default.OfDigits(Std_Strings_DecimalConversion.__default.FromNat(n));
      }
    };
    static IsNumberStr(str, minus) {
      return !(!_dafny.areEqual(str, _dafny.Seq.of())) || (((_dafny.areEqual((str)[_dafny.ZERO], minus)) || ((Std_Strings_DecimalConversion.__default.charToDigit).contains((str)[_dafny.ZERO]))) && (_dafny.Quantifier(((str).slice(_dafny.ONE)).UniqueElements, true, function (_forall_var_0) {
        let _0_c = _forall_var_0;
        return !(_dafny.Seq.contains((str).slice(_dafny.ONE), _0_c)) || (Std_Strings_DecimalConversion.__default.IsDigitChar(_0_c));
      })));
    };
    static OfInt(n, minus) {
      if ((_dafny.ZERO).isLessThanOrEqualTo(n)) {
        return Std_Strings_DecimalConversion.__default.OfNat(n);
      } else {
        return _dafny.Seq.Concat(_dafny.Seq.of(minus), Std_Strings_DecimalConversion.__default.OfNat((_dafny.ZERO).minus(n)));
      }
    };
    static ToNat(str) {
      if (_dafny.areEqual(str, _dafny.Seq.of())) {
        return _dafny.ZERO;
      } else {
        let _0_c = (str)[(new BigNumber((str).length)).minus(_dafny.ONE)];
        return ((Std_Strings_DecimalConversion.__default.ToNat((str).slice(0, (new BigNumber((str).length)).minus(_dafny.ONE)))).multipliedBy(Std_Strings_DecimalConversion.__default.base)).plus((Std_Strings_DecimalConversion.__default.charToDigit).get(_0_c));
      }
    };
    static ToInt(str, minus) {
      if (_dafny.Seq.IsPrefixOf(_dafny.Seq.of(minus), str)) {
        return (_dafny.ZERO).minus(Std_Strings_DecimalConversion.__default.ToNat((str).slice(_dafny.ONE)));
      } else {
        return Std_Strings_DecimalConversion.__default.ToNat(str);
      }
    };
    static ToNatRight(xs) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.ZERO;
      } else {
        return ((Std_Strings_DecimalConversion.__default.ToNatRight(Std_Collections_Seq.__default.DropFirst(xs))).multipliedBy(Std_Strings_DecimalConversion.__default.BASE())).plus(Std_Collections_Seq.__default.First(xs));
      }
    };
    static ToNatLeft(xs) {
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = ((Std_Collections_Seq.__default.Last(xs)).multipliedBy(Std_Arithmetic_Power.__default.Pow(Std_Strings_DecimalConversion.__default.BASE(), (new BigNumber((xs).length)).minus(_dafny.ONE)))).plus(_0___accumulator);
          let _in0 = Std_Collections_Seq.__default.DropLast(xs);
          xs = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static FromNat(n) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((n).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((n).mod(Std_Strings_DecimalConversion.__default.BASE())));
          let _in0 = _dafny.EuclideanDivision(n, Std_Strings_DecimalConversion.__default.BASE());
          n = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static SeqExtend(xs, n) {
      TAIL_CALL_START: while (true) {
        if ((n).isLessThanOrEqualTo(new BigNumber((xs).length))) {
          return xs;
        } else {
          let _in0 = _dafny.Seq.Concat(xs, _dafny.Seq.of(_dafny.ZERO));
          let _in1 = n;
          xs = _in0;
          n = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static SeqExtendMultiple(xs, n) {
      let _0_newLen = ((new BigNumber((xs).length)).plus(n)).minus((new BigNumber((xs).length)).mod(n));
      return Std_Strings_DecimalConversion.__default.SeqExtend(xs, _0_newLen);
    };
    static FromNatWithLen(n, len) {
      return Std_Strings_DecimalConversion.__default.SeqExtend(Std_Strings_DecimalConversion.__default.FromNat(n), len);
    };
    static SeqZero(len) {
      let _0_xs = Std_Strings_DecimalConversion.__default.FromNatWithLen(_dafny.ZERO, len);
      return _0_xs;
    };
    static SeqAdd(xs, ys) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Tuple.of(_dafny.Seq.of(), _dafny.ZERO);
      } else {
        let _let_tmp_rhs0 = Std_Strings_DecimalConversion.__default.SeqAdd(Std_Collections_Seq.__default.DropLast(xs), Std_Collections_Seq.__default.DropLast(ys));
        let _0_zs_k = (_let_tmp_rhs0)[0];
        let _1_cin = (_let_tmp_rhs0)[1];
        let _2_sum = ((Std_Collections_Seq.__default.Last(xs)).plus(Std_Collections_Seq.__default.Last(ys))).plus(_1_cin);
        let _let_tmp_rhs1 = (((_2_sum).isLessThan(Std_Strings_DecimalConversion.__default.BASE())) ? (_dafny.Tuple.of(_2_sum, _dafny.ZERO)) : (_dafny.Tuple.of((_2_sum).minus(Std_Strings_DecimalConversion.__default.BASE()), _dafny.ONE)));
        let _3_sum__out = (_let_tmp_rhs1)[0];
        let _4_cout = (_let_tmp_rhs1)[1];
        return _dafny.Tuple.of(_dafny.Seq.Concat(_0_zs_k, _dafny.Seq.of(_3_sum__out)), _4_cout);
      }
    };
    static SeqSub(xs, ys) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Tuple.of(_dafny.Seq.of(), _dafny.ZERO);
      } else {
        let _let_tmp_rhs0 = Std_Strings_DecimalConversion.__default.SeqSub(Std_Collections_Seq.__default.DropLast(xs), Std_Collections_Seq.__default.DropLast(ys));
        let _0_zs = (_let_tmp_rhs0)[0];
        let _1_cin = (_let_tmp_rhs0)[1];
        let _let_tmp_rhs1 = ((((Std_Collections_Seq.__default.Last(ys)).plus(_1_cin)).isLessThanOrEqualTo(Std_Collections_Seq.__default.Last(xs))) ? (_dafny.Tuple.of(((Std_Collections_Seq.__default.Last(xs)).minus(Std_Collections_Seq.__default.Last(ys))).minus(_1_cin), _dafny.ZERO)) : (_dafny.Tuple.of((((Std_Strings_DecimalConversion.__default.BASE()).plus(Std_Collections_Seq.__default.Last(xs))).minus(Std_Collections_Seq.__default.Last(ys))).minus(_1_cin), _dafny.ONE)));
        let _2_diff__out = (_let_tmp_rhs1)[0];
        let _3_cout = (_let_tmp_rhs1)[1];
        return _dafny.Tuple.of(_dafny.Seq.Concat(_0_zs, _dafny.Seq.of(_2_diff__out)), _3_cout);
      }
    };
    static get DIGITS() {
      return _dafny.Seq.UnicodeFromString("0123456789");
    };
    static get chars() {
      return Std_Strings_DecimalConversion.__default.DIGITS;
    };
    static get base() {
      return new BigNumber((Std_Strings_DecimalConversion.__default.chars).length);
    };
    static get charToDigit() {
      return _dafny.Map.Empty.slice().updateUnsafe(new _dafny.CodePoint('0'.codePointAt(0)),_dafny.ZERO).updateUnsafe(new _dafny.CodePoint('1'.codePointAt(0)),_dafny.ONE).updateUnsafe(new _dafny.CodePoint('2'.codePointAt(0)),new BigNumber(2)).updateUnsafe(new _dafny.CodePoint('3'.codePointAt(0)),new BigNumber(3)).updateUnsafe(new _dafny.CodePoint('4'.codePointAt(0)),new BigNumber(4)).updateUnsafe(new _dafny.CodePoint('5'.codePointAt(0)),new BigNumber(5)).updateUnsafe(new _dafny.CodePoint('6'.codePointAt(0)),new BigNumber(6)).updateUnsafe(new _dafny.CodePoint('7'.codePointAt(0)),new BigNumber(7)).updateUnsafe(new _dafny.CodePoint('8'.codePointAt(0)),new BigNumber(8)).updateUnsafe(new _dafny.CodePoint('9'.codePointAt(0)),new BigNumber(9));
    };
  };

  $module.CharSeq = class CharSeq {
    constructor () {
    }
    static get Default() {
      return _dafny.Seq.UnicodeFromString("");
    }
    static _Is(__source) {
      let _0_chars = __source;
      return (_dafny.ONE).isLessThan(new BigNumber((_0_chars).length));
    }
  };

  $module.digit = class digit {
    constructor () {
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _1_i = (__source);
      if (_System.nat._Is(_1_i)) {
        return ((_dafny.ZERO).isLessThanOrEqualTo(_1_i)) && ((_1_i).isLessThan(Std_Strings_DecimalConversion.__default.BASE()));
      }
      return false;
    }
  };
  return $module;
})(); // end of module Std_Strings_DecimalConversion
let Std_Strings_CharStrEscaping = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Strings.CharStrEscaping._default";
    }
    _parentTraits() {
      return [];
    }
    static Escape(str, mustEscape, escape) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if (_dafny.areEqual(str, _dafny.Seq.of())) {
          return _dafny.Seq.Concat(_0___accumulator, str);
        } else if ((mustEscape).contains((str)[_dafny.ZERO])) {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of(escape, (str)[_dafny.ZERO]));
          let _in0 = (str).slice(_dafny.ONE);
          let _in1 = mustEscape;
          let _in2 = escape;
          str = _in0;
          mustEscape = _in1;
          escape = _in2;
          continue TAIL_CALL_START;
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((str)[_dafny.ZERO]));
          let _in3 = (str).slice(_dafny.ONE);
          let _in4 = mustEscape;
          let _in5 = escape;
          str = _in3;
          mustEscape = _in4;
          escape = _in5;
          continue TAIL_CALL_START;
        }
      }
    };
    static Unescape(str, escape) {
      if (_dafny.areEqual(str, _dafny.Seq.of())) {
        return Std_Wrappers.Option.create_Some(str);
      } else if (_dafny.areEqual((str)[_dafny.ZERO], escape)) {
        if ((_dafny.ONE).isLessThan(new BigNumber((str).length))) {
          let _0_valueOrError0 = Std_Strings_CharStrEscaping.__default.Unescape((str).slice(new BigNumber(2)), escape);
          if ((_0_valueOrError0).IsFailure()) {
            return (_0_valueOrError0).PropagateFailure();
          } else {
            let _1_tl = (_0_valueOrError0).Extract();
            return Std_Wrappers.Option.create_Some(_dafny.Seq.Concat(_dafny.Seq.of((str)[_dafny.ONE]), _1_tl));
          }
        } else {
          return Std_Wrappers.Option.create_None();
        }
      } else {
        let _2_valueOrError1 = Std_Strings_CharStrEscaping.__default.Unescape((str).slice(_dafny.ONE), escape);
        if ((_2_valueOrError1).IsFailure()) {
          return (_2_valueOrError1).PropagateFailure();
        } else {
          let _3_tl = (_2_valueOrError1).Extract();
          return Std_Wrappers.Option.create_Some(_dafny.Seq.Concat(_dafny.Seq.of((str)[_dafny.ZERO]), _3_tl));
        }
      }
    };
  };
  return $module;
})(); // end of module Std_Strings_CharStrEscaping
let Std_Strings = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Strings._default";
    }
    _parentTraits() {
      return [];
    }
    static OfNat(n) {
      return Std_Strings_DecimalConversion.__default.OfNat(n);
    };
    static OfInt(n) {
      return Std_Strings_DecimalConversion.__default.OfInt(n, new _dafny.CodePoint('-'.codePointAt(0)));
    };
    static ToNat(str) {
      return Std_Strings_DecimalConversion.__default.ToNat(str);
    };
    static ToInt(str) {
      return Std_Strings_DecimalConversion.__default.ToInt(str, new _dafny.CodePoint('-'.codePointAt(0)));
    };
    static EscapeQuotes(str) {
      return Std_Strings_CharStrEscaping.__default.Escape(str, _dafny.Set.fromElements(new _dafny.CodePoint('\"'.codePointAt(0)), new _dafny.CodePoint('\''.codePointAt(0))), new _dafny.CodePoint('\\'.codePointAt(0)));
    };
    static UnescapeQuotes(str) {
      return Std_Strings_CharStrEscaping.__default.Unescape(str, new _dafny.CodePoint('\\'.codePointAt(0)));
    };
    static OfBool(b) {
      if (b) {
        return _dafny.Seq.UnicodeFromString("true");
      } else {
        return _dafny.Seq.UnicodeFromString("false");
      }
    };
    static OfChar(c) {
      return _dafny.Seq.of(c);
    };
  };
  return $module;
})(); // end of module Std_Strings
let Std_Unicode_Utf8EncodingForm = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Unicode.Utf8EncodingForm._default";
    }
    _parentTraits() {
      return [];
    }
    static IsMinimalWellFormedCodeUnitSubsequence(s) {
      if ((new BigNumber((s).length)).isEqualTo(_dafny.ONE)) {
        let _0_b = Std_Unicode_Utf8EncodingForm.__default.IsWellFormedSingleCodeUnitSequence(s);
        return _0_b;
      } else if ((new BigNumber((s).length)).isEqualTo(new BigNumber(2))) {
        let _1_b = Std_Unicode_Utf8EncodingForm.__default.IsWellFormedDoubleCodeUnitSequence(s);
        return _1_b;
      } else if ((new BigNumber((s).length)).isEqualTo(new BigNumber(3))) {
        let _2_b = Std_Unicode_Utf8EncodingForm.__default.IsWellFormedTripleCodeUnitSequence(s);
        return _2_b;
      } else if ((new BigNumber((s).length)).isEqualTo(new BigNumber(4))) {
        let _3_b = Std_Unicode_Utf8EncodingForm.__default.IsWellFormedQuadrupleCodeUnitSequence(s);
        return _3_b;
      } else {
        return false;
      }
    };
    static IsWellFormedSingleCodeUnitSequence(s) {
      let _0_firstByte = (s)[_dafny.ZERO];
      return (true) && (((_dafny.ZERO).isLessThanOrEqualTo(_0_firstByte)) && ((_0_firstByte).isLessThanOrEqualTo(new BigNumber(127))));
    };
    static IsWellFormedDoubleCodeUnitSequence(s) {
      let _0_firstByte = (s)[_dafny.ZERO];
      let _1_secondByte = (s)[_dafny.ONE];
      return (((new BigNumber(194)).isLessThanOrEqualTo(_0_firstByte)) && ((_0_firstByte).isLessThanOrEqualTo(new BigNumber(223)))) && (((new BigNumber(128)).isLessThanOrEqualTo(_1_secondByte)) && ((_1_secondByte).isLessThanOrEqualTo(new BigNumber(191))));
    };
    static IsWellFormedTripleCodeUnitSequence(s) {
      let _0_firstByte = (s)[_dafny.ZERO];
      let _1_secondByte = (s)[_dafny.ONE];
      let _2_thirdByte = (s)[new BigNumber(2)];
      return ((((((_0_firstByte).isEqualTo(new BigNumber(224))) && (((new BigNumber(160)).isLessThanOrEqualTo(_1_secondByte)) && ((_1_secondByte).isLessThanOrEqualTo(new BigNumber(191))))) || ((((new BigNumber(225)).isLessThanOrEqualTo(_0_firstByte)) && ((_0_firstByte).isLessThanOrEqualTo(new BigNumber(236)))) && (((new BigNumber(128)).isLessThanOrEqualTo(_1_secondByte)) && ((_1_secondByte).isLessThanOrEqualTo(new BigNumber(191)))))) || (((_0_firstByte).isEqualTo(new BigNumber(237))) && (((new BigNumber(128)).isLessThanOrEqualTo(_1_secondByte)) && ((_1_secondByte).isLessThanOrEqualTo(new BigNumber(159)))))) || ((((new BigNumber(238)).isLessThanOrEqualTo(_0_firstByte)) && ((_0_firstByte).isLessThanOrEqualTo(new BigNumber(239)))) && (((new BigNumber(128)).isLessThanOrEqualTo(_1_secondByte)) && ((_1_secondByte).isLessThanOrEqualTo(new BigNumber(191)))))) && (((new BigNumber(128)).isLessThanOrEqualTo(_2_thirdByte)) && ((_2_thirdByte).isLessThanOrEqualTo(new BigNumber(191))));
    };
    static IsWellFormedQuadrupleCodeUnitSequence(s) {
      let _0_firstByte = (s)[_dafny.ZERO];
      let _1_secondByte = (s)[_dafny.ONE];
      let _2_thirdByte = (s)[new BigNumber(2)];
      let _3_fourthByte = (s)[new BigNumber(3)];
      return ((((((_0_firstByte).isEqualTo(new BigNumber(240))) && (((new BigNumber(144)).isLessThanOrEqualTo(_1_secondByte)) && ((_1_secondByte).isLessThanOrEqualTo(new BigNumber(191))))) || ((((new BigNumber(241)).isLessThanOrEqualTo(_0_firstByte)) && ((_0_firstByte).isLessThanOrEqualTo(new BigNumber(243)))) && (((new BigNumber(128)).isLessThanOrEqualTo(_1_secondByte)) && ((_1_secondByte).isLessThanOrEqualTo(new BigNumber(191)))))) || (((_0_firstByte).isEqualTo(new BigNumber(244))) && (((new BigNumber(128)).isLessThanOrEqualTo(_1_secondByte)) && ((_1_secondByte).isLessThanOrEqualTo(new BigNumber(143)))))) && (((new BigNumber(128)).isLessThanOrEqualTo(_2_thirdByte)) && ((_2_thirdByte).isLessThanOrEqualTo(new BigNumber(191))))) && (((new BigNumber(128)).isLessThanOrEqualTo(_3_fourthByte)) && ((_3_fourthByte).isLessThanOrEqualTo(new BigNumber(191))));
    };
    static SplitPrefixMinimalWellFormedCodeUnitSubsequence(s) {
      if (((_dafny.ONE).isLessThanOrEqualTo(new BigNumber((s).length))) && (Std_Unicode_Utf8EncodingForm.__default.IsWellFormedSingleCodeUnitSequence((s).slice(0, _dafny.ONE)))) {
        return Std_Wrappers.Option.create_Some((s).slice(0, _dafny.ONE));
      } else if (((new BigNumber(2)).isLessThanOrEqualTo(new BigNumber((s).length))) && (Std_Unicode_Utf8EncodingForm.__default.IsWellFormedDoubleCodeUnitSequence((s).slice(0, new BigNumber(2))))) {
        return Std_Wrappers.Option.create_Some((s).slice(0, new BigNumber(2)));
      } else if (((new BigNumber(3)).isLessThanOrEqualTo(new BigNumber((s).length))) && (Std_Unicode_Utf8EncodingForm.__default.IsWellFormedTripleCodeUnitSequence((s).slice(0, new BigNumber(3))))) {
        return Std_Wrappers.Option.create_Some((s).slice(0, new BigNumber(3)));
      } else if (((new BigNumber(4)).isLessThanOrEqualTo(new BigNumber((s).length))) && (Std_Unicode_Utf8EncodingForm.__default.IsWellFormedQuadrupleCodeUnitSequence((s).slice(0, new BigNumber(4))))) {
        return Std_Wrappers.Option.create_Some((s).slice(0, new BigNumber(4)));
      } else {
        return Std_Wrappers.Option.create_None();
      }
    };
    static EncodeScalarValue(v) {
      if ((v).isLessThanOrEqualTo(new BigNumber(127))) {
        return Std_Unicode_Utf8EncodingForm.__default.EncodeScalarValueSingleByte(v);
      } else if ((v).isLessThanOrEqualTo(new BigNumber(2047))) {
        return Std_Unicode_Utf8EncodingForm.__default.EncodeScalarValueDoubleByte(v);
      } else if ((v).isLessThanOrEqualTo(new BigNumber(65535))) {
        return Std_Unicode_Utf8EncodingForm.__default.EncodeScalarValueTripleByte(v);
      } else {
        return Std_Unicode_Utf8EncodingForm.__default.EncodeScalarValueQuadrupleByte(v);
      }
    };
    static EncodeScalarValueSingleByte(v) {
      let _0_x = _dafny.BitwiseAnd(v, new BigNumber(127));
      let _1_firstByte = _0_x;
      return _dafny.Seq.of(_1_firstByte);
    };
    static EncodeScalarValueDoubleByte(v) {
      let _0_x = _dafny.BitwiseAnd(v, new BigNumber(63));
      let _1_y = (_dafny.ShiftRight(_dafny.BitwiseAnd(v, new BigNumber(1984)), (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      let _2_firstByte = _dafny.BitwiseOr(new BigNumber(192), _1_y);
      let _3_secondByte = _dafny.BitwiseOr(new BigNumber(128), _0_x);
      return _dafny.Seq.of(_2_firstByte, _3_secondByte);
    };
    static EncodeScalarValueTripleByte(v) {
      let _0_x = _dafny.BitwiseAnd(v, new BigNumber(63));
      let _1_y = (_dafny.ShiftRight(_dafny.BitwiseAnd(v, new BigNumber(4032)), (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      let _2_z = (_dafny.ShiftRight(_dafny.BitwiseAnd(v, new BigNumber(61440)), (new BigNumber(12)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      let _3_firstByte = _dafny.BitwiseOr(new BigNumber(224), _2_z);
      let _4_secondByte = _dafny.BitwiseOr(new BigNumber(128), _1_y);
      let _5_thirdByte = _dafny.BitwiseOr(new BigNumber(128), _0_x);
      return _dafny.Seq.of(_3_firstByte, _4_secondByte, _5_thirdByte);
    };
    static EncodeScalarValueQuadrupleByte(v) {
      let _0_x = _dafny.BitwiseAnd(v, new BigNumber(63));
      let _1_y = (_dafny.ShiftRight(_dafny.BitwiseAnd(v, new BigNumber(4032)), (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      let _2_z = (_dafny.ShiftRight(_dafny.BitwiseAnd(v, new BigNumber(61440)), (new BigNumber(12)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      let _3_u2 = (_dafny.ShiftRight(_dafny.BitwiseAnd(v, new BigNumber(196608)), (new BigNumber(16)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      let _4_u1 = (_dafny.ShiftRight(_dafny.BitwiseAnd(v, new BigNumber(1835008)), (new BigNumber(18)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      let _5_firstByte = _dafny.BitwiseOr(new BigNumber(240), _4_u1);
      let _6_secondByte = _dafny.BitwiseOr(_dafny.BitwiseOr(new BigNumber(128), (_dafny.ShiftLeft(_3_u2, (new BigNumber(4)).toNumber())).mod(new BigNumber(2).exponentiatedBy(8))), _2_z);
      let _7_thirdByte = _dafny.BitwiseOr(new BigNumber(128), _1_y);
      let _8_fourthByte = _dafny.BitwiseOr(new BigNumber(128), _0_x);
      return _dafny.Seq.of(_5_firstByte, _6_secondByte, _7_thirdByte, _8_fourthByte);
    };
    static DecodeMinimalWellFormedCodeUnitSubsequence(m) {
      if ((new BigNumber((m).length)).isEqualTo(_dafny.ONE)) {
        return Std_Unicode_Utf8EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequenceSingleByte(m);
      } else if ((new BigNumber((m).length)).isEqualTo(new BigNumber(2))) {
        return Std_Unicode_Utf8EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequenceDoubleByte(m);
      } else if ((new BigNumber((m).length)).isEqualTo(new BigNumber(3))) {
        return Std_Unicode_Utf8EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequenceTripleByte(m);
      } else {
        return Std_Unicode_Utf8EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequenceQuadrupleByte(m);
      }
    };
    static DecodeMinimalWellFormedCodeUnitSubsequenceSingleByte(m) {
      let _0_firstByte = (m)[_dafny.ZERO];
      let _1_x = _0_firstByte;
      return _1_x;
    };
    static DecodeMinimalWellFormedCodeUnitSubsequenceDoubleByte(m) {
      let _0_firstByte = (m)[_dafny.ZERO];
      let _1_secondByte = (m)[_dafny.ONE];
      let _2_y = _dafny.BitwiseAnd(_0_firstByte, new BigNumber(31));
      let _3_x = _dafny.BitwiseAnd(_1_secondByte, new BigNumber(63));
      return _dafny.BitwiseOr((_dafny.ShiftLeft(_2_y, (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), (_3_x));
    };
    static DecodeMinimalWellFormedCodeUnitSubsequenceTripleByte(m) {
      let _0_firstByte = (m)[_dafny.ZERO];
      let _1_secondByte = (m)[_dafny.ONE];
      let _2_thirdByte = (m)[new BigNumber(2)];
      let _3_z = _dafny.BitwiseAnd(_0_firstByte, new BigNumber(15));
      let _4_y = _dafny.BitwiseAnd(_1_secondByte, new BigNumber(63));
      let _5_x = _dafny.BitwiseAnd(_2_thirdByte, new BigNumber(63));
      return _dafny.BitwiseOr(_dafny.BitwiseOr((_dafny.ShiftLeft(_3_z, (new BigNumber(12)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), (_dafny.ShiftLeft(_4_y, (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24))), (_5_x));
    };
    static DecodeMinimalWellFormedCodeUnitSubsequenceQuadrupleByte(m) {
      let _0_firstByte = (m)[_dafny.ZERO];
      let _1_secondByte = (m)[_dafny.ONE];
      let _2_thirdByte = (m)[new BigNumber(2)];
      let _3_fourthByte = (m)[new BigNumber(3)];
      let _4_u1 = _dafny.BitwiseAnd(_0_firstByte, new BigNumber(7));
      let _5_u2 = (_dafny.ShiftRight(_dafny.BitwiseAnd(_1_secondByte, new BigNumber(48)), (new BigNumber(4)).toNumber())).mod(new BigNumber(2).exponentiatedBy(8));
      let _6_z = _dafny.BitwiseAnd(_1_secondByte, new BigNumber(15));
      let _7_y = _dafny.BitwiseAnd(_2_thirdByte, new BigNumber(63));
      let _8_x = _dafny.BitwiseAnd(_3_fourthByte, new BigNumber(63));
      let _9_r = _dafny.BitwiseOr(_dafny.BitwiseOr(_dafny.BitwiseOr(_dafny.BitwiseOr((_dafny.ShiftLeft(_4_u1, (new BigNumber(18)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), (_dafny.ShiftLeft(_5_u2, (new BigNumber(16)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24))), (_dafny.ShiftLeft(_6_z, (new BigNumber(12)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24))), (_dafny.ShiftLeft(_7_y, (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24))), (_8_x));
      return _9_r;
    };
    static PartitionCodeUnitSequenceChecked(s) {
      let maybeParts = Std_Wrappers.Result.Default(_dafny.Seq.of());
      if (_dafny.areEqual(s, _dafny.Seq.of())) {
        maybeParts = Std_Wrappers.Result.create_Success(_dafny.Seq.of());
        return maybeParts;
      }
      let _0_result;
      _0_result = _dafny.Seq.of();
      let _1_rest;
      _1_rest = s;
      while ((_dafny.ZERO).isLessThan(new BigNumber((_1_rest).length))) {
        let _2_valueOrError0 = undefined;
        _2_valueOrError0 = (Std_Unicode_Utf8EncodingForm.__default.SplitPrefixMinimalWellFormedCodeUnitSubsequence(_1_rest)).ToResult(_1_rest);
        if ((_2_valueOrError0).IsFailure()) {
          maybeParts = (_2_valueOrError0).PropagateFailure();
          return maybeParts;
        }
        let _3_prefix;
        _3_prefix = (_2_valueOrError0).Extract();
        _0_result = _dafny.Seq.Concat(_0_result, _dafny.Seq.of(_3_prefix));
        _1_rest = (_1_rest).slice(new BigNumber((_3_prefix).length));
      }
      maybeParts = Std_Wrappers.Result.create_Success(_0_result);
      return maybeParts;
      return maybeParts;
    }
    static PartitionCodeUnitSequence(s) {
      return (Std_Unicode_Utf8EncodingForm.__default.PartitionCodeUnitSequenceChecked(s)).Extract();
    };
    static IsWellFormedCodeUnitSequence(s) {
      return (Std_Unicode_Utf8EncodingForm.__default.PartitionCodeUnitSequenceChecked(s)).is_Success;
    };
    static EncodeScalarSequence(vs) {
      let s = Std_Unicode_Utf8EncodingForm.WellFormedCodeUnitSeq.Default;
      s = _dafny.Seq.of();
      let _lo0 = _dafny.ZERO;
      for (let _0_i = new BigNumber((vs).length); _lo0.isLessThan(_0_i); ) {
        _0_i = _0_i.minus(_dafny.ONE);
        let _1_next;
        _1_next = Std_Unicode_Utf8EncodingForm.__default.EncodeScalarValue((vs)[_0_i]);
        s = _dafny.Seq.Concat(_1_next, s);
      }
      return s;
    }
    static DecodeCodeUnitSequence(s) {
      let _0_parts = Std_Unicode_Utf8EncodingForm.__default.PartitionCodeUnitSequence(s);
      let _1_vs = Std_Collections_Seq.__default.MapPartialFunction(Std_Unicode_Utf8EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequence, _0_parts);
      return _1_vs;
    };
    static DecodeErrorMessage(index) {
      return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Could not decode byte at index "), Std_Strings.__default.OfInt(index));
    };
    static DecodeCodeUnitSequenceChecked(s) {
      let resultVs = Std_Wrappers.Result.Default(_dafny.Seq.of());
      let _0_maybeParts;
      _0_maybeParts = Std_Unicode_Utf8EncodingForm.__default.PartitionCodeUnitSequenceChecked(s);
      if ((_0_maybeParts).is_Failure) {
        resultVs = Std_Wrappers.Result.create_Failure(Std_Unicode_Utf8EncodingForm.__default.DecodeErrorMessage((new BigNumber((s).length)).minus(new BigNumber(((_0_maybeParts).dtor_error).length))));
        return resultVs;
      }
      let _1_parts;
      _1_parts = (_0_maybeParts).dtor_value;
      let _2_vs;
      _2_vs = Std_Collections_Seq.__default.MapPartialFunction(Std_Unicode_Utf8EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequence, _1_parts);
      resultVs = Std_Wrappers.Result.create_Success(_2_vs);
      return resultVs;
      return resultVs;
    }
  };

  $module.WellFormedCodeUnitSeq = class WellFormedCodeUnitSeq {
    constructor () {
    }
    static get Witness() {
      return _dafny.Seq.of();
    }
    static get Default() {
      return Std_Unicode_Utf8EncodingForm.WellFormedCodeUnitSeq.Witness;
    }
    static _Is(__source) {
      let _3_s = __source;
      return Std_Unicode_Utf8EncodingForm.__default.IsWellFormedCodeUnitSequence(_3_s);
    }
  };

  $module.MinimalWellFormedCodeUnitSeq = class MinimalWellFormedCodeUnitSeq {
    constructor () {
    }
    static get Default() {
      return _dafny.Seq.of();
    }
    static _Is(__source) {
      let _4_s = __source;
      return Std_Unicode_Utf8EncodingForm.__default.IsMinimalWellFormedCodeUnitSubsequence(_4_s);
    }
  };
  return $module;
})(); // end of module Std_Unicode_Utf8EncodingForm
let Std_Unicode_Utf16EncodingForm = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Unicode.Utf16EncodingForm._default";
    }
    _parentTraits() {
      return [];
    }
    static IsMinimalWellFormedCodeUnitSubsequence(s) {
      if ((new BigNumber((s).length)).isEqualTo(_dafny.ONE)) {
        return Std_Unicode_Utf16EncodingForm.__default.IsWellFormedSingleCodeUnitSequence(s);
      } else if ((new BigNumber((s).length)).isEqualTo(new BigNumber(2))) {
        let _0_b = Std_Unicode_Utf16EncodingForm.__default.IsWellFormedDoubleCodeUnitSequence(s);
        return _0_b;
      } else {
        return false;
      }
    };
    static IsWellFormedSingleCodeUnitSequence(s) {
      let _0_firstWord = (s)[_dafny.ZERO];
      return (((_dafny.ZERO).isLessThanOrEqualTo(_0_firstWord)) && ((_0_firstWord).isLessThanOrEqualTo(new BigNumber(55295)))) || (((new BigNumber(57344)).isLessThanOrEqualTo(_0_firstWord)) && ((_0_firstWord).isLessThanOrEqualTo(new BigNumber(65535))));
    };
    static IsWellFormedDoubleCodeUnitSequence(s) {
      let _0_firstWord = (s)[_dafny.ZERO];
      let _1_secondWord = (s)[_dafny.ONE];
      return (((new BigNumber(55296)).isLessThanOrEqualTo(_0_firstWord)) && ((_0_firstWord).isLessThanOrEqualTo(new BigNumber(56319)))) && (((new BigNumber(56320)).isLessThanOrEqualTo(_1_secondWord)) && ((_1_secondWord).isLessThanOrEqualTo(new BigNumber(57343))));
    };
    static SplitPrefixMinimalWellFormedCodeUnitSubsequence(s) {
      if (((_dafny.ONE).isLessThanOrEqualTo(new BigNumber((s).length))) && (Std_Unicode_Utf16EncodingForm.__default.IsWellFormedSingleCodeUnitSequence((s).slice(0, _dafny.ONE)))) {
        return Std_Wrappers.Option.create_Some((s).slice(0, _dafny.ONE));
      } else if (((new BigNumber(2)).isLessThanOrEqualTo(new BigNumber((s).length))) && (Std_Unicode_Utf16EncodingForm.__default.IsWellFormedDoubleCodeUnitSequence((s).slice(0, new BigNumber(2))))) {
        return Std_Wrappers.Option.create_Some((s).slice(0, new BigNumber(2)));
      } else {
        return Std_Wrappers.Option.create_None();
      }
    };
    static EncodeScalarValue(v) {
      if ((((_dafny.ZERO).isLessThanOrEqualTo(v)) && ((v).isLessThanOrEqualTo(new BigNumber(55295)))) || (((new BigNumber(57344)).isLessThanOrEqualTo(v)) && ((v).isLessThanOrEqualTo(new BigNumber(65535))))) {
        return Std_Unicode_Utf16EncodingForm.__default.EncodeScalarValueSingleWord(v);
      } else {
        return Std_Unicode_Utf16EncodingForm.__default.EncodeScalarValueDoubleWord(v);
      }
    };
    static EncodeScalarValueSingleWord(v) {
      let _0_firstWord = v;
      return _dafny.Seq.of(_0_firstWord);
    };
    static EncodeScalarValueDoubleWord(v) {
      let _0_x2 = _dafny.BitwiseAnd(v, new BigNumber(1023));
      let _1_x1 = (_dafny.ShiftRight(_dafny.BitwiseAnd(v, new BigNumber(64512)), (new BigNumber(10)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      let _2_u = (_dafny.ShiftRight(_dafny.BitwiseAnd(v, new BigNumber(2031616)), (new BigNumber(16)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24));
      let _3_w = ((_2_u).minus(_dafny.ONE)).mod(new BigNumber(2).exponentiatedBy(5));
      let _4_firstWord = _dafny.BitwiseOr(_dafny.BitwiseOr(new BigNumber(55296), (_dafny.ShiftLeft(_3_w, (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(16))), _1_x1);
      let _5_secondWord = _dafny.BitwiseOr(new BigNumber(56320), _0_x2);
      return _dafny.Seq.of(_4_firstWord, _5_secondWord);
    };
    static DecodeMinimalWellFormedCodeUnitSubsequence(m) {
      if ((new BigNumber((m).length)).isEqualTo(_dafny.ONE)) {
        return Std_Unicode_Utf16EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequenceSingleWord(m);
      } else {
        return Std_Unicode_Utf16EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequenceDoubleWord(m);
      }
    };
    static DecodeMinimalWellFormedCodeUnitSubsequenceSingleWord(m) {
      let _0_firstWord = (m)[_dafny.ZERO];
      let _1_x = _0_firstWord;
      return _1_x;
    };
    static DecodeMinimalWellFormedCodeUnitSubsequenceDoubleWord(m) {
      let _0_firstWord = (m)[_dafny.ZERO];
      let _1_secondWord = (m)[_dafny.ONE];
      let _2_x2 = _dafny.BitwiseAnd(_1_secondWord, new BigNumber(1023));
      let _3_x1 = _dafny.BitwiseAnd(_0_firstWord, new BigNumber(63));
      let _4_w = (_dafny.ShiftRight(_dafny.BitwiseAnd(_0_firstWord, new BigNumber(960)), (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(16));
      let _5_u = ((_4_w).plus(_dafny.ONE)).mod(new BigNumber(2).exponentiatedBy(24));
      let _6_v = _dafny.BitwiseOr(_dafny.BitwiseOr((_dafny.ShiftLeft(_5_u, (new BigNumber(16)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), (_dafny.ShiftLeft(_3_x1, (new BigNumber(10)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24))), (_2_x2));
      return _6_v;
    };
    static PartitionCodeUnitSequenceChecked(s) {
      let maybeParts = Std_Wrappers.Result.Default(_dafny.Seq.of());
      if (_dafny.areEqual(s, _dafny.Seq.of())) {
        maybeParts = Std_Wrappers.Result.create_Success(_dafny.Seq.of());
        return maybeParts;
      }
      let _0_result;
      _0_result = _dafny.Seq.of();
      let _1_rest;
      _1_rest = s;
      while ((_dafny.ZERO).isLessThan(new BigNumber((_1_rest).length))) {
        let _2_valueOrError0 = undefined;
        _2_valueOrError0 = (Std_Unicode_Utf16EncodingForm.__default.SplitPrefixMinimalWellFormedCodeUnitSubsequence(_1_rest)).ToResult(_1_rest);
        if ((_2_valueOrError0).IsFailure()) {
          maybeParts = (_2_valueOrError0).PropagateFailure();
          return maybeParts;
        }
        let _3_prefix;
        _3_prefix = (_2_valueOrError0).Extract();
        _0_result = _dafny.Seq.Concat(_0_result, _dafny.Seq.of(_3_prefix));
        _1_rest = (_1_rest).slice(new BigNumber((_3_prefix).length));
      }
      maybeParts = Std_Wrappers.Result.create_Success(_0_result);
      return maybeParts;
      return maybeParts;
    }
    static PartitionCodeUnitSequence(s) {
      return (Std_Unicode_Utf16EncodingForm.__default.PartitionCodeUnitSequenceChecked(s)).Extract();
    };
    static IsWellFormedCodeUnitSequence(s) {
      return (Std_Unicode_Utf16EncodingForm.__default.PartitionCodeUnitSequenceChecked(s)).is_Success;
    };
    static EncodeScalarSequence(vs) {
      let s = Std_Unicode_Utf16EncodingForm.WellFormedCodeUnitSeq.Default;
      s = _dafny.Seq.of();
      let _lo0 = _dafny.ZERO;
      for (let _0_i = new BigNumber((vs).length); _lo0.isLessThan(_0_i); ) {
        _0_i = _0_i.minus(_dafny.ONE);
        let _1_next;
        _1_next = Std_Unicode_Utf16EncodingForm.__default.EncodeScalarValue((vs)[_0_i]);
        s = _dafny.Seq.Concat(_1_next, s);
      }
      return s;
    }
    static DecodeCodeUnitSequence(s) {
      let _0_parts = Std_Unicode_Utf16EncodingForm.__default.PartitionCodeUnitSequence(s);
      let _1_vs = Std_Collections_Seq.__default.MapPartialFunction(Std_Unicode_Utf16EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequence, _0_parts);
      return _1_vs;
    };
    static DecodeErrorMessage(index) {
      return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Could not decode byte at index "), Std_Strings.__default.OfInt(index));
    };
    static DecodeCodeUnitSequenceChecked(s) {
      let resultVs = Std_Wrappers.Result.Default(_dafny.Seq.of());
      let _0_maybeParts;
      _0_maybeParts = Std_Unicode_Utf16EncodingForm.__default.PartitionCodeUnitSequenceChecked(s);
      if ((_0_maybeParts).is_Failure) {
        resultVs = Std_Wrappers.Result.create_Failure(Std_Unicode_Utf16EncodingForm.__default.DecodeErrorMessage((new BigNumber((s).length)).minus(new BigNumber(((_0_maybeParts).dtor_error).length))));
        return resultVs;
      }
      let _1_parts;
      _1_parts = (_0_maybeParts).dtor_value;
      let _2_vs;
      _2_vs = Std_Collections_Seq.__default.MapPartialFunction(Std_Unicode_Utf16EncodingForm.__default.DecodeMinimalWellFormedCodeUnitSubsequence, _1_parts);
      resultVs = Std_Wrappers.Result.create_Success(_2_vs);
      return resultVs;
      return resultVs;
    }
  };

  $module.WellFormedCodeUnitSeq = class WellFormedCodeUnitSeq {
    constructor () {
    }
    static get Witness() {
      return _dafny.Seq.of();
    }
    static get Default() {
      return Std_Unicode_Utf16EncodingForm.WellFormedCodeUnitSeq.Witness;
    }
    static _Is(__source) {
      let _3_s = __source;
      return Std_Unicode_Utf16EncodingForm.__default.IsWellFormedCodeUnitSequence(_3_s);
    }
  };

  $module.MinimalWellFormedCodeUnitSeq = class MinimalWellFormedCodeUnitSeq {
    constructor () {
    }
    static get Default() {
      return _dafny.Seq.of();
    }
    static _Is(__source) {
      let _4_s = __source;
      return Std_Unicode_Utf16EncodingForm.__default.IsMinimalWellFormedCodeUnitSubsequence(_4_s);
    }
  };
  return $module;
})(); // end of module Std_Unicode_Utf16EncodingForm
let Std_Unicode_UnicodeStringsWithUnicodeChar = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Unicode.UnicodeStringsWithUnicodeChar._default";
    }
    _parentTraits() {
      return [];
    }
    static CharAsUnicodeScalarValue(c) {
      return new BigNumber((c).value);
    };
    static CharFromUnicodeScalarValue(sv) {
      return new _dafny.CodePoint((sv).toNumber());
    };
    static ToUTF8Checked(s) {
      let _0_asCodeUnits = Std_Collections_Seq.__default.Map(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.CharAsUnicodeScalarValue, s);
      let _1_asUtf8CodeUnits = Std_Unicode_Utf8EncodingForm.__default.EncodeScalarSequence(_0_asCodeUnits);
      let _2_asBytes = Std_Collections_Seq.__default.Map(function (_3_cu) {
        return (_3_cu).toNumber();
      }, _1_asUtf8CodeUnits);
      return Std_Wrappers.Option.create_Some(_2_asBytes);
    };
    static FromUTF8Checked(bs) {
      let _0_asCodeUnits = Std_Collections_Seq.__default.Map(function (_1_c) {
        return new BigNumber(_1_c);
      }, bs);
      let _2_valueOrError0 = Std_Unicode_Utf8EncodingForm.__default.DecodeCodeUnitSequenceChecked(_0_asCodeUnits);
      if ((_2_valueOrError0).IsFailure()) {
        return (_2_valueOrError0).PropagateFailure();
      } else {
        let _3_utf32 = (_2_valueOrError0).Extract();
        let _4_asChars = Std_Collections_Seq.__default.Map(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.CharFromUnicodeScalarValue, _3_utf32);
        return Std_Wrappers.Result.create_Success(_4_asChars);
      }
    };
    static ToUTF16Checked(s) {
      let _0_asCodeUnits = Std_Collections_Seq.__default.Map(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.CharAsUnicodeScalarValue, s);
      let _1_asUtf16CodeUnits = Std_Unicode_Utf16EncodingForm.__default.EncodeScalarSequence(_0_asCodeUnits);
      let _2_asBytes = Std_Collections_Seq.__default.Map(function (_3_cu) {
        return (_3_cu).toNumber();
      }, _1_asUtf16CodeUnits);
      return Std_Wrappers.Option.create_Some(_2_asBytes);
    };
    static FromUTF16Checked(bs) {
      let _0_asCodeUnits = Std_Collections_Seq.__default.Map(function (_1_c) {
        return new BigNumber(_1_c);
      }, bs);
      let _2_valueOrError0 = Std_Unicode_Utf16EncodingForm.__default.DecodeCodeUnitSequenceChecked(_0_asCodeUnits);
      if ((_2_valueOrError0).IsFailure()) {
        return (_2_valueOrError0).PropagateFailure();
      } else {
        let _3_utf32 = (_2_valueOrError0).Extract();
        let _4_asChars = Std_Collections_Seq.__default.Map(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.CharFromUnicodeScalarValue, _3_utf32);
        return Std_Wrappers.Result.create_Success(_4_asChars);
      }
    };
    static ASCIIToUTF8(s) {
      return Std_Collections_Seq.__default.Map(function (_0_c) {
        return (_0_c).value;
      }, s);
    };
    static ASCIIToUTF16(s) {
      return Std_Collections_Seq.__default.Map(function (_0_c) {
        return (_0_c).value;
      }, s);
    };
  };
  return $module;
})(); // end of module Std_Unicode_UnicodeStringsWithUnicodeChar
let Std_Unicode_Utf8EncodingScheme = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Unicode.Utf8EncodingScheme._default";
    }
    _parentTraits() {
      return [];
    }
    static Serialize(s) {
      return Std_Collections_Seq.__default.Map(function (_0_c) {
        return (_0_c).toNumber();
      }, s);
    };
    static Deserialize(b) {
      return Std_Collections_Seq.__default.Map(function (_0_b) {
        return new BigNumber(_0_b);
      }, b);
    };
  };
  return $module;
})(); // end of module Std_Unicode_Utf8EncodingScheme
let Std_Unicode = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_Unicode
let Std_FileIO = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.FileIO._default";
    }
    _parentTraits() {
      return [];
    }
    static ReadBytesFromFile(path) {
      let res = Std_Wrappers.Result.Default(_dafny.Seq.of());
      let _0_isError;
      let _1_bytesRead;
      let _2_errorMsg;
      let _out0;
      let _out1;
      let _out2;
      let _outcollector0 = Std_FileIOInternalExterns.__default.INTERNAL__ReadBytesFromFile(path);
      _out0 = _outcollector0[0];
      _out1 = _outcollector0[1];
      _out2 = _outcollector0[2];
      _0_isError = _out0;
      _1_bytesRead = _out1;
      _2_errorMsg = _out2;
      if (_0_isError) {
        res = Std_Wrappers.Result.create_Failure(_2_errorMsg);
      } else {
        res = Std_Wrappers.Result.create_Success(_1_bytesRead);
      }
      return res;
      return res;
    }
    static WriteBytesToFile(path, bytes) {
      let res = Std_Wrappers.Result.Default(_dafny.Tuple.Default());
      let _0_isError;
      let _1_errorMsg;
      let _out0;
      let _out1;
      let _outcollector0 = Std_FileIOInternalExterns.__default.INTERNAL__WriteBytesToFile(path, bytes);
      _out0 = _outcollector0[0];
      _out1 = _outcollector0[1];
      _0_isError = _out0;
      _1_errorMsg = _out1;
      if (_0_isError) {
        res = Std_Wrappers.Result.create_Failure(_1_errorMsg);
      } else {
        res = Std_Wrappers.Result.create_Success(_dafny.Tuple.of());
      }
      return res;
      return res;
    }
    static ReadUTF8FromFile(fileName) {
      let r = Std_Wrappers.Result.Default(_dafny.Seq.UnicodeFromString(""));
      let _0_valueOrError0 = Std_Wrappers.Result.Default(_dafny.Seq.of());
      let _out0;
      _out0 = Std_FileIO.__default.ReadBytesFromFile(fileName);
      _0_valueOrError0 = _out0;
      if ((_0_valueOrError0).IsFailure()) {
        r = (_0_valueOrError0).PropagateFailure();
        return r;
      }
      let _1_bytes;
      _1_bytes = (_0_valueOrError0).Extract();
      r = Std_Unicode_UnicodeStringsWithUnicodeChar.__default.FromUTF8Checked(_dafny.Seq.Create(new BigNumber((_1_bytes).length), ((_2_bytes) => function (_3_i) {
        return ((_2_bytes)[_3_i]).toNumber();
      })(_1_bytes)));
      return r;
      return r;
    }
    static WriteUTF8ToFile(fileName, content) {
      let r = Std_Wrappers.Outcome.Default();
      let _0_bytes;
      _0_bytes = (Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ToUTF8Checked(content)).dtor_value;
      let _1_writeResult;
      let _out0;
      _out0 = Std_FileIO.__default.WriteBytesToFile(fileName, _dafny.Seq.Create(new BigNumber((_0_bytes).length), ((_2_bytes) => function (_3_i) {
        return new BigNumber((_2_bytes)[_3_i]);
      })(_0_bytes)));
      _1_writeResult = _out0;
      if ((_1_writeResult).IsFailure()) {
        r = Std_Wrappers.Outcome.create_Fail(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Failed to write to file '"), fileName), _dafny.Seq.UnicodeFromString("': ")), (_1_writeResult).dtor_error));
        return r;
      }
      r = Std_Wrappers.Outcome.create_Pass();
      return r;
      return r;
    }
  };
  return $module;
})(); // end of module Std_FileIO
let Std_BulkActions = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.BulkActions._default";
    }
    _parentTraits() {
      return [];
    }
    static ToBatched(t) {
      return Std_BulkActions.Batched.create_BatchValue(t);
    };
    static ToBatchedProducer(values) {
      let result = undefined;
      let _0_chunkProducer;
      let _nw0 = new Std_Producers.SeqReader();
      _nw0.constructor(values);
      _0_chunkProducer = _nw0;
      let _1_mapping;
      let _nw1 = new Std_Actions.FunctionAction();
      _nw1.constructor(Std_BulkActions.__default.ToBatched);
      _1_mapping = _nw1;
      let _nw2 = new Std_Producers.MappedProducer();
      _nw2.constructor(_0_chunkProducer, _1_mapping);
      result = _nw2;
      return result;
    }
  };

  $module.Batched = class Batched {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_BatchValue(value) {
      let $dt = new Batched(0);
      $dt.value = value;
      return $dt;
    }
    static create_BatchError(error) {
      let $dt = new Batched(1);
      $dt.error = error;
      return $dt;
    }
    static create_EndOfInput() {
      let $dt = new Batched(2);
      return $dt;
    }
    get is_BatchValue() { return this.$tag === 0; }
    get is_BatchError() { return this.$tag === 1; }
    get is_EndOfInput() { return this.$tag === 2; }
    get dtor_value() { return this.value; }
    get dtor_error() { return this.error; }
    toString() {
      if (this.$tag === 0) {
        return "BulkActions.Batched.BatchValue" + "(" + _dafny.toString(this.value) + ")";
      } else if (this.$tag === 1) {
        return "BulkActions.Batched.BatchError" + "(" + _dafny.toString(this.error) + ")";
      } else if (this.$tag === 2) {
        return "BulkActions.Batched.EndOfInput";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.value, other.value);
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.error, other.error);
      } else if (this.$tag === 2) {
        return other.$tag === 2;
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_BulkActions.Batched.create_EndOfInput();
    }
    static Rtd() {
      return class {
        static get Default() {
          return Batched.Default();
        }
      };
    }
  }

  $module.BulkAction = class BulkAction {
  };

  $module.BatchReader = class BatchReader {
    constructor () {
      this._tname = "Std.BulkActions.BatchReader";
      this.index = _dafny.ZERO;
      this._elements = _dafny.Seq.of();
    }
    _parentTraits() {
      return [Std_Producers.Producer, Std_Actions.Action, Std_Actions.TotalActionProof, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Next() {
      let _this = this;
      let _out10;
      _out10 = Std_Producers.Producer.Next(_this);
      return _out10;
    }
    // DUPLICATE CONSTRUCTOR: constructor(elements) {
    // let _this = this;
    // (_this)._elements = elements;
    // (_this).index = _dafny.ZERO;
    // return;
    // }
    ProducedCount() {
      let _this = this;
      return _this.index;
    };
    Remaining() {
      let _this = this;
      return Std_Wrappers.Option.create_Some((new BigNumber(((_this).elements).length)).minus(_this.index));
    };
    Invoke(t) {
      let _this = this;
      let value = Std_Wrappers.Option.Default();
      if ((new BigNumber(((_this).elements).length)).isEqualTo(_this.index)) {
        value = Std_Wrappers.Option.create_None();
      } else {
        value = Std_Wrappers.Option.create_Some(Std_BulkActions.Batched.create_BatchValue(((_this).elements)[_this.index]));
        (_this).index = (_this.index).plus(_dafny.ONE);
      }
      return value;
    }
    ForEach(consumer) {
      let _this = this;
      if (function (_is_1) {
        return _is_1 instanceof Std_BulkActions.BatchSeqWriter;
      }(consumer)) {
        let _0_writer;
        _0_writer = consumer;
        let _1_s;
        let _out0;
        _out0 = (_this).Read();
        _1_s = _out0;
        (_0_writer).elements = _dafny.Seq.Concat(_0_writer.elements, _1_s);
        return;
      }
      Std_Producers.__default.DefaultForEach(_this, consumer);
      return;
    }
    Fill(consumer) {
      let _this = this;
      Std_Producers.__default.DefaultFill(_this, consumer);
      return;
    }
    Read() {
      let _this = this;
      let s = _dafny.Seq.of();
      if ((_this.index).isEqualTo(_dafny.ZERO)) {
        s = (_this).elements;
      } else {
        s = ((_this).elements).slice(_this.index);
      }
      (_this).index = new BigNumber(((_this).elements).length);
      let _0_produced;
      _0_produced = Std_Collections_Seq.__default.Map(Std_BulkActions.__default.ToBatched, s);
      return s;
    }
    get elements() {
      let _this = this;
      return _this._elements;
    };
  };

  $module.BatchSeqWriter = class BatchSeqWriter {
    constructor () {
      this._tname = "Std.BulkActions.BatchSeqWriter";
      this.elements = _dafny.Seq.of();
      this.state = Std_Wrappers.Result.Default(false);
    }
    _parentTraits() {
      return [Std_Consumers.IConsumer, Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Accept(t) {
      let _this = this;
      Std_Consumers.IConsumer.Accept(_this, t);
      return ;
    }
    // DUPLICATE CONSTRUCTOR: constructor() {
    // let _this = this;
    // (_this).elements = _dafny.Seq.of();
    // (_this).state = Std_Wrappers.Result.create_Success(true);
    // return;
    // }
    Invoke(t) {
      let _this = this;
      let r = _dafny.Tuple.Default();
      let _source0 = t;
      Lmatch0: {
        {
          if (_source0.is_BatchValue) {
            let _0_t = (_source0).value;
            (_this).elements = _dafny.Seq.Concat(_this.elements, _dafny.Seq.of(_0_t));
            break Lmatch0;
          }
        }
        {
          if (_source0.is_BatchError) {
            let _1_e = (_source0).error;
            (_this).state = Std_Wrappers.Result.create_Failure(_1_e);
            break Lmatch0;
          }
        }
        {
          (_this).state = Std_Wrappers.Result.create_Success(false);
        }
      }
      r = _dafny.Tuple.of();
      return r;
    }
    Values() {
      let _this = this;
      return _this.elements;
    };
  };

  $module.BatchSeqWriterTotalProof = class BatchSeqWriterTotalProof {
    constructor () {
      this._tname = "Std.BulkActions.BatchSeqWriterTotalProof";
    }
    _parentTraits() {
      return [Std_Actions.TotalActionProof, Std_Frames.Validatable];
    }
  };

  $module.BatchArrayWriter = class BatchArrayWriter {
    constructor () {
      this._tname = "Std.BulkActions.BatchArrayWriter";
      this.storage = [];
      this.size = _dafny.ZERO;
      this.otherInputs = _dafny.ZERO;
      this.state = Std_Wrappers.Result.Default(false);
    }
    _parentTraits() {
      return [Std_Consumers.Consumer, Std_Actions.Action, Std_GenericActions.GenericAction, Std_Frames.Validatable];
    }
    Accept(t) {
      let _this = this;
      let _out3;
      _out3 = Std_Consumers.Consumer.Accept(_this, t);
      return _out3;
    }
    // DUPLICATE CONSTRUCTOR: constructor(storage) {
    // let _this = this;
    // (_this).storage = storage;
    // (_this).size = _dafny.ZERO;
    // (_this).otherInputs = _dafny.ZERO;
    // (_this).state = Std_Wrappers.Result.create_Success(true);
    // return;
    // }
    Capacity() {
      let _this = this;
      return Std_Wrappers.Option.create_Some(((new BigNumber((_this.storage).length)).minus(_this.size)).minus(_this.otherInputs));
    };
    Invoke(t) {
      let _this = this;
      let r = false;
      if (((_this.size).plus(_this.otherInputs)).isEqualTo(new BigNumber((_this.storage).length))) {
        r = false;
      } else {
        let _source0 = t;
        Lmatch0: {
          {
            if (_source0.is_BatchValue) {
              let _0_value = (_source0).value;
              let _arr0 = _this.storage;
              let _index0 = _this.size;
              _arr0[_index0] = _0_value;
              (_this).size = (_this.size).plus(_dafny.ONE);
              break Lmatch0;
            }
          }
          {
            if (_source0.is_BatchError) {
              let _1_e = (_source0).error;
              (_this).state = Std_Wrappers.Result.create_Failure(_1_e);
              (_this).otherInputs = (_this.otherInputs).plus(_dafny.ONE);
              break Lmatch0;
            }
          }
          {
            (_this).state = Std_Wrappers.Result.create_Success(false);
            (_this).otherInputs = (_this.otherInputs).plus(_dafny.ONE);
          }
        }
        r = true;
      }
      return r;
    }
    Values() {
      let _this = this;
      return _dafny.Seq.of(...(_this.storage).slice(0, _this.size));
    };
  };

  $module.BatchArrayWriterTotalProof = class BatchArrayWriterTotalProof {
    constructor () {
      this._tname = "Std.BulkActions.BatchArrayWriterTotalProof";
    }
    _parentTraits() {
      return [Std_Actions.TotalActionProof, Std_Frames.Validatable];
    }
  };
  return $module;
})(); // end of module Std_BulkActions
let Std_Base64 = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Base64._default";
    }
    _parentTraits() {
      return [];
    }
    static IsBase64Char(c) {
      return ((((_dafny.areEqual(c, new _dafny.CodePoint('+'.codePointAt(0)))) || (_dafny.areEqual(c, new _dafny.CodePoint('/'.codePointAt(0))))) || (((new _dafny.CodePoint('0'.codePointAt(0))).isLessThanOrEqual(c)) && ((c).isLessThanOrEqual(new _dafny.CodePoint('9'.codePointAt(0)))))) || (((new _dafny.CodePoint('A'.codePointAt(0))).isLessThanOrEqual(c)) && ((c).isLessThanOrEqual(new _dafny.CodePoint('Z'.codePointAt(0)))))) || (((new _dafny.CodePoint('a'.codePointAt(0))).isLessThanOrEqual(c)) && ((c).isLessThanOrEqual(new _dafny.CodePoint('z'.codePointAt(0)))));
    };
    static IsUnpaddedBase64String(s) {
      return (((new BigNumber((s).length)).mod(new BigNumber(4))).isEqualTo(_dafny.ZERO)) && (_dafny.Quantifier((s).UniqueElements, true, function (_forall_var_0) {
        let _0_k = _forall_var_0;
        return !(_dafny.Seq.contains(s, _0_k)) || (Std_Base64.__default.IsBase64Char(_0_k));
      }));
    };
    static IndexToChar(i) {
      if ((i).isEqualTo(new BigNumber(63))) {
        return new _dafny.CodePoint('/'.codePointAt(0));
      } else if ((i).isEqualTo(new BigNumber(62))) {
        return new _dafny.CodePoint('+'.codePointAt(0));
      } else if (((new BigNumber(52)).isLessThanOrEqualTo(i)) && ((i).isLessThanOrEqualTo(new BigNumber(61)))) {
        return new _dafny.CodePoint((((i).minus(new BigNumber(4))).mod(new BigNumber(2).exponentiatedBy(6))).toNumber());
      } else if (((new BigNumber(26)).isLessThanOrEqualTo(i)) && ((i).isLessThanOrEqualTo(new BigNumber(51)))) {
        return _dafny.UnicodePlusChar(new _dafny.CodePoint((i).toNumber()), new _dafny.CodePoint((new BigNumber(71)).toNumber()));
      } else {
        return _dafny.UnicodePlusChar(new _dafny.CodePoint((i).toNumber()), new _dafny.CodePoint((new BigNumber(65)).toNumber()));
      }
    };
    static CharToIndex(c) {
      if (_dafny.areEqual(c, new _dafny.CodePoint('/'.codePointAt(0)))) {
        return new BigNumber(63);
      } else if (_dafny.areEqual(c, new _dafny.CodePoint('+'.codePointAt(0)))) {
        return new BigNumber(62);
      } else if (((new _dafny.CodePoint('0'.codePointAt(0))).isLessThanOrEqual(c)) && ((c).isLessThanOrEqual(new _dafny.CodePoint('9'.codePointAt(0))))) {
        return new BigNumber((_dafny.UnicodePlusChar(c, new _dafny.CodePoint((new BigNumber(4)).toNumber()))).value);
      } else if (((new _dafny.CodePoint('a'.codePointAt(0))).isLessThanOrEqual(c)) && ((c).isLessThanOrEqual(new _dafny.CodePoint('z'.codePointAt(0))))) {
        return new BigNumber((_dafny.UnicodeMinusChar(c, new _dafny.CodePoint((new BigNumber(71)).toNumber()))).value);
      } else {
        return new BigNumber((_dafny.UnicodeMinusChar(c, new _dafny.CodePoint((new BigNumber(65)).toNumber()))).value);
      }
    };
    static BV24ToSeq(x) {
      let _0_b0 = _dafny.BitwiseAnd((_dafny.ShiftRight(x, (new BigNumber(16)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), new BigNumber(255));
      let _1_b1 = _dafny.BitwiseAnd((_dafny.ShiftRight(x, (new BigNumber(8)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), new BigNumber(255));
      let _2_b2 = _dafny.BitwiseAnd(x, new BigNumber(255));
      return _dafny.Seq.of(_0_b0, _1_b1, _2_b2);
    };
    static SeqToBV24(x) {
      return _dafny.BitwiseOr(_dafny.BitwiseOr((_dafny.ShiftLeft((x)[_dafny.ZERO], (new BigNumber(16)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), (_dafny.ShiftLeft((x)[_dafny.ONE], (new BigNumber(8)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24))), (x)[new BigNumber(2)]);
    };
    static BV24ToIndexSeq(x) {
      let _0_b0 = _dafny.BitwiseAnd((_dafny.ShiftRight(x, (new BigNumber(18)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), new BigNumber(63));
      let _1_b1 = _dafny.BitwiseAnd((_dafny.ShiftRight(x, (new BigNumber(12)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), new BigNumber(63));
      let _2_b2 = _dafny.BitwiseAnd((_dafny.ShiftRight(x, (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), new BigNumber(63));
      let _3_b3 = _dafny.BitwiseAnd(x, new BigNumber(63));
      return _dafny.Seq.of(_0_b0, _1_b1, _2_b2, _3_b3);
    };
    static IndexSeqToBV24(x) {
      return _dafny.BitwiseOr(_dafny.BitwiseOr(_dafny.BitwiseOr((_dafny.ShiftLeft((x)[_dafny.ZERO], (new BigNumber(18)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24)), (_dafny.ShiftLeft((x)[_dafny.ONE], (new BigNumber(12)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24))), (_dafny.ShiftLeft((x)[new BigNumber(2)], (new BigNumber(6)).toNumber())).mod(new BigNumber(2).exponentiatedBy(24))), (x)[new BigNumber(3)]);
    };
    static DecodeBlock(s) {
      return Std_Base64.__default.BV24ToSeq(Std_Base64.__default.IndexSeqToBV24(s));
    };
    static EncodeBlock(s) {
      return Std_Base64.__default.BV24ToIndexSeq(Std_Base64.__default.SeqToBV24(s));
    };
    static DecodeRecursively(s) {
      let b = _dafny.Seq.of();
      let _0_resultLength;
      _0_resultLength = (_dafny.EuclideanDivision(new BigNumber((s).length), new BigNumber(4))).multipliedBy(new BigNumber(3));
      let _1_result;
      let _init0 = function (_2_i) {
        return _dafny.ZERO;
      };
      let _nw0 = Array((_0_resultLength).toNumber());
      for (let _i0_0 = 0; _i0_0 < new BigNumber(_nw0.length); _i0_0++) {
        _nw0[_i0_0] = _init0(new BigNumber(_i0_0));
      }
      _1_result = _nw0;
      let _3_i;
      _3_i = new BigNumber((s).length);
      let _4_j;
      _4_j = _0_resultLength;
      while ((_dafny.ZERO).isLessThan(_3_i)) {
        _3_i = (_3_i).minus(new BigNumber(4));
        _4_j = (_4_j).minus(new BigNumber(3));
        let _5_block;
        _5_block = Std_Base64.__default.DecodeBlock((s).slice(_3_i, (_3_i).plus(new BigNumber(4))));
        (_1_result)[(_4_j)] = (_5_block)[_dafny.ZERO];
        let _index0 = (_4_j).plus(_dafny.ONE);
        (_1_result)[_index0] = (_5_block)[_dafny.ONE];
        let _index1 = (_4_j).plus(new BigNumber(2));
        (_1_result)[_index1] = (_5_block)[new BigNumber(2)];
      }
      b = _dafny.Seq.of(...(_1_result).slice());
      return b;
    }
    static EncodeRecursively(b) {
      let s = _dafny.Seq.of();
      let _0_resultLength;
      _0_resultLength = (_dafny.EuclideanDivision(new BigNumber((b).length), new BigNumber(3))).multipliedBy(new BigNumber(4));
      let _1_result;
      let _init0 = function (_2_i) {
        return _dafny.ZERO;
      };
      let _nw0 = Array((_0_resultLength).toNumber());
      for (let _i0_0 = 0; _i0_0 < new BigNumber(_nw0.length); _i0_0++) {
        _nw0[_i0_0] = _init0(new BigNumber(_i0_0));
      }
      _1_result = _nw0;
      let _3_i;
      _3_i = new BigNumber((b).length);
      let _4_j;
      _4_j = _0_resultLength;
      while ((_dafny.ZERO).isLessThan(_3_i)) {
        _3_i = (_3_i).minus(new BigNumber(3));
        _4_j = (_4_j).minus(new BigNumber(4));
        let _5_block;
        _5_block = Std_Base64.__default.EncodeBlock((b).slice(_3_i, (_3_i).plus(new BigNumber(3))));
        (_1_result)[(_4_j)] = (_5_block)[_dafny.ZERO];
        let _index0 = (_4_j).plus(_dafny.ONE);
        (_1_result)[_index0] = (_5_block)[_dafny.ONE];
        let _index1 = (_4_j).plus(new BigNumber(2));
        (_1_result)[_index1] = (_5_block)[new BigNumber(2)];
        let _index2 = (_4_j).plus(new BigNumber(3));
        (_1_result)[_index2] = (_5_block)[new BigNumber(3)];
      }
      s = _dafny.Seq.of(...(_1_result).slice());
      return s;
    }
    static FromCharsToIndices(s) {
      return _dafny.Seq.Create(new BigNumber((s).length), ((_0_s) => function (_1_i) {
        return Std_Base64.__default.CharToIndex((_0_s)[_1_i]);
      })(s));
    };
    static FromIndicesToChars(b) {
      return _dafny.Seq.Create(new BigNumber((b).length), ((_0_b) => function (_1_i) {
        return Std_Base64.__default.IndexToChar((_0_b)[_1_i]);
      })(b));
    };
    static DecodeUnpadded(s) {
      return Std_Base64.__default.DecodeRecursively(Std_Base64.__default.FromCharsToIndices(s));
    };
    static EncodeUnpadded(b) {
      return Std_Base64.__default.FromIndicesToChars(Std_Base64.__default.EncodeRecursively(b));
    };
    static Is1Padding(s) {
      return ((((((new BigNumber((s).length)).isEqualTo(new BigNumber(4))) && (Std_Base64.__default.IsBase64Char((s)[_dafny.ZERO]))) && (Std_Base64.__default.IsBase64Char((s)[_dafny.ONE]))) && (Std_Base64.__default.IsBase64Char((s)[new BigNumber(2)]))) && ((_dafny.BitwiseAnd(Std_Base64.__default.CharToIndex((s)[new BigNumber(2)]), new BigNumber(3))).isEqualTo(_dafny.ZERO))) && (_dafny.areEqual((s)[new BigNumber(3)], new _dafny.CodePoint('='.codePointAt(0))));
    };
    static Decode1Padding(s) {
      let _0_d = Std_Base64.__default.DecodeBlock(_dafny.Seq.of(Std_Base64.__default.CharToIndex((s)[_dafny.ZERO]), Std_Base64.__default.CharToIndex((s)[_dafny.ONE]), Std_Base64.__default.CharToIndex((s)[new BigNumber(2)]), _dafny.ZERO));
      return _dafny.Seq.of((_0_d)[_dafny.ZERO], (_0_d)[_dafny.ONE]);
    };
    static Encode1Padding(b) {
      let _0_e = Std_Base64.__default.EncodeBlock(_dafny.Seq.of((b)[_dafny.ZERO], (b)[_dafny.ONE], _dafny.ZERO));
      return _dafny.Seq.of(Std_Base64.__default.IndexToChar((_0_e)[_dafny.ZERO]), Std_Base64.__default.IndexToChar((_0_e)[_dafny.ONE]), Std_Base64.__default.IndexToChar((_0_e)[new BigNumber(2)]), new _dafny.CodePoint('='.codePointAt(0)));
    };
    static Is2Padding(s) {
      return ((((((new BigNumber((s).length)).isEqualTo(new BigNumber(4))) && (Std_Base64.__default.IsBase64Char((s)[_dafny.ZERO]))) && (Std_Base64.__default.IsBase64Char((s)[_dafny.ONE]))) && (((Std_Base64.__default.CharToIndex((s)[_dafny.ONE])).mod(new BigNumber(16))).isEqualTo(_dafny.ZERO))) && (_dafny.areEqual((s)[new BigNumber(2)], new _dafny.CodePoint('='.codePointAt(0))))) && (_dafny.areEqual((s)[new BigNumber(3)], new _dafny.CodePoint('='.codePointAt(0))));
    };
    static Decode2Padding(s) {
      let _0_d = Std_Base64.__default.DecodeBlock(_dafny.Seq.of(Std_Base64.__default.CharToIndex((s)[_dafny.ZERO]), Std_Base64.__default.CharToIndex((s)[_dafny.ONE]), _dafny.ZERO, _dafny.ZERO));
      return _dafny.Seq.of((_0_d)[_dafny.ZERO]);
    };
    static Encode2Padding(b) {
      let _0_e = Std_Base64.__default.EncodeBlock(_dafny.Seq.of((b)[_dafny.ZERO], _dafny.ZERO, _dafny.ZERO));
      return _dafny.Seq.of(Std_Base64.__default.IndexToChar((_0_e)[_dafny.ZERO]), Std_Base64.__default.IndexToChar((_0_e)[_dafny.ONE]), new _dafny.CodePoint('='.codePointAt(0)), new _dafny.CodePoint('='.codePointAt(0)));
    };
    static IsBase64String(s) {
      let _0_finalBlockStart = (new BigNumber((s).length)).minus(new BigNumber(4));
      return (((new BigNumber((s).length)).mod(new BigNumber(4))).isEqualTo(_dafny.ZERO)) && ((Std_Base64.__default.IsUnpaddedBase64String(s)) || ((Std_Base64.__default.IsUnpaddedBase64String((s).slice(0, _0_finalBlockStart))) && ((Std_Base64.__default.Is1Padding((s).slice(_0_finalBlockStart))) || (Std_Base64.__default.Is2Padding((s).slice(_0_finalBlockStart))))));
    };
    static DecodeValid(s) {
      if (_dafny.areEqual(s, _dafny.Seq.of())) {
        return _dafny.Seq.of();
      } else {
        let _0_finalBlockStart = (new BigNumber((s).length)).minus(new BigNumber(4));
        let _1_prefix = (s).slice(0, _0_finalBlockStart);
        let _2_suffix = (s).slice(_0_finalBlockStart);
        if (Std_Base64.__default.Is1Padding(_2_suffix)) {
          return _dafny.Seq.Concat(Std_Base64.__default.DecodeUnpadded(_1_prefix), Std_Base64.__default.Decode1Padding(_2_suffix));
        } else if (Std_Base64.__default.Is2Padding(_2_suffix)) {
          return _dafny.Seq.Concat(Std_Base64.__default.DecodeUnpadded(_1_prefix), Std_Base64.__default.Decode2Padding(_2_suffix));
        } else {
          return Std_Base64.__default.DecodeUnpadded(s);
        }
      }
    };
    static DecodeBV(s) {
      if (Std_Base64.__default.IsBase64String(s)) {
        return Std_Wrappers.Result.create_Success(Std_Base64.__default.DecodeValid(s));
      } else {
        return Std_Wrappers.Result.create_Failure(_dafny.Seq.UnicodeFromString("The encoding is malformed"));
      }
    };
    static EncodeBV(b) {
      if (((new BigNumber((b).length)).mod(new BigNumber(3))).isEqualTo(_dafny.ZERO)) {
        return Std_Base64.__default.EncodeUnpadded(b);
      } else if (((new BigNumber((b).length)).mod(new BigNumber(3))).isEqualTo(_dafny.ONE)) {
        let _0_s1 = Std_Base64.__default.EncodeUnpadded((b).slice(0, (new BigNumber((b).length)).minus(_dafny.ONE)));
        let _1_s2 = Std_Base64.__default.Encode2Padding((b).slice((new BigNumber((b).length)).minus(_dafny.ONE)));
        return _dafny.Seq.Concat(_0_s1, _1_s2);
      } else {
        let _2_s1 = Std_Base64.__default.EncodeUnpadded((b).slice(0, (new BigNumber((b).length)).minus(new BigNumber(2))));
        let _3_s2 = Std_Base64.__default.Encode1Padding((b).slice((new BigNumber((b).length)).minus(new BigNumber(2))));
        return _dafny.Seq.Concat(_2_s1, _3_s2);
      }
    };
    static UInt8sToBVs(u) {
      return _dafny.Seq.Create(new BigNumber((u).length), ((_0_u) => function (_1_i) {
        return new BigNumber((_0_u)[_1_i]);
      })(u));
    };
    static BVsToUInt8s(b) {
      return _dafny.Seq.Create(new BigNumber((b).length), ((_0_b) => function (_1_i) {
        return ((_0_b)[_1_i]).toNumber();
      })(b));
    };
    static Encode(u) {
      return Std_Base64.__default.EncodeBV(Std_Base64.__default.UInt8sToBVs(u));
    };
    static Decode(s) {
      if (Std_Base64.__default.IsBase64String(s)) {
        let _0_b = Std_Base64.__default.DecodeValid(s);
        return Std_Wrappers.Result.create_Success(Std_Base64.__default.BVsToUInt8s(_0_b));
      } else {
        return Std_Wrappers.Result.create_Failure(_dafny.Seq.UnicodeFromString("The encoding is malformed"));
      }
    };
  };
  return $module;
})(); // end of module Std_Base64
let Std_JSON_Values = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.Values._default";
    }
    _parentTraits() {
      return [];
    }
    static Int(n) {
      return Std_JSON_Values.Decimal.create_Decimal(n, _dafny.ZERO);
    };
  };

  $module.Decimal = class Decimal {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Decimal(n, e10) {
      let $dt = new Decimal(0);
      $dt.n = n;
      $dt.e10 = e10;
      return $dt;
    }
    get is_Decimal() { return this.$tag === 0; }
    get dtor_n() { return this.n; }
    get dtor_e10() { return this.e10; }
    toString() {
      if (this.$tag === 0) {
        return "Values.Decimal.Decimal" + "(" + _dafny.toString(this.n) + ", " + _dafny.toString(this.e10) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.n, other.n) && _dafny.areEqual(this.e10, other.e10);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Values.Decimal.create_Decimal(_dafny.ZERO, _dafny.ZERO);
    }
    static Rtd() {
      return class {
        static get Default() {
          return Decimal.Default();
        }
      };
    }
  }

  $module.JSON = class JSON {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Null() {
      let $dt = new JSON(0);
      return $dt;
    }
    static create_Bool(b) {
      let $dt = new JSON(1);
      $dt.b = b;
      return $dt;
    }
    static create_String(str) {
      let $dt = new JSON(2);
      $dt.str = str;
      return $dt;
    }
    static create_Number(num) {
      let $dt = new JSON(3);
      $dt.num = num;
      return $dt;
    }
    static create_Object(obj) {
      let $dt = new JSON(4);
      $dt.obj = obj;
      return $dt;
    }
    static create_Array(arr) {
      let $dt = new JSON(5);
      $dt.arr = arr;
      return $dt;
    }
    get is_Null() { return this.$tag === 0; }
    get is_Bool() { return this.$tag === 1; }
    get is_String() { return this.$tag === 2; }
    get is_Number() { return this.$tag === 3; }
    get is_Object() { return this.$tag === 4; }
    get is_Array() { return this.$tag === 5; }
    get dtor_b() { return this.b; }
    get dtor_str() { return this.str; }
    get dtor_num() { return this.num; }
    get dtor_obj() { return this.obj; }
    get dtor_arr() { return this.arr; }
    toString() {
      if (this.$tag === 0) {
        return "Values.JSON.Null";
      } else if (this.$tag === 1) {
        return "Values.JSON.Bool" + "(" + _dafny.toString(this.b) + ")";
      } else if (this.$tag === 2) {
        return "Values.JSON.String" + "(" + this.str.toVerbatimString(true) + ")";
      } else if (this.$tag === 3) {
        return "Values.JSON.Number" + "(" + _dafny.toString(this.num) + ")";
      } else if (this.$tag === 4) {
        return "Values.JSON.Object" + "(" + _dafny.toString(this.obj) + ")";
      } else if (this.$tag === 5) {
        return "Values.JSON.Array" + "(" + _dafny.toString(this.arr) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && this.b === other.b;
      } else if (this.$tag === 2) {
        return other.$tag === 2 && _dafny.areEqual(this.str, other.str);
      } else if (this.$tag === 3) {
        return other.$tag === 3 && _dafny.areEqual(this.num, other.num);
      } else if (this.$tag === 4) {
        return other.$tag === 4 && _dafny.areEqual(this.obj, other.obj);
      } else if (this.$tag === 5) {
        return other.$tag === 5 && _dafny.areEqual(this.arr, other.arr);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Values.JSON.create_Null();
    }
    static Rtd() {
      return class {
        static get Default() {
          return JSON.Default();
        }
      };
    }
  }
  return $module;
})(); // end of module Std_JSON_Values
let Std_JSON_Errors = (function() {
  let $module = {};


  $module.DeserializationError = class DeserializationError {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_UnterminatedSequence() {
      let $dt = new DeserializationError(0);
      return $dt;
    }
    static create_UnsupportedEscape(str) {
      let $dt = new DeserializationError(1);
      $dt.str = str;
      return $dt;
    }
    static create_EscapeAtEOS() {
      let $dt = new DeserializationError(2);
      return $dt;
    }
    static create_EmptyNumber() {
      let $dt = new DeserializationError(3);
      return $dt;
    }
    static create_ExpectingEOF() {
      let $dt = new DeserializationError(4);
      return $dt;
    }
    static create_IntOverflow() {
      let $dt = new DeserializationError(5);
      return $dt;
    }
    static create_ReachedEOF() {
      let $dt = new DeserializationError(6);
      return $dt;
    }
    static create_ExpectingByte(expected, b) {
      let $dt = new DeserializationError(7);
      $dt.expected = expected;
      $dt.b = b;
      return $dt;
    }
    static create_ExpectingAnyByte(expected__sq, b) {
      let $dt = new DeserializationError(8);
      $dt.expected__sq = expected__sq;
      $dt.b = b;
      return $dt;
    }
    static create_InvalidUnicode(str) {
      let $dt = new DeserializationError(9);
      $dt.str = str;
      return $dt;
    }
    get is_UnterminatedSequence() { return this.$tag === 0; }
    get is_UnsupportedEscape() { return this.$tag === 1; }
    get is_EscapeAtEOS() { return this.$tag === 2; }
    get is_EmptyNumber() { return this.$tag === 3; }
    get is_ExpectingEOF() { return this.$tag === 4; }
    get is_IntOverflow() { return this.$tag === 5; }
    get is_ReachedEOF() { return this.$tag === 6; }
    get is_ExpectingByte() { return this.$tag === 7; }
    get is_ExpectingAnyByte() { return this.$tag === 8; }
    get is_InvalidUnicode() { return this.$tag === 9; }
    get dtor_str() { return this.str; }
    get dtor_expected() { return this.expected; }
    get dtor_b() { return this.b; }
    get dtor_expected__sq() { return this.expected__sq; }
    toString() {
      if (this.$tag === 0) {
        return "Errors.DeserializationError.UnterminatedSequence";
      } else if (this.$tag === 1) {
        return "Errors.DeserializationError.UnsupportedEscape" + "(" + this.str.toVerbatimString(true) + ")";
      } else if (this.$tag === 2) {
        return "Errors.DeserializationError.EscapeAtEOS";
      } else if (this.$tag === 3) {
        return "Errors.DeserializationError.EmptyNumber";
      } else if (this.$tag === 4) {
        return "Errors.DeserializationError.ExpectingEOF";
      } else if (this.$tag === 5) {
        return "Errors.DeserializationError.IntOverflow";
      } else if (this.$tag === 6) {
        return "Errors.DeserializationError.ReachedEOF";
      } else if (this.$tag === 7) {
        return "Errors.DeserializationError.ExpectingByte" + "(" + _dafny.toString(this.expected) + ", " + _dafny.toString(this.b) + ")";
      } else if (this.$tag === 8) {
        return "Errors.DeserializationError.ExpectingAnyByte" + "(" + _dafny.toString(this.expected__sq) + ", " + _dafny.toString(this.b) + ")";
      } else if (this.$tag === 9) {
        return "Errors.DeserializationError.InvalidUnicode" + "(" + this.str.toVerbatimString(true) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.str, other.str);
      } else if (this.$tag === 2) {
        return other.$tag === 2;
      } else if (this.$tag === 3) {
        return other.$tag === 3;
      } else if (this.$tag === 4) {
        return other.$tag === 4;
      } else if (this.$tag === 5) {
        return other.$tag === 5;
      } else if (this.$tag === 6) {
        return other.$tag === 6;
      } else if (this.$tag === 7) {
        return other.$tag === 7 && this.expected === other.expected && this.b === other.b;
      } else if (this.$tag === 8) {
        return other.$tag === 8 && _dafny.areEqual(this.expected__sq, other.expected__sq) && this.b === other.b;
      } else if (this.$tag === 9) {
        return other.$tag === 9 && _dafny.areEqual(this.str, other.str);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Errors.DeserializationError.create_UnterminatedSequence();
    }
    static Rtd() {
      return class {
        static get Default() {
          return DeserializationError.Default();
        }
      };
    }
    ToString() {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_UnterminatedSequence) {
          return _dafny.Seq.UnicodeFromString("Unterminated sequence");
        }
      }
      {
        if (_source0.is_UnsupportedEscape) {
          let _0_str = (_source0).str;
          return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Unsupported escape sequence: "), _0_str);
        }
      }
      {
        if (_source0.is_EscapeAtEOS) {
          return _dafny.Seq.UnicodeFromString("Escape character at end of string");
        }
      }
      {
        if (_source0.is_EmptyNumber) {
          return _dafny.Seq.UnicodeFromString("Number must contain at least one digit");
        }
      }
      {
        if (_source0.is_ExpectingEOF) {
          return _dafny.Seq.UnicodeFromString("Expecting EOF");
        }
      }
      {
        if (_source0.is_IntOverflow) {
          return _dafny.Seq.UnicodeFromString("Input length does not fit in a 32-bit counter");
        }
      }
      {
        if (_source0.is_ReachedEOF) {
          return _dafny.Seq.UnicodeFromString("Reached EOF");
        }
      }
      {
        if (_source0.is_ExpectingByte) {
          let _1_b0 = (_source0).expected;
          let _2_b = (_source0).b;
          let _3_c = (((_2_b) > (0)) ? (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("'"), _dafny.Seq.of(new _dafny.CodePoint((_2_b)))), _dafny.Seq.UnicodeFromString("'"))) : (_dafny.Seq.UnicodeFromString("EOF")));
          return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Expecting '"), _dafny.Seq.of(new _dafny.CodePoint((_1_b0)))), _dafny.Seq.UnicodeFromString("', read ")), _3_c);
        }
      }
      {
        if (_source0.is_ExpectingAnyByte) {
          let _4_bs0 = (_source0).expected__sq;
          let _5_b = (_source0).b;
          let _6_c = (((_5_b) > (0)) ? (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("'"), _dafny.Seq.of(new _dafny.CodePoint((_5_b)))), _dafny.Seq.UnicodeFromString("'"))) : (_dafny.Seq.UnicodeFromString("EOF")));
          let _7_c0s = _dafny.Seq.Create(new BigNumber((_4_bs0).length), ((_8_bs0) => function (_9_idx) {
            return new _dafny.CodePoint(((_8_bs0)[_9_idx]));
          })(_4_bs0));
          return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Expecting one of '"), _7_c0s), _dafny.Seq.UnicodeFromString("', read ")), _6_c);
        }
      }
      {
        let _10_str = (_source0).str;
        if (_dafny.areEqual(_10_str, _dafny.Seq.UnicodeFromString(""))) {
          return _dafny.Seq.UnicodeFromString("Invalid Unicode sequence");
        } else {
          return _10_str;
        }
      }
    };
  }

  $module.SerializationError = class SerializationError {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_OutOfMemory() {
      let $dt = new SerializationError(0);
      return $dt;
    }
    static create_IntTooLarge(i) {
      let $dt = new SerializationError(1);
      $dt.i = i;
      return $dt;
    }
    static create_StringTooLong(s) {
      let $dt = new SerializationError(2);
      $dt.s = s;
      return $dt;
    }
    static create_InvalidUnicode() {
      let $dt = new SerializationError(3);
      return $dt;
    }
    get is_OutOfMemory() { return this.$tag === 0; }
    get is_IntTooLarge() { return this.$tag === 1; }
    get is_StringTooLong() { return this.$tag === 2; }
    get is_InvalidUnicode() { return this.$tag === 3; }
    get dtor_i() { return this.i; }
    get dtor_s() { return this.s; }
    toString() {
      if (this.$tag === 0) {
        return "Errors.SerializationError.OutOfMemory";
      } else if (this.$tag === 1) {
        return "Errors.SerializationError.IntTooLarge" + "(" + _dafny.toString(this.i) + ")";
      } else if (this.$tag === 2) {
        return "Errors.SerializationError.StringTooLong" + "(" + this.s.toVerbatimString(true) + ")";
      } else if (this.$tag === 3) {
        return "Errors.SerializationError.InvalidUnicode";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.i, other.i);
      } else if (this.$tag === 2) {
        return other.$tag === 2 && _dafny.areEqual(this.s, other.s);
      } else if (this.$tag === 3) {
        return other.$tag === 3;
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Errors.SerializationError.create_OutOfMemory();
    }
    static Rtd() {
      return class {
        static get Default() {
          return SerializationError.Default();
        }
      };
    }
    ToString() {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_OutOfMemory) {
          return _dafny.Seq.UnicodeFromString("Out of memory");
        }
      }
      {
        if (_source0.is_IntTooLarge) {
          let _0_i = (_source0).i;
          return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Integer too large: "), Std_Strings.__default.OfInt(_0_i));
        }
      }
      {
        if (_source0.is_StringTooLong) {
          let _1_s = (_source0).s;
          return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("String too long: "), _1_s);
        }
      }
      {
        return _dafny.Seq.UnicodeFromString("Invalid Unicode sequence");
      }
    };
  }
  return $module;
})(); // end of module Std_JSON_Errors
let Std_JSON_Spec = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.Spec._default";
    }
    _parentTraits() {
      return [];
    }
    static EscapeUnicode(c) {
      let _0_sStr = Std_Strings_HexConversion.__default.OfNat(new BigNumber(c));
      let _1_s = Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF16(_0_sStr);
      return _dafny.Seq.Concat(_dafny.Seq.Create((new BigNumber(4)).minus(new BigNumber((_1_s).length)), function (_2___v8) {
        return (new _dafny.CodePoint('0'.codePointAt(0))).value;
      }), _1_s);
    };
    static Escape(str, start) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((str).length)).isLessThanOrEqualTo(start)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, function () {
            let _source0 = (str)[start];
            {
              if ((_source0) === (34)) {
                return Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF16(_dafny.Seq.UnicodeFromString("\\\""));
              }
            }
            {
              if ((_source0) === (92)) {
                return Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF16(_dafny.Seq.UnicodeFromString("\\\\"));
              }
            }
            {
              if ((_source0) === (8)) {
                return Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF16(_dafny.Seq.UnicodeFromString("\\b"));
              }
            }
            {
              if ((_source0) === (12)) {
                return Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF16(_dafny.Seq.UnicodeFromString("\\f"));
              }
            }
            {
              if ((_source0) === (10)) {
                return Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF16(_dafny.Seq.UnicodeFromString("\\n"));
              }
            }
            {
              if ((_source0) === (13)) {
                return Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF16(_dafny.Seq.UnicodeFromString("\\r"));
              }
            }
            {
              if ((_source0) === (9)) {
                return Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF16(_dafny.Seq.UnicodeFromString("\\t"));
              }
            }
            {
              let _1_c = _source0;
              if ((_1_c) < (31)) {
                return _dafny.Seq.Concat(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF16(_dafny.Seq.UnicodeFromString("\\u")), Std_JSON_Spec.__default.EscapeUnicode(_1_c));
              } else {
                return _dafny.Seq.of((str)[start]);
              }
            }
          }());
          let _in0 = str;
          let _in1 = (start).plus(_dafny.ONE);
          str = _in0;
          start = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static EscapeToUTF8(str, start) {
      let _0_valueOrError0 = (Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ToUTF16Checked(str)).ToResult(Std_JSON_Errors.SerializationError.create_InvalidUnicode());
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_utf16 = (_0_valueOrError0).Extract();
        let _2_escaped = Std_JSON_Spec.__default.Escape(_1_utf16, _dafny.ZERO);
        let _3_valueOrError1 = ((Std_Unicode_UnicodeStringsWithUnicodeChar.__default.FromUTF16Checked(_2_escaped)).ToOption()).ToResult(Std_JSON_Errors.SerializationError.create_InvalidUnicode());
        if ((_3_valueOrError1).IsFailure()) {
          return (_3_valueOrError1).PropagateFailure();
        } else {
          let _4_utf32 = (_3_valueOrError1).Extract();
          return (Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ToUTF8Checked(_4_utf32)).ToResult(Std_JSON_Errors.SerializationError.create_InvalidUnicode());
        }
      }
    };
    static String(str) {
      let _0_valueOrError0 = Std_JSON_Spec.__default.EscapeToUTF8(str, _dafny.ZERO);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_inBytes = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success(_dafny.Seq.Concat(_dafny.Seq.Concat(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("\"")), _1_inBytes), Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("\""))));
      }
    };
    static IntToBytes(n) {
      let _0_s = Std_Strings.__default.OfInt(n);
      return Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_0_s);
    };
    static Number(dec) {
      return Std_Wrappers.Result.create_Success(_dafny.Seq.Concat(Std_JSON_Spec.__default.IntToBytes((dec).dtor_n), ((((dec).dtor_e10).isEqualTo(_dafny.ZERO)) ? (_dafny.Seq.of()) : (_dafny.Seq.Concat(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("e")), Std_JSON_Spec.__default.IntToBytes((dec).dtor_e10))))));
    };
    static KeyValue(kv) {
      let _0_valueOrError0 = Std_JSON_Spec.__default.String((kv)[0]);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_key = (_0_valueOrError0).Extract();
        let _2_valueOrError1 = Std_JSON_Spec.__default.JSON((kv)[1]);
        if ((_2_valueOrError1).IsFailure()) {
          return (_2_valueOrError1).PropagateFailure();
        } else {
          let _3_value = (_2_valueOrError1).Extract();
          return Std_Wrappers.Result.create_Success(_dafny.Seq.Concat(_dafny.Seq.Concat(_1_key, Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString(":"))), _3_value));
        }
      }
    };
    static Join(sep, items) {
      if ((new BigNumber((items).length)).isEqualTo(_dafny.ZERO)) {
        return Std_Wrappers.Result.create_Success(_dafny.Seq.of());
      } else {
        let _0_valueOrError0 = (items)[_dafny.ZERO];
        if ((_0_valueOrError0).IsFailure()) {
          return (_0_valueOrError0).PropagateFailure();
        } else {
          let _1_first = (_0_valueOrError0).Extract();
          if ((new BigNumber((items).length)).isEqualTo(_dafny.ONE)) {
            return Std_Wrappers.Result.create_Success(_1_first);
          } else {
            let _2_valueOrError1 = Std_JSON_Spec.__default.Join(sep, (items).slice(_dafny.ONE));
            if ((_2_valueOrError1).IsFailure()) {
              return (_2_valueOrError1).PropagateFailure();
            } else {
              let _3_rest = (_2_valueOrError1).Extract();
              return Std_Wrappers.Result.create_Success(_dafny.Seq.Concat(_dafny.Seq.Concat(_1_first, sep), _3_rest));
            }
          }
        }
      }
    };
    static Object(obj) {
      let _0_valueOrError0 = Std_JSON_Spec.__default.Join(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString(",")), _dafny.Seq.Create(new BigNumber((obj).length), ((_1_obj) => function (_2_i) {
        return Std_JSON_Spec.__default.KeyValue((_1_obj)[_2_i]);
      })(obj)));
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _3_middle = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success(_dafny.Seq.Concat(_dafny.Seq.Concat(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("{")), _3_middle), Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("}"))));
      }
    };
    static Array(arr) {
      let _0_valueOrError0 = Std_JSON_Spec.__default.Join(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString(",")), _dafny.Seq.Create(new BigNumber((arr).length), ((_1_arr) => function (_2_i) {
        return Std_JSON_Spec.__default.JSON((_1_arr)[_2_i]);
      })(arr)));
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _3_middle = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success(_dafny.Seq.Concat(_dafny.Seq.Concat(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("[")), _3_middle), Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("]"))));
      }
    };
    static JSON(js) {
      let _source0 = js;
      {
        if (_source0.is_Null) {
          return Std_Wrappers.Result.create_Success(Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("null")));
        }
      }
      {
        if (_source0.is_Bool) {
          let _0_b = (_source0).b;
          return Std_Wrappers.Result.create_Success(((_0_b) ? (Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("true"))) : (Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ASCIIToUTF8(_dafny.Seq.UnicodeFromString("false")))));
        }
      }
      {
        if (_source0.is_String) {
          let _1_str = (_source0).str;
          return Std_JSON_Spec.__default.String(_1_str);
        }
      }
      {
        if (_source0.is_Number) {
          let _2_dec = (_source0).num;
          return Std_JSON_Spec.__default.Number(_2_dec);
        }
      }
      {
        if (_source0.is_Object) {
          let _3_obj = (_source0).obj;
          return Std_JSON_Spec.__default.Object(_3_obj);
        }
      }
      {
        let _4_arr = (_source0).arr;
        return Std_JSON_Spec.__default.Array(_4_arr);
      }
    };
  };
  return $module;
})(); // end of module Std_JSON_Spec
let Std_JSON_Utils_Views_Core = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.Utils.Views.Core._default";
    }
    _parentTraits() {
      return [];
    }
    static Adjacent(lv, rv) {
      return (((lv).dtor_end) === ((rv).dtor_beg)) && (_dafny.areEqual((lv).dtor_s, (rv).dtor_s));
    };
    static Merge(lv, rv) {
      let _0_dt__update__tmp_h0 = lv;
      let _1_dt__update_hend_h0 = (rv).dtor_end;
      return Std_JSON_Utils_Views_Core.View__.create_View((_0_dt__update__tmp_h0).dtor_s, (_0_dt__update__tmp_h0).dtor_beg, _1_dt__update_hend_h0);
    };
  };

  $module.View = class View {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.create_View(_dafny.Seq.of(), 0, 0);
    }
    static get Default() {
      return Std_JSON_Utils_Views_Core.View.Witness;
    }
  };

  $module.View__ = class View__ {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_View(s, beg, end) {
      let $dt = new View__(0);
      $dt.s = s;
      $dt.beg = beg;
      $dt.end = end;
      return $dt;
    }
    get is_View() { return this.$tag === 0; }
    get dtor_s() { return this.s; }
    get dtor_beg() { return this.beg; }
    get dtor_end() { return this.end; }
    toString() {
      if (this.$tag === 0) {
        return "Core.View_.View" + "(" + _dafny.toString(this.s) + ", " + _dafny.toString(this.beg) + ", " + _dafny.toString(this.end) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.s, other.s) && this.beg === other.beg && this.end === other.end;
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Utils_Views_Core.View__.create_View(_dafny.Seq.of(), 0, 0);
    }
    static Rtd() {
      return class {
        static get Default() {
          return View__.Default();
        }
      };
    }
    Length() {
      let _this = this;
      return ((_this).dtor_end) - ((_this).dtor_beg);
    };
    Bytes() {
      let _this = this;
      return ((_this).dtor_s).slice((_this).dtor_beg, (_this).dtor_end);
    };
    static OfBytes(bs) {
      return Std_JSON_Utils_Views_Core.View__.create_View(bs, (0), (bs).length);
    };
    static OfString(s) {
      return _dafny.Seq.Create(new BigNumber((s).length), ((_0_s) => function (_1_i) {
        return ((_0_s)[_1_i]).value;
      })(s));
    };
    Byte_q(c) {
      let _this = this;
      let _hresult = false;
      _hresult = (((_this).Length()) === (1)) && (((_this).At(0)) === (c));
      return _hresult;
      return _hresult;
    }
    Char_q(c) {
      let _this = this;
      return (_this).Byte_q((c).value);
    };
    At(idx) {
      let _this = this;
      return ((_this).dtor_s)[((_this).dtor_beg) + (idx)];
    };
    Peek() {
      let _this = this;
      if ((_this).Empty_q) {
        return -1;
      } else {
        return (_this).At(0);
      }
    };
    CopyTo(dest, start) {
      let _this = this;
      let _hi0 = (_this).Length();
      for (let _0_idx = 0; _0_idx < _hi0; _0_idx++) {
        let _index0 = (start) + (_0_idx);
        (dest)[_index0] = ((_this).dtor_s)[((_this).dtor_beg) + (_0_idx)];
      }
      return;
    }
    static get Empty() {
      return Std_JSON_Utils_Views_Core.View__.create_View(_dafny.Seq.of(), 0, 0);
    };
    get Empty_q() {
      let _this = this;
      return ((_this).dtor_beg) === ((_this).dtor_end);
    };
  }
  return $module;
})(); // end of module Std_JSON_Utils_Views_Core
let Std_JSON_Utils_Views_Writers = (function() {
  let $module = {};


  $module.Chain = class Chain {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Empty() {
      let $dt = new Chain(0);
      return $dt;
    }
    static create_Chain(previous, v) {
      let $dt = new Chain(1);
      $dt.previous = previous;
      $dt.v = v;
      return $dt;
    }
    get is_Empty() { return this.$tag === 0; }
    get is_Chain() { return this.$tag === 1; }
    get dtor_previous() { return this.previous; }
    get dtor_v() { return this.v; }
    toString() {
      if (this.$tag === 0) {
        return "Writers.Chain.Empty";
      } else if (this.$tag === 1) {
        return "Writers.Chain.Chain" + "(" + _dafny.toString(this.previous) + ", " + _dafny.toString(this.v) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.previous, other.previous) && _dafny.areEqual(this.v, other.v);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Utils_Views_Writers.Chain.create_Empty();
    }
    static Rtd() {
      return class {
        static get Default() {
          return Chain.Default();
        }
      };
    }
    Length() {
      let _this = this;
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((_this).is_Empty) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = (new BigNumber(((_this).dtor_v).Length())).plus(_0___accumulator);
          let _in0 = (_this).dtor_previous;
          _this = _in0;
          ;
          continue TAIL_CALL_START;
        }
      }
    };
    Count() {
      let _this = this;
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((_this).is_Empty) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = (_dafny.ONE).plus(_0___accumulator);
          let _in0 = (_this).dtor_previous;
          _this = _in0;
          ;
          continue TAIL_CALL_START;
        }
      }
    };
    Bytes() {
      let _this = this;
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((_this).is_Empty) {
          return _dafny.Seq.Concat(_dafny.Seq.of(), _0___accumulator);
        } else {
          _0___accumulator = _dafny.Seq.Concat(((_this).dtor_v).Bytes(), _0___accumulator);
          let _in0 = (_this).dtor_previous;
          _this = _in0;
          ;
          continue TAIL_CALL_START;
        }
      }
    };
    Append(v_k) {
      let _this = this;
      if (((_this).is_Chain) && (Std_JSON_Utils_Views_Core.__default.Adjacent((_this).dtor_v, v_k))) {
        return Std_JSON_Utils_Views_Writers.Chain.create_Chain((_this).dtor_previous, Std_JSON_Utils_Views_Core.__default.Merge((_this).dtor_v, v_k));
      } else {
        return Std_JSON_Utils_Views_Writers.Chain.create_Chain(_this, v_k);
      }
    };
    CopyTo(dest, end) {
      let _this = this;
      TAIL_CALL_START: while (true) {
        if ((_this).is_Chain) {
          let _0_end;
          _0_end = (end) - (((_this).dtor_v).Length());
          ((_this).dtor_v).CopyTo(dest, _0_end);
          let _in0 = (_this).dtor_previous;
          let _in1 = dest;
          let _in2 = _0_end;
          _this = _in0;
          ;
          dest = _in1;
          end = _in2;
          continue TAIL_CALL_START;
        }
        return;
        return;
      }
    }
  }

  $module.Writer = class Writer {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Writers.Writer__.create_Writer(0, Std_JSON_Utils_Views_Writers.Chain.create_Empty());
    }
    static get Default() {
      return Std_JSON_Utils_Views_Writers.Writer.Witness;
    }
  };

  $module.Writer__ = class Writer__ {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Writer(length, chain) {
      let $dt = new Writer__(0);
      $dt.length = length;
      $dt.chain = chain;
      return $dt;
    }
    get is_Writer() { return this.$tag === 0; }
    get dtor_length() { return this.length; }
    get dtor_chain() { return this.chain; }
    toString() {
      if (this.$tag === 0) {
        return "Writers.Writer_.Writer" + "(" + _dafny.toString(this.length) + ", " + _dafny.toString(this.chain) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && this.length === other.length && _dafny.areEqual(this.chain, other.chain);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Utils_Views_Writers.Writer__.create_Writer(0, Std_JSON_Utils_Views_Writers.Chain.Default());
    }
    static Rtd() {
      return class {
        static get Default() {
          return Writer__.Default();
        }
      };
    }
    Bytes() {
      let _this = this;
      return ((_this).dtor_chain).Bytes();
    };
    static SaturatedAddU32(a, b) {
      if ((a) <= ((Std_BoundedInts.__default.UINT32__MAX) - (b))) {
        return (a) + (b);
      } else {
        return Std_BoundedInts.__default.UINT32__MAX;
      }
    };
    Append(v_k) {
      let _this = this;
      return Std_JSON_Utils_Views_Writers.Writer__.create_Writer(Std_JSON_Utils_Views_Writers.Writer__.SaturatedAddU32((_this).dtor_length, (v_k).Length()), ((_this).dtor_chain).Append(v_k));
    };
    Then(fn) {
      let _this = this;
      return (fn)(_this);
    };
    CopyTo(dest) {
      let _this = this;
      ((_this).dtor_chain).CopyTo(dest, (_this).dtor_length);
      return;
    }
    ToArray() {
      let _this = this;
      let bs = [];
      let _init0 = function (_0_i) {
        return 0;
      };
      let _nw0 = Array((BigNumber((_this).dtor_length)).toNumber());
      for (let _i0_0 = 0; _i0_0 < new BigNumber(_nw0.length); _i0_0++) {
        _nw0[_i0_0] = _init0(new BigNumber(_i0_0));
      }
      bs = _nw0;
      (_this).CopyTo(bs);
      return bs;
    }
    static get Empty() {
      return Std_JSON_Utils_Views_Writers.Writer__.create_Writer(0, Std_JSON_Utils_Views_Writers.Chain.create_Empty());
    };
    get Unsaturated_q() {
      let _this = this;
      return ((_this).dtor_length) !== (Std_BoundedInts.__default.UINT32__MAX);
    };
    get Empty_q() {
      let _this = this;
      return ((_this).dtor_chain).is_Empty;
    };
  }
  return $module;
})(); // end of module Std_JSON_Utils_Views_Writers
let Std_JSON_Utils_Lexers_Core = (function() {
  let $module = {};


  $module.LexerResult = class LexerResult {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Accept() {
      let $dt = new LexerResult(0);
      return $dt;
    }
    static create_Reject(err) {
      let $dt = new LexerResult(1);
      $dt.err = err;
      return $dt;
    }
    static create_Partial(st) {
      let $dt = new LexerResult(2);
      $dt.st = st;
      return $dt;
    }
    get is_Accept() { return this.$tag === 0; }
    get is_Reject() { return this.$tag === 1; }
    get is_Partial() { return this.$tag === 2; }
    get dtor_err() { return this.err; }
    get dtor_st() { return this.st; }
    toString() {
      if (this.$tag === 0) {
        return "Core.LexerResult.Accept";
      } else if (this.$tag === 1) {
        return "Core.LexerResult.Reject" + "(" + _dafny.toString(this.err) + ")";
      } else if (this.$tag === 2) {
        return "Core.LexerResult.Partial" + "(" + _dafny.toString(this.st) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.err, other.err);
      } else if (this.$tag === 2) {
        return other.$tag === 2 && _dafny.areEqual(this.st, other.st);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Utils_Lexers_Core.LexerResult.create_Accept();
    }
    static Rtd() {
      return class {
        static get Default() {
          return LexerResult.Default();
        }
      };
    }
  }
  return $module;
})(); // end of module Std_JSON_Utils_Lexers_Core
let Std_JSON_Utils_Lexers_Strings = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.Utils.Lexers.Strings._default";
    }
    _parentTraits() {
      return [];
    }
    static StringBody(escaped, _$$_byte) {
      if ((_$$_byte) === ((new _dafny.CodePoint('\\'.codePointAt(0))).value)) {
        return Std_JSON_Utils_Lexers_Core.LexerResult.create_Partial(!(escaped));
      } else if (((_$$_byte) === ((new _dafny.CodePoint('\"'.codePointAt(0))).value)) && (!(escaped))) {
        return Std_JSON_Utils_Lexers_Core.LexerResult.create_Accept();
      } else {
        return Std_JSON_Utils_Lexers_Core.LexerResult.create_Partial(false);
      }
    };
    static String(st, _$$_byte) {
      let _source0 = st;
      {
        if (_source0.is_Start) {
          if ((_$$_byte) === ((new _dafny.CodePoint('\"'.codePointAt(0))).value)) {
            return Std_JSON_Utils_Lexers_Core.LexerResult.create_Partial(Std_JSON_Utils_Lexers_Strings.StringLexerState.create_Body(false));
          } else {
            return Std_JSON_Utils_Lexers_Core.LexerResult.create_Reject(_dafny.Seq.UnicodeFromString("String must start with double quote"));
          }
        }
      }
      {
        if (_source0.is_End) {
          return Std_JSON_Utils_Lexers_Core.LexerResult.create_Accept();
        }
      }
      {
        let _0_escaped = (_source0).escaped;
        if ((_$$_byte) === ((new _dafny.CodePoint('\\'.codePointAt(0))).value)) {
          return Std_JSON_Utils_Lexers_Core.LexerResult.create_Partial(Std_JSON_Utils_Lexers_Strings.StringLexerState.create_Body(!(_0_escaped)));
        } else if (((_$$_byte) === ((new _dafny.CodePoint('\"'.codePointAt(0))).value)) && (!(_0_escaped))) {
          return Std_JSON_Utils_Lexers_Core.LexerResult.create_Partial(Std_JSON_Utils_Lexers_Strings.StringLexerState.create_End());
        } else {
          return Std_JSON_Utils_Lexers_Core.LexerResult.create_Partial(Std_JSON_Utils_Lexers_Strings.StringLexerState.create_Body(false));
        }
      }
    };
    static get StringBodyLexerStart() {
      return false;
    };
    static get StringLexerStart() {
      return Std_JSON_Utils_Lexers_Strings.StringLexerState.create_Start();
    };
  };

  $module.StringLexerState = class StringLexerState {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Start() {
      let $dt = new StringLexerState(0);
      return $dt;
    }
    static create_Body(escaped) {
      let $dt = new StringLexerState(1);
      $dt.escaped = escaped;
      return $dt;
    }
    static create_End() {
      let $dt = new StringLexerState(2);
      return $dt;
    }
    get is_Start() { return this.$tag === 0; }
    get is_Body() { return this.$tag === 1; }
    get is_End() { return this.$tag === 2; }
    get dtor_escaped() { return this.escaped; }
    toString() {
      if (this.$tag === 0) {
        return "Strings.StringLexerState.Start";
      } else if (this.$tag === 1) {
        return "Strings.StringLexerState.Body" + "(" + _dafny.toString(this.escaped) + ")";
      } else if (this.$tag === 2) {
        return "Strings.StringLexerState.End";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && this.escaped === other.escaped;
      } else if (this.$tag === 2) {
        return other.$tag === 2;
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Utils_Lexers_Strings.StringLexerState.create_Start();
    }
    static Rtd() {
      return class {
        static get Default() {
          return StringLexerState.Default();
        }
      };
    }
  }
  return $module;
})(); // end of module Std_JSON_Utils_Lexers_Strings
let Std_JSON_Utils_Lexers = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_JSON_Utils_Lexers
let Std_JSON_Utils_Cursors = (function() {
  let $module = {};


  $module.Split = class Split {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_SP(t, cs) {
      let $dt = new Split(0);
      $dt.t = t;
      $dt.cs = cs;
      return $dt;
    }
    get is_SP() { return this.$tag === 0; }
    get dtor_t() { return this.t; }
    get dtor_cs() { return this.cs; }
    toString() {
      if (this.$tag === 0) {
        return "Cursors.Split.SP" + "(" + _dafny.toString(this.t) + ", " + _dafny.toString(this.cs) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.t, other.t) && _dafny.areEqual(this.cs, other.cs);
      } else  {
        return false; // unexpected
      }
    }
    static Default(_default_T) {
      return Std_JSON_Utils_Cursors.Split.create_SP(_default_T, Std_JSON_Utils_Cursors.FreshCursor.Default);
    }
    static Rtd(rtd$_T) {
      return class {
        static get Default() {
          return Split.Default(rtd$_T.Default);
        }
      };
    }
  }

  $module.Cursor = class Cursor {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Cursors.Cursor__.create_Cursor(_dafny.Seq.of(), 0, 0, 0);
    }
    static get Default() {
      return Std_JSON_Utils_Cursors.Cursor.Witness;
    }
  };

  $module.FreshCursor = class FreshCursor {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Cursors.Cursor__.create_Cursor(_dafny.Seq.of(), 0, 0, 0);
    }
    static get Default() {
      return Std_JSON_Utils_Cursors.FreshCursor.Witness;
    }
  };

  $module.CursorError = class CursorError {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_EOF() {
      let $dt = new CursorError(0);
      return $dt;
    }
    static create_ExpectingByte(expected, b) {
      let $dt = new CursorError(1);
      $dt.expected = expected;
      $dt.b = b;
      return $dt;
    }
    static create_ExpectingAnyByte(expected__sq, b) {
      let $dt = new CursorError(2);
      $dt.expected__sq = expected__sq;
      $dt.b = b;
      return $dt;
    }
    static create_OtherError(err) {
      let $dt = new CursorError(3);
      $dt.err = err;
      return $dt;
    }
    get is_EOF() { return this.$tag === 0; }
    get is_ExpectingByte() { return this.$tag === 1; }
    get is_ExpectingAnyByte() { return this.$tag === 2; }
    get is_OtherError() { return this.$tag === 3; }
    get dtor_expected() { return this.expected; }
    get dtor_b() { return this.b; }
    get dtor_expected__sq() { return this.expected__sq; }
    get dtor_err() { return this.err; }
    toString() {
      if (this.$tag === 0) {
        return "Cursors.CursorError.EOF";
      } else if (this.$tag === 1) {
        return "Cursors.CursorError.ExpectingByte" + "(" + _dafny.toString(this.expected) + ", " + _dafny.toString(this.b) + ")";
      } else if (this.$tag === 2) {
        return "Cursors.CursorError.ExpectingAnyByte" + "(" + _dafny.toString(this.expected__sq) + ", " + _dafny.toString(this.b) + ")";
      } else if (this.$tag === 3) {
        return "Cursors.CursorError.OtherError" + "(" + _dafny.toString(this.err) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && this.expected === other.expected && this.b === other.b;
      } else if (this.$tag === 2) {
        return other.$tag === 2 && _dafny.areEqual(this.expected__sq, other.expected__sq) && this.b === other.b;
      } else if (this.$tag === 3) {
        return other.$tag === 3 && _dafny.areEqual(this.err, other.err);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Utils_Cursors.CursorError.create_EOF();
    }
    static Rtd() {
      return class {
        static get Default() {
          return CursorError.Default();
        }
      };
    }
    ToString(pr) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_EOF) {
          return _dafny.Seq.UnicodeFromString("Reached EOF");
        }
      }
      {
        if (_source0.is_ExpectingByte) {
          let _0_b0 = (_source0).expected;
          let _1_b = (_source0).b;
          let _2_c = (((_1_b) > (0)) ? (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("'"), _dafny.Seq.of(new _dafny.CodePoint((_1_b)))), _dafny.Seq.UnicodeFromString("'"))) : (_dafny.Seq.UnicodeFromString("EOF")));
          return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Expecting '"), _dafny.Seq.of(new _dafny.CodePoint((_0_b0)))), _dafny.Seq.UnicodeFromString("', read ")), _2_c);
        }
      }
      {
        if (_source0.is_ExpectingAnyByte) {
          let _3_bs0 = (_source0).expected__sq;
          let _4_b = (_source0).b;
          let _5_c = (((_4_b) > (0)) ? (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("'"), _dafny.Seq.of(new _dafny.CodePoint((_4_b)))), _dafny.Seq.UnicodeFromString("'"))) : (_dafny.Seq.UnicodeFromString("EOF")));
          let _6_c0s = _dafny.Seq.Create(new BigNumber((_3_bs0).length), ((_7_bs0) => function (_8_idx) {
            return new _dafny.CodePoint(((_7_bs0)[_8_idx]));
          })(_3_bs0));
          return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Expecting one of '"), _6_c0s), _dafny.Seq.UnicodeFromString("', read ")), _5_c);
        }
      }
      {
        let _9_err = (_source0).err;
        return (pr)(_9_err);
      }
    };
  }

  $module.Cursor__ = class Cursor__ {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Cursor(s, beg, point, end) {
      let $dt = new Cursor__(0);
      $dt.s = s;
      $dt.beg = beg;
      $dt.point = point;
      $dt.end = end;
      return $dt;
    }
    get is_Cursor() { return this.$tag === 0; }
    get dtor_s() { return this.s; }
    get dtor_beg() { return this.beg; }
    get dtor_point() { return this.point; }
    get dtor_end() { return this.end; }
    toString() {
      if (this.$tag === 0) {
        return "Cursors.Cursor_.Cursor" + "(" + _dafny.toString(this.s) + ", " + _dafny.toString(this.beg) + ", " + _dafny.toString(this.point) + ", " + _dafny.toString(this.end) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.s, other.s) && this.beg === other.beg && this.point === other.point && this.end === other.end;
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Utils_Cursors.Cursor__.create_Cursor(_dafny.Seq.of(), 0, 0, 0);
    }
    static Rtd() {
      return class {
        static get Default() {
          return Cursor__.Default();
        }
      };
    }
    static OfView(v) {
      return Std_JSON_Utils_Cursors.Cursor__.create_Cursor((v).dtor_s, (v).dtor_beg, (v).dtor_beg, (v).dtor_end);
    };
    static OfBytes(bs) {
      return Std_JSON_Utils_Cursors.Cursor__.create_Cursor(bs, 0, 0, (bs).length);
    };
    Bytes() {
      let _this = this;
      return ((_this).dtor_s).slice((_this).dtor_beg, (_this).dtor_end);
    };
    Prefix() {
      let _this = this;
      return Std_JSON_Utils_Views_Core.View__.create_View((_this).dtor_s, (_this).dtor_beg, (_this).dtor_point);
    };
    Suffix() {
      let _this = this;
      let _0_dt__update__tmp_h0 = _this;
      let _1_dt__update_hbeg_h0 = (_this).dtor_point;
      return Std_JSON_Utils_Cursors.Cursor__.create_Cursor((_0_dt__update__tmp_h0).dtor_s, _1_dt__update_hbeg_h0, (_0_dt__update__tmp_h0).dtor_point, (_0_dt__update__tmp_h0).dtor_end);
    };
    Split() {
      let _this = this;
      return Std_JSON_Utils_Cursors.Split.create_SP((_this).Prefix(), (_this).Suffix());
    };
    PrefixLength() {
      let _this = this;
      return ((_this).dtor_point) - ((_this).dtor_beg);
    };
    SuffixLength() {
      let _this = this;
      return ((_this).dtor_end) - ((_this).dtor_point);
    };
    Length() {
      let _this = this;
      return ((_this).dtor_end) - ((_this).dtor_beg);
    };
    At(idx) {
      let _this = this;
      return ((_this).dtor_s)[((_this).dtor_beg) + (idx)];
    };
    SuffixAt(idx) {
      let _this = this;
      return ((_this).dtor_s)[((_this).dtor_point) + (idx)];
    };
    Peek() {
      let _this = this;
      if ((_this).EOF_q) {
        return -1;
      } else {
        return (_this).SuffixAt(0);
      }
    };
    LookingAt(c) {
      let _this = this;
      return ((_this).Peek()) === ((c).value);
    };
    Skip(n) {
      let _this = this;
      let _0_dt__update__tmp_h0 = _this;
      let _1_dt__update_hpoint_h0 = ((_this).dtor_point) + (n);
      return Std_JSON_Utils_Cursors.Cursor__.create_Cursor((_0_dt__update__tmp_h0).dtor_s, (_0_dt__update__tmp_h0).dtor_beg, _1_dt__update_hpoint_h0, (_0_dt__update__tmp_h0).dtor_end);
    };
    Unskip(n) {
      let _this = this;
      let _0_dt__update__tmp_h0 = _this;
      let _1_dt__update_hpoint_h0 = ((_this).dtor_point) - (n);
      return Std_JSON_Utils_Cursors.Cursor__.create_Cursor((_0_dt__update__tmp_h0).dtor_s, (_0_dt__update__tmp_h0).dtor_beg, _1_dt__update_hpoint_h0, (_0_dt__update__tmp_h0).dtor_end);
    };
    Get(err) {
      let _this = this;
      if ((_this).EOF_q) {
        return Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_OtherError(err));
      } else {
        return Std_Wrappers.Result.create_Success((_this).Skip(1));
      }
    };
    AssertByte(b) {
      let _this = this;
      let _0_nxt = (_this).Peek();
      if ((_0_nxt) === (b)) {
        return Std_Wrappers.Result.create_Success((_this).Skip(1));
      } else {
        return Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_ExpectingByte(b, _0_nxt));
      }
    };
    AssertBytes(bs, offset) {
      let _this = this;
      TAIL_CALL_START: while (true) {
        if ((offset) === ((bs).length)) {
          return Std_Wrappers.Result.create_Success(_this);
        } else {
          let _0_valueOrError0 = (_this).AssertByte((bs)[offset]);
          if ((_0_valueOrError0).IsFailure()) {
            return (_0_valueOrError0).PropagateFailure();
          } else {
            let _1_ps = (_0_valueOrError0).Extract();
            let _in0 = _1_ps;
            let _in1 = bs;
            let _in2 = (offset) + (1);
            _this = _in0;
            ;
            bs = _in1;
            offset = _in2;
            continue TAIL_CALL_START;
          }
        }
      }
    };
    AssertChar(c0) {
      let _this = this;
      return (_this).AssertByte((c0).value);
    };
    SkipByte() {
      let _this = this;
      if ((_this).EOF_q) {
        return _this;
      } else {
        return (_this).Skip(1);
      }
    };
    SkipIf(p) {
      let _this = this;
      if (((_this).EOF_q) || (!((p)((_this).SuffixAt(0))))) {
        return _this;
      } else {
        return (_this).Skip(1);
      }
    };
    SkipWhile(p) {
      let _this = this;
      let ps = Std_JSON_Utils_Cursors.Cursor.Default;
      let _0_point_k;
      _0_point_k = (_this).dtor_point;
      let _1_end;
      _1_end = (_this).dtor_end;
      while (((_0_point_k) < (_1_end)) && ((p)(((_this).dtor_s)[_0_point_k]))) {
        _0_point_k = (_0_point_k) + (1);
      }
      ps = Std_JSON_Utils_Cursors.Cursor__.create_Cursor((_this).dtor_s, (_this).dtor_beg, _0_point_k, (_this).dtor_end);
      return ps;
      return ps;
    }
    SkipWhileLexer(step, st) {
      let _this = this;
      let pr = Std_Wrappers.Result.Default(Std_JSON_Utils_Cursors.Cursor.Default);
      let _0_point_k;
      _0_point_k = (_this).dtor_point;
      let _1_end;
      _1_end = (_this).dtor_end;
      let _2_st_k;
      _2_st_k = st;
      while (true) {
        let _3_eof;
        _3_eof = (_0_point_k) === (_1_end);
        let _4_minusone;
        _4_minusone = -1;
        let _5_c;
        if (_3_eof) {
          _5_c = _4_minusone;
        } else {
          _5_c = ((_this).dtor_s)[_0_point_k];
        }
        let _source0 = (step)(_2_st_k, _5_c);
        Lmatch0: {
          {
            if (_source0.is_Accept) {
              pr = Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Cursor__.create_Cursor((_this).dtor_s, (_this).dtor_beg, _0_point_k, (_this).dtor_end));
              return pr;
              break Lmatch0;
            }
          }
          {
            if (_source0.is_Reject) {
              let _6_err = (_source0).err;
              pr = Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_OtherError(_6_err));
              return pr;
              break Lmatch0;
            }
          }
          {
            let _7_st_k_k = (_source0).st;
            if (_3_eof) {
              pr = Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_EOF());
              return pr;
            } else {
              _2_st_k = _7_st_k_k;
              _0_point_k = (_0_point_k) + (1);
            }
          }
        }
      }
      return pr;
    }
    get BOF_q() {
      let _this = this;
      return ((_this).dtor_point) === ((_this).dtor_beg);
    };
    get EOF_q() {
      let _this = this;
      return ((_this).dtor_point) === ((_this).dtor_end);
    };
  }
  return $module;
})(); // end of module Std_JSON_Utils_Cursors
let Std_JSON_Utils_Parsers = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.Utils.Parsers._default";
    }
    _parentTraits() {
      return [];
    }
    static ParserWitness() {
      return function (_0___v9) {
        return Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_EOF());
      };
    };
    static SubParserWitness() {
      return function (_0_cs) {
        return Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_EOF());
      };
    };
  };

  $module.Parser = class Parser {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Parsers.__default.ParserWitness();
    }
    static get Default() {
      return Std_JSON_Utils_Parsers.Parser.Witness;
    }
  };

  $module.Parser__ = class Parser__ {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Parser(fn) {
      let $dt = new Parser__(0);
      $dt.fn = fn;
      return $dt;
    }
    get is_Parser() { return this.$tag === 0; }
    get dtor_fn() { return this.fn; }
    toString() {
      if (this.$tag === 0) {
        return "Parsers.Parser_.Parser" + "(" + _dafny.toString(this.fn) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.fn, other.fn);
      } else  {
        return false; // unexpected
      }
    }
    static Default(_default_T) {
      return function () { return Std_Wrappers.Result.Default(Std_JSON_Utils_Cursors.Split.Default(_default_T)); };
    }
    static Rtd(rtd$_T) {
      return class {
        static get Default() {
          return Parser__.Default(rtd$_T.Default);
        }
      };
    }
  }

  $module.SubParser__ = class SubParser__ {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_SubParser(fn) {
      let $dt = new SubParser__(0);
      $dt.fn = fn;
      return $dt;
    }
    get is_SubParser() { return this.$tag === 0; }
    get dtor_fn() { return this.fn; }
    toString() {
      if (this.$tag === 0) {
        return "Parsers.SubParser_.SubParser" + "(" + _dafny.toString(this.fn) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.fn, other.fn);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return null;
    }
    static Rtd() {
      return class {
        static get Default() {
          return SubParser__.Default();
        }
      };
    }
  }

  $module.SubParser = class SubParser {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Parsers.__default.SubParserWitness();
    }
    static get Default() {
      return Std_JSON_Utils_Parsers.SubParser.Witness;
    }
  };
  return $module;
})(); // end of module Std_JSON_Utils_Parsers
let Std_JSON_Grammar = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.Grammar._default";
    }
    _parentTraits() {
      return [];
    }
    static Blank_q(b) {
      return ((((b) === (32)) || ((b) === (9))) || ((b) === (10))) || ((b) === (13));
    };
    static Digit_q(b) {
      return (((new _dafny.CodePoint('0'.codePointAt(0))).value) <= (b)) && ((b) <= ((new _dafny.CodePoint('9'.codePointAt(0))).value));
    };
    static get NULL() {
      return _dafny.Seq.of((new _dafny.CodePoint('n'.codePointAt(0))).value, (new _dafny.CodePoint('u'.codePointAt(0))).value, (new _dafny.CodePoint('l'.codePointAt(0))).value, (new _dafny.CodePoint('l'.codePointAt(0))).value);
    };
    static get TRUE() {
      return _dafny.Seq.of((new _dafny.CodePoint('t'.codePointAt(0))).value, (new _dafny.CodePoint('r'.codePointAt(0))).value, (new _dafny.CodePoint('u'.codePointAt(0))).value, (new _dafny.CodePoint('e'.codePointAt(0))).value);
    };
    static get FALSE() {
      return _dafny.Seq.of((new _dafny.CodePoint('f'.codePointAt(0))).value, (new _dafny.CodePoint('a'.codePointAt(0))).value, (new _dafny.CodePoint('l'.codePointAt(0))).value, (new _dafny.CodePoint('s'.codePointAt(0))).value, (new _dafny.CodePoint('e'.codePointAt(0))).value);
    };
    static get DOUBLEQUOTE() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('\"'.codePointAt(0))).value));
    };
    static get PERIOD() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('.'.codePointAt(0))).value));
    };
    static get E() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('e'.codePointAt(0))).value));
    };
    static get COLON() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint(':'.codePointAt(0))).value));
    };
    static get COMMA() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint(','.codePointAt(0))).value));
    };
    static get LBRACE() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('{'.codePointAt(0))).value));
    };
    static get RBRACE() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('}'.codePointAt(0))).value));
    };
    static get LBRACKET() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('['.codePointAt(0))).value));
    };
    static get RBRACKET() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint(']'.codePointAt(0))).value));
    };
    static get MINUS() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('-'.codePointAt(0))).value));
    };
    static get EMPTY() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of());
    };
  };

  $module.jchar = class jchar {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('b'.codePointAt(0))).value));
    }
    static get Default() {
      return Std_JSON_Grammar.jchar.Witness;
    }
  };

  $module.jquote = class jquote {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.DOUBLEQUOTE;
    }
    static get Default() {
      return Std_JSON_Grammar.jquote.Witness;
    }
  };

  $module.jperiod = class jperiod {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.PERIOD;
    }
    static get Default() {
      return Std_JSON_Grammar.jperiod.Witness;
    }
  };

  $module.je = class je {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.E;
    }
    static get Default() {
      return Std_JSON_Grammar.je.Witness;
    }
  };

  $module.jcolon = class jcolon {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.COLON;
    }
    static get Default() {
      return Std_JSON_Grammar.jcolon.Witness;
    }
  };

  $module.jcomma = class jcomma {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.COMMA;
    }
    static get Default() {
      return Std_JSON_Grammar.jcomma.Witness;
    }
  };

  $module.jlbrace = class jlbrace {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.LBRACE;
    }
    static get Default() {
      return Std_JSON_Grammar.jlbrace.Witness;
    }
  };

  $module.jrbrace = class jrbrace {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.RBRACE;
    }
    static get Default() {
      return Std_JSON_Grammar.jrbrace.Witness;
    }
  };

  $module.jlbracket = class jlbracket {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.LBRACKET;
    }
    static get Default() {
      return Std_JSON_Grammar.jlbracket.Witness;
    }
  };

  $module.jrbracket = class jrbracket {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.RBRACKET;
    }
    static get Default() {
      return Std_JSON_Grammar.jrbracket.Witness;
    }
  };

  $module.jminus = class jminus {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.MINUS;
    }
    static get Default() {
      return Std_JSON_Grammar.jminus.Witness;
    }
  };

  $module.jsign = class jsign {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Grammar.__default.EMPTY;
    }
    static get Default() {
      return Std_JSON_Grammar.jsign.Witness;
    }
  };

  $module.jblanks = class jblanks {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of());
    }
    static get Default() {
      return Std_JSON_Grammar.jblanks.Witness;
    }
  };

  $module.Structural = class Structural {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Structural(before, t, after) {
      let $dt = new Structural(0);
      $dt.before = before;
      $dt.t = t;
      $dt.after = after;
      return $dt;
    }
    get is_Structural() { return this.$tag === 0; }
    get dtor_before() { return this.before; }
    get dtor_t() { return this.t; }
    get dtor_after() { return this.after; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.Structural.Structural" + "(" + _dafny.toString(this.before) + ", " + _dafny.toString(this.t) + ", " + _dafny.toString(this.after) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.before, other.before) && _dafny.areEqual(this.t, other.t) && _dafny.areEqual(this.after, other.after);
      } else  {
        return false; // unexpected
      }
    }
    static Default(_default_T) {
      return Std_JSON_Grammar.Structural.create_Structural(Std_JSON_Grammar.jblanks.Default, _default_T, Std_JSON_Grammar.jblanks.Default);
    }
    static Rtd(rtd$_T) {
      return class {
        static get Default() {
          return Structural.Default(rtd$_T.Default);
        }
      };
    }
  }

  $module.Maybe = class Maybe {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Empty() {
      let $dt = new Maybe(0);
      return $dt;
    }
    static create_NonEmpty(t) {
      let $dt = new Maybe(1);
      $dt.t = t;
      return $dt;
    }
    get is_Empty() { return this.$tag === 0; }
    get is_NonEmpty() { return this.$tag === 1; }
    get dtor_t() { return this.t; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.Maybe.Empty";
      } else if (this.$tag === 1) {
        return "Grammar.Maybe.NonEmpty" + "(" + _dafny.toString(this.t) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.t, other.t);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Grammar.Maybe.create_Empty();
    }
    static Rtd() {
      return class {
        static get Default() {
          return Maybe.Default();
        }
      };
    }
  }

  $module.Suffixed = class Suffixed {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Suffixed(t, suffix) {
      let $dt = new Suffixed(0);
      $dt.t = t;
      $dt.suffix = suffix;
      return $dt;
    }
    get is_Suffixed() { return this.$tag === 0; }
    get dtor_t() { return this.t; }
    get dtor_suffix() { return this.suffix; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.Suffixed.Suffixed" + "(" + _dafny.toString(this.t) + ", " + _dafny.toString(this.suffix) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.t, other.t) && _dafny.areEqual(this.suffix, other.suffix);
      } else  {
        return false; // unexpected
      }
    }
    static Default(_default_T) {
      return Std_JSON_Grammar.Suffixed.create_Suffixed(_default_T, Std_JSON_Grammar.Maybe.Default());
    }
    static Rtd(rtd$_T) {
      return class {
        static get Default() {
          return Suffixed.Default(rtd$_T.Default);
        }
      };
    }
  }

  $module.SuffixedSequence = class SuffixedSequence {
    constructor () {
    }
    static get Default() {
      return _dafny.Seq.of();
    }
  };

  $module.Bracketed = class Bracketed {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Bracketed(l, data, r) {
      let $dt = new Bracketed(0);
      $dt.l = l;
      $dt.data = data;
      $dt.r = r;
      return $dt;
    }
    get is_Bracketed() { return this.$tag === 0; }
    get dtor_l() { return this.l; }
    get dtor_data() { return this.data; }
    get dtor_r() { return this.r; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.Bracketed.Bracketed" + "(" + _dafny.toString(this.l) + ", " + _dafny.toString(this.data) + ", " + _dafny.toString(this.r) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.l, other.l) && _dafny.areEqual(this.data, other.data) && _dafny.areEqual(this.r, other.r);
      } else  {
        return false; // unexpected
      }
    }
    static Default(_default_L, _default_R) {
      return Std_JSON_Grammar.Bracketed.create_Bracketed(Std_JSON_Grammar.Structural.Default(_default_L), _dafny.Seq.of(), Std_JSON_Grammar.Structural.Default(_default_R));
    }
    static Rtd(rtd$_L, rtd$_R) {
      return class {
        static get Default() {
          return Bracketed.Default(rtd$_L.Default, rtd$_R.Default);
        }
      };
    }
  }

  $module.jnull = class jnull {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(Std_JSON_Grammar.__default.NULL);
    }
    static get Default() {
      return Std_JSON_Grammar.jnull.Witness;
    }
  };

  $module.jbool = class jbool {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(Std_JSON_Grammar.__default.TRUE);
    }
    static get Default() {
      return Std_JSON_Grammar.jbool.Witness;
    }
  };

  $module.jdigits = class jdigits {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of());
    }
    static get Default() {
      return Std_JSON_Grammar.jdigits.Witness;
    }
  };

  $module.jnum = class jnum {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('0'.codePointAt(0))).value));
    }
    static get Default() {
      return Std_JSON_Grammar.jnum.Witness;
    }
  };

  $module.jint = class jint {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('0'.codePointAt(0))).value));
    }
    static get Default() {
      return Std_JSON_Grammar.jint.Witness;
    }
  };

  $module.jstr = class jstr {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of());
    }
    static get Default() {
      return Std_JSON_Grammar.jstr.Witness;
    }
  };

  $module.jstring = class jstring {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_JString(lq, contents, rq) {
      let $dt = new jstring(0);
      $dt.lq = lq;
      $dt.contents = contents;
      $dt.rq = rq;
      return $dt;
    }
    get is_JString() { return this.$tag === 0; }
    get dtor_lq() { return this.lq; }
    get dtor_contents() { return this.contents; }
    get dtor_rq() { return this.rq; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.jstring.JString" + "(" + _dafny.toString(this.lq) + ", " + _dafny.toString(this.contents) + ", " + _dafny.toString(this.rq) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.lq, other.lq) && _dafny.areEqual(this.contents, other.contents) && _dafny.areEqual(this.rq, other.rq);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Grammar.jstring.create_JString(Std_JSON_Grammar.jquote.Default, Std_JSON_Grammar.jstr.Default, Std_JSON_Grammar.jquote.Default);
    }
    static Rtd() {
      return class {
        static get Default() {
          return jstring.Default();
        }
      };
    }
  }

  $module.jKeyValue = class jKeyValue {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_KeyValue(k, colon, v) {
      let $dt = new jKeyValue(0);
      $dt.k = k;
      $dt.colon = colon;
      $dt.v = v;
      return $dt;
    }
    get is_KeyValue() { return this.$tag === 0; }
    get dtor_k() { return this.k; }
    get dtor_colon() { return this.colon; }
    get dtor_v() { return this.v; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.jKeyValue.KeyValue" + "(" + _dafny.toString(this.k) + ", " + _dafny.toString(this.colon) + ", " + _dafny.toString(this.v) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.k, other.k) && _dafny.areEqual(this.colon, other.colon) && _dafny.areEqual(this.v, other.v);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Grammar.jKeyValue.create_KeyValue(Std_JSON_Grammar.jstring.Default(), Std_JSON_Grammar.Structural.Default(Std_JSON_Grammar.jcolon.Default), Std_JSON_Grammar.Value.Default());
    }
    static Rtd() {
      return class {
        static get Default() {
          return jKeyValue.Default();
        }
      };
    }
  }

  $module.jfrac = class jfrac {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_JFrac(period, num) {
      let $dt = new jfrac(0);
      $dt.period = period;
      $dt.num = num;
      return $dt;
    }
    get is_JFrac() { return this.$tag === 0; }
    get dtor_period() { return this.period; }
    get dtor_num() { return this.num; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.jfrac.JFrac" + "(" + _dafny.toString(this.period) + ", " + _dafny.toString(this.num) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.period, other.period) && _dafny.areEqual(this.num, other.num);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Grammar.jfrac.create_JFrac(Std_JSON_Grammar.jperiod.Default, Std_JSON_Grammar.jnum.Default);
    }
    static Rtd() {
      return class {
        static get Default() {
          return jfrac.Default();
        }
      };
    }
  }

  $module.jexp = class jexp {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_JExp(e, sign, num) {
      let $dt = new jexp(0);
      $dt.e = e;
      $dt.sign = sign;
      $dt.num = num;
      return $dt;
    }
    get is_JExp() { return this.$tag === 0; }
    get dtor_e() { return this.e; }
    get dtor_sign() { return this.sign; }
    get dtor_num() { return this.num; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.jexp.JExp" + "(" + _dafny.toString(this.e) + ", " + _dafny.toString(this.sign) + ", " + _dafny.toString(this.num) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.e, other.e) && _dafny.areEqual(this.sign, other.sign) && _dafny.areEqual(this.num, other.num);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Grammar.jexp.create_JExp(Std_JSON_Grammar.je.Default, Std_JSON_Grammar.jsign.Default, Std_JSON_Grammar.jnum.Default);
    }
    static Rtd() {
      return class {
        static get Default() {
          return jexp.Default();
        }
      };
    }
  }

  $module.jnumber = class jnumber {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_JNumber(minus, num, frac, exp) {
      let $dt = new jnumber(0);
      $dt.minus = minus;
      $dt.num = num;
      $dt.frac = frac;
      $dt.exp = exp;
      return $dt;
    }
    get is_JNumber() { return this.$tag === 0; }
    get dtor_minus() { return this.minus; }
    get dtor_num() { return this.num; }
    get dtor_frac() { return this.frac; }
    get dtor_exp() { return this.exp; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.jnumber.JNumber" + "(" + _dafny.toString(this.minus) + ", " + _dafny.toString(this.num) + ", " + _dafny.toString(this.frac) + ", " + _dafny.toString(this.exp) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.minus, other.minus) && _dafny.areEqual(this.num, other.num) && _dafny.areEqual(this.frac, other.frac) && _dafny.areEqual(this.exp, other.exp);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Grammar.jnumber.create_JNumber(Std_JSON_Grammar.jminus.Default, Std_JSON_Grammar.jnum.Default, Std_JSON_Grammar.Maybe.Default(), Std_JSON_Grammar.Maybe.Default());
    }
    static Rtd() {
      return class {
        static get Default() {
          return jnumber.Default();
        }
      };
    }
  }

  $module.Value = class Value {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Null(n) {
      let $dt = new Value(0);
      $dt.n = n;
      return $dt;
    }
    static create_Bool(b) {
      let $dt = new Value(1);
      $dt.b = b;
      return $dt;
    }
    static create_String(str) {
      let $dt = new Value(2);
      $dt.str = str;
      return $dt;
    }
    static create_Number(num) {
      let $dt = new Value(3);
      $dt.num = num;
      return $dt;
    }
    static create_Object(obj) {
      let $dt = new Value(4);
      $dt.obj = obj;
      return $dt;
    }
    static create_Array(arr) {
      let $dt = new Value(5);
      $dt.arr = arr;
      return $dt;
    }
    get is_Null() { return this.$tag === 0; }
    get is_Bool() { return this.$tag === 1; }
    get is_String() { return this.$tag === 2; }
    get is_Number() { return this.$tag === 3; }
    get is_Object() { return this.$tag === 4; }
    get is_Array() { return this.$tag === 5; }
    get dtor_n() { return this.n; }
    get dtor_b() { return this.b; }
    get dtor_str() { return this.str; }
    get dtor_num() { return this.num; }
    get dtor_obj() { return this.obj; }
    get dtor_arr() { return this.arr; }
    toString() {
      if (this.$tag === 0) {
        return "Grammar.Value.Null" + "(" + _dafny.toString(this.n) + ")";
      } else if (this.$tag === 1) {
        return "Grammar.Value.Bool" + "(" + _dafny.toString(this.b) + ")";
      } else if (this.$tag === 2) {
        return "Grammar.Value.String" + "(" + _dafny.toString(this.str) + ")";
      } else if (this.$tag === 3) {
        return "Grammar.Value.Number" + "(" + _dafny.toString(this.num) + ")";
      } else if (this.$tag === 4) {
        return "Grammar.Value.Object" + "(" + _dafny.toString(this.obj) + ")";
      } else if (this.$tag === 5) {
        return "Grammar.Value.Array" + "(" + _dafny.toString(this.arr) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.n, other.n);
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.b, other.b);
      } else if (this.$tag === 2) {
        return other.$tag === 2 && _dafny.areEqual(this.str, other.str);
      } else if (this.$tag === 3) {
        return other.$tag === 3 && _dafny.areEqual(this.num, other.num);
      } else if (this.$tag === 4) {
        return other.$tag === 4 && _dafny.areEqual(this.obj, other.obj);
      } else if (this.$tag === 5) {
        return other.$tag === 5 && _dafny.areEqual(this.arr, other.arr);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_JSON_Grammar.Value.create_Null(Std_JSON_Grammar.jnull.Default);
    }
    static Rtd() {
      return class {
        static get Default() {
          return Value.Default();
        }
      };
    }
  }
  return $module;
})(); // end of module Std_JSON_Grammar
let Std_JSON_ByteStrConversion = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ByteStrConversion._default";
    }
    _parentTraits() {
      return [];
    }
    static BASE() {
      return Std_JSON_ByteStrConversion.__default.base;
    };
    static IsDigitChar(c) {
      return (Std_JSON_ByteStrConversion.__default.charToDigit).contains(c);
    };
    static OfDigits(digits) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if (_dafny.areEqual(digits, _dafny.Seq.of())) {
          return _dafny.Seq.Concat(_dafny.Seq.of(), _0___accumulator);
        } else {
          _0___accumulator = _dafny.Seq.Concat(_dafny.Seq.of((Std_JSON_ByteStrConversion.__default.chars)[(digits)[_dafny.ZERO]]), _0___accumulator);
          let _in0 = (digits).slice(_dafny.ONE);
          digits = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static OfNat(n) {
      if ((n).isEqualTo(_dafny.ZERO)) {
        return _dafny.Seq.of((Std_JSON_ByteStrConversion.__default.chars)[_dafny.ZERO]);
      } else {
        return Std_JSON_ByteStrConversion.__default.OfDigits(Std_JSON_ByteStrConversion.__default.FromNat(n));
      }
    };
    static IsNumberStr(str, minus) {
      return !(!_dafny.areEqual(str, _dafny.Seq.of())) || (((((str)[_dafny.ZERO]) === (minus)) || ((Std_JSON_ByteStrConversion.__default.charToDigit).contains((str)[_dafny.ZERO]))) && (_dafny.Quantifier(((str).slice(_dafny.ONE)).UniqueElements, true, function (_forall_var_0) {
        let _0_c = _forall_var_0;
        return !(_dafny.Seq.contains((str).slice(_dafny.ONE), _0_c)) || (Std_JSON_ByteStrConversion.__default.IsDigitChar(_0_c));
      })));
    };
    static OfInt(n, minus) {
      if ((_dafny.ZERO).isLessThanOrEqualTo(n)) {
        return Std_JSON_ByteStrConversion.__default.OfNat(n);
      } else {
        return _dafny.Seq.Concat(_dafny.Seq.of(minus), Std_JSON_ByteStrConversion.__default.OfNat((_dafny.ZERO).minus(n)));
      }
    };
    static ToNat(str) {
      if (_dafny.areEqual(str, _dafny.Seq.of())) {
        return _dafny.ZERO;
      } else {
        let _0_c = (str)[(new BigNumber((str).length)).minus(_dafny.ONE)];
        return ((Std_JSON_ByteStrConversion.__default.ToNat((str).slice(0, (new BigNumber((str).length)).minus(_dafny.ONE)))).multipliedBy(Std_JSON_ByteStrConversion.__default.base)).plus((Std_JSON_ByteStrConversion.__default.charToDigit).get(_0_c));
      }
    };
    static ToInt(str, minus) {
      if (_dafny.Seq.IsPrefixOf(_dafny.Seq.of(minus), str)) {
        return (_dafny.ZERO).minus(Std_JSON_ByteStrConversion.__default.ToNat((str).slice(_dafny.ONE)));
      } else {
        return Std_JSON_ByteStrConversion.__default.ToNat(str);
      }
    };
    static ToNatRight(xs) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.ZERO;
      } else {
        return ((Std_JSON_ByteStrConversion.__default.ToNatRight(Std_Collections_Seq.__default.DropFirst(xs))).multipliedBy(Std_JSON_ByteStrConversion.__default.BASE())).plus(Std_Collections_Seq.__default.First(xs));
      }
    };
    static ToNatLeft(xs) {
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = ((Std_Collections_Seq.__default.Last(xs)).multipliedBy(Std_Arithmetic_Power.__default.Pow(Std_JSON_ByteStrConversion.__default.BASE(), (new BigNumber((xs).length)).minus(_dafny.ONE)))).plus(_0___accumulator);
          let _in0 = Std_Collections_Seq.__default.DropLast(xs);
          xs = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static FromNat(n) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((n).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((n).mod(Std_JSON_ByteStrConversion.__default.BASE())));
          let _in0 = _dafny.EuclideanDivision(n, Std_JSON_ByteStrConversion.__default.BASE());
          n = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static SeqExtend(xs, n) {
      TAIL_CALL_START: while (true) {
        if ((n).isLessThanOrEqualTo(new BigNumber((xs).length))) {
          return xs;
        } else {
          let _in0 = _dafny.Seq.Concat(xs, _dafny.Seq.of(_dafny.ZERO));
          let _in1 = n;
          xs = _in0;
          n = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static SeqExtendMultiple(xs, n) {
      let _0_newLen = ((new BigNumber((xs).length)).plus(n)).minus((new BigNumber((xs).length)).mod(n));
      return Std_JSON_ByteStrConversion.__default.SeqExtend(xs, _0_newLen);
    };
    static FromNatWithLen(n, len) {
      return Std_JSON_ByteStrConversion.__default.SeqExtend(Std_JSON_ByteStrConversion.__default.FromNat(n), len);
    };
    static SeqZero(len) {
      let _0_xs = Std_JSON_ByteStrConversion.__default.FromNatWithLen(_dafny.ZERO, len);
      return _0_xs;
    };
    static SeqAdd(xs, ys) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Tuple.of(_dafny.Seq.of(), _dafny.ZERO);
      } else {
        let _let_tmp_rhs0 = Std_JSON_ByteStrConversion.__default.SeqAdd(Std_Collections_Seq.__default.DropLast(xs), Std_Collections_Seq.__default.DropLast(ys));
        let _0_zs_k = (_let_tmp_rhs0)[0];
        let _1_cin = (_let_tmp_rhs0)[1];
        let _2_sum = ((Std_Collections_Seq.__default.Last(xs)).plus(Std_Collections_Seq.__default.Last(ys))).plus(_1_cin);
        let _let_tmp_rhs1 = (((_2_sum).isLessThan(Std_JSON_ByteStrConversion.__default.BASE())) ? (_dafny.Tuple.of(_2_sum, _dafny.ZERO)) : (_dafny.Tuple.of((_2_sum).minus(Std_JSON_ByteStrConversion.__default.BASE()), _dafny.ONE)));
        let _3_sum__out = (_let_tmp_rhs1)[0];
        let _4_cout = (_let_tmp_rhs1)[1];
        return _dafny.Tuple.of(_dafny.Seq.Concat(_0_zs_k, _dafny.Seq.of(_3_sum__out)), _4_cout);
      }
    };
    static SeqSub(xs, ys) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Tuple.of(_dafny.Seq.of(), _dafny.ZERO);
      } else {
        let _let_tmp_rhs0 = Std_JSON_ByteStrConversion.__default.SeqSub(Std_Collections_Seq.__default.DropLast(xs), Std_Collections_Seq.__default.DropLast(ys));
        let _0_zs = (_let_tmp_rhs0)[0];
        let _1_cin = (_let_tmp_rhs0)[1];
        let _let_tmp_rhs1 = ((((Std_Collections_Seq.__default.Last(ys)).plus(_1_cin)).isLessThanOrEqualTo(Std_Collections_Seq.__default.Last(xs))) ? (_dafny.Tuple.of(((Std_Collections_Seq.__default.Last(xs)).minus(Std_Collections_Seq.__default.Last(ys))).minus(_1_cin), _dafny.ZERO)) : (_dafny.Tuple.of((((Std_JSON_ByteStrConversion.__default.BASE()).plus(Std_Collections_Seq.__default.Last(xs))).minus(Std_Collections_Seq.__default.Last(ys))).minus(_1_cin), _dafny.ONE)));
        let _2_diff__out = (_let_tmp_rhs1)[0];
        let _3_cout = (_let_tmp_rhs1)[1];
        return _dafny.Tuple.of(_dafny.Seq.Concat(_0_zs, _dafny.Seq.of(_2_diff__out)), _3_cout);
      }
    };
    static get chars() {
      return _dafny.Seq.of((new _dafny.CodePoint('0'.codePointAt(0))).value, (new _dafny.CodePoint('1'.codePointAt(0))).value, (new _dafny.CodePoint('2'.codePointAt(0))).value, (new _dafny.CodePoint('3'.codePointAt(0))).value, (new _dafny.CodePoint('4'.codePointAt(0))).value, (new _dafny.CodePoint('5'.codePointAt(0))).value, (new _dafny.CodePoint('6'.codePointAt(0))).value, (new _dafny.CodePoint('7'.codePointAt(0))).value, (new _dafny.CodePoint('8'.codePointAt(0))).value, (new _dafny.CodePoint('9'.codePointAt(0))).value);
    };
    static get base() {
      return new BigNumber((Std_JSON_ByteStrConversion.__default.chars).length);
    };
    static get charToDigit() {
      return _dafny.Map.Empty.slice().updateUnsafe((new _dafny.CodePoint('0'.codePointAt(0))).value,_dafny.ZERO).updateUnsafe((new _dafny.CodePoint('1'.codePointAt(0))).value,_dafny.ONE).updateUnsafe((new _dafny.CodePoint('2'.codePointAt(0))).value,new BigNumber(2)).updateUnsafe((new _dafny.CodePoint('3'.codePointAt(0))).value,new BigNumber(3)).updateUnsafe((new _dafny.CodePoint('4'.codePointAt(0))).value,new BigNumber(4)).updateUnsafe((new _dafny.CodePoint('5'.codePointAt(0))).value,new BigNumber(5)).updateUnsafe((new _dafny.CodePoint('6'.codePointAt(0))).value,new BigNumber(6)).updateUnsafe((new _dafny.CodePoint('7'.codePointAt(0))).value,new BigNumber(7)).updateUnsafe((new _dafny.CodePoint('8'.codePointAt(0))).value,new BigNumber(8)).updateUnsafe((new _dafny.CodePoint('9'.codePointAt(0))).value,new BigNumber(9));
    };
  };

  $module.CharSeq = class CharSeq {
    constructor () {
    }
    static get Default() {
      return _dafny.Seq.of();
    }
    static _Is(__source) {
      let _0_chars = __source;
      return (_dafny.ONE).isLessThan(new BigNumber((_0_chars).length));
    }
  };

  $module.digit = class digit {
    constructor () {
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _1_i = (__source);
      if (_System.nat._Is(_1_i)) {
        return ((_dafny.ZERO).isLessThanOrEqualTo(_1_i)) && ((_1_i).isLessThan(Std_JSON_ByteStrConversion.__default.BASE()));
      }
      return false;
    }
  };
  return $module;
})(); // end of module Std_JSON_ByteStrConversion
let Std_JSON_Serializer = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.Serializer._default";
    }
    _parentTraits() {
      return [];
    }
    static Bool(b) {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(((b) ? (Std_JSON_Grammar.__default.TRUE) : (Std_JSON_Grammar.__default.FALSE)));
    };
    static CheckLength(s, err) {
      return Std_Wrappers.Outcome.Need((new BigNumber((s).length)).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__32), err);
    };
    static String(str) {
      let _0_valueOrError0 = Std_JSON_Spec.__default.EscapeToUTF8(str, _dafny.ZERO);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_bs = (_0_valueOrError0).Extract();
        let _2_o = Std_JSON_Serializer.__default.CheckLength(_1_bs, Std_JSON_Errors.SerializationError.create_StringTooLong(str));
        if ((_2_o).is_Pass) {
          return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.jstring.create_JString(Std_JSON_Grammar.__default.DOUBLEQUOTE, Std_JSON_Utils_Views_Core.View__.OfBytes(_1_bs), Std_JSON_Grammar.__default.DOUBLEQUOTE));
        } else {
          return Std_Wrappers.Result.create_Failure((_2_o).dtor_error);
        }
      }
    };
    static Sign(n) {
      return Std_JSON_Utils_Views_Core.View__.OfBytes((((n).isLessThan(_dafny.ZERO)) ? (_dafny.Seq.of((new _dafny.CodePoint('-'.codePointAt(0))).value)) : (_dafny.Seq.of())));
    };
    static Int_k(n) {
      return Std_JSON_ByteStrConversion.__default.OfInt(n, Std_JSON_Serializer.__default.MINUS);
    };
    static Int(n) {
      let _0_bs = Std_JSON_Serializer.__default.Int_k(n);
      let _1_o = Std_JSON_Serializer.__default.CheckLength(_0_bs, Std_JSON_Errors.SerializationError.create_IntTooLarge(n));
      if ((_1_o).is_Pass) {
        return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Views_Core.View__.OfBytes(_0_bs));
      } else {
        return Std_Wrappers.Result.create_Failure((_1_o).dtor_error);
      }
    };
    static Number(dec) {
      let _pat_let_tv0 = dec;
      let _pat_let_tv1 = dec;
      let _0_minus = Std_JSON_Serializer.__default.Sign((dec).dtor_n);
      let _1_valueOrError0 = Std_JSON_Serializer.__default.Int(Std_Math.__default.Abs((dec).dtor_n));
      if ((_1_valueOrError0).IsFailure()) {
        return (_1_valueOrError0).PropagateFailure();
      } else {
        let _2_num = (_1_valueOrError0).Extract();
        let _3_frac = Std_JSON_Grammar.Maybe.create_Empty();
        let _4_valueOrError1 = ((((dec).dtor_e10).isEqualTo(_dafny.ZERO)) ? (Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Maybe.create_Empty())) : (function (_pat_let2_0) {
          return function (_5_e) {
            return function (_pat_let3_0) {
              return function (_6_sign) {
                return function (_pat_let4_0) {
                  return function (_7_valueOrError2) {
                    return (((_7_valueOrError2).IsFailure()) ? ((_7_valueOrError2).PropagateFailure()) : (function (_pat_let5_0) {
                      return function (_8_num) {
                        return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Maybe.create_NonEmpty(Std_JSON_Grammar.jexp.create_JExp(_5_e, _6_sign, _8_num)));
                      }(_pat_let5_0);
                    }((_7_valueOrError2).Extract())));
                  }(_pat_let4_0);
                }(Std_JSON_Serializer.__default.Int(Std_Math.__default.Abs((_pat_let_tv1).dtor_e10)));
              }(_pat_let3_0);
            }(Std_JSON_Serializer.__default.Sign((_pat_let_tv0).dtor_e10));
          }(_pat_let2_0);
        }(Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of((new _dafny.CodePoint('e'.codePointAt(0))).value)))));
        if ((_4_valueOrError1).IsFailure()) {
          return (_4_valueOrError1).PropagateFailure();
        } else {
          let _9_exp = (_4_valueOrError1).Extract();
          return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.jnumber.create_JNumber(_0_minus, _2_num, Std_JSON_Grammar.Maybe.create_Empty(), _9_exp));
        }
      }
    };
    static MkStructural(v) {
      return Std_JSON_Grammar.Structural.create_Structural(Std_JSON_Grammar.__default.EMPTY, v, Std_JSON_Grammar.__default.EMPTY);
    };
    static KeyValue(kv) {
      let _0_valueOrError0 = Std_JSON_Serializer.__default.String((kv)[0]);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_k = (_0_valueOrError0).Extract();
        let _2_valueOrError1 = Std_JSON_Serializer.__default.Value((kv)[1]);
        if ((_2_valueOrError1).IsFailure()) {
          return (_2_valueOrError1).PropagateFailure();
        } else {
          let _3_v = (_2_valueOrError1).Extract();
          return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.jKeyValue.create_KeyValue(_1_k, Std_JSON_Serializer.__default.COLON, _3_v));
        }
      }
    };
    static MkSuffixedSequence(ds, suffix, start) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((ds).length)).isLessThanOrEqualTo(start)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else if ((start).isEqualTo((new BigNumber((ds).length)).minus(_dafny.ONE))) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of(Std_JSON_Grammar.Suffixed.create_Suffixed((ds)[start], Std_JSON_Grammar.Maybe.create_Empty())));
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of(Std_JSON_Grammar.Suffixed.create_Suffixed((ds)[start], Std_JSON_Grammar.Maybe.create_NonEmpty(suffix))));
          let _in0 = ds;
          let _in1 = suffix;
          let _in2 = (start).plus(_dafny.ONE);
          ds = _in0;
          suffix = _in1;
          start = _in2;
          continue TAIL_CALL_START;
        }
      }
    };
    static Object(obj) {
      let _0_valueOrError0 = Std_Collections_Seq.__default.MapWithResult(((_1_obj) => function (_2_v) {
        return Std_JSON_Serializer.__default.KeyValue(_2_v);
      })(obj), obj);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _3_items = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Bracketed.create_Bracketed(Std_JSON_Serializer.__default.MkStructural(Std_JSON_Grammar.__default.LBRACE), Std_JSON_Serializer.__default.MkSuffixedSequence(_3_items, Std_JSON_Serializer.__default.COMMA, _dafny.ZERO), Std_JSON_Serializer.__default.MkStructural(Std_JSON_Grammar.__default.RBRACE)));
      }
    };
    static Array(arr) {
      let _0_valueOrError0 = Std_Collections_Seq.__default.MapWithResult(((_1_arr) => function (_2_v) {
        return Std_JSON_Serializer.__default.Value(_2_v);
      })(arr), arr);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _3_items = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Bracketed.create_Bracketed(Std_JSON_Serializer.__default.MkStructural(Std_JSON_Grammar.__default.LBRACKET), Std_JSON_Serializer.__default.MkSuffixedSequence(_3_items, Std_JSON_Serializer.__default.COMMA, _dafny.ZERO), Std_JSON_Serializer.__default.MkStructural(Std_JSON_Grammar.__default.RBRACKET)));
      }
    };
    static Value(js) {
      let _source0 = js;
      {
        if (_source0.is_Null) {
          return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Value.create_Null(Std_JSON_Utils_Views_Core.View__.OfBytes(Std_JSON_Grammar.__default.NULL)));
        }
      }
      {
        if (_source0.is_Bool) {
          let _0_b = (_source0).b;
          return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Value.create_Bool(Std_JSON_Serializer.__default.Bool(_0_b)));
        }
      }
      {
        if (_source0.is_String) {
          let _1_str = (_source0).str;
          let _2_valueOrError0 = Std_JSON_Serializer.__default.String(_1_str);
          if ((_2_valueOrError0).IsFailure()) {
            return (_2_valueOrError0).PropagateFailure();
          } else {
            let _3_s = (_2_valueOrError0).Extract();
            return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Value.create_String(_3_s));
          }
        }
      }
      {
        if (_source0.is_Number) {
          let _4_dec = (_source0).num;
          let _5_valueOrError1 = Std_JSON_Serializer.__default.Number(_4_dec);
          if ((_5_valueOrError1).IsFailure()) {
            return (_5_valueOrError1).PropagateFailure();
          } else {
            let _6_n = (_5_valueOrError1).Extract();
            return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Value.create_Number(_6_n));
          }
        }
      }
      {
        if (_source0.is_Object) {
          let _7_obj = (_source0).obj;
          let _8_valueOrError2 = Std_JSON_Serializer.__default.Object(_7_obj);
          if ((_8_valueOrError2).IsFailure()) {
            return (_8_valueOrError2).PropagateFailure();
          } else {
            let _9_o = (_8_valueOrError2).Extract();
            return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Value.create_Object(_9_o));
          }
        }
      }
      {
        let _10_arr = (_source0).arr;
        let _11_valueOrError3 = Std_JSON_Serializer.__default.Array(_10_arr);
        if ((_11_valueOrError3).IsFailure()) {
          return (_11_valueOrError3).PropagateFailure();
        } else {
          let _12_a = (_11_valueOrError3).Extract();
          return Std_Wrappers.Result.create_Success(Std_JSON_Grammar.Value.create_Array(_12_a));
        }
      }
    };
    static JSON(js) {
      let _0_valueOrError0 = Std_JSON_Serializer.__default.Value(js);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_val = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success(Std_JSON_Serializer.__default.MkStructural(_1_val));
      }
    };
    static get DIGITS() {
      return Std_JSON_ByteStrConversion.__default.chars;
    };
    static get MINUS() {
      return (new _dafny.CodePoint('-'.codePointAt(0))).value;
    };
    static get COLON() {
      return Std_JSON_Serializer.__default.MkStructural(Std_JSON_Grammar.__default.COLON);
    };
    static get COMMA() {
      return Std_JSON_Serializer.__default.MkStructural(Std_JSON_Grammar.__default.COMMA);
    };
  };

  $module.bytes32 = class bytes32 {
    constructor () {
    }
    static get Default() {
      return _dafny.Seq.of();
    }
    static _Is(__source) {
      let _0_bs = __source;
      return (new BigNumber((_0_bs).length)).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__32);
    }
  };

  $module.string32 = class string32 {
    constructor () {
    }
    static get Default() {
      return _dafny.Seq.UnicodeFromString("");
    }
    static _Is(__source) {
      let _1_s = __source;
      return (new BigNumber((_1_s).length)).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__32);
    }
  };
  return $module;
})(); // end of module Std_JSON_Serializer
let Std_JSON_Deserializer_Uint16StrConversion = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.Deserializer.Uint16StrConversion._default";
    }
    _parentTraits() {
      return [];
    }
    static BASE() {
      return Std_JSON_Deserializer_Uint16StrConversion.__default.base;
    };
    static IsDigitChar(c) {
      return (Std_JSON_Deserializer_Uint16StrConversion.__default.charToDigit).contains(c);
    };
    static OfDigits(digits) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if (_dafny.areEqual(digits, _dafny.Seq.of())) {
          return _dafny.Seq.Concat(_dafny.Seq.of(), _0___accumulator);
        } else {
          _0___accumulator = _dafny.Seq.Concat(_dafny.Seq.of((Std_JSON_Deserializer_Uint16StrConversion.__default.chars)[(digits)[_dafny.ZERO]]), _0___accumulator);
          let _in0 = (digits).slice(_dafny.ONE);
          digits = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static OfNat(n) {
      if ((n).isEqualTo(_dafny.ZERO)) {
        return _dafny.Seq.of((Std_JSON_Deserializer_Uint16StrConversion.__default.chars)[_dafny.ZERO]);
      } else {
        return Std_JSON_Deserializer_Uint16StrConversion.__default.OfDigits(Std_JSON_Deserializer_Uint16StrConversion.__default.FromNat(n));
      }
    };
    static IsNumberStr(str, minus) {
      return !(!_dafny.areEqual(str, _dafny.Seq.of())) || (((((str)[_dafny.ZERO]) === (minus)) || ((Std_JSON_Deserializer_Uint16StrConversion.__default.charToDigit).contains((str)[_dafny.ZERO]))) && (_dafny.Quantifier(((str).slice(_dafny.ONE)).UniqueElements, true, function (_forall_var_0) {
        let _0_c = _forall_var_0;
        return !(_dafny.Seq.contains((str).slice(_dafny.ONE), _0_c)) || (Std_JSON_Deserializer_Uint16StrConversion.__default.IsDigitChar(_0_c));
      })));
    };
    static OfInt(n, minus) {
      if ((_dafny.ZERO).isLessThanOrEqualTo(n)) {
        return Std_JSON_Deserializer_Uint16StrConversion.__default.OfNat(n);
      } else {
        return _dafny.Seq.Concat(_dafny.Seq.of(minus), Std_JSON_Deserializer_Uint16StrConversion.__default.OfNat((_dafny.ZERO).minus(n)));
      }
    };
    static ToNat(str) {
      if (_dafny.areEqual(str, _dafny.Seq.of())) {
        return _dafny.ZERO;
      } else {
        let _0_c = (str)[(new BigNumber((str).length)).minus(_dafny.ONE)];
        return ((Std_JSON_Deserializer_Uint16StrConversion.__default.ToNat((str).slice(0, (new BigNumber((str).length)).minus(_dafny.ONE)))).multipliedBy(Std_JSON_Deserializer_Uint16StrConversion.__default.base)).plus((Std_JSON_Deserializer_Uint16StrConversion.__default.charToDigit).get(_0_c));
      }
    };
    static ToInt(str, minus) {
      if (_dafny.Seq.IsPrefixOf(_dafny.Seq.of(minus), str)) {
        return (_dafny.ZERO).minus(Std_JSON_Deserializer_Uint16StrConversion.__default.ToNat((str).slice(_dafny.ONE)));
      } else {
        return Std_JSON_Deserializer_Uint16StrConversion.__default.ToNat(str);
      }
    };
    static ToNatRight(xs) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.ZERO;
      } else {
        return ((Std_JSON_Deserializer_Uint16StrConversion.__default.ToNatRight(Std_Collections_Seq.__default.DropFirst(xs))).multipliedBy(Std_JSON_Deserializer_Uint16StrConversion.__default.BASE())).plus(Std_Collections_Seq.__default.First(xs));
      }
    };
    static ToNatLeft(xs) {
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = ((Std_Collections_Seq.__default.Last(xs)).multipliedBy(Std_Arithmetic_Power.__default.Pow(Std_JSON_Deserializer_Uint16StrConversion.__default.BASE(), (new BigNumber((xs).length)).minus(_dafny.ONE)))).plus(_0___accumulator);
          let _in0 = Std_Collections_Seq.__default.DropLast(xs);
          xs = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static FromNat(n) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((n).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of((n).mod(Std_JSON_Deserializer_Uint16StrConversion.__default.BASE())));
          let _in0 = _dafny.EuclideanDivision(n, Std_JSON_Deserializer_Uint16StrConversion.__default.BASE());
          n = _in0;
          continue TAIL_CALL_START;
        }
      }
    };
    static SeqExtend(xs, n) {
      TAIL_CALL_START: while (true) {
        if ((n).isLessThanOrEqualTo(new BigNumber((xs).length))) {
          return xs;
        } else {
          let _in0 = _dafny.Seq.Concat(xs, _dafny.Seq.of(_dafny.ZERO));
          let _in1 = n;
          xs = _in0;
          n = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static SeqExtendMultiple(xs, n) {
      let _0_newLen = ((new BigNumber((xs).length)).plus(n)).minus((new BigNumber((xs).length)).mod(n));
      return Std_JSON_Deserializer_Uint16StrConversion.__default.SeqExtend(xs, _0_newLen);
    };
    static FromNatWithLen(n, len) {
      return Std_JSON_Deserializer_Uint16StrConversion.__default.SeqExtend(Std_JSON_Deserializer_Uint16StrConversion.__default.FromNat(n), len);
    };
    static SeqZero(len) {
      let _0_xs = Std_JSON_Deserializer_Uint16StrConversion.__default.FromNatWithLen(_dafny.ZERO, len);
      return _0_xs;
    };
    static SeqAdd(xs, ys) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Tuple.of(_dafny.Seq.of(), _dafny.ZERO);
      } else {
        let _let_tmp_rhs0 = Std_JSON_Deserializer_Uint16StrConversion.__default.SeqAdd(Std_Collections_Seq.__default.DropLast(xs), Std_Collections_Seq.__default.DropLast(ys));
        let _0_zs_k = (_let_tmp_rhs0)[0];
        let _1_cin = (_let_tmp_rhs0)[1];
        let _2_sum = ((Std_Collections_Seq.__default.Last(xs)).plus(Std_Collections_Seq.__default.Last(ys))).plus(_1_cin);
        let _let_tmp_rhs1 = (((_2_sum).isLessThan(Std_JSON_Deserializer_Uint16StrConversion.__default.BASE())) ? (_dafny.Tuple.of(_2_sum, _dafny.ZERO)) : (_dafny.Tuple.of((_2_sum).minus(Std_JSON_Deserializer_Uint16StrConversion.__default.BASE()), _dafny.ONE)));
        let _3_sum__out = (_let_tmp_rhs1)[0];
        let _4_cout = (_let_tmp_rhs1)[1];
        return _dafny.Tuple.of(_dafny.Seq.Concat(_0_zs_k, _dafny.Seq.of(_3_sum__out)), _4_cout);
      }
    };
    static SeqSub(xs, ys) {
      if ((new BigNumber((xs).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Tuple.of(_dafny.Seq.of(), _dafny.ZERO);
      } else {
        let _let_tmp_rhs0 = Std_JSON_Deserializer_Uint16StrConversion.__default.SeqSub(Std_Collections_Seq.__default.DropLast(xs), Std_Collections_Seq.__default.DropLast(ys));
        let _0_zs = (_let_tmp_rhs0)[0];
        let _1_cin = (_let_tmp_rhs0)[1];
        let _let_tmp_rhs1 = ((((Std_Collections_Seq.__default.Last(ys)).plus(_1_cin)).isLessThanOrEqualTo(Std_Collections_Seq.__default.Last(xs))) ? (_dafny.Tuple.of(((Std_Collections_Seq.__default.Last(xs)).minus(Std_Collections_Seq.__default.Last(ys))).minus(_1_cin), _dafny.ZERO)) : (_dafny.Tuple.of((((Std_JSON_Deserializer_Uint16StrConversion.__default.BASE()).plus(Std_Collections_Seq.__default.Last(xs))).minus(Std_Collections_Seq.__default.Last(ys))).minus(_1_cin), _dafny.ONE)));
        let _2_diff__out = (_let_tmp_rhs1)[0];
        let _3_cout = (_let_tmp_rhs1)[1];
        return _dafny.Tuple.of(_dafny.Seq.Concat(_0_zs, _dafny.Seq.of(_2_diff__out)), _3_cout);
      }
    };
    static get chars() {
      return _dafny.Seq.of((new _dafny.CodePoint('0'.codePointAt(0))).value, (new _dafny.CodePoint('1'.codePointAt(0))).value, (new _dafny.CodePoint('2'.codePointAt(0))).value, (new _dafny.CodePoint('3'.codePointAt(0))).value, (new _dafny.CodePoint('4'.codePointAt(0))).value, (new _dafny.CodePoint('5'.codePointAt(0))).value, (new _dafny.CodePoint('6'.codePointAt(0))).value, (new _dafny.CodePoint('7'.codePointAt(0))).value, (new _dafny.CodePoint('8'.codePointAt(0))).value, (new _dafny.CodePoint('9'.codePointAt(0))).value, (new _dafny.CodePoint('a'.codePointAt(0))).value, (new _dafny.CodePoint('b'.codePointAt(0))).value, (new _dafny.CodePoint('c'.codePointAt(0))).value, (new _dafny.CodePoint('d'.codePointAt(0))).value, (new _dafny.CodePoint('e'.codePointAt(0))).value, (new _dafny.CodePoint('f'.codePointAt(0))).value, (new _dafny.CodePoint('A'.codePointAt(0))).value, (new _dafny.CodePoint('B'.codePointAt(0))).value, (new _dafny.CodePoint('C'.codePointAt(0))).value, (new _dafny.CodePoint('D'.codePointAt(0))).value, (new _dafny.CodePoint('E'.codePointAt(0))).value, (new _dafny.CodePoint('F'.codePointAt(0))).value);
    };
    static get base() {
      return new BigNumber((Std_JSON_Deserializer_Uint16StrConversion.__default.chars).length);
    };
    static get charToDigit() {
      return _dafny.Map.Empty.slice().updateUnsafe((new _dafny.CodePoint('0'.codePointAt(0))).value,_dafny.ZERO).updateUnsafe((new _dafny.CodePoint('1'.codePointAt(0))).value,_dafny.ONE).updateUnsafe((new _dafny.CodePoint('2'.codePointAt(0))).value,new BigNumber(2)).updateUnsafe((new _dafny.CodePoint('3'.codePointAt(0))).value,new BigNumber(3)).updateUnsafe((new _dafny.CodePoint('4'.codePointAt(0))).value,new BigNumber(4)).updateUnsafe((new _dafny.CodePoint('5'.codePointAt(0))).value,new BigNumber(5)).updateUnsafe((new _dafny.CodePoint('6'.codePointAt(0))).value,new BigNumber(6)).updateUnsafe((new _dafny.CodePoint('7'.codePointAt(0))).value,new BigNumber(7)).updateUnsafe((new _dafny.CodePoint('8'.codePointAt(0))).value,new BigNumber(8)).updateUnsafe((new _dafny.CodePoint('9'.codePointAt(0))).value,new BigNumber(9)).updateUnsafe((new _dafny.CodePoint('a'.codePointAt(0))).value,new BigNumber(10)).updateUnsafe((new _dafny.CodePoint('b'.codePointAt(0))).value,new BigNumber(11)).updateUnsafe((new _dafny.CodePoint('c'.codePointAt(0))).value,new BigNumber(12)).updateUnsafe((new _dafny.CodePoint('d'.codePointAt(0))).value,new BigNumber(13)).updateUnsafe((new _dafny.CodePoint('e'.codePointAt(0))).value,new BigNumber(14)).updateUnsafe((new _dafny.CodePoint('f'.codePointAt(0))).value,new BigNumber(15)).updateUnsafe((new _dafny.CodePoint('A'.codePointAt(0))).value,new BigNumber(10)).updateUnsafe((new _dafny.CodePoint('B'.codePointAt(0))).value,new BigNumber(11)).updateUnsafe((new _dafny.CodePoint('C'.codePointAt(0))).value,new BigNumber(12)).updateUnsafe((new _dafny.CodePoint('D'.codePointAt(0))).value,new BigNumber(13)).updateUnsafe((new _dafny.CodePoint('E'.codePointAt(0))).value,new BigNumber(14)).updateUnsafe((new _dafny.CodePoint('F'.codePointAt(0))).value,new BigNumber(15));
    };
  };

  $module.CharSeq = class CharSeq {
    constructor () {
    }
    static get Default() {
      return _dafny.Seq.of();
    }
    static _Is(__source) {
      let _0_chars = __source;
      return (_dafny.ONE).isLessThan(new BigNumber((_0_chars).length));
    }
  };

  $module.digit = class digit {
    constructor () {
    }
    static get Default() {
      return _dafny.ZERO;
    }
    static _Is(__source) {
      let _1_i = (__source);
      if (_System.nat._Is(_1_i)) {
        return ((_dafny.ZERO).isLessThanOrEqualTo(_1_i)) && ((_1_i).isLessThan(Std_JSON_Deserializer_Uint16StrConversion.__default.BASE()));
      }
      return false;
    }
  };
  return $module;
})(); // end of module Std_JSON_Deserializer_Uint16StrConversion
let Std_JSON_Deserializer = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.Deserializer._default";
    }
    _parentTraits() {
      return [];
    }
    static Bool(js) {
      return ((js).At(0)) === ((new _dafny.CodePoint('t'.codePointAt(0))).value);
    };
    static UnsupportedEscape16(code) {
      return Std_JSON_Errors.DeserializationError.create_UnsupportedEscape(((Std_Unicode_UnicodeStringsWithUnicodeChar.__default.FromUTF16Checked(code)).ToOption()).GetOr(_dafny.Seq.UnicodeFromString("Couldn't decode UTF-16")));
    };
    static ToNat16(str) {
      let _0_hd = Std_JSON_Deserializer_Uint16StrConversion.__default.ToNat(str);
      return (_0_hd).toNumber();
    };
    static Unescape(str, start, prefix) {
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((str).length)).isLessThanOrEqualTo(start)) {
          return Std_Wrappers.Result.create_Success(prefix);
        } else if (((str)[start]) === ((new _dafny.CodePoint('\\'.codePointAt(0))).value)) {
          if ((new BigNumber((str).length)).isEqualTo((start).plus(_dafny.ONE))) {
            return Std_Wrappers.Result.create_Failure(Std_JSON_Errors.DeserializationError.create_EscapeAtEOS());
          } else {
            let _0_c = (str)[(start).plus(_dafny.ONE)];
            if ((_0_c) === ((new _dafny.CodePoint('u'.codePointAt(0))).value)) {
              if ((new BigNumber((str).length)).isLessThan((start).plus(new BigNumber(6)))) {
                return Std_Wrappers.Result.create_Failure(Std_JSON_Errors.DeserializationError.create_EscapeAtEOS());
              } else {
                let _1_code = (str).slice((start).plus(new BigNumber(2)), (start).plus(new BigNumber(6)));
                if (_dafny.Quantifier((_1_code).UniqueElements, false, function (_exists_var_0) {
                  let _2_c = _exists_var_0;
                  return (_dafny.Seq.contains(_1_code, _2_c)) && (!(Std_JSON_Deserializer.__default.HEX__TABLE__16).contains(_2_c));
                })) {
                  return Std_Wrappers.Result.create_Failure(Std_JSON_Deserializer.__default.UnsupportedEscape16(_1_code));
                } else {
                  let _3_hd = Std_JSON_Deserializer.__default.ToNat16(_1_code);
                  let _in0 = str;
                  let _in1 = (start).plus(new BigNumber(6));
                  let _in2 = _dafny.Seq.Concat(prefix, _dafny.Seq.of(_3_hd));
                  str = _in0;
                  start = _in1;
                  prefix = _in2;
                  continue TAIL_CALL_START;
                }
              }
            } else {
              let _4_unescaped = function () {
                let _source0 = _0_c;
                {
                  if ((_source0) === (34)) {
                    return (34);
                  }
                }
                {
                  if ((_source0) === (92)) {
                    return (92);
                  }
                }
                {
                  if ((_source0) === (98)) {
                    return (8);
                  }
                }
                {
                  if ((_source0) === (102)) {
                    return (12);
                  }
                }
                {
                  if ((_source0) === (110)) {
                    return (10);
                  }
                }
                {
                  if ((_source0) === (114)) {
                    return (13);
                  }
                }
                {
                  if ((_source0) === (116)) {
                    return (9);
                  }
                }
                {
                  return (0);
                }
              }();
              if ((new BigNumber(_4_unescaped)).isEqualTo(_dafny.ZERO)) {
                return Std_Wrappers.Result.create_Failure(Std_JSON_Deserializer.__default.UnsupportedEscape16((str).slice(start, (start).plus(new BigNumber(2)))));
              } else {
                let _in3 = str;
                let _in4 = (start).plus(new BigNumber(2));
                let _in5 = _dafny.Seq.Concat(prefix, _dafny.Seq.of(_4_unescaped));
                str = _in3;
                start = _in4;
                prefix = _in5;
                continue TAIL_CALL_START;
              }
            }
          }
        } else {
          let _in6 = str;
          let _in7 = (start).plus(_dafny.ONE);
          let _in8 = _dafny.Seq.Concat(prefix, _dafny.Seq.of((str)[start]));
          str = _in6;
          start = _in7;
          prefix = _in8;
          continue TAIL_CALL_START;
        }
      }
    };
    static String(js) {
      let _0_valueOrError0 = (Std_Unicode_UnicodeStringsWithUnicodeChar.__default.FromUTF8Checked(((js).dtor_contents).Bytes())).MapFailure(function (_1_error) {
        return Std_JSON_Errors.DeserializationError.create_InvalidUnicode(_1_error);
      });
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _2_asUtf32 = (_0_valueOrError0).Extract();
        let _3_valueOrError1 = (Std_Unicode_UnicodeStringsWithUnicodeChar.__default.ToUTF16Checked(_2_asUtf32)).ToResult(Std_JSON_Errors.DeserializationError.create_InvalidUnicode(_dafny.Seq.UnicodeFromString("")));
        if ((_3_valueOrError1).IsFailure()) {
          return (_3_valueOrError1).PropagateFailure();
        } else {
          let _4_asUint16 = (_3_valueOrError1).Extract();
          let _5_valueOrError2 = Std_JSON_Deserializer.__default.Unescape(_4_asUint16, _dafny.ZERO, _dafny.Seq.of());
          if ((_5_valueOrError2).IsFailure()) {
            return (_5_valueOrError2).PropagateFailure();
          } else {
            let _6_unescaped = (_5_valueOrError2).Extract();
            return (Std_Unicode_UnicodeStringsWithUnicodeChar.__default.FromUTF16Checked(_6_unescaped)).MapFailure(function (_7_error) {
              return Std_JSON_Errors.DeserializationError.create_InvalidUnicode(_7_error);
            });
          }
        }
      }
    };
    static ToInt(sign, n) {
      let _0_n = Std_JSON_ByteStrConversion.__default.ToNat((n).Bytes());
      return Std_Wrappers.Result.create_Success((((sign).Char_q(new _dafny.CodePoint('-'.codePointAt(0)))) ? ((_dafny.ZERO).minus(_0_n)) : (_0_n)));
    };
    static Number(js) {
      let _let_tmp_rhs0 = js;
      let _0_minus = (_let_tmp_rhs0).minus;
      let _1_num = (_let_tmp_rhs0).num;
      let _2_frac = (_let_tmp_rhs0).frac;
      let _3_exp = (_let_tmp_rhs0).exp;
      let _4_valueOrError0 = Std_JSON_Deserializer.__default.ToInt(_0_minus, _1_num);
      if ((_4_valueOrError0).IsFailure()) {
        return (_4_valueOrError0).PropagateFailure();
      } else {
        let _5_n = (_4_valueOrError0).Extract();
        let _6_valueOrError1 = function () {
          let _source0 = _3_exp;
          {
            if (_source0.is_Empty) {
              return Std_Wrappers.Result.create_Success(_dafny.ZERO);
            }
          }
          {
            let t0 = (_source0).t;
            let _7_sign = (t0).sign;
            let _8_num = (t0).num;
            return Std_JSON_Deserializer.__default.ToInt(_7_sign, _8_num);
          }
        }();
        if ((_6_valueOrError1).IsFailure()) {
          return (_6_valueOrError1).PropagateFailure();
        } else {
          let _9_e10 = (_6_valueOrError1).Extract();
          let _source1 = _2_frac;
          {
            if (_source1.is_Empty) {
              return Std_Wrappers.Result.create_Success(Std_JSON_Values.Decimal.create_Decimal(_5_n, _9_e10));
            }
          }
          {
            let t1 = (_source1).t;
            let _10_num = (t1).num;
            let _11_pow10 = new BigNumber((_10_num).Length());
            let _12_valueOrError2 = Std_JSON_Deserializer.__default.ToInt(_0_minus, _10_num);
            if ((_12_valueOrError2).IsFailure()) {
              return (_12_valueOrError2).PropagateFailure();
            } else {
              let _13_frac = (_12_valueOrError2).Extract();
              return Std_Wrappers.Result.create_Success(Std_JSON_Values.Decimal.create_Decimal(((_5_n).multipliedBy(Std_Arithmetic_Power.__default.Pow(new BigNumber(10), _11_pow10))).plus(_13_frac), (_9_e10).minus(_11_pow10)));
            }
          }
        }
      }
    };
    static KeyValue(js) {
      let _0_valueOrError0 = Std_JSON_Deserializer.__default.String((js).dtor_k);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_k = (_0_valueOrError0).Extract();
        let _2_valueOrError1 = Std_JSON_Deserializer.__default.Value((js).dtor_v);
        if ((_2_valueOrError1).IsFailure()) {
          return (_2_valueOrError1).PropagateFailure();
        } else {
          let _3_v = (_2_valueOrError1).Extract();
          return Std_Wrappers.Result.create_Success(_dafny.Tuple.of(_1_k, _3_v));
        }
      }
    };
    static Object(js) {
      let _0_f = ((_1_js) => function (_2_d) {
        return Std_JSON_Deserializer.__default.KeyValue((_2_d).dtor_t);
      })(js);
      return Std_Collections_Seq.__default.MapWithResult(_0_f, (js).dtor_data);
    };
    static Array(js) {
      let _0_f = ((_1_js) => function (_2_d) {
        return Std_JSON_Deserializer.__default.Value((_2_d).dtor_t);
      })(js);
      return Std_Collections_Seq.__default.MapWithResult(_0_f, (js).dtor_data);
    };
    static Value(js) {
      let _source0 = js;
      {
        if (_source0.is_Null) {
          return Std_Wrappers.Result.create_Success(Std_JSON_Values.JSON.create_Null());
        }
      }
      {
        if (_source0.is_Bool) {
          let _0_b = (_source0).b;
          return Std_Wrappers.Result.create_Success(Std_JSON_Values.JSON.create_Bool(Std_JSON_Deserializer.__default.Bool(_0_b)));
        }
      }
      {
        if (_source0.is_String) {
          let _1_str = (_source0).str;
          let _2_valueOrError0 = Std_JSON_Deserializer.__default.String(_1_str);
          if ((_2_valueOrError0).IsFailure()) {
            return (_2_valueOrError0).PropagateFailure();
          } else {
            let _3_s = (_2_valueOrError0).Extract();
            return Std_Wrappers.Result.create_Success(Std_JSON_Values.JSON.create_String(_3_s));
          }
        }
      }
      {
        if (_source0.is_Number) {
          let _4_dec = (_source0).num;
          let _5_valueOrError1 = Std_JSON_Deserializer.__default.Number(_4_dec);
          if ((_5_valueOrError1).IsFailure()) {
            return (_5_valueOrError1).PropagateFailure();
          } else {
            let _6_n = (_5_valueOrError1).Extract();
            return Std_Wrappers.Result.create_Success(Std_JSON_Values.JSON.create_Number(_6_n));
          }
        }
      }
      {
        if (_source0.is_Object) {
          let _7_obj = (_source0).obj;
          let _8_valueOrError2 = Std_JSON_Deserializer.__default.Object(_7_obj);
          if ((_8_valueOrError2).IsFailure()) {
            return (_8_valueOrError2).PropagateFailure();
          } else {
            let _9_o = (_8_valueOrError2).Extract();
            return Std_Wrappers.Result.create_Success(Std_JSON_Values.JSON.create_Object(_9_o));
          }
        }
      }
      {
        let _10_arr = (_source0).arr;
        let _11_valueOrError3 = Std_JSON_Deserializer.__default.Array(_10_arr);
        if ((_11_valueOrError3).IsFailure()) {
          return (_11_valueOrError3).PropagateFailure();
        } else {
          let _12_a = (_11_valueOrError3).Extract();
          return Std_Wrappers.Result.create_Success(Std_JSON_Values.JSON.create_Array(_12_a));
        }
      }
    };
    static JSON(js) {
      return Std_JSON_Deserializer.__default.Value((js).dtor_t);
    };
    static get HEX__TABLE__16() {
      return Std_JSON_Deserializer_Uint16StrConversion.__default.charToDigit;
    };
    static get DIGITS() {
      return Std_JSON_ByteStrConversion.__default.charToDigit;
    };
    static get MINUS() {
      return (new _dafny.CodePoint('-'.codePointAt(0))).value;
    };
  };
  return $module;
})(); // end of module Std_JSON_Deserializer
let Std_JSON_ConcreteSyntax_Spec = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ConcreteSyntax.Spec._default";
    }
    _parentTraits() {
      return [];
    }
    static View(v) {
      return (v).Bytes();
    };
    static Structural(self, fT) {
      return _dafny.Seq.Concat(_dafny.Seq.Concat(Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_before), (fT)((self).dtor_t)), Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_after));
    };
    static StructuralView(self) {
      return Std_JSON_ConcreteSyntax_Spec.__default.Structural(self, Std_JSON_ConcreteSyntax_Spec.__default.View);
    };
    static Maybe(self, fT) {
      if ((self).is_Empty) {
        return _dafny.Seq.of();
      } else {
        return (fT)((self).dtor_t);
      }
    };
    static ConcatBytes(ts, fT) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((ts).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.of());
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, (fT)((ts)[_dafny.ZERO]));
          let _in0 = (ts).slice(_dafny.ONE);
          let _in1 = fT;
          ts = _in0;
          fT = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static Bracketed(self, fDatum) {
      return _dafny.Seq.Concat(_dafny.Seq.Concat(Std_JSON_ConcreteSyntax_Spec.__default.StructuralView((self).dtor_l), Std_JSON_ConcreteSyntax_Spec.__default.ConcatBytes((self).dtor_data, fDatum)), Std_JSON_ConcreteSyntax_Spec.__default.StructuralView((self).dtor_r));
    };
    static KeyValue(self) {
      return _dafny.Seq.Concat(_dafny.Seq.Concat(Std_JSON_ConcreteSyntax_Spec.__default.String((self).dtor_k), Std_JSON_ConcreteSyntax_Spec.__default.StructuralView((self).dtor_colon)), Std_JSON_ConcreteSyntax_Spec.__default.Value((self).dtor_v));
    };
    static Frac(self) {
      return _dafny.Seq.Concat(Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_period), Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_num));
    };
    static Exp(self) {
      return _dafny.Seq.Concat(_dafny.Seq.Concat(Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_e), Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_sign)), Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_num));
    };
    static Number(self) {
      return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_minus), Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_num)), Std_JSON_ConcreteSyntax_Spec.__default.Maybe((self).dtor_frac, Std_JSON_ConcreteSyntax_Spec.__default.Frac)), Std_JSON_ConcreteSyntax_Spec.__default.Maybe((self).dtor_exp, Std_JSON_ConcreteSyntax_Spec.__default.Exp));
    };
    static String(self) {
      return _dafny.Seq.Concat(_dafny.Seq.Concat(Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_lq), Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_contents)), Std_JSON_ConcreteSyntax_Spec.__default.View((self).dtor_rq));
    };
    static CommaSuffix(c) {
      return Std_JSON_ConcreteSyntax_Spec.__default.Maybe(c, Std_JSON_ConcreteSyntax_Spec.__default.StructuralView);
    };
    static Member(self) {
      return _dafny.Seq.Concat(Std_JSON_ConcreteSyntax_Spec.__default.KeyValue((self).dtor_t), Std_JSON_ConcreteSyntax_Spec.__default.CommaSuffix((self).dtor_suffix));
    };
    static Item(self) {
      return _dafny.Seq.Concat(Std_JSON_ConcreteSyntax_Spec.__default.Value((self).dtor_t), Std_JSON_ConcreteSyntax_Spec.__default.CommaSuffix((self).dtor_suffix));
    };
    static Object(obj) {
      return Std_JSON_ConcreteSyntax_Spec.__default.Bracketed(obj, ((_0_obj) => function (_1_d) {
        return Std_JSON_ConcreteSyntax_Spec.__default.Member(_1_d);
      })(obj));
    };
    static Array(arr) {
      return Std_JSON_ConcreteSyntax_Spec.__default.Bracketed(arr, ((_0_arr) => function (_1_d) {
        return Std_JSON_ConcreteSyntax_Spec.__default.Item(_1_d);
      })(arr));
    };
    static Value(self) {
      let _source0 = self;
      {
        if (_source0.is_Null) {
          let _0_n = (_source0).n;
          return Std_JSON_ConcreteSyntax_Spec.__default.View(_0_n);
        }
      }
      {
        if (_source0.is_Bool) {
          let _1_b = (_source0).b;
          return Std_JSON_ConcreteSyntax_Spec.__default.View(_1_b);
        }
      }
      {
        if (_source0.is_String) {
          let _2_str = (_source0).str;
          return Std_JSON_ConcreteSyntax_Spec.__default.String(_2_str);
        }
      }
      {
        if (_source0.is_Number) {
          let _3_num = (_source0).num;
          return Std_JSON_ConcreteSyntax_Spec.__default.Number(_3_num);
        }
      }
      {
        if (_source0.is_Object) {
          let _4_obj = (_source0).obj;
          return Std_JSON_ConcreteSyntax_Spec.__default.Object(_4_obj);
        }
      }
      {
        let _5_arr = (_source0).arr;
        return Std_JSON_ConcreteSyntax_Spec.__default.Array(_5_arr);
      }
    };
    static JSON(js) {
      return Std_JSON_ConcreteSyntax_Spec.__default.Structural(js, Std_JSON_ConcreteSyntax_Spec.__default.Value);
    };
  };
  return $module;
})(); // end of module Std_JSON_ConcreteSyntax_Spec
let Std_JSON_ConcreteSyntax_SpecProperties = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_JSON_ConcreteSyntax_SpecProperties
let Std_JSON_ZeroCopy_Serializer = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Serializer._default";
    }
    _parentTraits() {
      return [];
    }
    static Serialize(js) {
      let rbs = Std_Wrappers.Result.Default([]);
      let _0_writer;
      _0_writer = Std_JSON_ZeroCopy_Serializer.__default.Text(js);
      let _1_valueOrError0 = Std_Wrappers.OutcomeResult.Default();
      _1_valueOrError0 = Std_Wrappers.__default.Need((_0_writer).Unsaturated_q, Std_JSON_Errors.SerializationError.create_OutOfMemory());
      if ((_1_valueOrError0).IsFailure()) {
        rbs = (_1_valueOrError0).PropagateFailure();
        return rbs;
      }
      let _2_bs;
      let _out0;
      _out0 = (_0_writer).ToArray();
      _2_bs = _out0;
      rbs = Std_Wrappers.Result.create_Success(_2_bs);
      return rbs;
      return rbs;
    }
    static SerializeTo(js, dest) {
      let len = Std_Wrappers.Result.Default(0);
      let _0_writer;
      _0_writer = Std_JSON_ZeroCopy_Serializer.__default.Text(js);
      let _1_valueOrError0 = Std_Wrappers.OutcomeResult.Default();
      _1_valueOrError0 = Std_Wrappers.__default.Need((_0_writer).Unsaturated_q, Std_JSON_Errors.SerializationError.create_OutOfMemory());
      if ((_1_valueOrError0).IsFailure()) {
        len = (_1_valueOrError0).PropagateFailure();
        return len;
      }
      let _2_valueOrError1 = Std_Wrappers.OutcomeResult.Default();
      _2_valueOrError1 = Std_Wrappers.__default.Need((new BigNumber((_0_writer).dtor_length)).isLessThanOrEqualTo(new BigNumber((dest).length)), Std_JSON_Errors.SerializationError.create_OutOfMemory());
      if ((_2_valueOrError1).IsFailure()) {
        len = (_2_valueOrError1).PropagateFailure();
        return len;
      }
      (_0_writer).CopyTo(dest);
      len = Std_Wrappers.Result.create_Success((_0_writer).dtor_length);
      return len;
      return len;
    }
    static Text(js) {
      return Std_JSON_ZeroCopy_Serializer.__default.JSON(js, Std_JSON_Utils_Views_Writers.Writer__.Empty);
    };
    static JSON(js, writer) {
      return (((writer).Append((js).dtor_before)).Then(((_0_js) => function (_1_wr) {
        return Std_JSON_ZeroCopy_Serializer.__default.Value((_0_js).dtor_t, _1_wr);
      })(js))).Append((js).dtor_after);
    };
    static Value(v, writer) {
      let _source0 = v;
      {
        if (_source0.is_Null) {
          let _0_n = (_source0).n;
          let _1_wr = (writer).Append(_0_n);
          return _1_wr;
        }
      }
      {
        if (_source0.is_Bool) {
          let _2_b = (_source0).b;
          let _3_wr = (writer).Append(_2_b);
          return _3_wr;
        }
      }
      {
        if (_source0.is_String) {
          let _4_str = (_source0).str;
          let _5_wr = Std_JSON_ZeroCopy_Serializer.__default.String(_4_str, writer);
          return _5_wr;
        }
      }
      {
        if (_source0.is_Number) {
          let _6_num = (_source0).num;
          let _7_wr = Std_JSON_ZeroCopy_Serializer.__default.Number(_6_num, writer);
          return _7_wr;
        }
      }
      {
        if (_source0.is_Object) {
          let _8_obj = (_source0).obj;
          let _9_wr = Std_JSON_ZeroCopy_Serializer.__default.Object(_8_obj, writer);
          return _9_wr;
        }
      }
      {
        let _10_arr = (_source0).arr;
        let _11_wr = Std_JSON_ZeroCopy_Serializer.__default.Array(_10_arr, writer);
        return _11_wr;
      }
    };
    static String(str, writer) {
      return (((writer).Append((str).dtor_lq)).Append((str).dtor_contents)).Append((str).dtor_rq);
    };
    static Number(num, writer) {
      let _0_wr1 = ((writer).Append((num).dtor_minus)).Append((num).dtor_num);
      let _1_wr2 = ((((num).dtor_frac).is_NonEmpty) ? (((_0_wr1).Append((((num).dtor_frac).dtor_t).dtor_period)).Append((((num).dtor_frac).dtor_t).dtor_num)) : (_0_wr1));
      let _2_wr3 = ((((num).dtor_exp).is_NonEmpty) ? ((((_1_wr2).Append((((num).dtor_exp).dtor_t).dtor_e)).Append((((num).dtor_exp).dtor_t).dtor_sign)).Append((((num).dtor_exp).dtor_t).dtor_num)) : (_1_wr2));
      let _3_wr = _2_wr3;
      return _3_wr;
    };
    static StructuralView(st, writer) {
      return (((writer).Append((st).dtor_before)).Append((st).dtor_t)).Append((st).dtor_after);
    };
    static Object(obj, writer) {
      let _0_wr = Std_JSON_ZeroCopy_Serializer.__default.StructuralView((obj).dtor_l, writer);
      let _1_wr = Std_JSON_ZeroCopy_Serializer.__default.Members(obj, _0_wr);
      let _2_wr = Std_JSON_ZeroCopy_Serializer.__default.StructuralView((obj).dtor_r, _1_wr);
      return _2_wr;
    };
    static Array(arr, writer) {
      let _0_wr = Std_JSON_ZeroCopy_Serializer.__default.StructuralView((arr).dtor_l, writer);
      let _1_wr = Std_JSON_ZeroCopy_Serializer.__default.Items(arr, _0_wr);
      let _2_wr = Std_JSON_ZeroCopy_Serializer.__default.StructuralView((arr).dtor_r, _1_wr);
      return _2_wr;
    };
    static Members(obj, writer) {
      let wr = Std_JSON_Utils_Views_Writers.Writer.Default;
      let _out0;
      _out0 = Std_JSON_ZeroCopy_Serializer.__default.MembersImpl(obj, writer);
      wr = _out0;
      return wr;
    }
    static Items(arr, writer) {
      let wr = Std_JSON_Utils_Views_Writers.Writer.Default;
      let _out0;
      _out0 = Std_JSON_ZeroCopy_Serializer.__default.ItemsImpl(arr, writer);
      wr = _out0;
      return wr;
    }
    static MembersImpl(obj, writer) {
      let wr = Std_JSON_Utils_Views_Writers.Writer.Default;
      wr = writer;
      let _0_members;
      _0_members = (obj).dtor_data;
      let _hi0 = new BigNumber((_0_members).length);
      for (let _1_i = _dafny.ZERO; _1_i.isLessThan(_hi0); _1_i = _1_i.plus(_dafny.ONE)) {
        wr = Std_JSON_ZeroCopy_Serializer.__default.Member((_0_members)[_1_i], wr);
      }
      return wr;
    }
    static ItemsImpl(arr, writer) {
      let wr = Std_JSON_Utils_Views_Writers.Writer.Default;
      wr = writer;
      let _0_items;
      _0_items = (arr).dtor_data;
      let _hi0 = new BigNumber((_0_items).length);
      for (let _1_i = _dafny.ZERO; _1_i.isLessThan(_hi0); _1_i = _1_i.plus(_dafny.ONE)) {
        wr = Std_JSON_ZeroCopy_Serializer.__default.Item((_0_items)[_1_i], wr);
      }
      return wr;
    }
    static Member(m, writer) {
      let _0_wr = Std_JSON_ZeroCopy_Serializer.__default.String(((m).dtor_t).dtor_k, writer);
      let _1_wr = Std_JSON_ZeroCopy_Serializer.__default.StructuralView(((m).dtor_t).dtor_colon, _0_wr);
      let _2_wr = Std_JSON_ZeroCopy_Serializer.__default.Value(((m).dtor_t).dtor_v, _1_wr);
      let _3_wr = ((((m).dtor_suffix).is_Empty) ? (_2_wr) : (Std_JSON_ZeroCopy_Serializer.__default.StructuralView(((m).dtor_suffix).dtor_t, _2_wr)));
      return _3_wr;
    };
    static Item(m, writer) {
      let _0_wr = Std_JSON_ZeroCopy_Serializer.__default.Value((m).dtor_t, writer);
      let _1_wr = ((((m).dtor_suffix).is_Empty) ? (_0_wr) : (Std_JSON_ZeroCopy_Serializer.__default.StructuralView(((m).dtor_suffix).dtor_t, _0_wr)));
      return _1_wr;
    };
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Serializer
let Std_JSON_ZeroCopy_Deserializer_Core = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.Core._default";
    }
    _parentTraits() {
      return [];
    }
    static Get(cs, err) {
      let _0_valueOrError0 = (cs).Get(err);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_cs = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success((_1_cs).Split());
      }
    };
    static WS(cs) {
      let sp = Std_JSON_Utils_Cursors.Split.Default(Std_JSON_Grammar.jblanks.Default);
      let _0_point_k;
      _0_point_k = (cs).dtor_point;
      let _1_end;
      _1_end = (cs).dtor_end;
      while (((_0_point_k) < (_1_end)) && (Std_JSON_Grammar.__default.Blank_q(((cs).dtor_s)[_0_point_k]))) {
        _0_point_k = (_0_point_k) + (1);
      }
      sp = (Std_JSON_Utils_Cursors.Cursor__.create_Cursor((cs).dtor_s, (cs).dtor_beg, _0_point_k, (cs).dtor_end)).Split();
      return sp;
      return sp;
    }
    static Structural(cs, parser) {
      let _let_tmp_rhs0 = Std_JSON_ZeroCopy_Deserializer_Core.__default.WS(cs);
      let _0_before = (_let_tmp_rhs0).t;
      let _1_cs = (_let_tmp_rhs0).cs;
      let _2_valueOrError0 = ((parser))(_1_cs);
      if ((_2_valueOrError0).IsFailure()) {
        return (_2_valueOrError0).PropagateFailure();
      } else {
        let _let_tmp_rhs1 = (_2_valueOrError0).Extract();
        let _3_val = (_let_tmp_rhs1).t;
        let _4_cs = (_let_tmp_rhs1).cs;
        let _let_tmp_rhs2 = Std_JSON_ZeroCopy_Deserializer_Core.__default.WS(_4_cs);
        let _5_after = (_let_tmp_rhs2).t;
        let _6_cs = (_let_tmp_rhs2).cs;
        return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Structural.create_Structural(_0_before, _3_val, _5_after), _6_cs));
      }
    };
    static TryStructural(cs) {
      let _let_tmp_rhs0 = Std_JSON_ZeroCopy_Deserializer_Core.__default.WS(cs);
      let _0_before = (_let_tmp_rhs0).t;
      let _1_cs = (_let_tmp_rhs0).cs;
      let _let_tmp_rhs1 = ((_1_cs).SkipByte()).Split();
      let _2_val = (_let_tmp_rhs1).t;
      let _3_cs = (_let_tmp_rhs1).cs;
      let _let_tmp_rhs2 = Std_JSON_ZeroCopy_Deserializer_Core.__default.WS(_3_cs);
      let _4_after = (_let_tmp_rhs2).t;
      let _5_cs = (_let_tmp_rhs2).cs;
      return Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Structural.create_Structural(_0_before, _2_val, _4_after), _5_cs);
    };
    static get SpecView() {
      return function (_0_v) {
        return Std_JSON_ConcreteSyntax_Spec.__default.View(_0_v);
      };
    };
  };

  $module.jopt = class jopt {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of());
    }
    static get Default() {
      return Std_JSON_ZeroCopy_Deserializer_Core.jopt.Witness;
    }
  };

  $module.ValueParser = class ValueParser {
    constructor () {
    }
    static get Default() {
      return Std_JSON_Utils_Parsers.SubParser.Default;
    }
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_Core
let Std_JSON_ZeroCopy_Deserializer_Strings = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.Strings._default";
    }
    _parentTraits() {
      return [];
    }
    static StringBody(cs) {
      let pr = Std_Wrappers.Result.Default(Std_JSON_Utils_Cursors.Cursor.Default);
      let _0_escaped;
      _0_escaped = false;
      let _hi0 = (cs).dtor_end;
      for (let _1_point_k = (cs).dtor_point; _1_point_k < _hi0; _1_point_k++) {
        let _2_byte;
        _2_byte = ((cs).dtor_s)[_1_point_k];
        if (((_2_byte) === ((new _dafny.CodePoint('\"'.codePointAt(0))).value)) && (!(_0_escaped))) {
          pr = Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Cursor__.create_Cursor((cs).dtor_s, (cs).dtor_beg, _1_point_k, (cs).dtor_end));
          return pr;
        } else if ((_2_byte) === ((new _dafny.CodePoint('\\'.codePointAt(0))).value)) {
          _0_escaped = !(_0_escaped);
        } else {
          _0_escaped = false;
        }
      }
      pr = Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_EOF());
      return pr;
      return pr;
    }
    static Quote(cs) {
      let _0_valueOrError0 = (cs).AssertChar(new _dafny.CodePoint('\"'.codePointAt(0)));
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_cs = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success((_1_cs).Split());
      }
    };
    static String(cs) {
      let _0_origCs = cs;
      let _1_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Strings.__default.Quote(cs);
      if ((_1_valueOrError0).IsFailure()) {
        return (_1_valueOrError0).PropagateFailure();
      } else {
        let _let_tmp_rhs0 = (_1_valueOrError0).Extract();
        let _2_lq = (_let_tmp_rhs0).t;
        let _3_cs = (_let_tmp_rhs0).cs;
        let _4_valueOrError1 = Std_JSON_ZeroCopy_Deserializer_Strings.__default.StringBody(_3_cs);
        if ((_4_valueOrError1).IsFailure()) {
          return (_4_valueOrError1).PropagateFailure();
        } else {
          let _5_contents = (_4_valueOrError1).Extract();
          let _let_tmp_rhs1 = (_5_contents).Split();
          let _6_contents = (_let_tmp_rhs1).t;
          let _7_cs = (_let_tmp_rhs1).cs;
          let _8_valueOrError2 = Std_JSON_ZeroCopy_Deserializer_Strings.__default.Quote(_7_cs);
          if ((_8_valueOrError2).IsFailure()) {
            return (_8_valueOrError2).PropagateFailure();
          } else {
            let _let_tmp_rhs2 = (_8_valueOrError2).Extract();
            let _9_rq = (_let_tmp_rhs2).t;
            let _10_cs = (_let_tmp_rhs2).cs;
            let _11_result = Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.jstring.create_JString(_2_lq, _6_contents, _9_rq), _10_cs);
            return Std_Wrappers.Result.create_Success(_11_result);
          }
        }
      }
    };
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_Strings
let Std_JSON_ZeroCopy_Deserializer_Numbers = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.Numbers._default";
    }
    _parentTraits() {
      return [];
    }
    static Digits(cs) {
      return ((cs).SkipWhile(Std_JSON_Grammar.__default.Digit_q)).Split();
    };
    static NonEmptyDigits(cs) {
      let _0_sp = Std_JSON_ZeroCopy_Deserializer_Numbers.__default.Digits(cs);
      if (((_0_sp).dtor_t).Empty_q) {
        return Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_OtherError(Std_JSON_Errors.DeserializationError.create_EmptyNumber()));
      } else {
        return Std_Wrappers.Result.create_Success(_0_sp);
      }
    };
    static NonZeroInt(cs) {
      return Std_JSON_ZeroCopy_Deserializer_Numbers.__default.NonEmptyDigits(cs);
    };
    static OptionalMinus(cs) {
      return ((cs).SkipIf(function (_0_c) {
        return (_0_c) === ((new _dafny.CodePoint('-'.codePointAt(0))).value);
      })).Split();
    };
    static OptionalSign(cs) {
      return ((cs).SkipIf(function (_0_c) {
        return ((_0_c) === ((new _dafny.CodePoint('-'.codePointAt(0))).value)) || ((_0_c) === ((new _dafny.CodePoint('+'.codePointAt(0))).value));
      })).Split();
    };
    static TrimmedInt(cs) {
      let _0_sp = ((cs).SkipIf(function (_1_c) {
        return (_1_c) === ((new _dafny.CodePoint('0'.codePointAt(0))).value);
      })).Split();
      if (((_0_sp).dtor_t).Empty_q) {
        return Std_JSON_ZeroCopy_Deserializer_Numbers.__default.NonZeroInt((_0_sp).dtor_cs);
      } else {
        return Std_Wrappers.Result.create_Success(_0_sp);
      }
    };
    static Exp(cs) {
      let _let_tmp_rhs0 = ((cs).SkipIf(function (_0_c) {
        return ((_0_c) === ((new _dafny.CodePoint('e'.codePointAt(0))).value)) || ((_0_c) === ((new _dafny.CodePoint('E'.codePointAt(0))).value));
      })).Split();
      let _1_e = (_let_tmp_rhs0).t;
      let _2_cs = (_let_tmp_rhs0).cs;
      if ((_1_e).Empty_q) {
        return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Maybe.create_Empty(), _2_cs));
      } else {
        let _let_tmp_rhs1 = Std_JSON_ZeroCopy_Deserializer_Numbers.__default.OptionalSign(_2_cs);
        let _3_sign = (_let_tmp_rhs1).t;
        let _4_cs = (_let_tmp_rhs1).cs;
        let _5_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Numbers.__default.NonEmptyDigits(_4_cs);
        if ((_5_valueOrError0).IsFailure()) {
          return (_5_valueOrError0).PropagateFailure();
        } else {
          let _let_tmp_rhs2 = (_5_valueOrError0).Extract();
          let _6_num = (_let_tmp_rhs2).t;
          let _7_cs = (_let_tmp_rhs2).cs;
          return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Maybe.create_NonEmpty(Std_JSON_Grammar.jexp.create_JExp(_1_e, _3_sign, _6_num)), _7_cs));
        }
      }
    };
    static Frac(cs) {
      let _let_tmp_rhs0 = ((cs).SkipIf(function (_0_c) {
        return (_0_c) === ((new _dafny.CodePoint('.'.codePointAt(0))).value);
      })).Split();
      let _1_period = (_let_tmp_rhs0).t;
      let _2_cs = (_let_tmp_rhs0).cs;
      if ((_1_period).Empty_q) {
        return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Maybe.create_Empty(), _2_cs));
      } else {
        let _3_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Numbers.__default.NonEmptyDigits(_2_cs);
        if ((_3_valueOrError0).IsFailure()) {
          return (_3_valueOrError0).PropagateFailure();
        } else {
          let _let_tmp_rhs1 = (_3_valueOrError0).Extract();
          let _4_num = (_let_tmp_rhs1).t;
          let _5_cs = (_let_tmp_rhs1).cs;
          return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Maybe.create_NonEmpty(Std_JSON_Grammar.jfrac.create_JFrac(_1_period, _4_num)), _5_cs));
        }
      }
    };
    static NumberFromParts(minus, num, frac, exp) {
      let _0_sp = Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.jnumber.create_JNumber((minus).dtor_t, (num).dtor_t, (frac).dtor_t, (exp).dtor_t), (exp).dtor_cs);
      return _0_sp;
    };
    static Number(cs) {
      let _0_minus = Std_JSON_ZeroCopy_Deserializer_Numbers.__default.OptionalMinus(cs);
      let _1_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Numbers.__default.TrimmedInt((_0_minus).dtor_cs);
      if ((_1_valueOrError0).IsFailure()) {
        return (_1_valueOrError0).PropagateFailure();
      } else {
        let _2_num = (_1_valueOrError0).Extract();
        let _3_valueOrError1 = Std_JSON_ZeroCopy_Deserializer_Numbers.__default.Frac((_2_num).dtor_cs);
        if ((_3_valueOrError1).IsFailure()) {
          return (_3_valueOrError1).PropagateFailure();
        } else {
          let _4_frac = (_3_valueOrError1).Extract();
          let _5_valueOrError2 = Std_JSON_ZeroCopy_Deserializer_Numbers.__default.Exp((_4_frac).dtor_cs);
          if ((_5_valueOrError2).IsFailure()) {
            return (_5_valueOrError2).PropagateFailure();
          } else {
            let _6_exp = (_5_valueOrError2).Extract();
            return Std_Wrappers.Result.create_Success(Std_JSON_ZeroCopy_Deserializer_Numbers.__default.NumberFromParts(_0_minus, _2_num, _4_frac, _6_exp));
          }
        }
      }
    };
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_Numbers
let Std_JSON_ZeroCopy_Deserializer_ObjectParams = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.ObjectParams._default";
    }
    _parentTraits() {
      return [];
    }
    static Colon(cs) {
      let _0_valueOrError0 = (cs).AssertChar(new _dafny.CodePoint(':'.codePointAt(0)));
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_cs = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success((_1_cs).Split());
      }
    };
    static KeyValueFromParts(k, colon, v) {
      let _0_sp = Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.jKeyValue.create_KeyValue((k).dtor_t, (colon).dtor_t, (v).dtor_t), (v).dtor_cs);
      return _0_sp;
    };
    static ElementSpec(t) {
      return Std_JSON_ConcreteSyntax_Spec.__default.KeyValue(t);
    };
    static Element(cs, json) {
      let _0_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Strings.__default.String(cs);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_k = (_0_valueOrError0).Extract();
        let _2_p = Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.Colon;
        let _3_valueOrError1 = Std_JSON_ZeroCopy_Deserializer_Core.__default.Structural((_1_k).dtor_cs, _2_p);
        if ((_3_valueOrError1).IsFailure()) {
          return (_3_valueOrError1).PropagateFailure();
        } else {
          let _4_colon = (_3_valueOrError1).Extract();
          let _5_valueOrError2 = ((json))((_4_colon).dtor_cs);
          if ((_5_valueOrError2).IsFailure()) {
            return (_5_valueOrError2).PropagateFailure();
          } else {
            let _6_v = (_5_valueOrError2).Extract();
            let _7_kv = Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.KeyValueFromParts(_1_k, _4_colon, _6_v);
            return Std_Wrappers.Result.create_Success(_7_kv);
          }
        }
      }
    };
    static get OPEN() {
      return (new _dafny.CodePoint('{'.codePointAt(0))).value;
    };
    static get CLOSE() {
      return (new _dafny.CodePoint('}'.codePointAt(0))).value;
    };
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_ObjectParams
let Std_JSON_ZeroCopy_Deserializer_Objects = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.Objects._default";
    }
    _parentTraits() {
      return [];
    }
    static Object(cs, json) {
      let _0_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Objects.__default.Bracketed(cs, json);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_sp = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success(_1_sp);
      }
    };
    static Open(cs) {
      let _0_valueOrError0 = (cs).AssertByte(Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.OPEN);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_cs = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success((_1_cs).Split());
      }
    };
    static Close(cs) {
      let _0_valueOrError0 = (cs).AssertByte(Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.CLOSE);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_cs = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success((_1_cs).Split());
      }
    };
    static BracketedFromParts(open, elems, close) {
      let _0_sp = Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Bracketed.create_Bracketed((open).dtor_t, (elems).dtor_t, (close).dtor_t), (close).dtor_cs);
      return _0_sp;
    };
    static AppendWithSuffix(elems, elem, sep) {
      let _0_suffixed = Std_JSON_Grammar.Suffixed.create_Suffixed((elem).dtor_t, Std_JSON_Grammar.Maybe.create_NonEmpty((sep).dtor_t));
      let _1_elems_k = Std_JSON_Utils_Cursors.Split.create_SP(_dafny.Seq.Concat((elems).dtor_t, _dafny.Seq.of(_0_suffixed)), (sep).dtor_cs);
      return _1_elems_k;
    };
    static AppendLast(elems, elem, sep) {
      let _0_suffixed = Std_JSON_Grammar.Suffixed.create_Suffixed((elem).dtor_t, Std_JSON_Grammar.Maybe.create_Empty());
      let _1_elems_k = Std_JSON_Utils_Cursors.Split.create_SP(_dafny.Seq.Concat((elems).dtor_t, _dafny.Seq.of(_0_suffixed)), (elem).dtor_cs);
      return _1_elems_k;
    };
    static Elements(json, open, elems) {
      TAIL_CALL_START: while (true) {
        let _0_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.Element((elems).dtor_cs, json);
        if ((_0_valueOrError0).IsFailure()) {
          return (_0_valueOrError0).PropagateFailure();
        } else {
          let _1_elem = (_0_valueOrError0).Extract();
          if (((_1_elem).dtor_cs).EOF_q) {
            return Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_EOF());
          } else {
            let _2_sep = Std_JSON_ZeroCopy_Deserializer_Core.__default.TryStructural((_1_elem).dtor_cs);
            let _3_s0 = (((_2_sep).dtor_t).dtor_t).Peek();
            if (((_3_s0) === (Std_JSON_ZeroCopy_Deserializer_Objects.__default.SEPARATOR)) && (((((_2_sep).dtor_t).dtor_t).Length()) === (1))) {
              let _4_sep = _2_sep;
              let _5_elems = Std_JSON_ZeroCopy_Deserializer_Objects.__default.AppendWithSuffix(elems, _1_elem, _4_sep);
              let _in0 = json;
              let _in1 = open;
              let _in2 = _5_elems;
              json = _in0;
              open = _in1;
              elems = _in2;
              continue TAIL_CALL_START;
            } else if (((_3_s0) === (Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.CLOSE)) && (((((_2_sep).dtor_t).dtor_t).Length()) === (1))) {
              let _6_sep = _2_sep;
              let _7_elems_k = Std_JSON_ZeroCopy_Deserializer_Objects.__default.AppendLast(elems, _1_elem, _6_sep);
              let _8_bracketed = Std_JSON_ZeroCopy_Deserializer_Objects.__default.BracketedFromParts(open, _7_elems_k, _6_sep);
              return Std_Wrappers.Result.create_Success(_8_bracketed);
            } else {
              let _9_separator = Std_JSON_ZeroCopy_Deserializer_Objects.__default.SEPARATOR;
              let _10_pr = Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_ExpectingAnyByte(_dafny.Seq.of(Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.CLOSE, _9_separator), _3_s0));
              return _10_pr;
            }
          }
        }
      }
    };
    static Bracketed(cs, json) {
      let _0_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Core.__default.Structural(cs, Std_JSON_ZeroCopy_Deserializer_Objects.__default.Open);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_open = (_0_valueOrError0).Extract();
        let _2_elems = Std_JSON_Utils_Cursors.Split.create_SP(_dafny.Seq.of(), (_1_open).dtor_cs);
        if ((((_1_open).dtor_cs).Peek()) === (Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.CLOSE)) {
          let _3_p = Std_JSON_ZeroCopy_Deserializer_Objects.__default.Close;
          let _4_valueOrError1 = Std_JSON_ZeroCopy_Deserializer_Core.__default.Structural((_1_open).dtor_cs, _3_p);
          if ((_4_valueOrError1).IsFailure()) {
            return (_4_valueOrError1).PropagateFailure();
          } else {
            let _5_close = (_4_valueOrError1).Extract();
            return Std_Wrappers.Result.create_Success(Std_JSON_ZeroCopy_Deserializer_Objects.__default.BracketedFromParts(_1_open, _2_elems, _5_close));
          }
        } else {
          return Std_JSON_ZeroCopy_Deserializer_Objects.__default.Elements(json, _1_open, _2_elems);
        }
      }
    };
    static get SpecViewOpen() {
      return Std_JSON_ZeroCopy_Deserializer_Core.__default.SpecView;
    };
    static get SpecViewClose() {
      return Std_JSON_ZeroCopy_Deserializer_Core.__default.SpecView;
    };
    static get SEPARATOR() {
      return (new _dafny.CodePoint(','.codePointAt(0))).value;
    };
  };

  $module.jopen = class jopen {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of(Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.OPEN));
    }
    static get Default() {
      return Std_JSON_ZeroCopy_Deserializer_Objects.jopen.Witness;
    }
  };

  $module.jclose = class jclose {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of(Std_JSON_ZeroCopy_Deserializer_ObjectParams.__default.CLOSE));
    }
    static get Default() {
      return Std_JSON_ZeroCopy_Deserializer_Objects.jclose.Witness;
    }
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_Objects
let Std_JSON_ZeroCopy_Deserializer_ArrayParams = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.ArrayParams._default";
    }
    _parentTraits() {
      return [];
    }
    static ElementSpec(t) {
      return Std_JSON_ConcreteSyntax_Spec.__default.Value(t);
    };
    static Element(cs, json) {
      return ((json))(cs);
    };
    static get OPEN() {
      return (new _dafny.CodePoint('['.codePointAt(0))).value;
    };
    static get CLOSE() {
      return (new _dafny.CodePoint(']'.codePointAt(0))).value;
    };
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_ArrayParams
let Std_JSON_ZeroCopy_Deserializer_Arrays = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.Arrays._default";
    }
    _parentTraits() {
      return [];
    }
    static Array(cs, json) {
      let _0_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Arrays.__default.Bracketed(cs, json);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_sp = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success(_1_sp);
      }
    };
    static Open(cs) {
      let _0_valueOrError0 = (cs).AssertByte(Std_JSON_ZeroCopy_Deserializer_ArrayParams.__default.OPEN);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_cs = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success((_1_cs).Split());
      }
    };
    static Close(cs) {
      let _0_valueOrError0 = (cs).AssertByte(Std_JSON_ZeroCopy_Deserializer_ArrayParams.__default.CLOSE);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_cs = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success((_1_cs).Split());
      }
    };
    static BracketedFromParts(open, elems, close) {
      let _0_sp = Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Bracketed.create_Bracketed((open).dtor_t, (elems).dtor_t, (close).dtor_t), (close).dtor_cs);
      return _0_sp;
    };
    static AppendWithSuffix(elems, elem, sep) {
      let _0_suffixed = Std_JSON_Grammar.Suffixed.create_Suffixed((elem).dtor_t, Std_JSON_Grammar.Maybe.create_NonEmpty((sep).dtor_t));
      let _1_elems_k = Std_JSON_Utils_Cursors.Split.create_SP(_dafny.Seq.Concat((elems).dtor_t, _dafny.Seq.of(_0_suffixed)), (sep).dtor_cs);
      return _1_elems_k;
    };
    static AppendLast(elems, elem, sep) {
      let _0_suffixed = Std_JSON_Grammar.Suffixed.create_Suffixed((elem).dtor_t, Std_JSON_Grammar.Maybe.create_Empty());
      let _1_elems_k = Std_JSON_Utils_Cursors.Split.create_SP(_dafny.Seq.Concat((elems).dtor_t, _dafny.Seq.of(_0_suffixed)), (elem).dtor_cs);
      return _1_elems_k;
    };
    static Elements(json, open, elems) {
      TAIL_CALL_START: while (true) {
        let _0_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_ArrayParams.__default.Element((elems).dtor_cs, json);
        if ((_0_valueOrError0).IsFailure()) {
          return (_0_valueOrError0).PropagateFailure();
        } else {
          let _1_elem = (_0_valueOrError0).Extract();
          if (((_1_elem).dtor_cs).EOF_q) {
            return Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_EOF());
          } else {
            let _2_sep = Std_JSON_ZeroCopy_Deserializer_Core.__default.TryStructural((_1_elem).dtor_cs);
            let _3_s0 = (((_2_sep).dtor_t).dtor_t).Peek();
            if (((_3_s0) === (Std_JSON_ZeroCopy_Deserializer_Arrays.__default.SEPARATOR)) && (((((_2_sep).dtor_t).dtor_t).Length()) === (1))) {
              let _4_sep = _2_sep;
              let _5_elems = Std_JSON_ZeroCopy_Deserializer_Arrays.__default.AppendWithSuffix(elems, _1_elem, _4_sep);
              let _in0 = json;
              let _in1 = open;
              let _in2 = _5_elems;
              json = _in0;
              open = _in1;
              elems = _in2;
              continue TAIL_CALL_START;
            } else if (((_3_s0) === (Std_JSON_ZeroCopy_Deserializer_ArrayParams.__default.CLOSE)) && (((((_2_sep).dtor_t).dtor_t).Length()) === (1))) {
              let _6_sep = _2_sep;
              let _7_elems_k = Std_JSON_ZeroCopy_Deserializer_Arrays.__default.AppendLast(elems, _1_elem, _6_sep);
              let _8_bracketed = Std_JSON_ZeroCopy_Deserializer_Arrays.__default.BracketedFromParts(open, _7_elems_k, _6_sep);
              return Std_Wrappers.Result.create_Success(_8_bracketed);
            } else {
              let _9_separator = Std_JSON_ZeroCopy_Deserializer_Arrays.__default.SEPARATOR;
              let _10_pr = Std_Wrappers.Result.create_Failure(Std_JSON_Utils_Cursors.CursorError.create_ExpectingAnyByte(_dafny.Seq.of(Std_JSON_ZeroCopy_Deserializer_ArrayParams.__default.CLOSE, _9_separator), _3_s0));
              return _10_pr;
            }
          }
        }
      }
    };
    static Bracketed(cs, json) {
      let _0_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Core.__default.Structural(cs, Std_JSON_ZeroCopy_Deserializer_Arrays.__default.Open);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_open = (_0_valueOrError0).Extract();
        let _2_elems = Std_JSON_Utils_Cursors.Split.create_SP(_dafny.Seq.of(), (_1_open).dtor_cs);
        if ((((_1_open).dtor_cs).Peek()) === (Std_JSON_ZeroCopy_Deserializer_ArrayParams.__default.CLOSE)) {
          let _3_p = Std_JSON_ZeroCopy_Deserializer_Arrays.__default.Close;
          let _4_valueOrError1 = Std_JSON_ZeroCopy_Deserializer_Core.__default.Structural((_1_open).dtor_cs, _3_p);
          if ((_4_valueOrError1).IsFailure()) {
            return (_4_valueOrError1).PropagateFailure();
          } else {
            let _5_close = (_4_valueOrError1).Extract();
            return Std_Wrappers.Result.create_Success(Std_JSON_ZeroCopy_Deserializer_Arrays.__default.BracketedFromParts(_1_open, _2_elems, _5_close));
          }
        } else {
          return Std_JSON_ZeroCopy_Deserializer_Arrays.__default.Elements(json, _1_open, _2_elems);
        }
      }
    };
    static get SpecViewOpen() {
      return Std_JSON_ZeroCopy_Deserializer_Core.__default.SpecView;
    };
    static get SpecViewClose() {
      return Std_JSON_ZeroCopy_Deserializer_Core.__default.SpecView;
    };
    static get SEPARATOR() {
      return (new _dafny.CodePoint(','.codePointAt(0))).value;
    };
  };

  $module.jopen = class jopen {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of(Std_JSON_ZeroCopy_Deserializer_ArrayParams.__default.OPEN));
    }
    static get Default() {
      return Std_JSON_ZeroCopy_Deserializer_Arrays.jopen.Witness;
    }
  };

  $module.jclose = class jclose {
    constructor () {
    }
    static get Witness() {
      return Std_JSON_Utils_Views_Core.View__.OfBytes(_dafny.Seq.of(Std_JSON_ZeroCopy_Deserializer_ArrayParams.__default.CLOSE));
    }
    static get Default() {
      return Std_JSON_ZeroCopy_Deserializer_Arrays.jclose.Witness;
    }
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_Arrays
let Std_JSON_ZeroCopy_Deserializer_Constants = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.Constants._default";
    }
    _parentTraits() {
      return [];
    }
    static Constant(cs, expected) {
      let _0_valueOrError0 = (cs).AssertBytes(expected, 0);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_cs = (_0_valueOrError0).Extract();
        return Std_Wrappers.Result.create_Success((_1_cs).Split());
      }
    };
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_Constants
let Std_JSON_ZeroCopy_Deserializer_Values = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.Values._default";
    }
    _parentTraits() {
      return [];
    }
    static Value(cs) {
      let _0_c = (cs).Peek();
      if ((_0_c) === ((new _dafny.CodePoint('{'.codePointAt(0))).value)) {
        let _1_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_Objects.__default.Object(cs, Std_JSON_ZeroCopy_Deserializer_Values.__default.ValueParser(cs));
        if ((_1_valueOrError0).IsFailure()) {
          return (_1_valueOrError0).PropagateFailure();
        } else {
          let _let_tmp_rhs0 = (_1_valueOrError0).Extract();
          let _2_obj = (_let_tmp_rhs0).t;
          let _3_cs_k = (_let_tmp_rhs0).cs;
          let _4_v = Std_JSON_Grammar.Value.create_Object(_2_obj);
          let _5_sp = Std_JSON_Utils_Cursors.Split.create_SP(_4_v, _3_cs_k);
          return Std_Wrappers.Result.create_Success(_5_sp);
        }
      } else if ((_0_c) === ((new _dafny.CodePoint('['.codePointAt(0))).value)) {
        let _6_valueOrError1 = Std_JSON_ZeroCopy_Deserializer_Arrays.__default.Array(cs, Std_JSON_ZeroCopy_Deserializer_Values.__default.ValueParser(cs));
        if ((_6_valueOrError1).IsFailure()) {
          return (_6_valueOrError1).PropagateFailure();
        } else {
          let _let_tmp_rhs1 = (_6_valueOrError1).Extract();
          let _7_arr = (_let_tmp_rhs1).t;
          let _8_cs_k = (_let_tmp_rhs1).cs;
          let _9_v = Std_JSON_Grammar.Value.create_Array(_7_arr);
          let _10_sp = Std_JSON_Utils_Cursors.Split.create_SP(_9_v, _8_cs_k);
          return Std_Wrappers.Result.create_Success(_10_sp);
        }
      } else if ((_0_c) === ((new _dafny.CodePoint('\"'.codePointAt(0))).value)) {
        let _11_valueOrError2 = Std_JSON_ZeroCopy_Deserializer_Strings.__default.String(cs);
        if ((_11_valueOrError2).IsFailure()) {
          return (_11_valueOrError2).PropagateFailure();
        } else {
          let _let_tmp_rhs2 = (_11_valueOrError2).Extract();
          let _12_str = (_let_tmp_rhs2).t;
          let _13_cs_k = (_let_tmp_rhs2).cs;
          return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Value.create_String(_12_str), _13_cs_k));
        }
      } else if ((_0_c) === ((new _dafny.CodePoint('t'.codePointAt(0))).value)) {
        let _14_valueOrError3 = Std_JSON_ZeroCopy_Deserializer_Constants.__default.Constant(cs, Std_JSON_Grammar.__default.TRUE);
        if ((_14_valueOrError3).IsFailure()) {
          return (_14_valueOrError3).PropagateFailure();
        } else {
          let _let_tmp_rhs3 = (_14_valueOrError3).Extract();
          let _15_cst = (_let_tmp_rhs3).t;
          let _16_cs_k = (_let_tmp_rhs3).cs;
          return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Value.create_Bool(_15_cst), _16_cs_k));
        }
      } else if ((_0_c) === ((new _dafny.CodePoint('f'.codePointAt(0))).value)) {
        let _17_valueOrError4 = Std_JSON_ZeroCopy_Deserializer_Constants.__default.Constant(cs, Std_JSON_Grammar.__default.FALSE);
        if ((_17_valueOrError4).IsFailure()) {
          return (_17_valueOrError4).PropagateFailure();
        } else {
          let _let_tmp_rhs4 = (_17_valueOrError4).Extract();
          let _18_cst = (_let_tmp_rhs4).t;
          let _19_cs_k = (_let_tmp_rhs4).cs;
          return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Value.create_Bool(_18_cst), _19_cs_k));
        }
      } else if ((_0_c) === ((new _dafny.CodePoint('n'.codePointAt(0))).value)) {
        let _20_valueOrError5 = Std_JSON_ZeroCopy_Deserializer_Constants.__default.Constant(cs, Std_JSON_Grammar.__default.NULL);
        if ((_20_valueOrError5).IsFailure()) {
          return (_20_valueOrError5).PropagateFailure();
        } else {
          let _let_tmp_rhs5 = (_20_valueOrError5).Extract();
          let _21_cst = (_let_tmp_rhs5).t;
          let _22_cs_k = (_let_tmp_rhs5).cs;
          return Std_Wrappers.Result.create_Success(Std_JSON_Utils_Cursors.Split.create_SP(Std_JSON_Grammar.Value.create_Null(_21_cst), _22_cs_k));
        }
      } else {
        let _23_valueOrError6 = Std_JSON_ZeroCopy_Deserializer_Numbers.__default.Number(cs);
        if ((_23_valueOrError6).IsFailure()) {
          return (_23_valueOrError6).PropagateFailure();
        } else {
          let _let_tmp_rhs6 = (_23_valueOrError6).Extract();
          let _24_num = (_let_tmp_rhs6).t;
          let _25_cs_k = (_let_tmp_rhs6).cs;
          let _26_v = Std_JSON_Grammar.Value.create_Number(_24_num);
          let _27_sp = Std_JSON_Utils_Cursors.Split.create_SP(_26_v, _25_cs_k);
          return Std_Wrappers.Result.create_Success(_27_sp);
        }
      }
    };
    static ValueParser(cs) {
      let _0_pre = ((_1_cs) => function (_2_ps_k) {
        return ((_2_ps_k).Length()) < ((_1_cs).Length());
      })(cs);
      let _3_fn = ((_4_pre) => function (_5_ps_k) {
        return Std_JSON_ZeroCopy_Deserializer_Values.__default.Value(_5_ps_k);
      })(_0_pre);
      return _3_fn;
    };
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_Values
let Std_JSON_ZeroCopy_Deserializer_API = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.Deserializer.API._default";
    }
    _parentTraits() {
      return [];
    }
    static LiftCursorError(err) {
      let _source0 = err;
      {
        if (_source0.is_EOF) {
          return Std_JSON_Errors.DeserializationError.create_ReachedEOF();
        }
      }
      {
        if (_source0.is_ExpectingByte) {
          let _0_expected = (_source0).expected;
          let _1_b = (_source0).b;
          return Std_JSON_Errors.DeserializationError.create_ExpectingByte(_0_expected, _1_b);
        }
      }
      {
        if (_source0.is_ExpectingAnyByte) {
          let _2_expected__sq = (_source0).expected__sq;
          let _3_b = (_source0).b;
          return Std_JSON_Errors.DeserializationError.create_ExpectingAnyByte(_2_expected__sq, _3_b);
        }
      }
      {
        let _4_err = (_source0).err;
        return _4_err;
      }
    };
    static JSON(cs) {
      return (Std_JSON_ZeroCopy_Deserializer_Core.__default.Structural(cs, Std_JSON_ZeroCopy_Deserializer_Values.__default.Value)).MapFailure(Std_JSON_ZeroCopy_Deserializer_API.__default.LiftCursorError);
    };
    static Text(v) {
      let _0_valueOrError0 = Std_JSON_ZeroCopy_Deserializer_API.__default.JSON(Std_JSON_Utils_Cursors.Cursor__.OfView(v));
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _let_tmp_rhs0 = (_0_valueOrError0).Extract();
        let _1_text = (_let_tmp_rhs0).t;
        let _2_cs = (_let_tmp_rhs0).cs;
        let _3_valueOrError1 = Std_Wrappers.__default.Need((_2_cs).EOF_q, Std_JSON_Errors.DeserializationError.create_ExpectingEOF());
        if ((_3_valueOrError1).IsFailure()) {
          return (_3_valueOrError1).PropagateFailure();
        } else {
          return Std_Wrappers.Result.create_Success(_1_text);
        }
      }
    };
    static OfBytes(bs) {
      let _0_valueOrError0 = Std_Wrappers.__default.Need((new BigNumber((bs).length)).isLessThan(Std_BoundedInts.__default.TWO__TO__THE__32), Std_JSON_Errors.DeserializationError.create_IntOverflow());
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        return Std_JSON_ZeroCopy_Deserializer_API.__default.Text(Std_JSON_Utils_Views_Core.View__.OfBytes(bs));
      }
    };
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer_API
let Std_JSON_ZeroCopy_Deserializer = (function() {
  let $module = {};

  return $module;
})(); // end of module Std_JSON_ZeroCopy_Deserializer
let Std_JSON_ZeroCopy_API = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.ZeroCopy.API._default";
    }
    _parentTraits() {
      return [];
    }
    static Serialize(js) {
      return Std_Wrappers.Result.create_Success((Std_JSON_ZeroCopy_Serializer.__default.Text(js)).Bytes());
    };
    static SerializeAlloc(js) {
      let bs = Std_Wrappers.Result.Default([]);
      let _out0;
      _out0 = Std_JSON_ZeroCopy_Serializer.__default.Serialize(js);
      bs = _out0;
      return bs;
    }
    static SerializeInto(js, bs) {
      let len = Std_Wrappers.Result.Default(0);
      let _out0;
      _out0 = Std_JSON_ZeroCopy_Serializer.__default.SerializeTo(js, bs);
      len = _out0;
      return len;
    }
    static Deserialize(bs) {
      return Std_JSON_ZeroCopy_Deserializer_API.__default.OfBytes(bs);
    };
  };
  return $module;
})(); // end of module Std_JSON_ZeroCopy_API
let Std_JSON_API = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.JSON.API._default";
    }
    _parentTraits() {
      return [];
    }
    static Serialize(js) {
      let _0_valueOrError0 = Std_JSON_Serializer.__default.JSON(js);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_js = (_0_valueOrError0).Extract();
        return Std_JSON_ZeroCopy_API.__default.Serialize(_1_js);
      }
    };
    static SerializeAlloc(js) {
      let bs = Std_Wrappers.Result.Default([]);
      let _0_valueOrError0 = Std_Wrappers.Result.Default(Std_JSON_Grammar.Structural.Default(Std_JSON_Grammar.Value.Default()));
      _0_valueOrError0 = Std_JSON_Serializer.__default.JSON(js);
      if ((_0_valueOrError0).IsFailure()) {
        bs = (_0_valueOrError0).PropagateFailure();
        return bs;
      }
      let _1_js;
      _1_js = (_0_valueOrError0).Extract();
      let _out0;
      _out0 = Std_JSON_ZeroCopy_API.__default.SerializeAlloc(_1_js);
      bs = _out0;
      return bs;
    }
    static SerializeInto(js, bs) {
      let len = Std_Wrappers.Result.Default(0);
      let _0_valueOrError0 = Std_Wrappers.Result.Default(Std_JSON_Grammar.Structural.Default(Std_JSON_Grammar.Value.Default()));
      _0_valueOrError0 = Std_JSON_Serializer.__default.JSON(js);
      if ((_0_valueOrError0).IsFailure()) {
        len = (_0_valueOrError0).PropagateFailure();
        return len;
      }
      let _1_js;
      _1_js = (_0_valueOrError0).Extract();
      let _out0;
      _out0 = Std_JSON_ZeroCopy_API.__default.SerializeInto(_1_js, bs);
      len = _out0;
      return len;
    }
    static Deserialize(bs) {
      let _0_valueOrError0 = Std_JSON_ZeroCopy_API.__default.Deserialize(bs);
      if ((_0_valueOrError0).IsFailure()) {
        return (_0_valueOrError0).PropagateFailure();
      } else {
        let _1_js = (_0_valueOrError0).Extract();
        return Std_JSON_Deserializer.__default.JSON(_1_js);
      }
    };
  };
  return $module;
})(); // end of module Std_JSON_API
let Std_Parsers_InputString = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Parsers.InputString._default";
    }
    _parentTraits() {
      return [];
    }
    static ToInput(r) {
      return Std_Collections_Seq.Slice.create_Slice(r, _dafny.ZERO, new BigNumber((r).length));
    };
    static View(self) {
      return (self).View();
    };
    static Length(self) {
      return (self).Length();
    };
    static CharAt(self, i) {
      return (self).At(i);
    };
    static Drop(self, start) {
      return (self).Drop(start);
    };
    static Slice(self, start, end) {
      return (self).Sub(start, end);
    };
    static Equals(self, other) {
      return _dafny.areEqual(self, other);
    };
  };

  $module.Input = class Input {
    constructor () {
    }
    static get Default() {
      return Std_Collections_Seq.Slice.Default();
    }
  };
  return $module;
})(); // end of module Std_Parsers_InputString
let Std_Parsers_StringParsers = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Parsers.StringParsers._default";
    }
    _parentTraits() {
      return [];
    }
    static Char(expectedChar) {
      return Std_Parsers_StringParsers.__default.CharTest(((_0_expectedChar) => function (_1_c) {
        return _dafny.areEqual(_1_c, _0_expectedChar);
      })(expectedChar), _dafny.Seq.of(expectedChar));
    };
    static Space() {
      return Std_Parsers_StringParsers.__default.CharTest(function (_0_c) {
        return _dafny.Seq.contains(_dafny.Seq.UnicodeFromString(" \t\r\n               　"), _0_c);
      }, _dafny.Seq.UnicodeFromString("space"));
    };
    static WS() {
      return Std_Parsers_StringParsers.__default.ZeroOrMore(Std_Parsers_StringParsers.__default.Space());
    };
    static Digit() {
      return Std_Parsers_StringParsers.__default.CharTest(function (_0_c) {
        return _dafny.Seq.contains(_dafny.Seq.UnicodeFromString("0123456789"), _0_c);
      }, _dafny.Seq.UnicodeFromString("digit"));
    };
    static DigitNumber() {
      return Std_Parsers_StringParsers.__default.Map(Std_Parsers_StringParsers.__default.Digit(), function (_0_c) {
        return function (_pat_let6_0) {
          return function (_1_d) {
            return function (_pat_let7_0) {
              return function (_2_n) {
                return _2_n;
              }(_pat_let7_0);
            }((((_dafny.ZERO).isLessThanOrEqualTo(_1_d)) ? (_1_d) : (_dafny.ZERO)));
          }(_pat_let6_0);
        }(Std_Parsers_StringParsers.__default.DigitToInt(_0_c));
      });
    };
    static Nat() {
      return Std_Parsers_StringParsers.__default.Bind(Std_Parsers_StringParsers.__default.DigitNumber(), function (_0_result) {
        return Std_Parsers_StringParsers.__default.Rep(Std_Parsers_StringParsers.__default.DigitNumber(), function (_1_previous, _2_c) {
          return function (_pat_let8_0) {
            return function (_3_r) {
              return _3_r;
            }(_pat_let8_0);
          }(((_1_previous).multipliedBy(new BigNumber(10))).plus(_2_c));
        }, _0_result);
      });
    };
    static Int() {
      return Std_Parsers_StringParsers.__default.Bind(Std_Parsers_StringParsers.__default.Maybe(Std_Parsers_StringParsers.__default.Char(new _dafny.CodePoint('-'.codePointAt(0)))), function (_0_minusSign) {
        return Std_Parsers_StringParsers.__default.Map(Std_Parsers_StringParsers.__default.Nat(), ((_1_minusSign) => function (_2_result) {
          return (((_1_minusSign).is_Some) ? ((_dafny.ZERO).minus(_2_result)) : (_2_result));
        })(_0_minusSign));
      });
    };
    static String(expected) {
      return ((_0_expected) => function (_1_input) {
        return ((((new BigNumber((_0_expected).length)).isLessThanOrEqualTo(Std_Parsers_InputString.__default.Length(_1_input))) && (_dafny.areEqual((Std_Parsers_InputString.__default.Slice(_1_input, _dafny.ZERO, new BigNumber((_0_expected).length))).View(), _0_expected))) ? (Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(_0_expected, Std_Parsers_InputString.__default.Drop(_1_input, new BigNumber((_0_expected).length)))) : (Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Recoverable(), Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("expected '"), _0_expected), _dafny.Seq.UnicodeFromString("'")), _1_input, Std_Wrappers.Option.create_None()))));
      })(expected);
    };
    static ExtractLineCol(input, pos) {
      let output = Std_Parsers_StringParsers.CodeLocation.Default();
      let _0_lineNumber = _dafny.ZERO;
      let _1_colNumber = _dafny.ZERO;
      let _2_lineStr = _dafny.Seq.UnicodeFromString("");
      _0_lineNumber = _dafny.ONE;
      let _3_startLinePos;
      _3_startLinePos = _dafny.ZERO;
      _1_colNumber = _dafny.ZERO;
      let _4_i;
      _4_i = _dafny.ZERO;
      while (((_4_i).isLessThan(new BigNumber((input).length))) && (!(_4_i).isEqualTo(pos))) {
        _1_colNumber = (_1_colNumber).plus(_dafny.ONE);
        if (((_dafny.areEqual((input)[_4_i], new _dafny.CodePoint('\r'.codePointAt(0)))) && (((_4_i).plus(_dafny.ONE)).isLessThan(new BigNumber((input).length)))) && (_dafny.areEqual((input)[(_4_i).plus(_dafny.ONE)], new _dafny.CodePoint('\n'.codePointAt(0))))) {
          _0_lineNumber = (_0_lineNumber).plus(_dafny.ONE);
          _1_colNumber = _dafny.ZERO;
          _4_i = (_4_i).plus(_dafny.ONE);
          _3_startLinePos = (_4_i).plus(_dafny.ONE);
        } else if (_dafny.Seq.contains(_dafny.Seq.UnicodeFromString("\r\n"), (input)[_4_i])) {
          _0_lineNumber = (_0_lineNumber).plus(_dafny.ONE);
          _1_colNumber = _dafny.ZERO;
          _3_startLinePos = (_4_i).plus(_dafny.ONE);
        }
        _4_i = (_4_i).plus(_dafny.ONE);
      }
      while (((_4_i).isLessThan(new BigNumber((input).length))) && (!_dafny.Seq.contains(_dafny.Seq.UnicodeFromString("\r\n"), (input)[_4_i]))) {
        _4_i = (_4_i).plus(_dafny.ONE);
      }
      _2_lineStr = (input).slice(_3_startLinePos, _4_i);
      output = Std_Parsers_StringParsers.CodeLocation.create_CodeLocation(_0_lineNumber, _1_colNumber, _2_lineStr);
      return output;
    }
    static DebugSummary(input) {
      return _dafny.Seq.Concat((((_dafny.ZERO).isLessThan(new BigNumber((input).length))) ? (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("'"), function () {
        let _source0 = (input)[_dafny.ZERO];
        {
          if (_dafny.areEqual(_source0, new _dafny.CodePoint('\n'.codePointAt(0)))) {
            return _dafny.Seq.UnicodeFromString("\\n");
          }
        }
        {
          if (_dafny.areEqual(_source0, new _dafny.CodePoint('\r'.codePointAt(0)))) {
            return _dafny.Seq.UnicodeFromString("\\r");
          }
        }
        {
          if (_dafny.areEqual(_source0, new _dafny.CodePoint('\t'.codePointAt(0)))) {
            return _dafny.Seq.UnicodeFromString("\\t");
          }
        }
        {
          let _0_c = _source0;
          return _dafny.Seq.of(_0_c);
        }
      }()), (((new BigNumber((input).length)).isEqualTo(_dafny.ONE)) ? (_dafny.Seq.UnicodeFromString("' and end of string")) : (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("'"), _dafny.Seq.UnicodeFromString(" and ")), Std_Strings.__default.OfInt((new BigNumber((input).length)).minus(_dafny.ONE))), _dafny.Seq.UnicodeFromString(" char")), (((new BigNumber((input).length)).isEqualTo(new BigNumber(2))) ? (_dafny.Seq.UnicodeFromString("")) : (_dafny.Seq.UnicodeFromString("s")))), _dafny.Seq.UnicodeFromString(" remaining")))))) : (_dafny.Seq.UnicodeFromString("'' (end of string)"))), _dafny.Seq.UnicodeFromString("\n"));
    };
    static DebugNameSummary(name, input) {
      return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("["), name), _dafny.Seq.UnicodeFromString("] ")), Std_Parsers_StringParsers.__default.DebugSummary(input));
    };
    static DebugSummaryInput(name, input) {
      return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("> "), Std_Parsers_StringParsers.__default.DebugNameSummary(name, input));
    };
    static PrintDebugSummaryInput(name, input) {
      process.stdout.write((Std_Parsers_StringParsers.__default.DebugSummaryInput(name, input)).toVerbatimString(false));
      return;
    }
    static NewIndent(input, indent) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((input).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.UnicodeFromString(""));
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, ((_dafny.areEqual((input)[_dafny.ZERO], new _dafny.CodePoint('\n'.codePointAt(0)))) ? (_dafny.Seq.Concat((input).slice(0, _dafny.ONE), indent)) : ((input).slice(0, _dafny.ONE))));
          let _in0 = (input).slice(_dafny.ONE);
          let _in1 = indent;
          input = _in0;
          indent = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static PrintDebugSummaryOutput(name, input, result) {
      process.stdout.write((_dafny.Seq.UnicodeFromString("< ")).toVerbatimString(false));
      process.stdout.write((Std_Parsers_StringParsers.__default.DebugNameSummary(name, input)).toVerbatimString(false));
      if ((result).is_ParseFailure) {
        process.stdout.write((_dafny.Seq.UnicodeFromString("| Unparsed: ")).toVerbatimString(false));
        process.stdout.write((Std_Parsers_StringParsers.__default.DebugSummary(Std_Parsers_InputString.__default.View((result).Remaining()))).toVerbatimString(false));
        if ((Std_Parsers_InputString.__default.Length((result).Remaining())).isLessThan(new BigNumber((input).length))) {
          process.stdout.write((_dafny.Seq.UnicodeFromString("| Was committed\n")).toVerbatimString(false));
        }
        process.stdout.write((_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("| "), Std_Parsers_StringParsers.__default.NewIndent(Std_Parsers_StringParsers.__default.FailureToString(input, result, new BigNumber(-1)), _dafny.Seq.UnicodeFromString("| ")))).toVerbatimString(false));
        process.stdout.write((_dafny.Seq.UnicodeFromString("\n")).toVerbatimString(false));
      } else {
        process.stdout.write((_dafny.Seq.UnicodeFromString("| Success: ")).toVerbatimString(false));
        process.stdout.write(_dafny.toString((result).dtor_result));
        process.stdout.write((_dafny.Seq.UnicodeFromString(", ")).toVerbatimString(false));
        process.stdout.write((Std_Parsers_StringParsers.__default.DebugSummary(Std_Parsers_InputString.__default.View((result).Remaining()))).toVerbatimString(false));
        process.stdout.write((_dafny.Seq.UnicodeFromString("\n")).toVerbatimString(false));
      }
      return;
    }
    static FailureToString(input, result, printPos) {
      let _0_failure = _dafny.Seq.UnicodeFromString("");
      let _1_failure = _dafny.Seq.Concat(_0_failure, (((printPos).isEqualTo(new BigNumber(-1))) ? (_dafny.Seq.Concat(((_dafny.areEqual((result).dtor_level, Std_Parsers_StringParsers.FailureLevel.create_Fatal())) ? (_dafny.Seq.UnicodeFromString("Fatal error")) : (_dafny.Seq.UnicodeFromString("Error"))), _dafny.Seq.UnicodeFromString(":\n"))) : (_dafny.Seq.UnicodeFromString(""))));
      let _2_pos = (new BigNumber((input).length)).minus(Std_Parsers_InputString.__default.Length(((result).dtor_data).dtor_remaining));
      let _3_pos = (((_2_pos).isLessThan(_dafny.ZERO)) ? (_dafny.ZERO) : (_2_pos));
      let _4_failure = (((printPos).isEqualTo(_3_pos)) ? (_1_failure) : (function (_pat_let9_0) {
        return function (_5_output) {
          return function (_pat_let10_0) {
            return function (_6_line) {
              return function (_7_col) {
                return function (_8_lineStr) {
                  return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_1_failure, Std_Strings.__default.OfInt(_6_line)), _dafny.Seq.UnicodeFromString(": ")), _8_lineStr), _dafny.Seq.UnicodeFromString("\n")), Std_Collections_Seq.__default.Repeat(new _dafny.CodePoint(' '.codePointAt(0)), ((_7_col).plus(new BigNumber(2))).plus(new BigNumber((Std_Strings.__default.OfInt(_6_line)).length)))), _dafny.Seq.UnicodeFromString("^")), _dafny.Seq.UnicodeFromString("\n"));
                }((_pat_let10_0).lineStr);
              }((_pat_let10_0).colNumber);
            }((_pat_let10_0).lineNumber);
          }(_5_output);
        }(_pat_let9_0);
      }(Std_Parsers_StringParsers.__default.ExtractLineCol(input, _3_pos))));
      let _9_failure = _dafny.Seq.Concat(_4_failure, ((result).dtor_data).dtor_message);
      if ((((result).dtor_data).dtor_next).is_Some) {
        let _10_failure = _dafny.Seq.Concat(_9_failure, _dafny.Seq.UnicodeFromString(", or\n"));
        let _11_subFailure = Std_Parsers_StringParsers.__default.FailureToString(input, Std_Parsers_StringParsers.ParseResult.create_ParseFailure((result).dtor_level, (((result).dtor_data).dtor_next).dtor_value), _3_pos);
        let _12_failure = _dafny.Seq.Concat(_10_failure, _11_subFailure);
        return _12_failure;
      } else {
        let _13_failure = _dafny.Seq.Concat(_9_failure, _dafny.Seq.UnicodeFromString("\n"));
        return _13_failure;
      }
    };
    static Apply(parser, input) {
      return (parser)(Std_Parsers_StringParsers.__default.ToInput(input));
    };
    static ToInput(input) {
      return Std_Collections_Seq.Slice.create_Slice(input, _dafny.ZERO, new BigNumber((input).length));
    };
    static IsRemaining(input, remaining) {
      return ((Std_Parsers_InputString.__default.Length(remaining)).isLessThanOrEqualTo(Std_Parsers_InputString.__default.Length(input))) && (_dafny.areEqual(Std_Parsers_InputString.__default.Drop(input, (Std_Parsers_InputString.__default.Length(input)).minus(Std_Parsers_InputString.__default.Length(remaining))), remaining));
    };
    static SucceedWith(result) {
      return ((_0_result) => function (_1_input) {
        return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(_0_result, _1_input);
      })(result);
    };
    static Epsilon() {
      return Std_Parsers_StringParsers.__default.SucceedWith(_dafny.Tuple.of());
    };
    static FailWith(message, level) {
      return ((_0_level, _1_message) => function (_2_input) {
        return Std_Parsers_StringParsers.ParseResult.create_ParseFailure(_0_level, Std_Parsers_StringParsers.FailureData.create_FailureData(_1_message, _2_input, Std_Wrappers.Option.create_None()));
      })(level, message);
    };
    static ResultWith(result) {
      return ((_0_result) => function (_1_input) {
        return _0_result;
      })(result);
    };
    static EndOfString() {
      return function (_0_input) {
        return (((Std_Parsers_InputString.__default.Length(_0_input)).isEqualTo(_dafny.ZERO)) ? (Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(_dafny.Tuple.of(), _0_input)) : (Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Recoverable(), Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.UnicodeFromString("expected end of string"), _0_input, Std_Wrappers.Option.create_None()))));
      };
    };
    static Bind(left, right) {
      return ((_0_left, _1_right) => function (_2_input) {
        return function (_pat_let11_0) {
          return function (_3_valueOrError0) {
            return (((_3_valueOrError0).IsFailure()) ? ((_3_valueOrError0).PropagateFailure()) : (function (_pat_let12_0) {
              return function (_4_leftResult) {
                return function (_5_remaining) {
                  return ((_1_right)(_4_leftResult))(_5_remaining);
                }((_pat_let12_0)[1]);
              }((_pat_let12_0)[0]);
            }((_3_valueOrError0).Extract())));
          }(_pat_let11_0);
        }((_0_left)(_2_input));
      })(left, right);
    };
    static BindSucceeds(left, right) {
      return ((_0_left, _1_right) => function (_2_input) {
        return function (_pat_let13_0) {
          return function (_3_valueOrError0) {
            return (((_3_valueOrError0).IsFailure()) ? ((_3_valueOrError0).PropagateFailure()) : (function (_pat_let14_0) {
              return function (_4_leftResult) {
                return function (_5_remaining) {
                  return ((_1_right)(_4_leftResult, _5_remaining))(_5_remaining);
                }((_pat_let14_0)[1]);
              }((_pat_let14_0)[0]);
            }((_3_valueOrError0).Extract())));
          }(_pat_let13_0);
        }((_0_left)(_2_input));
      })(left, right);
    };
    static BindResult(left, right) {
      return ((_0_right, _1_left) => function (_2_input) {
        return ((_0_right)((_1_left)(_2_input), _2_input))(_2_input);
      })(right, left);
    };
    static Map(underlying, mappingFunc) {
      return ((_0_underlying, _1_mappingFunc) => function (_2_input) {
        return function (_pat_let15_0) {
          return function (_3_valueOrError0) {
            return (((_3_valueOrError0).IsFailure()) ? ((_3_valueOrError0).PropagateFailure()) : (function (_pat_let16_0) {
              return function (_4_result) {
                return function (_5_remaining) {
                  return function (_pat_let17_0) {
                    return function (_6_u) {
                      return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(_6_u, _5_remaining);
                    }(_pat_let17_0);
                  }((_1_mappingFunc)(_4_result));
                }((_pat_let16_0)[1]);
              }((_pat_let16_0)[0]);
            }((_3_valueOrError0).Extract())));
          }(_pat_let15_0);
        }((_0_underlying)(_2_input));
      })(underlying, mappingFunc);
    };
    static Not(underlying) {
      return ((_0_underlying) => function (_1_input) {
        return function (_pat_let18_0) {
          return function (_2_l) {
            return (((_2_l).IsFailure()) ? ((((_2_l).IsFatal()) ? ((_2_l).PropagateFailure()) : (Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(_dafny.Tuple.of(), _1_input)))) : (Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Recoverable(), Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.UnicodeFromString("not failed"), _1_input, Std_Wrappers.Option.create_None()))));
          }(_pat_let18_0);
        }((_0_underlying)(_1_input));
      })(underlying);
    };
    static And(left, right) {
      return ((_0_left, _1_right) => function (_2_input) {
        return function (_pat_let19_0) {
          return function (_3_valueOrError0) {
            return (((_3_valueOrError0).IsFailure()) ? ((_3_valueOrError0).PropagateFailure()) : (function (_pat_let20_0) {
              return function (_4_l) {
                return function (_5_remainingLeft) {
                  return function (_pat_let21_0) {
                    return function (_6_valueOrError1) {
                      return (((_6_valueOrError1).IsFailure()) ? ((_6_valueOrError1).PropagateFailure()) : (function (_pat_let22_0) {
                        return function (_7_r) {
                          return function (_8_remainingRight) {
                            return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(_dafny.Tuple.of(_4_l, _7_r), _8_remainingRight);
                          }((_pat_let22_0)[1]);
                        }((_pat_let22_0)[0]);
                      }((_6_valueOrError1).Extract())));
                    }(_pat_let21_0);
                  }((_1_right)(_2_input));
                }((_pat_let20_0)[1]);
              }((_pat_let20_0)[0]);
            }((_3_valueOrError0).Extract())));
          }(_pat_let19_0);
        }((_0_left)(_2_input));
      })(left, right);
    };
    static Or(left, right) {
      return ((_0_left, _1_right) => function (_2_input) {
        return function (_pat_let23_0) {
          return function (_3_p) {
            return ((!((_3_p).NeedsAlternative(_2_input))) ? (_3_p) : (function (_pat_let24_0) {
              return function (_4_p2) {
                return ((!((_4_p2).NeedsAlternative(_2_input))) ? (_4_p2) : ((_4_p2).MapRecoverableError(((_5_p) => function (_6_dataRight) {
                  return ((_5_p).dtor_data).Concat(_6_dataRight);
                })(_3_p))));
              }(_pat_let24_0);
            }((_1_right)(_2_input))));
          }(_pat_let23_0);
        }((_0_left)(_2_input));
      })(left, right);
    };
    static OrSeq(alternatives) {
      if ((new BigNumber((alternatives).length)).isEqualTo(_dafny.ZERO)) {
        return Std_Parsers_StringParsers.__default.FailWith(_dafny.Seq.UnicodeFromString("no alternatives"), Std_Parsers_StringParsers.FailureLevel.create_Recoverable());
      } else if ((new BigNumber((alternatives).length)).isEqualTo(_dafny.ONE)) {
        return (alternatives)[_dafny.ZERO];
      } else {
        return Std_Parsers_StringParsers.__default.Or((alternatives)[_dafny.ZERO], Std_Parsers_StringParsers.__default.OrSeq((alternatives).slice(_dafny.ONE)));
      }
    };
    static Lookahead(underlying) {
      return ((_0_underlying) => function (_1_input) {
        return function (_pat_let25_0) {
          return function (_2_p) {
            return (((_2_p).IsFailure()) ? ((((_2_p).IsFatal()) ? (_2_p) : (function (_pat_let26_0) {
              return function (_3_dt__update__tmp_h0) {
                return function (_pat_let27_0) {
                  return function (_4_dt__update_hdata_h0) {
                    return Std_Parsers_StringParsers.ParseResult.create_ParseFailure((_3_dt__update__tmp_h0).dtor_level, _4_dt__update_hdata_h0);
                  }(_pat_let27_0);
                }(Std_Parsers_StringParsers.FailureData.create_FailureData(((_2_p).dtor_data).dtor_message, _1_input, Std_Wrappers.Option.create_None()));
              }(_pat_let26_0);
            }(_2_p)))) : (function (_pat_let28_0) {
              return function (_5_dt__update__tmp_h1) {
                return function (_pat_let29_0) {
                  return function (_6_dt__update_hremaining_h0) {
                    return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess((_5_dt__update__tmp_h1).dtor_result, _6_dt__update_hremaining_h0);
                  }(_pat_let29_0);
                }(_1_input);
              }(_pat_let28_0);
            }(_2_p)));
          }(_pat_let25_0);
        }((_0_underlying)(_1_input));
      })(underlying);
    };
    static _q(underlying) {
      return ((_0_underlying) => function (_1_input) {
        return function (_pat_let30_0) {
          return function (_2_p) {
            return (((_2_p).IsFailure()) ? ((((_2_p).IsFatal()) ? (_2_p) : (function (_pat_let31_0) {
              return function (_3_dt__update__tmp_h0) {
                return function (_pat_let32_0) {
                  return function (_4_dt__update_hdata_h0) {
                    return Std_Parsers_StringParsers.ParseResult.create_ParseFailure((_3_dt__update__tmp_h0).dtor_level, _4_dt__update_hdata_h0);
                  }(_pat_let32_0);
                }(Std_Parsers_StringParsers.FailureData.create_FailureData(((_2_p).dtor_data).dtor_message, _1_input, Std_Wrappers.Option.create_None()));
              }(_pat_let31_0);
            }(_2_p)))) : (_2_p));
          }(_pat_let30_0);
        }((_0_underlying)(_1_input));
      })(underlying);
    };
    static If(condition, succeed) {
      return Std_Parsers_StringParsers.__default.Bind(Std_Parsers_StringParsers.__default.Lookahead(condition), ((_0_succeed) => function (_1_l) {
        return _0_succeed;
      })(succeed));
    };
    static Maybe(underlying) {
      return ((_0_underlying) => function (_1_input) {
        return function (_pat_let33_0) {
          return function (_2_u) {
            return ((((_2_u).IsFatalFailure()) || (((_2_u).IsFailure()) && (!((_2_u).NeedsAlternative(_1_input))))) ? ((_2_u).PropagateFailure()) : ((((_2_u).is_ParseSuccess) ? ((_2_u).Map(function (_3_result) {
              return Std_Wrappers.Option.create_Some(_3_result);
            })) : (Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(Std_Wrappers.Option.create_None(), _1_input)))));
          }(_pat_let33_0);
        }((_0_underlying)(_1_input));
      })(underlying);
    };
    static ConcatMap(left, right, mapper) {
      return ((_0_left, _1_right, _2_mapper) => function (_3_input) {
        return function (_pat_let34_0) {
          return function (_4_valueOrError0) {
            return (((_4_valueOrError0).IsFailure()) ? ((_4_valueOrError0).PropagateFailure()) : (function (_pat_let35_0) {
              return function (_5_l) {
                return function (_6_remaining) {
                  return function (_pat_let36_0) {
                    return function (_7_valueOrError1) {
                      return (((_7_valueOrError1).IsFailure()) ? ((_7_valueOrError1).PropagateFailure()) : (function (_pat_let37_0) {
                        return function (_8_r) {
                          return function (_9_remaining2) {
                            return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess((_2_mapper)(_5_l, _8_r), _9_remaining2);
                          }((_pat_let37_0)[1]);
                        }((_pat_let37_0)[0]);
                      }((_7_valueOrError1).Extract())));
                    }(_pat_let36_0);
                  }((_1_right)(_6_remaining));
                }((_pat_let35_0)[1]);
              }((_pat_let35_0)[0]);
            }((_4_valueOrError0).Extract())));
          }(_pat_let34_0);
        }((_0_left)(_3_input));
      })(left, right, mapper);
    };
    static Concat(left, right) {
      return ((_0_left, _1_right) => function (_2_input) {
        return function (_pat_let38_0) {
          return function (_3_valueOrError0) {
            return (((_3_valueOrError0).IsFailure()) ? ((_3_valueOrError0).PropagateFailure()) : (function (_pat_let39_0) {
              return function (_4_l) {
                return function (_5_remaining) {
                  return function (_pat_let40_0) {
                    return function (_6_valueOrError1) {
                      return (((_6_valueOrError1).IsFailure()) ? ((_6_valueOrError1).PropagateFailure()) : (function (_pat_let41_0) {
                        return function (_7_r) {
                          return function (_8_remaining2) {
                            return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(_dafny.Tuple.of(_4_l, _7_r), _8_remaining2);
                          }((_pat_let41_0)[1]);
                        }((_pat_let41_0)[0]);
                      }((_6_valueOrError1).Extract())));
                    }(_pat_let40_0);
                  }((_1_right)(_5_remaining));
                }((_pat_let39_0)[1]);
              }((_pat_let39_0)[0]);
            }((_3_valueOrError0).Extract())));
          }(_pat_let38_0);
        }((_0_left)(_2_input));
      })(left, right);
    };
    static ConcatKeepRight(left, right) {
      return Std_Parsers_StringParsers.__default.ConcatMap(left, right, function (_0_l, _1_r) {
        return _1_r;
      });
    };
    static ConcatKeepLeft(left, right) {
      return Std_Parsers_StringParsers.__default.ConcatMap(left, right, function (_0_l, _1_r) {
        return _0_l;
      });
    };
    static Debug(underlying, name, onEnter, onExit) {
      return ((_0_onEnter, _1_name, _2_underlying, _3_onExit) => function (_4_input) {
        return function (_pat_let42_0) {
          return function (_5_debugData) {
            return function (_pat_let43_0) {
              return function (_6_output) {
                return function (_pat_let44_0) {
                  return function (_7___v16) {
                    return _6_output;
                  }(_pat_let44_0);
                }((_3_onExit)(_1_name, _5_debugData, _6_output));
              }(_pat_let43_0);
            }((_2_underlying)(_4_input));
          }(_pat_let42_0);
        }((_0_onEnter)(_1_name, _4_input));
      })(onEnter, name, underlying, onExit);
    };
    static ZeroOrMore(underlying) {
      return Std_Parsers_StringParsers.__default.Map(Std_Parsers_StringParsers.__default.Rep(underlying, function (_0_result, _1_r) {
        return (_0_result).Append(_1_r);
      }, Std_Parsers_StringParsers.SeqB.create_SeqBNil()), function (_2_result) {
        return (_2_result).ToSequence();
      });
    };
    static OneOrMore(underlying) {
      return Std_Parsers_StringParsers.__default.Bind(underlying, ((_0_underlying) => function (_1_r) {
        return Std_Parsers_StringParsers.__default.Map(Std_Parsers_StringParsers.__default.Rep(_0_underlying, function (_2_result, _3_r) {
          return (_2_result).Append(_3_r);
        }, Std_Parsers_StringParsers.SeqB.create_SeqBCons(_1_r, Std_Parsers_StringParsers.SeqB.create_SeqBNil())), function (_4_result) {
          return (_4_result).ToSequence();
        });
      })(underlying));
    };
    static Rep(underlying, combine, acc) {
      return ((_0_underlying, _1_combine, _2_acc) => function (_3_input) {
        return Std_Parsers_StringParsers.__default.Rep__(_0_underlying, _1_combine, _2_acc, _3_input);
      })(underlying, combine, acc);
    };
    static RepSep(underlying, separator) {
      return Std_Parsers_StringParsers.__default.Bind(Std_Parsers_StringParsers.__default.Maybe(underlying), ((_0_separator, _1_underlying) => function (_2_result) {
        return (((_2_result).is_None) ? (Std_Parsers_StringParsers.__default.SucceedWith(_dafny.Seq.of())) : (Std_Parsers_StringParsers.__default.Map(Std_Parsers_StringParsers.__default.Rep(Std_Parsers_StringParsers.__default.ConcatKeepRight(_0_separator, _1_underlying), function (_3_acc, _4_a) {
          return (_3_acc).Append(_4_a);
        }, Std_Parsers_StringParsers.SeqB.create_SeqBCons((_2_result).dtor_value, Std_Parsers_StringParsers.SeqB.create_SeqBNil())), function (_5_result) {
          return (_5_result).ToSequence();
        })));
      })(separator, underlying));
    };
    static RepMerge(underlying, merger) {
      return Std_Parsers_StringParsers.__default.Bind(Std_Parsers_StringParsers.__default.Maybe(underlying), ((_0_underlying, _1_merger) => function (_2_result) {
        return (((_2_result).is_None) ? (Std_Parsers_StringParsers.__default.FailWith(_dafny.Seq.UnicodeFromString("No first element in RepMerge"), Std_Parsers_StringParsers.FailureLevel.create_Recoverable())) : (Std_Parsers_StringParsers.__default.Rep(_0_underlying, ((_3_merger) => function (_4_acc, _5_a) {
          return (_3_merger)(_4_acc, _5_a);
        })(_1_merger), (_2_result).dtor_value)));
      })(underlying, merger));
    };
    static RepSepMerge(underlying, separator, merger) {
      return Std_Parsers_StringParsers.__default.Bind(Std_Parsers_StringParsers.__default.Maybe(underlying), ((_0_separator, _1_underlying, _2_merger) => function (_3_result) {
        return (((_3_result).is_None) ? (Std_Parsers_StringParsers.__default.FailWith(_dafny.Seq.UnicodeFromString("No first element in RepSepMerge"), Std_Parsers_StringParsers.FailureLevel.create_Recoverable())) : (Std_Parsers_StringParsers.__default.Rep(Std_Parsers_StringParsers.__default.ConcatKeepRight(_0_separator, _1_underlying), ((_4_merger) => function (_5_acc, _6_a) {
          return (_4_merger)(_5_acc, _6_a);
        })(_2_merger), (_3_result).dtor_value)));
      })(separator, underlying, merger));
    };
    static Rep__(underlying, combine, acc, input) {
      TAIL_CALL_START: while (true) {
        let _source0 = (underlying)(input);
        {
          if (_source0.is_ParseSuccess) {
            let _0_result = (_source0).result;
            let _1_remaining = (_source0).remaining;
            if ((Std_Parsers_InputString.__default.Length(input)).isLessThanOrEqualTo(Std_Parsers_InputString.__default.Length(_1_remaining))) {
              return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(acc, input);
            } else {
              let _in0 = underlying;
              let _in1 = combine;
              let _in2 = (combine)(acc, _0_result);
              let _in3 = _1_remaining;
              underlying = _in0;
              combine = _in1;
              acc = _in2;
              input = _in3;
              continue TAIL_CALL_START;
            }
          }
        }
        {
          let _2_failure = _source0;
          if ((_2_failure).NeedsAlternative(input)) {
            return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(acc, input);
          } else {
            return (_2_failure).PropagateFailure();
          }
        }
      }
    };
    static Recursive(underlying) {
      return ((_0_underlying) => function (_1_input) {
        return Std_Parsers_StringParsers.__default.Recursive__(_0_underlying, _1_input);
      })(underlying);
    };
    static RecursiveProgressError(name, input, remaining) {
      if ((Std_Parsers_InputString.__default.Length(remaining)).isEqualTo(Std_Parsers_InputString.__default.Length(input))) {
        return Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Recoverable(), Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.Concat(name, _dafny.Seq.UnicodeFromString(" no progress in recursive parser")), remaining, Std_Wrappers.Option.create_None()));
      } else {
        return Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Fatal(), Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.Concat(name, _dafny.Seq.UnicodeFromString("fixpoint called with an increasing remaining sequence")), remaining, Std_Wrappers.Option.create_None()));
      }
    };
    static Recursive__(underlying, input) {
      let _0_callback = ((_1_input, _2_underlying) => function (_3_remaining) {
        return (((Std_Parsers_InputString.__default.Length(_3_remaining)).isLessThan(Std_Parsers_InputString.__default.Length(_1_input))) ? (Std_Parsers_StringParsers.__default.Recursive__(_2_underlying, _3_remaining)) : (Std_Parsers_StringParsers.__default.RecursiveProgressError(_dafny.Seq.UnicodeFromString("Parsers.Recursive"), _1_input, _3_remaining)));
      })(input, underlying);
      return ((underlying)(_0_callback))(input);
    };
    static RecursiveNoStack(underlying) {
      return ((_0_underlying) => function (_1_input) {
        return Std_Parsers_StringParsers.__default.RecursiveNoStack__(_0_underlying, _0_underlying, _1_input, _dafny.Seq.of());
      })(underlying);
    };
    static RecursiveNoStack__(continuation, underlying, input, callbacks) {
      TAIL_CALL_START: while (true) {
        let _0_valueOrError0 = (continuation)(input);
        if ((_0_valueOrError0).IsFailure()) {
          return (_0_valueOrError0).PropagateFailure();
        } else {
          let _let_tmp_rhs0 = (_0_valueOrError0).Extract();
          let _1_recursor = (_let_tmp_rhs0)[0];
          let _2_remaining = (_let_tmp_rhs0)[1];
          let _source0 = _1_recursor;
          {
            if (_source0.is_RecursiveReturn) {
              let _3_result = (_source0)._a0;
              if ((new BigNumber((callbacks).length)).isEqualTo(_dafny.ZERO)) {
                return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(_3_result, _2_remaining);
              } else {
                let _4_toCompute = ((callbacks)[_dafny.ZERO])(Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(_3_result, _2_remaining));
                if ((Std_Parsers_InputString.__default.Length(input)).isLessThan(Std_Parsers_InputString.__default.Length(_2_remaining))) {
                  return Std_Parsers_StringParsers.__default.RecursiveProgressError(_dafny.Seq.UnicodeFromString("Parsers.RecursiveNoStack[internal]"), input, _2_remaining);
                } else {
                  let _in0 = _4_toCompute;
                  let _in1 = underlying;
                  let _in2 = _2_remaining;
                  let _in3 = (callbacks).slice(_dafny.ONE);
                  continuation = _in0;
                  underlying = _in1;
                  input = _in2;
                  callbacks = _in3;
                  continue TAIL_CALL_START;
                }
              }
            }
          }
          {
            let _5_rToNewParserOfRecursiveNoStackResultOfR = (_source0)._a0;
            if ((Std_Parsers_InputString.__default.Length(input)).isLessThanOrEqualTo(Std_Parsers_InputString.__default.Length(_2_remaining))) {
              return Std_Parsers_StringParsers.__default.RecursiveProgressError(_dafny.Seq.UnicodeFromString("Parsers.RecursiveNoStack"), input, _2_remaining);
            } else {
              let _in4 = underlying;
              let _in5 = underlying;
              let _in6 = _2_remaining;
              let _in7 = _dafny.Seq.Concat(_dafny.Seq.of(((_6_rToNewParserOfRecursiveNoStackResultOfR) => function (_7_p) {
                return (((_7_p).IsFailure()) ? (Std_Parsers_StringParsers.__default.ResultWith((_7_p).PropagateFailure())) : (function (_pat_let45_0) {
                  return function (_8_r) {
                    return function (_9_remaining2) {
                      return (_6_rToNewParserOfRecursiveNoStackResultOfR)(_8_r);
                    }((_pat_let45_0)[1]);
                  }((_pat_let45_0)[0]);
                }((_7_p).Extract())));
              })(_5_rToNewParserOfRecursiveNoStackResultOfR)), callbacks);
              continuation = _in4;
              underlying = _in5;
              input = _in6;
              callbacks = _in7;
              continue TAIL_CALL_START;
            }
          }
        }
      }
    };
    static RecursiveMap(underlying, fun) {
      return ((_0_underlying, _1_fun) => function (_2_input) {
        return Std_Parsers_StringParsers.__default.RecursiveMap__(_0_underlying, _1_fun, _2_input);
      })(underlying, fun);
    };
    static RecursiveMap__(underlying, fun, input) {
      if (!(underlying).contains(fun)) {
        return Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Fatal(), Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("parser '"), fun), _dafny.Seq.UnicodeFromString("' not found")), input, Std_Wrappers.Option.create_None()));
      } else {
        let _let_tmp_rhs0 = (underlying).get(fun);
        let _0_orderFun = (_let_tmp_rhs0).order;
        let _1_definitionFun = (_let_tmp_rhs0).definition;
        let _2_callback = ((_3_underlying, _4_input, _5_orderFun, _6_fun) => function (_7_fun_k) {
          return function (_pat_let46_0) {
            return function (_17_p) {
              return _17_p;
            }(_pat_let46_0);
          }(((!((_3_underlying).Keys).contains(_7_fun_k)) ? (Std_Parsers_StringParsers.__default.FailWith(_dafny.Seq.Concat(_7_fun_k, _dafny.Seq.UnicodeFromString(" not defined")), Std_Parsers_StringParsers.FailureLevel.create_Fatal())) : (function (_pat_let47_0) {
            return function (_8_orderFun_k) {
              return function (_9_definitionFun_k) {
                return ((_10_input, _11_orderFun_k, _12_orderFun, _13_underlying, _14_fun_k, _15_fun) => function (_16_remaining) {
                  return ((((Std_Parsers_InputString.__default.Length(_16_remaining)).isLessThan(Std_Parsers_InputString.__default.Length(_10_input))) || (((Std_Parsers_InputString.__default.Length(_16_remaining)).isEqualTo(Std_Parsers_InputString.__default.Length(_10_input))) && ((_11_orderFun_k).isLessThan(_12_orderFun)))) ? (Std_Parsers_StringParsers.__default.RecursiveMap__(_13_underlying, _14_fun_k, _16_remaining)) : ((((Std_Parsers_InputString.__default.Length(_16_remaining)).isEqualTo(Std_Parsers_InputString.__default.Length(_10_input))) ? (Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Recoverable(), Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("non-progressing recursive call requires that order of '"), _14_fun_k), _dafny.Seq.UnicodeFromString("' (")), Std_Strings.__default.OfInt(_11_orderFun_k)), _dafny.Seq.UnicodeFromString(") is lower than the order of '")), _15_fun), _dafny.Seq.UnicodeFromString("' (")), Std_Strings.__default.OfInt(_12_orderFun)), _dafny.Seq.UnicodeFromString(")")), _16_remaining, Std_Wrappers.Option.create_None()))) : (Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Fatal(), Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.UnicodeFromString("parser did not return a suffix of the input"), _16_remaining, Std_Wrappers.Option.create_None()))))));
                })(_4_input, _8_orderFun_k, _5_orderFun, _3_underlying, _7_fun_k, _6_fun);
              }((_pat_let47_0).definition);
            }((_pat_let47_0).order);
          }((_3_underlying).get(_7_fun_k)))));
        })(underlying, input, _0_orderFun, fun);
        return ((_1_definitionFun)(_2_callback))(input);
      }
    };
    static CharTest(test, name) {
      return ((_0_test, _1_name) => function (_2_input) {
        return ((((_dafny.ZERO).isLessThan(Std_Parsers_InputString.__default.Length(_2_input))) && ((_0_test)(Std_Parsers_InputString.__default.CharAt(_2_input, _dafny.ZERO)))) ? (Std_Parsers_StringParsers.ParseResult.create_ParseSuccess(Std_Parsers_InputString.__default.CharAt(_2_input, _dafny.ZERO), Std_Parsers_InputString.__default.Drop(_2_input, _dafny.ONE))) : (Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Recoverable(), Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("expected a "), _1_name), _2_input, Std_Wrappers.Option.create_None()))));
      })(test, name);
    };
    static DigitToInt(c) {
      let _source0 = c;
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('0'.codePointAt(0)))) {
          return _dafny.ZERO;
        }
      }
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('1'.codePointAt(0)))) {
          return _dafny.ONE;
        }
      }
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('2'.codePointAt(0)))) {
          return new BigNumber(2);
        }
      }
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('3'.codePointAt(0)))) {
          return new BigNumber(3);
        }
      }
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('4'.codePointAt(0)))) {
          return new BigNumber(4);
        }
      }
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('5'.codePointAt(0)))) {
          return new BigNumber(5);
        }
      }
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('6'.codePointAt(0)))) {
          return new BigNumber(6);
        }
      }
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('7'.codePointAt(0)))) {
          return new BigNumber(7);
        }
      }
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('8'.codePointAt(0)))) {
          return new BigNumber(8);
        }
      }
      {
        if (_dafny.areEqual(_source0, new _dafny.CodePoint('9'.codePointAt(0)))) {
          return new BigNumber(9);
        }
      }
      {
        return new BigNumber(-1);
      }
    };
    static StringToInt(s) {
      if ((new BigNumber((s).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.ZERO;
      } else if ((new BigNumber((s).length)).isEqualTo(_dafny.ONE)) {
        return Std_Parsers_StringParsers.__default.DigitToInt((s)[_dafny.ZERO]);
      } else if (_dafny.areEqual((s)[_dafny.ZERO], new _dafny.CodePoint('-'.codePointAt(0)))) {
        return (_dafny.ZERO).minus(Std_Parsers_StringParsers.__default.StringToInt((s).slice(_dafny.ONE)));
      } else {
        return ((Std_Parsers_StringParsers.__default.StringToInt((s).slice(_dafny.ZERO, (new BigNumber((s).length)).minus(_dafny.ONE)))).multipliedBy(new BigNumber(10))).plus(Std_Parsers_StringParsers.__default.StringToInt((s).slice((new BigNumber((s).length)).minus(_dafny.ONE), new BigNumber((s).length))));
      }
    };
  };

  $module.CodeLocation = class CodeLocation {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_CodeLocation(lineNumber, colNumber, lineStr) {
      let $dt = new CodeLocation(0);
      $dt.lineNumber = lineNumber;
      $dt.colNumber = colNumber;
      $dt.lineStr = lineStr;
      return $dt;
    }
    get is_CodeLocation() { return this.$tag === 0; }
    get dtor_lineNumber() { return this.lineNumber; }
    get dtor_colNumber() { return this.colNumber; }
    get dtor_lineStr() { return this.lineStr; }
    toString() {
      if (this.$tag === 0) {
        return "StringParsers.CodeLocation.CodeLocation" + "(" + _dafny.toString(this.lineNumber) + ", " + _dafny.toString(this.colNumber) + ", " + this.lineStr.toVerbatimString(true) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.lineNumber, other.lineNumber) && _dafny.areEqual(this.colNumber, other.colNumber) && _dafny.areEqual(this.lineStr, other.lineStr);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringParsers.CodeLocation.create_CodeLocation(_dafny.ZERO, _dafny.ZERO, _dafny.Seq.UnicodeFromString(""));
    }
    static Rtd() {
      return class {
        static get Default() {
          return CodeLocation.Default();
        }
      };
    }
  }

  $module.ExtractLineMutableState = class ExtractLineMutableState {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_ExtractLineMutableState(input, pos, startLinePos, i, lineNumber, colNumber) {
      let $dt = new ExtractLineMutableState(0);
      $dt.input = input;
      $dt.pos = pos;
      $dt.startLinePos = startLinePos;
      $dt.i = i;
      $dt.lineNumber = lineNumber;
      $dt.colNumber = colNumber;
      return $dt;
    }
    get is_ExtractLineMutableState() { return this.$tag === 0; }
    get dtor_input() { return this.input; }
    get dtor_pos() { return this.pos; }
    get dtor_startLinePos() { return this.startLinePos; }
    get dtor_i() { return this.i; }
    get dtor_lineNumber() { return this.lineNumber; }
    get dtor_colNumber() { return this.colNumber; }
    toString() {
      if (this.$tag === 0) {
        return "StringParsers.ExtractLineMutableState.ExtractLineMutableState" + "(" + this.input.toVerbatimString(true) + ", " + _dafny.toString(this.pos) + ", " + _dafny.toString(this.startLinePos) + ", " + _dafny.toString(this.i) + ", " + _dafny.toString(this.lineNumber) + ", " + _dafny.toString(this.colNumber) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.input, other.input) && _dafny.areEqual(this.pos, other.pos) && _dafny.areEqual(this.startLinePos, other.startLinePos) && _dafny.areEqual(this.i, other.i) && _dafny.areEqual(this.lineNumber, other.lineNumber) && _dafny.areEqual(this.colNumber, other.colNumber);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringParsers.ExtractLineMutableState.create_ExtractLineMutableState(_dafny.Seq.UnicodeFromString(""), _dafny.ZERO, _dafny.ZERO, _dafny.ZERO, _dafny.ZERO, _dafny.ZERO);
    }
    static Rtd() {
      return class {
        static get Default() {
          return ExtractLineMutableState.Default();
        }
      };
    }
  }

  $module.FailureData = class FailureData {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_FailureData(message, remaining, next) {
      let $dt = new FailureData(0);
      $dt.message = message;
      $dt.remaining = remaining;
      $dt.next = next;
      return $dt;
    }
    get is_FailureData() { return this.$tag === 0; }
    get dtor_message() { return this.message; }
    get dtor_remaining() { return this.remaining; }
    get dtor_next() { return this.next; }
    toString() {
      if (this.$tag === 0) {
        return "StringParsers.FailureData.FailureData" + "(" + this.message.toVerbatimString(true) + ", " + _dafny.toString(this.remaining) + ", " + _dafny.toString(this.next) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.message, other.message) && _dafny.areEqual(this.remaining, other.remaining) && _dafny.areEqual(this.next, other.next);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringParsers.FailureData.create_FailureData(_dafny.Seq.UnicodeFromString(""), Std_Collections_Seq.Slice.Default(), Std_Wrappers.Option.Default());
    }
    static Rtd() {
      return class {
        static get Default() {
          return FailureData.Default();
        }
      };
    }
    Concat(other) {
      let _this = this;
      if (_dafny.areEqual((_this).dtor_next, Std_Wrappers.Option.create_None())) {
        let _0_dt__update__tmp_h0 = _this;
        let _1_dt__update_hnext_h0 = Std_Wrappers.Option.create_Some(other);
        return Std_Parsers_StringParsers.FailureData.create_FailureData((_0_dt__update__tmp_h0).dtor_message, (_0_dt__update__tmp_h0).dtor_remaining, _1_dt__update_hnext_h0);
      } else {
        return Std_Parsers_StringParsers.FailureData.create_FailureData((_this).dtor_message, (_this).dtor_remaining, Std_Wrappers.Option.create_Some((((_this).dtor_next).dtor_value).Concat(other)));
      }
    };
  }

  $module.FailureLevel = class FailureLevel {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Fatal() {
      let $dt = new FailureLevel(0);
      return $dt;
    }
    static create_Recoverable() {
      let $dt = new FailureLevel(1);
      return $dt;
    }
    get is_Fatal() { return this.$tag === 0; }
    get is_Recoverable() { return this.$tag === 1; }
    static get AllSingletonConstructors() {
      return this.AllSingletonConstructors_();
    }
    static *AllSingletonConstructors_() {
      yield FailureLevel.create_Fatal();
      yield FailureLevel.create_Recoverable();
    }
    toString() {
      if (this.$tag === 0) {
        return "StringParsers.FailureLevel.Fatal";
      } else if (this.$tag === 1) {
        return "StringParsers.FailureLevel.Recoverable";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0;
      } else if (this.$tag === 1) {
        return other.$tag === 1;
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringParsers.FailureLevel.create_Fatal();
    }
    static Rtd() {
      return class {
        static get Default() {
          return FailureLevel.Default();
        }
      };
    }
  }

  $module.ParseResult = class ParseResult {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_ParseFailure(level, data) {
      let $dt = new ParseResult(0);
      $dt.level = level;
      $dt.data = data;
      return $dt;
    }
    static create_ParseSuccess(result, remaining) {
      let $dt = new ParseResult(1);
      $dt.result = result;
      $dt.remaining = remaining;
      return $dt;
    }
    get is_ParseFailure() { return this.$tag === 0; }
    get is_ParseSuccess() { return this.$tag === 1; }
    get dtor_level() { return this.level; }
    get dtor_data() { return this.data; }
    get dtor_result() { return this.result; }
    get dtor_remaining() { return this.remaining; }
    toString() {
      if (this.$tag === 0) {
        return "StringParsers.ParseResult.ParseFailure" + "(" + _dafny.toString(this.level) + ", " + _dafny.toString(this.data) + ")";
      } else if (this.$tag === 1) {
        return "StringParsers.ParseResult.ParseSuccess" + "(" + _dafny.toString(this.result) + ", " + _dafny.toString(this.remaining) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.level, other.level) && _dafny.areEqual(this.data, other.data);
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.result, other.result) && _dafny.areEqual(this.remaining, other.remaining);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.Default(), Std_Parsers_StringParsers.FailureData.Default());
    }
    static Rtd() {
      return class {
        static get Default() {
          return ParseResult.Default();
        }
      };
    }
    Remaining() {
      let _this = this;
      if ((_this).is_ParseSuccess) {
        return (_this).dtor_remaining;
      } else {
        return ((_this).dtor_data).dtor_remaining;
      }
    };
    IsFailure() {
      let _this = this;
      return (_this).is_ParseFailure;
    };
    IsFatalFailure() {
      let _this = this;
      return ((_this).is_ParseFailure) && (_dafny.areEqual((_this).dtor_level, Std_Parsers_StringParsers.FailureLevel.create_Fatal()));
    };
    IsFatal() {
      let _this = this;
      return _dafny.areEqual((_this).dtor_level, Std_Parsers_StringParsers.FailureLevel.create_Fatal());
    };
    PropagateFailure() {
      let _this = this;
      return Std_Parsers_StringParsers.ParseResult.create_ParseFailure((_this).dtor_level, (_this).dtor_data);
    };
    Extract() {
      let _this = this;
      return _dafny.Tuple.of((_this).dtor_result, (_this).dtor_remaining);
    };
    Map(f) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_ParseSuccess) {
          let _0_result = (_source0).result;
          let _1_remaining = (_source0).remaining;
          return Std_Parsers_StringParsers.ParseResult.create_ParseSuccess((f)(_0_result), _1_remaining);
        }
      }
      {
        let _2_level = (_source0).level;
        let _3_data = (_source0).data;
        return Std_Parsers_StringParsers.ParseResult.create_ParseFailure(_2_level, _3_data);
      }
    };
    MapRecoverableError(f) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_ParseFailure) {
          let level0 = (_source0).level;
          if (level0.is_Recoverable) {
            let _0_data = (_source0).data;
            return Std_Parsers_StringParsers.ParseResult.create_ParseFailure(Std_Parsers_StringParsers.FailureLevel.create_Recoverable(), (f)(_0_data));
          }
        }
      }
      {
        return _this;
      }
    };
    NeedsAlternative(input) {
      let _this = this;
      return (((_this).is_ParseFailure) && (_dafny.areEqual((_this).dtor_level, Std_Parsers_StringParsers.FailureLevel.create_Recoverable()))) && (_dafny.areEqual(input, (_this).Remaining()));
    };
  }

  $module.SeqB = class SeqB {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_SeqBCons(last, init) {
      let $dt = new SeqB(0);
      $dt.last = last;
      $dt.init = init;
      return $dt;
    }
    static create_SeqBNil() {
      let $dt = new SeqB(1);
      return $dt;
    }
    get is_SeqBCons() { return this.$tag === 0; }
    get is_SeqBNil() { return this.$tag === 1; }
    get dtor_last() { return this.last; }
    get dtor_init() { return this.init; }
    toString() {
      if (this.$tag === 0) {
        return "StringParsers.SeqB.SeqBCons" + "(" + _dafny.toString(this.last) + ", " + _dafny.toString(this.init) + ")";
      } else if (this.$tag === 1) {
        return "StringParsers.SeqB.SeqBNil";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.last, other.last) && _dafny.areEqual(this.init, other.init);
      } else if (this.$tag === 1) {
        return other.$tag === 1;
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringParsers.SeqB.create_SeqBNil();
    }
    static Rtd() {
      return class {
        static get Default() {
          return SeqB.Default();
        }
      };
    }
    Append(elem) {
      let _this = this;
      return Std_Parsers_StringParsers.SeqB.create_SeqBCons(elem, _this);
    };
    Length() {
      let _this = this;
      let _0___accumulator = _dafny.ZERO;
      TAIL_CALL_START: while (true) {
        if ((_this).is_SeqBNil) {
          return (_dafny.ZERO).plus(_0___accumulator);
        } else {
          _0___accumulator = (_0___accumulator).plus(_dafny.ONE);
          let _in0 = (_this).dtor_init;
          _this = _in0;
          ;
          continue TAIL_CALL_START;
        }
      }
    };
    ToSequence() {
      let _this = this;
      let _hresult = _dafny.Seq.of();
      if ((_this).is_SeqBNil) {
        _hresult = _dafny.Seq.of();
        return _hresult;
      }
      let _0_defaultElem;
      _0_defaultElem = (_this).dtor_last;
      let _1_l;
      _1_l = (_this).Length();
      let _2_elements;
      let _init0 = ((_3_defaultElem) => function (_4_i) {
        return _3_defaultElem;
      })(_0_defaultElem);
      let _nw0 = Array((_1_l).toNumber());
      for (let _i0_0 = 0; _i0_0 < new BigNumber(_nw0.length); _i0_0++) {
        _nw0[_i0_0] = _init0(new BigNumber(_i0_0));
      }
      _2_elements = _nw0;
      let _5_t;
      _5_t = _this;
      let _6_i;
      _6_i = _1_l;
      while (!((_5_t).is_SeqBNil)) {
        _6_i = (_6_i).minus(_dafny.ONE);
        (_2_elements)[(_6_i)] = (_5_t).dtor_last;
        _5_t = (_5_t).dtor_init;
      }
      _hresult = _dafny.Seq.of(...(_2_elements).slice());
      return _hresult;
      return _hresult;
    }
  }

  $module.RecursiveNoStackResult = class RecursiveNoStackResult {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_RecursiveReturn(_a0) {
      let $dt = new RecursiveNoStackResult(0);
      $dt._a0 = _a0;
      return $dt;
    }
    static create_RecursiveContinue(_a0) {
      let $dt = new RecursiveNoStackResult(1);
      $dt._a0 = _a0;
      return $dt;
    }
    get is_RecursiveReturn() { return this.$tag === 0; }
    get is_RecursiveContinue() { return this.$tag === 1; }
    toString() {
      if (this.$tag === 0) {
        return "StringParsers.RecursiveNoStackResult.RecursiveReturn" + "(" + _dafny.toString(this._a0) + ")";
      } else if (this.$tag === 1) {
        return "StringParsers.RecursiveNoStackResult.RecursiveContinue" + "(" + _dafny.toString(this._a0) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this._a0, other._a0);
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this._a0, other._a0);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringParsers.RecursiveNoStackResult.create_RecursiveContinue(function () { return function () { return Std_Parsers_StringParsers.ParseResult.Default(); }; });
    }
    static Rtd() {
      return class {
        static get Default() {
          return RecursiveNoStackResult.Default();
        }
      };
    }
  }

  $module.RecursiveDef = class RecursiveDef {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_RecursiveDef(order, definition) {
      let $dt = new RecursiveDef(0);
      $dt.order = order;
      $dt.definition = definition;
      return $dt;
    }
    get is_RecursiveDef() { return this.$tag === 0; }
    get dtor_order() { return this.order; }
    get dtor_definition() { return this.definition; }
    toString() {
      if (this.$tag === 0) {
        return "StringParsers.RecursiveDef.RecursiveDef" + "(" + _dafny.toString(this.order) + ", " + _dafny.toString(this.definition) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.order, other.order) && _dafny.areEqual(this.definition, other.definition);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringParsers.RecursiveDef.create_RecursiveDef(_dafny.ZERO, function () { return function () { return Std_Parsers_StringParsers.ParseResult.Default(); }; });
    }
    static Rtd() {
      return class {
        static get Default() {
          return RecursiveDef.Default();
        }
      };
    }
  }
  return $module;
})(); // end of module Std_Parsers_StringParsers
let Std_Parsers_StringBuilders = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "Std.Parsers.StringBuilders._default";
    }
    _parentTraits() {
      return [];
    }
    static ToInput(other) {
      return Std_Collections_Seq.Slice.create_Slice(other, _dafny.ZERO, new BigNumber((other).length));
    };
    static ToInputEnd(other, fromEnd) {
      return Std_Collections_Seq.Slice.create_Slice(other, (new BigNumber((other).length)).minus(fromEnd), new BigNumber((other).length));
    };
    static S(s) {
      return Std_Parsers_StringParsers.__default.String(s);
    };
    static String(s) {
      return Std_Parsers_StringBuilders.__default.S(s);
    };
    static Except(s) {
      return Std_Parsers_StringBuilders.B.Rep(Std_Parsers_StringBuilders.__default.CharTest(((_0_s) => function (_1_c) {
        return !_dafny.Seq.contains(_0_s, _1_c);
      })(s), _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("Not '"), s), _dafny.Seq.UnicodeFromString("'"))));
    };
    static DebugSummaryInput(name, input) {
      return Std_Parsers_StringParsers.__default.DebugSummaryInput(name, input);
    };
    static PrintDebugSummaryOutput(name, input, result) {
      Std_Parsers_StringParsers.__default.PrintDebugSummaryOutput(name, input, result);
      return;
    }
    static FailureToString(input, result) {
      return Std_Parsers_StringParsers.__default.FailureToString(input, result, new BigNumber(-1));
    };
    static Apply(parser, input) {
      return Std_Parsers_StringParsers.__default.Apply((parser), input);
    };
    static InputToString(input) {
      return Std_Parsers_InputString.__default.View(input);
    };
    static SucceedWith(t) {
      return Std_Parsers_StringParsers.__default.SucceedWith(t);
    };
    static FailWith(message, level) {
      return Std_Parsers_StringParsers.__default.FailWith(message, level);
    };
    static ResultWith(result) {
      return Std_Parsers_StringParsers.__default.ResultWith(result);
    };
    static MId(r) {
      return r;
    };
    static MapIdentity(r) {
      return r;
    };
    static O(alternatives) {
      if ((new BigNumber((alternatives).length)).isEqualTo(_dafny.ZERO)) {
        return Std_Parsers_StringBuilders.__default.FailWith(_dafny.Seq.UnicodeFromString("no alternative"), Std_Parsers_StringParsers.FailureLevel.create_Recoverable());
      } else if ((new BigNumber((alternatives).length)).isEqualTo(_dafny.ONE)) {
        return (alternatives)[_dafny.ZERO];
      } else {
        return Std_Parsers_StringParsers.__default.Or(((alternatives)[_dafny.ZERO]), (Std_Parsers_StringBuilders.__default.O((alternatives).slice(_dafny.ONE))));
      }
    };
    static Or(alternatives) {
      return Std_Parsers_StringBuilders.__default.O(alternatives);
    };
    static CharTest(test, name) {
      return Std_Parsers_StringParsers.__default.CharTest(test, name);
    };
    static Rec(underlying) {
      return Std_Parsers_StringParsers.__default.Recursive(((_0_underlying) => function (_1_p) {
        return ((_0_underlying)(_1_p));
      })(underlying));
    };
    static Recursive(underlying) {
      return Std_Parsers_StringBuilders.__default.Rec(underlying);
    };
    static InputLength(input) {
      return Std_Parsers_InputString.__default.Length(input);
    };
    static NonProgressing(input1, input2) {
      return (Std_Parsers_StringBuilders.__default.InputLength(input1)).isLessThanOrEqualTo(Std_Parsers_StringBuilders.__default.InputLength(input2));
    };
    static RecursiveProgressError(name, input1, input2) {
      return Std_Parsers_StringParsers.__default.RecursiveProgressError(name, input1, input2);
    };
    static RecNoStack(underlying) {
      return ((_0_underlying) => function (_1_input) {
        return Std_Parsers_StringBuilders.__default.RecNoStack__(_0_underlying, _0_underlying, _1_input, _1_input, _dafny.Seq.of());
      })(underlying);
    };
    static RecursiveNoStack(underlying) {
      return Std_Parsers_StringBuilders.__default.RecNoStack(underlying);
    };
    static RecNoStack__(continuation, underlying, input, previousInput, callbacks) {
      TAIL_CALL_START: while (true) {
        let _0_continuationResult = ((continuation))(input);
        let _1_remaining = (_0_continuationResult).Remaining();
        if (((_0_continuationResult).IsFailure()) || ((((_0_continuationResult).Extract())[0]).is_RecReturn)) {
          let _2_parseResult = (((_0_continuationResult).IsFailure()) ? ((_0_continuationResult).PropagateFailure()) : (Std_Parsers_StringParsers.ParseResult.create_ParseSuccess((((_0_continuationResult).Extract())[0]).dtor_toReturn, _1_remaining)));
          if ((new BigNumber((callbacks).length)).isEqualTo(_dafny.ZERO)) {
            return _2_parseResult;
          } else {
            let _3_toCompute = ((callbacks)[_dafny.ZERO])(_2_parseResult);
            if ((Std_Parsers_InputString.__default.Length(input)).isLessThan(Std_Parsers_InputString.__default.Length(_1_remaining))) {
              return Std_Parsers_StringBuilders.__default.RecursiveProgressError(_dafny.Seq.UnicodeFromString("Parsers.RecNoStack[internal]"), input, _1_remaining);
            } else if ((Std_Parsers_InputString.__default.Length(previousInput)).isLessThan(Std_Parsers_InputString.__default.Length(input))) {
              return Std_Parsers_StringBuilders.__default.RecursiveProgressError(_dafny.Seq.UnicodeFromString("Parsers.RecNoStack[internal]"), previousInput, input);
            } else {
              let _in0 = _3_toCompute;
              let _in1 = underlying;
              let _in2 = _1_remaining;
              let _in3 = input;
              let _in4 = (callbacks).slice(_dafny.ONE);
              continuation = _in0;
              underlying = _in1;
              input = _in2;
              previousInput = _in3;
              callbacks = _in4;
              continue TAIL_CALL_START;
            }
          }
        } else {
          let _4_recursor = ((_0_continuationResult).Extract())[0];
          let _5_rToNewParserOfRecursiveNoStackResultOfR = (_4_recursor).dtor_toContinue;
          if ((Std_Parsers_InputString.__default.Length(_1_remaining)).isLessThan(Std_Parsers_InputString.__default.Length(input))) {
            let _in5 = underlying;
            let _in6 = underlying;
            let _in7 = _1_remaining;
            let _in8 = _1_remaining;
            let _in9 = _dafny.Seq.Concat(_dafny.Seq.of(((_6_rToNewParserOfRecursiveNoStackResultOfR) => function (_7_p) {
              return (((_7_p).IsFailure()) ? (Std_Parsers_StringParsers.__default.ResultWith((_7_p).PropagateFailure())) : (function (_pat_let48_0) {
                return function (_8_r) {
                  return function (_9_remaining2) {
                    return (_6_rToNewParserOfRecursiveNoStackResultOfR)(_8_r, _9_remaining2);
                  }((_pat_let48_0)[1]);
                }((_pat_let48_0)[0]);
              }((_7_p).Extract())));
            })(_5_rToNewParserOfRecursiveNoStackResultOfR)), callbacks);
            continuation = _in5;
            underlying = _in6;
            input = _in7;
            previousInput = _in8;
            callbacks = _in9;
            continue TAIL_CALL_START;
          } else if (((Std_Parsers_InputString.__default.Length(_1_remaining)).isEqualTo(Std_Parsers_InputString.__default.Length(input))) && ((Std_Parsers_InputString.__default.Length(_1_remaining)).isLessThan(Std_Parsers_InputString.__default.Length(previousInput)))) {
            let _in10 = underlying;
            let _in11 = underlying;
            let _in12 = _1_remaining;
            let _in13 = _1_remaining;
            let _in14 = _dafny.Seq.Concat(_dafny.Seq.of(((_10_rToNewParserOfRecursiveNoStackResultOfR) => function (_11_p) {
              return (((_11_p).IsFailure()) ? (Std_Parsers_StringParsers.__default.ResultWith((_11_p).PropagateFailure())) : (function (_pat_let49_0) {
                return function (_12_r) {
                  return function (_13_remaining2) {
                    return (_10_rToNewParserOfRecursiveNoStackResultOfR)(_12_r, _13_remaining2);
                  }((_pat_let49_0)[1]);
                }((_pat_let49_0)[0]);
              }((_11_p).Extract())));
            })(_5_rToNewParserOfRecursiveNoStackResultOfR)), callbacks);
            continuation = _in10;
            underlying = _in11;
            input = _in12;
            previousInput = _in13;
            callbacks = _in14;
            continue TAIL_CALL_START;
          } else {
            return Std_Parsers_StringBuilders.__default.RecursiveProgressError(_dafny.Seq.UnicodeFromString("ParserBuilders.RecNoStack"), input, _1_remaining);
          }
        }
      }
    };
    static RecMap(underlying, startFun) {
      return Std_Parsers_StringParsers.__default.RecursiveMap(function () {
        let _coll0 = new _dafny.Map();
        for (const _compr_0 of (underlying).Keys.Elements) {
          let _0_k = _compr_0;
          if ((underlying).contains(_0_k)) {
            _coll0.push([_0_k,Std_Parsers_StringParsers.RecursiveDef.create_RecursiveDef(((underlying).get(_0_k)).dtor_order, ((_1_underlying, _2_k) => function (_3_selector) {
  return ((((_1_underlying).get(_2_k)).dtor_definition)(((_4_selector) => function (_5_name) {
    return (_4_selector)(_5_name);
  })(_3_selector)));
})(underlying, _0_k))]);
          }
        }
        return _coll0;
      }(), startFun);
    };
    static RecursiveMap(underlying, startFun) {
      return Std_Parsers_StringBuilders.__default.RecMap(underlying, startFun);
    };
    static get Int() {
      return Std_Parsers_StringParsers.__default.Int();
    };
    static get Nat() {
      return Std_Parsers_StringParsers.__default.Nat();
    };
    static get Digit() {
      return Std_Parsers_StringParsers.__default.Digit();
    };
    static get DigitNumber() {
      return Std_Parsers_StringParsers.__default.DigitNumber();
    };
    static get WS() {
      return Std_Parsers_StringParsers.__default.WS();
    };
    static get Whitespace() {
      return Std_Parsers_StringBuilders.__default.WS;
    };
    static get Nothing() {
      return Std_Parsers_StringParsers.__default.Epsilon();
    };
    static get EOS() {
      return Std_Parsers_StringParsers.__default.EndOfString();
    };
    static get EndOfString() {
      return Std_Parsers_StringBuilders.__default.EOS;
    };
  };

  $module.B = class B {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_B(apply) {
      let $dt = new B(0);
      $dt.apply = apply;
      return $dt;
    }
    get is_B() { return this.$tag === 0; }
    get dtor_apply() { return this.apply; }
    toString() {
      if (this.$tag === 0) {
        return "StringBuilders.B.B" + "(" + _dafny.toString(this.apply) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.apply, other.apply);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return function () { return Std_Parsers_StringParsers.ParseResult.Default(); };
    }
    static Rtd() {
      return class {
        static get Default() {
          return B.Default();
        }
      };
    }
    static Apply(_this, input) {
      return ((_this))(Std_Parsers_StringBuilders.__default.ToInput(input));
    };
    static _q(_this) {
      return Std_Parsers_StringParsers.__default.Maybe((_this));
    };
    static Option(_this) {
      return Std_Parsers_StringParsers.__default.Maybe((_this));
    };
    static _q_q(_this) {
      return Std_Parsers_StringParsers.__default._q((_this));
    };
    static FailureResetsInput(_this) {
      return Std_Parsers_StringParsers.__default._q((_this));
    };
    static e__I(_this, other) {
      return Std_Parsers_StringParsers.__default.ConcatKeepRight((_this), (other));
    };
    static ConcatKeepRight(_this, other) {
      return Std_Parsers_StringBuilders.B.e__I(_this, other);
    };
    static I__e(_this, other) {
      return Std_Parsers_StringParsers.__default.ConcatKeepLeft((_this), (other));
    };
    static ConcatKeepLeft(_this, other) {
      return Std_Parsers_StringBuilders.B.I__e(_this, other);
    };
    static I__I(_this, other) {
      return Std_Parsers_StringParsers.__default.Concat((_this), (other));
    };
    static Concat(_this, other) {
      return Std_Parsers_StringBuilders.B.I__I(_this, other);
    };
    static If(_this, cond) {
      return Std_Parsers_StringParsers.__default.If((cond), (_this));
    };
    static M(_this, mappingFunc) {
      return Std_Parsers_StringParsers.__default.Map((_this), mappingFunc);
    };
    static Map(_this, mappingFunc) {
      return Std_Parsers_StringBuilders.B.M(_this, mappingFunc);
    };
    static M2(_this, unfolder, mappingFunc) {
      return Std_Parsers_StringParsers.__default.Map((_this), ((_0_unfolder, _1_mappingFunc) => function (_2_x) {
        return function (_pat_let50_0) {
          return function (_3_x) {
            return (_1_mappingFunc)((_3_x)[0], (_3_x)[1]);
          }(_pat_let50_0);
        }((_0_unfolder)(_2_x));
      })(unfolder, mappingFunc));
    };
    static Map2(_this, unfolder, mappingFunc) {
      return Std_Parsers_StringBuilders.B.M2(_this, unfolder, mappingFunc);
    };
    static M3(_this, unfolder, mappingFunc) {
      return Std_Parsers_StringParsers.__default.Map((_this), ((_0_unfolder, _1_mappingFunc) => function (_2_x) {
        return function (_pat_let51_0) {
          return function (_3_x) {
            return (_1_mappingFunc)((_3_x)[0], (_3_x)[1], (_3_x)[2]);
          }(_pat_let51_0);
        }((_0_unfolder)(_2_x));
      })(unfolder, mappingFunc));
    };
    static Map3(_this, unfolder, mappingFunc) {
      return Std_Parsers_StringBuilders.B.M3(_this, unfolder, mappingFunc);
    };
    static Then(_this, other) {
      return Std_Parsers_StringParsers.__default.Bind((_this), ((_0_other) => function (_1_result) {
        return ((_0_other)(_1_result));
      })(other));
    };
    static ThenWithRemaining(_this, other) {
      return Std_Parsers_StringParsers.__default.BindSucceeds((_this), ((_0_other) => function (_1_result, _2_input) {
        return ((_0_other)(_1_result, _2_input));
      })(other));
    };
    static Bind(_this, other) {
      return Std_Parsers_StringParsers.__default.BindResult((_this), ((_0_other) => function (_1_result, _2_input) {
        return ((_0_other)(_1_result, _2_input));
      })(other));
    };
    static Debug(_this, name, onEnter, onExit) {
      return Std_Parsers_StringParsers.__default.Debug((_this), name, onEnter, onExit);
    };
    static RepFold(_this, init, combine) {
      return Std_Parsers_StringParsers.__default.Rep((_this), combine, init);
    };
    static RepeatFold(_this, init, combine) {
      return Std_Parsers_StringBuilders.B.RepFold(_this, init, combine);
    };
    static RepSep(_this, separator) {
      return Std_Parsers_StringParsers.__default.RepSep((_this), (separator));
    };
    static RepeatSeparator(_this, separator) {
      return Std_Parsers_StringBuilders.B.RepSep(_this, separator);
    };
    static RepMerge(_this, merger) {
      return Std_Parsers_StringParsers.__default.RepMerge((_this), merger);
    };
    static RepeatMerge(_this, merger) {
      return Std_Parsers_StringBuilders.B.RepMerge(_this, merger);
    };
    static RepSepMerge(_this, separator, merger) {
      return Std_Parsers_StringParsers.__default.RepSepMerge((_this), (separator), merger);
    };
    static RepeatSeparatorMerge(_this, separator, merger) {
      return Std_Parsers_StringBuilders.B.RepSepMerge(_this, separator, merger);
    };
    static Rep(_this) {
      return Std_Parsers_StringParsers.__default.ZeroOrMore((_this));
    };
    static Repeat(_this) {
      return Std_Parsers_StringBuilders.B.Rep(_this);
    };
    static Rep1(_this) {
      return Std_Parsers_StringParsers.__default.OneOrMore((_this));
    };
    static RepeatAtLeastOnce(_this) {
      return Std_Parsers_StringBuilders.B.Rep1(_this);
    };
    static End(_this) {
      return Std_Parsers_StringBuilders.B.I__e(_this, Std_Parsers_StringBuilders.__default.EOS);
    };
  }

  $module.RecNoStackResult = class RecNoStackResult {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_RecReturn(toReturn) {
      let $dt = new RecNoStackResult(0);
      $dt.toReturn = toReturn;
      return $dt;
    }
    static create_RecContinue(toContinue) {
      let $dt = new RecNoStackResult(1);
      $dt.toContinue = toContinue;
      return $dt;
    }
    get is_RecReturn() { return this.$tag === 0; }
    get is_RecContinue() { return this.$tag === 1; }
    get dtor_toReturn() { return this.toReturn; }
    get dtor_toContinue() { return this.toContinue; }
    toString() {
      if (this.$tag === 0) {
        return "StringBuilders.RecNoStackResult.RecReturn" + "(" + _dafny.toString(this.toReturn) + ")";
      } else if (this.$tag === 1) {
        return "StringBuilders.RecNoStackResult.RecContinue" + "(" + _dafny.toString(this.toContinue) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.toReturn, other.toReturn);
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.toContinue, other.toContinue);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringBuilders.RecNoStackResult.create_RecContinue(function () { return Std_Parsers_StringBuilders.B.Default(); });
    }
    static Rtd() {
      return class {
        static get Default() {
          return RecNoStackResult.Default();
        }
      };
    }
  }

  $module.RecMapDef = class RecMapDef {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_RecMapDef(order, definition) {
      let $dt = new RecMapDef(0);
      $dt.order = order;
      $dt.definition = definition;
      return $dt;
    }
    get is_RecMapDef() { return this.$tag === 0; }
    get dtor_order() { return this.order; }
    get dtor_definition() { return this.definition; }
    toString() {
      if (this.$tag === 0) {
        return "StringBuilders.RecMapDef.RecMapDef" + "(" + _dafny.toString(this.order) + ", " + _dafny.toString(this.definition) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.order, other.order) && _dafny.areEqual(this.definition, other.definition);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return Std_Parsers_StringBuilders.RecMapDef.create_RecMapDef(_dafny.ZERO, function () { return Std_Parsers_StringBuilders.B.Default(); });
    }
    static Rtd() {
      return class {
        static get Default() {
          return RecMapDef.Default();
        }
      };
    }
  }
  return $module;
})(); // end of module Std_Parsers_StringBuilders
let SExprParser = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "SExprParser._default";
    }
    _parentTraits() {
      return [];
    }
    static JoinItems(items, indent) {
      if ((new BigNumber((items).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Seq.UnicodeFromString("");
      } else if ((new BigNumber((items).length)).isEqualTo(_dafny.ONE)) {
        return ((items)[_dafny.ZERO]).ToString(indent);
      } else {
        return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(((items)[_dafny.ZERO]).ToString(indent), _dafny.Seq.UnicodeFromString("\n")), indent), SExprParser.__default.JoinItems((items).slice(_dafny.ONE), indent));
      }
    };
    static JoinTopLevelItems(items, indent) {
      let _0___accumulator = _dafny.Seq.of();
      TAIL_CALL_START: while (true) {
        if ((new BigNumber((items).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.UnicodeFromString(""));
        } else if ((new BigNumber((items).length)).isEqualTo(_dafny.ONE)) {
          return _dafny.Seq.Concat(_0___accumulator, ((items)[_dafny.ZERO]).ToString(indent));
        } else {
          _0___accumulator = _dafny.Seq.Concat(_0___accumulator, _dafny.Seq.Concat(((items)[_dafny.ZERO]).ToString(indent), _dafny.Seq.UnicodeFromString("\n")));
          let _in0 = (items).slice(_dafny.ONE);
          let _in1 = indent;
          items = _in0;
          indent = _in1;
          continue TAIL_CALL_START;
        }
      }
    };
    static UnwrapComments(expr) {
      TAIL_CALL_START: while (true) {
        let _source0 = expr;
        {
          if (_source0.is_Comment) {
            let _0_underlyingNode = (_source0).underlyingNode;
            let _in0 = _0_underlyingNode;
            expr = _in0;
            continue TAIL_CALL_START;
          }
        }
        {
          return expr;
        }
      }
    };
    static IsAtom(expr, name) {
      let _0_unwrapped = SExprParser.__default.UnwrapComments(expr);
      return ((_0_unwrapped).is_Atom) && (_dafny.areEqual((_0_unwrapped).dtor_name, name));
    };
    static GetListItems(expr) {
      let _0_unwrapped = SExprParser.__default.UnwrapComments(expr);
      if ((_0_unwrapped).is_List) {
        return (_0_unwrapped).dtor_items;
      } else {
        return _dafny.Seq.of();
      }
    };
    static FormatInfix(op, left, right, indent) {
      return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat((left).ToString(indent), _dafny.Seq.UnicodeFromString(" ")), op), _dafny.Seq.UnicodeFromString(" ")), (right).ToString(indent));
    };
    static TryFormatAsInfix(items, indent) {
      if (((new BigNumber((items).length)).isEqualTo(new BigNumber(3))) && (((((((((SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("+"))) || (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("-")))) || (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("*")))) || (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("/")))) || (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("=")))) || (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("<")))) || (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString(">")))) || (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("<=")))) || (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString(">="))))) {
        let _0_unwrapped = SExprParser.__default.UnwrapComments((items)[_dafny.ZERO]);
        let _1_op = (_0_unwrapped).dtor_name;
        return _dafny.Tuple.of(true, SExprParser.__default.FormatInfix(_1_op, (items)[_dafny.ONE], (items)[new BigNumber(2)], indent));
      } else {
        return _dafny.Tuple.of(false, _dafny.Seq.UnicodeFromString(""));
      }
    };
    static TryFormatAsDefine(items, indent) {
      if (((new BigNumber(3)).isLessThanOrEqualTo(new BigNumber((items).length))) && (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("define")))) {
        let _0_funcDefItems = SExprParser.__default.GetListItems((items)[_dafny.ONE]);
        if (((_dafny.ONE).isLessThanOrEqualTo(new BigNumber((_0_funcDefItems).length))) && (SExprParser.__default.IsAtom((_0_funcDefItems)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("")))) {
          let _1_unwrappedFunc = SExprParser.__default.UnwrapComments((_0_funcDefItems)[_dafny.ZERO]);
          if ((_1_unwrappedFunc).is_Atom) {
            let _2_funcName = (_1_unwrappedFunc).dtor_name;
            let _3_params = (((_dafny.ONE).isLessThan(new BigNumber((_0_funcDefItems).length))) ? ((_0_funcDefItems).slice(_dafny.ONE)) : (_dafny.Seq.of()));
            let _4_paramStr = (((new BigNumber((_3_params).length)).isEqualTo(_dafny.ZERO)) ? (_dafny.Seq.UnicodeFromString("()")) : ((((new BigNumber((_3_params).length)).isEqualTo(_dafny.ONE)) ? (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("("), ((_3_params)[_dafny.ZERO]).ToString(_dafny.Seq.UnicodeFromString(""))), _dafny.Seq.UnicodeFromString(")"))) : (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("("), SExprParser.__default.JoinParams(_3_params)), _dafny.Seq.UnicodeFromString(")"))))));
            let _5_body = (((new BigNumber((items).length)).isEqualTo(new BigNumber(3))) ? (((items)[new BigNumber(2)]).ToString(_dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")))) : (SExprParser.__default.JoinItems((items).slice(new BigNumber(2)), _dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")))));
            return _dafny.Tuple.of(true, _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("function "), _2_funcName), _4_paramStr), _dafny.Seq.UnicodeFromString("\n")), indent), _dafny.Seq.UnicodeFromString("  ")), _5_body));
          } else {
            return _dafny.Tuple.of(false, _dafny.Seq.UnicodeFromString(""));
          }
        } else if ((_dafny.ONE).isLessThanOrEqualTo(new BigNumber((_0_funcDefItems).length))) {
          let _6_unwrappedFunc = SExprParser.__default.UnwrapComments((_0_funcDefItems)[_dafny.ZERO]);
          if ((_6_unwrappedFunc).is_Atom) {
            let _7_funcName = (_6_unwrappedFunc).dtor_name;
            let _8_params = (((_dafny.ONE).isLessThan(new BigNumber((_0_funcDefItems).length))) ? ((_0_funcDefItems).slice(_dafny.ONE)) : (_dafny.Seq.of()));
            let _9_paramStr = (((new BigNumber((_8_params).length)).isEqualTo(_dafny.ZERO)) ? (_dafny.Seq.UnicodeFromString("()")) : ((((new BigNumber((_8_params).length)).isEqualTo(_dafny.ONE)) ? (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("("), ((_8_params)[_dafny.ZERO]).ToString(_dafny.Seq.UnicodeFromString(""))), _dafny.Seq.UnicodeFromString(")"))) : (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("("), SExprParser.__default.JoinParams(_8_params)), _dafny.Seq.UnicodeFromString(")"))))));
            let _10_body = (((new BigNumber((items).length)).isEqualTo(new BigNumber(3))) ? (((items)[new BigNumber(2)]).ToString(_dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")))) : (SExprParser.__default.JoinItems((items).slice(new BigNumber(2)), _dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")))));
            return _dafny.Tuple.of(true, _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("function "), _7_funcName), _9_paramStr), _dafny.Seq.UnicodeFromString("\n")), indent), _dafny.Seq.UnicodeFromString("  ")), _10_body));
          } else {
            return _dafny.Tuple.of(false, _dafny.Seq.UnicodeFromString(""));
          }
        } else {
          return _dafny.Tuple.of(false, _dafny.Seq.UnicodeFromString(""));
        }
      } else {
        return _dafny.Tuple.of(false, _dafny.Seq.UnicodeFromString(""));
      }
    };
    static TryFormatAsIf(items, indent) {
      if (((new BigNumber((items).length)).isEqualTo(new BigNumber(4))) && (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("if")))) {
        let _0_condition = ((items)[_dafny.ONE]).ToString(_dafny.Seq.UnicodeFromString(""));
        let _1_thenBranch = ((items)[new BigNumber(2)]).ToString(_dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")));
        let _2_elseBranch = ((items)[new BigNumber(3)]).ToString(_dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")));
        return _dafny.Tuple.of(true, _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("if "), _0_condition), _dafny.Seq.UnicodeFromString(" then\n")), indent), _dafny.Seq.UnicodeFromString("  ")), _1_thenBranch), _dafny.Seq.UnicodeFromString("\n")), indent), _dafny.Seq.UnicodeFromString("else\n")), indent), _dafny.Seq.UnicodeFromString("  ")), _2_elseBranch));
      } else {
        return _dafny.Tuple.of(false, _dafny.Seq.UnicodeFromString(""));
      }
    };
    static JoinParams(params) {
      if ((new BigNumber((params).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Seq.UnicodeFromString("");
      } else if ((new BigNumber((params).length)).isEqualTo(_dafny.ONE)) {
        return ((params)[_dafny.ZERO]).ToString(_dafny.Seq.UnicodeFromString(""));
      } else {
        return _dafny.Seq.Concat(_dafny.Seq.Concat(((params)[_dafny.ZERO]).ToString(_dafny.Seq.UnicodeFromString("")), _dafny.Seq.UnicodeFromString(", ")), SExprParser.__default.JoinParams((params).slice(_dafny.ONE)));
      }
    };
    static TryFormatAsLet(items, indent) {
      if (((new BigNumber(3)).isLessThanOrEqualTo(new BigNumber((items).length))) && (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("let")))) {
        let _0_bindings = SExprParser.__default.GetListItems((items)[_dafny.ONE]);
        let _1_body = (((new BigNumber((items).length)).isEqualTo(new BigNumber(3))) ? (((items)[new BigNumber(2)]).ToString(_dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")))) : (SExprParser.__default.JoinItems((items).slice(new BigNumber(2)), _dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")))));
        let _2_bindingStr = SExprParser.__default.FormatBindings(_0_bindings, _dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")));
        return _dafny.Tuple.of(true, _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("let\n"), indent), _dafny.Seq.UnicodeFromString("  ")), _2_bindingStr), _dafny.Seq.UnicodeFromString("\n")), indent), _dafny.Seq.UnicodeFromString("in\n")), indent), _dafny.Seq.UnicodeFromString("  ")), _1_body));
      } else {
        return _dafny.Tuple.of(false, _dafny.Seq.UnicodeFromString(""));
      }
    };
    static FormatBindings(bindings, indent) {
      if ((new BigNumber((bindings).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Seq.UnicodeFromString("");
      } else if ((new BigNumber((bindings).length)).isEqualTo(_dafny.ONE)) {
        return SExprParser.__default.FormatBinding((bindings)[_dafny.ZERO], indent);
      } else {
        return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(SExprParser.__default.FormatBinding((bindings)[_dafny.ZERO], indent), _dafny.Seq.UnicodeFromString("\n")), indent), SExprParser.__default.FormatBindings((bindings).slice(_dafny.ONE), indent));
      }
    };
    static FormatBinding(binding, indent) {
      let _0_bindingItems = SExprParser.__default.GetListItems(binding);
      if ((new BigNumber((_0_bindingItems).length)).isEqualTo(new BigNumber(2))) {
        return _dafny.Seq.Concat(_dafny.Seq.Concat(((_0_bindingItems)[_dafny.ZERO]).ToString(_dafny.Seq.UnicodeFromString("")), _dafny.Seq.UnicodeFromString(" = ")), ((_0_bindingItems)[_dafny.ONE]).ToString(_dafny.Seq.UnicodeFromString("")));
      } else {
        return (binding).ToString(_dafny.Seq.UnicodeFromString(""));
      }
    };
    static TryFormatAsLambda(items, indent) {
      if (((new BigNumber(3)).isLessThanOrEqualTo(new BigNumber((items).length))) && (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("lambda")))) {
        let _0_params = SExprParser.__default.GetListItems((items)[_dafny.ONE]);
        let _1_paramStr = (((new BigNumber((_0_params).length)).isEqualTo(_dafny.ZERO)) ? (_dafny.Seq.UnicodeFromString("()")) : ((((new BigNumber((_0_params).length)).isEqualTo(_dafny.ONE)) ? (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("("), ((_0_params)[_dafny.ZERO]).ToString(_dafny.Seq.UnicodeFromString(""))), _dafny.Seq.UnicodeFromString(")"))) : (_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("("), SExprParser.__default.JoinParams(_0_params)), _dafny.Seq.UnicodeFromString(")"))))));
        let _2_body = (((new BigNumber((items).length)).isEqualTo(new BigNumber(3))) ? (((items)[new BigNumber(2)]).ToString(_dafny.Seq.UnicodeFromString(""))) : (SExprParser.__default.JoinItems((items).slice(new BigNumber(2)), _dafny.Seq.UnicodeFromString(""))));
        return _dafny.Tuple.of(true, _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("λ"), _1_paramStr), _dafny.Seq.UnicodeFromString(" => ")), _2_body));
      } else {
        return _dafny.Tuple.of(false, _dafny.Seq.UnicodeFromString(""));
      }
    };
    static TryFormatAsList(items, indent) {
      if (((_dafny.ONE).isLessThanOrEqualTo(new BigNumber((items).length))) && (SExprParser.__default.IsAtom((items)[_dafny.ZERO], _dafny.Seq.UnicodeFromString("list")))) {
        let _0_listItems = (((_dafny.ONE).isLessThan(new BigNumber((items).length))) ? ((items).slice(_dafny.ONE)) : (_dafny.Seq.of()));
        let _1_listStr = SExprParser.__default.JoinListItems(_0_listItems);
        return _dafny.Tuple.of(true, _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("["), _1_listStr), _dafny.Seq.UnicodeFromString("]")));
      } else {
        return _dafny.Tuple.of(false, _dafny.Seq.UnicodeFromString(""));
      }
    };
    static JoinListItems(items) {
      if ((new BigNumber((items).length)).isEqualTo(_dafny.ZERO)) {
        return _dafny.Seq.UnicodeFromString("");
      } else if ((new BigNumber((items).length)).isEqualTo(_dafny.ONE)) {
        return ((items)[_dafny.ZERO]).ToString(_dafny.Seq.UnicodeFromString(""));
      } else {
        return _dafny.Seq.Concat(_dafny.Seq.Concat(((items)[_dafny.ZERO]).ToString(_dafny.Seq.UnicodeFromString("")), _dafny.Seq.UnicodeFromString(", ")), SExprParser.__default.JoinListItems((items).slice(_dafny.ONE)));
      }
    };
    static ParseSExpr(input) {
      let result = _dafny.Seq.UnicodeFromString("");
      let _0_parseResult;
      _0_parseResult = Std_Parsers_StringBuilders.B.Apply(SExprParser.__default.p, input);
      let _source0 = _0_parseResult;
      Lmatch0: {
        {
          if (_source0.is_ParseSuccess) {
            let _1_value = (_source0).result;
            result = (_1_value).ToString(_dafny.Seq.UnicodeFromString(""));
            break Lmatch0;
          }
        }
        {
          let _2_error = (_source0).level;
          result = Std_Parsers_StringBuilders.__default.FailureToString(input, _0_parseResult);
        }
      }
      return result;
    }
    static ParseTopLevel(input) {
      let result = _dafny.Seq.UnicodeFromString("");
      let _0_parseResult;
      _0_parseResult = Std_Parsers_StringBuilders.B.Apply(SExprParser.__default.topLevelParser, input);
      let _source0 = _0_parseResult;
      Lmatch0: {
        {
          if (_source0.is_ParseSuccess) {
            let _1_value = (_source0).result;
            result = SExprParser.TopLevelExpr.ToString(_1_value, _dafny.Seq.UnicodeFromString(""));
            break Lmatch0;
          }
        }
        {
          let _2_error = (_source0).level;
          result = Std_Parsers_StringBuilders.__default.FailureToString(input, _0_parseResult);
        }
      }
      return result;
    }
    static ParseSExprJS(input) {
      let result = _dafny.Seq.UnicodeFromString("");
      let _out0;
      _out0 = SExprParser.__default.ParseTopLevel(input);
      result = _out0;
      return result;
    }
    static Main(__noArgsParameter) {
      let _0_input;
      _0_input = _dafny.Seq.UnicodeFromString("(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1)))))");
      let _1_result;
      let _out0;
      _out0 = SExprParser.__default.ParseTopLevel(_0_input);
      _1_result = _out0;
      process.stdout.write((_dafny.Seq.UnicodeFromString("Parsed: ")).toVerbatimString(false));
      process.stdout.write((_1_result).toVerbatimString(false));
      process.stdout.write((_dafny.Seq.UnicodeFromString("\n")).toVerbatimString(false));
      return;
    }
    static get notNewline() {
      return Std_Parsers_StringBuilders.__default.CharTest(function (_0_c) {
        return !_dafny.areEqual(_0_c, new _dafny.CodePoint('\n'.codePointAt(0)));
      }, _dafny.Seq.UnicodeFromString("anything except newline"));
    };
    static get commentText() {
      return Std_Parsers_StringBuilders.B.I__e(Std_Parsers_StringBuilders.B.e__I(Std_Parsers_StringBuilders.__default.S(_dafny.Seq.UnicodeFromString(";")), Std_Parsers_StringBuilders.B.Rep(SExprParser.__default.notNewline)), Std_Parsers_StringBuilders.__default.O(_dafny.Seq.of(Std_Parsers_StringBuilders.__default.S(_dafny.Seq.UnicodeFromString("\n")), Std_Parsers_StringBuilders.B.M(Std_Parsers_StringBuilders.__default.EOS, function (_0_x) {
        return _dafny.Seq.UnicodeFromString("");
      }))));
    };
    static get noParensNoSpace() {
      return Std_Parsers_StringBuilders.B.Rep1(Std_Parsers_StringBuilders.__default.CharTest(function (_0_c) {
        return (((((!_dafny.areEqual(_0_c, new _dafny.CodePoint('('.codePointAt(0)))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint(')'.codePointAt(0))))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint(' '.codePointAt(0))))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint('\t'.codePointAt(0))))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint('\n'.codePointAt(0))))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint('\r'.codePointAt(0))));
      }, _dafny.Seq.UnicodeFromString("atom character")));
    };
    static get parserSExpr() {
      return Std_Parsers_StringBuilders.__default.Rec(function (_0_SExpr) {
        return Std_Parsers_StringBuilders.__default.O(_dafny.Seq.of(Std_Parsers_StringBuilders.B.M(Std_Parsers_StringBuilders.B.I__I(Std_Parsers_StringBuilders.B.I__e(SExprParser.__default.commentText, Std_Parsers_StringBuilders.__default.WS), _0_SExpr), function (_1_commentAndExpr) {
          return SExprParser.SExpr.create_Comment((_1_commentAndExpr)[0], (_1_commentAndExpr)[1]);
        }), Std_Parsers_StringBuilders.B.M(Std_Parsers_StringBuilders.B.Then(Std_Parsers_StringBuilders.B.e__I(Std_Parsers_StringBuilders.__default.S(_dafny.Seq.UnicodeFromString("(")), Std_Parsers_StringBuilders.__default.WS), ((_2_SExpr) => function (_3_r) {
          return Std_Parsers_StringBuilders.B.I__e(Std_Parsers_StringBuilders.B.I__e(Std_Parsers_StringBuilders.B.Rep(Std_Parsers_StringBuilders.B.I__e(_2_SExpr, Std_Parsers_StringBuilders.__default.WS)), Std_Parsers_StringBuilders.__default.S(_dafny.Seq.UnicodeFromString(")"))), Std_Parsers_StringBuilders.__default.WS);
        })(_0_SExpr)), function (_4_r) {
          return SExprParser.SExpr.create_List(_4_r);
        }), Std_Parsers_StringBuilders.B.I__e(Std_Parsers_StringBuilders.B.M(SExprParser.__default.noParensNoSpace, function (_5_r) {
          return SExprParser.SExpr.create_Atom(_5_r);
        }), Std_Parsers_StringBuilders.__default.WS)));
      });
    };
    static get p() {
      return Std_Parsers_StringBuilders.B.End(Std_Parsers_StringBuilders.B.I__e(SExprParser.__default.parserSExpr, Std_Parsers_StringBuilders.__default.WS));
    };
    static get topLevelParser() {
      return Std_Parsers_StringBuilders.B.M(Std_Parsers_StringBuilders.B.End(Std_Parsers_StringBuilders.B.I__e(Std_Parsers_StringBuilders.B.e__I(Std_Parsers_StringBuilders.__default.WS, Std_Parsers_StringBuilders.B.Rep(Std_Parsers_StringBuilders.B.I__e(SExprParser.__default.parserSExpr, Std_Parsers_StringBuilders.__default.WS))), Std_Parsers_StringBuilders.__default.WS)), function (_0_items) {
        return _0_items;
      });
    };
  };

  $module.SExpr = class SExpr {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Atom(name) {
      let $dt = new SExpr(0);
      $dt.name = name;
      return $dt;
    }
    static create_List(items) {
      let $dt = new SExpr(1);
      $dt.items = items;
      return $dt;
    }
    static create_Comment(comment, underlyingNode) {
      let $dt = new SExpr(2);
      $dt.comment = comment;
      $dt.underlyingNode = underlyingNode;
      return $dt;
    }
    get is_Atom() { return this.$tag === 0; }
    get is_List() { return this.$tag === 1; }
    get is_Comment() { return this.$tag === 2; }
    get dtor_name() { return this.name; }
    get dtor_items() { return this.items; }
    get dtor_comment() { return this.comment; }
    get dtor_underlyingNode() { return this.underlyingNode; }
    toString() {
      if (this.$tag === 0) {
        return "SExprParser.SExpr.Atom" + "(" + this.name.toVerbatimString(true) + ")";
      } else if (this.$tag === 1) {
        return "SExprParser.SExpr.List" + "(" + _dafny.toString(this.items) + ")";
      } else if (this.$tag === 2) {
        return "SExprParser.SExpr.Comment" + "(" + this.comment.toVerbatimString(true) + ", " + _dafny.toString(this.underlyingNode) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.name, other.name);
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.items, other.items);
      } else if (this.$tag === 2) {
        return other.$tag === 2 && _dafny.areEqual(this.comment, other.comment) && _dafny.areEqual(this.underlyingNode, other.underlyingNode);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return SExprParser.SExpr.create_Atom(_dafny.Seq.UnicodeFromString(""));
    }
    static Rtd() {
      return class {
        static get Default() {
          return SExpr.Default();
        }
      };
    }
    ToString(indent) {
      let _this = this;
      let _source0 = _this;
      {
        if (_source0.is_Atom) {
          let _0_name = (_source0).name;
          return _0_name;
        }
      }
      {
        if (_source0.is_List) {
          let _1_items = (_source0).items;
          if ((new BigNumber((_1_items).length)).isEqualTo(_dafny.ZERO)) {
            return _dafny.Seq.UnicodeFromString("()");
          } else {
            let _let_tmp_rhs0 = SExprParser.__default.TryFormatAsDefine(_1_items, indent);
            let _2_isDefine = (_let_tmp_rhs0)[0];
            let _3_defineStr = (_let_tmp_rhs0)[1];
            if (_2_isDefine) {
              return _3_defineStr;
            } else {
              let _let_tmp_rhs1 = SExprParser.__default.TryFormatAsIf(_1_items, indent);
              let _4_isIf = (_let_tmp_rhs1)[0];
              let _5_ifStr = (_let_tmp_rhs1)[1];
              if (_4_isIf) {
                return _5_ifStr;
              } else {
                let _let_tmp_rhs2 = SExprParser.__default.TryFormatAsLet(_1_items, indent);
                let _6_isLet = (_let_tmp_rhs2)[0];
                let _7_letStr = (_let_tmp_rhs2)[1];
                if (_6_isLet) {
                  return _7_letStr;
                } else {
                  let _let_tmp_rhs3 = SExprParser.__default.TryFormatAsLambda(_1_items, indent);
                  let _8_isLambda = (_let_tmp_rhs3)[0];
                  let _9_lambdaStr = (_let_tmp_rhs3)[1];
                  if (_8_isLambda) {
                    return _9_lambdaStr;
                  } else {
                    let _let_tmp_rhs4 = SExprParser.__default.TryFormatAsList(_1_items, indent);
                    let _10_isList = (_let_tmp_rhs4)[0];
                    let _11_listStr = (_let_tmp_rhs4)[1];
                    if (_10_isList) {
                      return _11_listStr;
                    } else {
                      let _let_tmp_rhs5 = SExprParser.__default.TryFormatAsInfix(_1_items, indent);
                      let _12_isInfix = (_let_tmp_rhs5)[0];
                      let _13_infixStr = (_let_tmp_rhs5)[1];
                      if (_12_isInfix) {
                        return _13_infixStr;
                      } else {
                        return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("("), SExprParser.__default.JoinItems(_1_items, _dafny.Seq.Concat(indent, _dafny.Seq.UnicodeFromString("  ")))), _dafny.Seq.UnicodeFromString(")"));
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      {
        let _14_comment = (_source0).comment;
        let _15_underlyingNode = (_source0).underlyingNode;
        return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString(";"), _14_comment), _dafny.Seq.UnicodeFromString("\n")), indent), (_15_underlyingNode).ToString(indent));
      }
    };
  }

  $module.TopLevelExpr = class TopLevelExpr {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_TopLevel(items) {
      let $dt = new TopLevelExpr(0);
      $dt.items = items;
      return $dt;
    }
    get is_TopLevel() { return this.$tag === 0; }
    get dtor_items() { return this.items; }
    toString() {
      if (this.$tag === 0) {
        return "SExprParser.TopLevelExpr.TopLevel" + "(" + _dafny.toString(this.items) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.items, other.items);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return _dafny.Seq.of();
    }
    static Rtd() {
      return class {
        static get Default() {
          return TopLevelExpr.Default();
        }
      };
    }
    static ToString(_this, indent) {
      let _source0 = _this;
      {
        let _0_items = _source0;
        if ((new BigNumber((_0_items).length)).isEqualTo(_dafny.ZERO)) {
          return _dafny.Seq.UnicodeFromString("");
        } else {
          return SExprParser.__default.JoinTopLevelItems(_0_items, indent);
        }
      }
    };
  }
  return $module;
})(); // end of module SExprParser
let ParserSnippets = (function() {
  let $module = {};

  $module.__default = class __default {
    constructor () {
      this._tname = "ParserSnippets._default";
    }
    _parentTraits() {
      return [];
    }
    static ParseJS(parser, input) {
      let result = ParserSnippets.Result.Default();
      let _0_parseResult;
      _0_parseResult = Std_Parsers_StringBuilders.B.Apply(parser, input);
      let _source0 = _0_parseResult;
      Lmatch0: {
        {
          if (_source0.is_ParseSuccess) {
            let _1_value = (_source0).result;
            let _2_remaining = (_source0).remaining;
            result = ParserSnippets.Result.create_Success(_dafny.Tuple.of(_1_value, Std_Parsers_StringBuilders.__default.InputToString(_2_remaining)));
            break Lmatch0;
          }
        }
        {
          result = ParserSnippets.Result.create_Failure(Std_Parsers_StringBuilders.__default.FailureToString(input, _0_parseResult));
        }
      }
      return result;
    }
    static get AtomParser() {
      return Std_Parsers_StringBuilders.B.Rep1(Std_Parsers_StringBuilders.__default.CharTest(function (_0_c) {
        return (((((!_dafny.areEqual(_0_c, new _dafny.CodePoint('('.codePointAt(0)))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint(')'.codePointAt(0))))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint(';'.codePointAt(0))))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint(' '.codePointAt(0))))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint('\t'.codePointAt(0))))) && (!_dafny.areEqual(_0_c, new _dafny.CodePoint('\n'.codePointAt(0))));
      }, _dafny.Seq.UnicodeFromString("atom character")));
    };
    static get NumberOrSymbol() {
      return Std_Parsers_StringBuilders.__default.O(_dafny.Seq.of(Std_Parsers_StringBuilders.B.M(Std_Parsers_StringBuilders.B.Rep1(Std_Parsers_StringBuilders.__default.CharTest(function (_0_c) {
        return ((new _dafny.CodePoint('0'.codePointAt(0))).isLessThanOrEqual(_0_c)) && ((_0_c).isLessThanOrEqual(new _dafny.CodePoint('9'.codePointAt(0))));
      }, _dafny.Seq.UnicodeFromString("digit"))), function (_1_digits) {
        return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("NUMBER:"), _1_digits);
      }), Std_Parsers_StringBuilders.B.M(ParserSnippets.__default.AtomParser, function (_2_atom) {
        return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("SYMBOL:"), _2_atom);
      })));
    };
    static get ConcatDemo__I__I() {
      return Std_Parsers_StringBuilders.B.M(Std_Parsers_StringBuilders.B.I__I(Std_Parsers_StringBuilders.__default.S(_dafny.Seq.UnicodeFromString("(")), ParserSnippets.__default.AtomParser), function (_0_pair) {
        return _dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("BOTH: ("), (_0_pair)[0]), _dafny.Seq.UnicodeFromString(", ")), (_0_pair)[1]), _dafny.Seq.UnicodeFromString(")"));
      });
    };
    static get ConcatDemo__e__I() {
      return Std_Parsers_StringBuilders.B.M(Std_Parsers_StringBuilders.B.e__I(Std_Parsers_StringBuilders.__default.S(_dafny.Seq.UnicodeFromString("(")), ParserSnippets.__default.AtomParser), function (_0_name) {
        return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("RIGHT: "), _0_name);
      });
    };
    static get ConcatDemo__I__e() {
      return Std_Parsers_StringBuilders.B.M(Std_Parsers_StringBuilders.B.I__e(Std_Parsers_StringBuilders.__default.S(_dafny.Seq.UnicodeFromString("(")), ParserSnippets.__default.AtomParser), function (_0_paren) {
        return _dafny.Seq.Concat(_dafny.Seq.UnicodeFromString("LEFT: "), _0_paren);
      });
    };
    static get AtomWithSpaces() {
      return Std_Parsers_StringBuilders.B.I__e(ParserSnippets.__default.AtomParser, Std_Parsers_StringBuilders.__default.WS);
    };
    static get AngerParser() {
      return Std_Parsers_StringBuilders.__default.CharTest(function (_0_c) {
        return (((_dafny.areEqual(_0_c, new _dafny.CodePoint('😠'.codePointAt(0)))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('😡'.codePointAt(0))))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('🤬'.codePointAt(0))))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('😤'.codePointAt(0))));
      }, _dafny.Seq.UnicodeFromString("Angry Smily"));
    };
    static get JoyParser() {
      return Std_Parsers_StringBuilders.B.Rep(Std_Parsers_StringBuilders.__default.CharTest(function (_0_c) {
        return ((((_dafny.areEqual(_0_c, new _dafny.CodePoint('😀'.codePointAt(0)))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('😃'.codePointAt(0))))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('😄'.codePointAt(0))))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('😁'.codePointAt(0))))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('🥳'.codePointAt(0))));
      }, _dafny.Seq.UnicodeFromString("joy")));
    };
    static get JoyScoreParser() {
      return Std_Parsers_StringBuilders.B.M(Std_Parsers_StringBuilders.B.Rep(Std_Parsers_StringBuilders.__default.CharTest(function (_0_c) {
        return ((((_dafny.areEqual(_0_c, new _dafny.CodePoint('😀'.codePointAt(0)))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('😃'.codePointAt(0))))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('😄'.codePointAt(0))))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('😁'.codePointAt(0))))) || (_dafny.areEqual(_0_c, new _dafny.CodePoint('🥳'.codePointAt(0))));
      }, _dafny.Seq.UnicodeFromString("joy"))), function (_1_joyString) {
        return (new BigNumber((_1_joyString).length)).multipliedBy(new BigNumber(2));
      });
    };
  };

  $module.Result = class Result {
    constructor(tag) {
      this.$tag = tag;
    }
    static create_Success(value) {
      let $dt = new Result(0);
      $dt.value = value;
      return $dt;
    }
    static create_Failure(error) {
      let $dt = new Result(1);
      $dt.error = error;
      return $dt;
    }
    get is_Success() { return this.$tag === 0; }
    get is_Failure() { return this.$tag === 1; }
    get dtor_value() { return this.value; }
    get dtor_error() { return this.error; }
    toString() {
      if (this.$tag === 0) {
        return "ParserSnippets.Result.Success" + "(" + _dafny.toString(this.value) + ")";
      } else if (this.$tag === 1) {
        return "ParserSnippets.Result.Failure" + "(" + this.error.toVerbatimString(true) + ")";
      } else  {
        return "<unexpected>";
      }
    }
    equals(other) {
      if (this === other) {
        return true;
      } else if (this.$tag === 0) {
        return other.$tag === 0 && _dafny.areEqual(this.value, other.value);
      } else if (this.$tag === 1) {
        return other.$tag === 1 && _dafny.areEqual(this.error, other.error);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return ParserSnippets.Result.create_Failure(_dafny.Seq.UnicodeFromString(""));
    }
    static Rtd() {
      return class {
        static get Default() {
          return Result.Default();
        }
      };
    }
  }
  return $module;
})(); // end of module ParserSnippets
let _module = (function() {
  let $module = {};

  return $module;
})(); // end of module _module
_dafny.HandleHaltExceptions(() => SExprParser.__default.Main(_dafny.UnicodeFromMainArguments(require('process').argv)));
