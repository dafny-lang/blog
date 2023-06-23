// Dafny program typesprogramminglanguage.dfy compiled into JavaScript
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
      let log10 = this.isPowerOf10(this.den);
      if (log10 !== undefined) {
        let sign, digits;
        if (this.num.isLessThan(0)) {
          sign = "-"; digits = this.num.negated().toFixed();
        } else {
          sign = ""; digits = this.num.toFixed();
        }
        if (log10 < digits.length) {
          let n = digits.length - log10;
          return sign + digits.slice(0, n) + "." + digits.slice(n);
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
    toBigNumber() {
      if (this.num.isZero() || this.den.isEqualTo(1)) {
        return this.num;
      } else if (this.num.isGreaterThan(0)) {
        return this.num.dividedToIntegerBy(this.den);
      } else {
        return this.num.minus(this.den).plus(1).dividedToIntegerBy(this.den);
      }
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
let _System = (function() {
  let $module = {};

  $module.nat = class nat {
    constructor () {
    }
    static get Default() {
      return _dafny.ZERO;
    }
  };
  return $module;
})(); // end of module _System
let _module = (function() {
  let $module = {};

  $module.Term = class Term {
    constructor(tag) { this.$tag = tag; }
    static create_True() {
      let $dt = new Term(0);
      return $dt;
    }
    static create_False() {
      let $dt = new Term(1);
      return $dt;
    }
    static create_Zero() {
      let $dt = new Term(2);
      return $dt;
    }
    static create_Succ(e) {
      let $dt = new Term(3);
      $dt.e = e;
      return $dt;
    }
    static create_Pred(e) {
      let $dt = new Term(4);
      $dt.e = e;
      return $dt;
    }
    static create_IsZero(e) {
      let $dt = new Term(5);
      $dt.e = e;
      return $dt;
    }
    static create_Double(e) {
      let $dt = new Term(6);
      $dt.e = e;
      return $dt;
    }
    static create_Add(left, right) {
      let $dt = new Term(7);
      $dt.left = left;
      $dt.right = right;
      return $dt;
    }
    static create_If(cond, thn, els) {
      let $dt = new Term(8);
      $dt.cond = cond;
      $dt.thn = thn;
      $dt.els = els;
      return $dt;
    }
    get is_True() { return this.$tag === 0; }
    get is_False() { return this.$tag === 1; }
    get is_Zero() { return this.$tag === 2; }
    get is_Succ() { return this.$tag === 3; }
    get is_Pred() { return this.$tag === 4; }
    get is_IsZero() { return this.$tag === 5; }
    get is_Double() { return this.$tag === 6; }
    get is_Add() { return this.$tag === 7; }
    get is_If() { return this.$tag === 8; }
    get dtor_e() { return this.e; }
    get dtor_left() { return this.left; }
    get dtor_right() { return this.right; }
    get dtor_cond() { return this.cond; }
    get dtor_thn() { return this.thn; }
    get dtor_els() { return this.els; }
    toString() {
      if (this.$tag === 0) {
        return "Term.True";
      } else if (this.$tag === 1) {
        return "Term.False";
      } else if (this.$tag === 2) {
        return "Term.Zero";
      } else if (this.$tag === 3) {
        return "Term.Succ" + "(" + _dafny.toString(this.e) + ")";
      } else if (this.$tag === 4) {
        return "Term.Pred" + "(" + _dafny.toString(this.e) + ")";
      } else if (this.$tag === 5) {
        return "Term.IsZero" + "(" + _dafny.toString(this.e) + ")";
      } else if (this.$tag === 6) {
        return "Term.Double" + "(" + _dafny.toString(this.e) + ")";
      } else if (this.$tag === 7) {
        return "Term.Add" + "(" + _dafny.toString(this.left) + ", " + _dafny.toString(this.right) + ")";
      } else if (this.$tag === 8) {
        return "Term.If" + "(" + _dafny.toString(this.cond) + ", " + _dafny.toString(this.thn) + ", " + _dafny.toString(this.els) + ")";
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
      } else if (this.$tag === 2) {
        return other.$tag === 2;
      } else if (this.$tag === 3) {
        return other.$tag === 3 && _dafny.areEqual(this.e, other.e);
      } else if (this.$tag === 4) {
        return other.$tag === 4 && _dafny.areEqual(this.e, other.e);
      } else if (this.$tag === 5) {
        return other.$tag === 5 && _dafny.areEqual(this.e, other.e);
      } else if (this.$tag === 6) {
        return other.$tag === 6 && _dafny.areEqual(this.e, other.e);
      } else if (this.$tag === 7) {
        return other.$tag === 7 && _dafny.areEqual(this.left, other.left) && _dafny.areEqual(this.right, other.right);
      } else if (this.$tag === 8) {
        return other.$tag === 8 && _dafny.areEqual(this.cond, other.cond) && _dafny.areEqual(this.thn, other.thn) && _dafny.areEqual(this.els, other.els);
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return _module.Term.create_True();
    }
    static Rtd() {
      return class {
        static get Default() {
          return Term.Default();
        }
      };
    }
  }

  $module.Type = class Type {
    constructor(tag) { this.$tag = tag; }
    static create_Bool() {
      let $dt = new Type(0);
      return $dt;
    }
    static create_Int() {
      let $dt = new Type(1);
      return $dt;
    }
    get is_Bool() { return this.$tag === 0; }
    get is_Int() { return this.$tag === 1; }
    static get AllSingletonConstructors() {
      return this.AllSingletonConstructors_();
    }
    static *AllSingletonConstructors_() {
      yield Type.create_Bool();
      yield Type.create_Int();
    }
    toString() {
      if (this.$tag === 0) {
        return "Type.Bool";
      } else if (this.$tag === 1) {
        return "Type.Int";
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
      return _module.Type.create_Bool();
    }
    static Rtd() {
      return class {
        static get Default() {
          return Type.Default();
        }
      };
    }
  }

  $module.Option = class Option {
    constructor(tag) { this.$tag = tag; }
    static create_Some(value) {
      let $dt = new Option(0);
      $dt.value = value;
      return $dt;
    }
    static create_None() {
      let $dt = new Option(1);
      return $dt;
    }
    get is_Some() { return this.$tag === 0; }
    get is_None() { return this.$tag === 1; }
    get dtor_value() { return this.value; }
    toString() {
      if (this.$tag === 0) {
        return "Option.Some" + "(" + _dafny.toString(this.value) + ")";
      } else if (this.$tag === 1) {
        return "Option.None";
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
        return other.$tag === 1;
      } else  {
        return false; // unexpected
      }
    }
    static Default() {
      return _module.Option.create_None();
    }
    static Rtd() {
      return class {
        static get Default() {
          return Option.Default();
        }
      };
    }
  }

  $module.__default = class __default {
    constructor () {
      this._tname = "_module._default";
    }
    _parentTraits() {
      return [];
    }
    static GetType(term) {
      let _source0 = term;
      if (_source0.is_True) {
        return _module.Option.create_Some(_module.Type.create_Bool());
      } else if (_source0.is_False) {
        return _module.Option.create_Some(_module.Type.create_Bool());
      } else if (_source0.is_Zero) {
        return _module.Option.create_Some(_module.Type.create_Int());
      } else if (_source0.is_Succ) {
        let _0___mcc_h0 = (_source0).e;
        let _1_e = _0___mcc_h0;
        if (_dafny.areEqual(_module.__default.GetType(_1_e), _module.Option.create_Some(_module.Type.create_Int()))) {
          return _module.Option.create_Some(_module.Type.create_Int());
        } else {
          return _module.Option.create_None();
        }
      } else if (_source0.is_Pred) {
        let _2___mcc_h1 = (_source0).e;
        let _3_e = _2___mcc_h1;
        if (_dafny.areEqual(_module.__default.GetType(_3_e), _module.Option.create_Some(_module.Type.create_Int()))) {
          return _module.Option.create_Some(_module.Type.create_Int());
        } else {
          return _module.Option.create_None();
        }
      } else if (_source0.is_IsZero) {
        let _4___mcc_h2 = (_source0).e;
        let _5_e = _4___mcc_h2;
        if (_dafny.areEqual(_module.__default.GetType(_5_e), _module.Option.create_Some(_module.Type.create_Int()))) {
          return _module.Option.create_Some(_module.Type.create_Bool());
        } else {
          return _module.Option.create_None();
        }
      } else if (_source0.is_Double) {
        let _6___mcc_h3 = (_source0).e;
        let _7_e = _6___mcc_h3;
        if (_dafny.areEqual(_module.__default.GetType(_7_e), _module.Option.create_Some(_module.Type.create_Int()))) {
          return _module.Option.create_Some(_module.Type.create_Int());
        } else {
          return _module.Option.create_None();
        }
      } else if (_source0.is_Add) {
        let _8___mcc_h4 = (_source0).left;
        let _9___mcc_h5 = (_source0).right;
        let _10_right = _9___mcc_h5;
        let _11_left = _8___mcc_h4;
        if ((_dafny.areEqual(_module.__default.GetType(_11_left), _module.Option.create_Some(_module.Type.create_Int()))) && (_dafny.areEqual(_module.Option.create_Some(_module.Type.create_Int()), _module.__default.GetType(_10_right)))) {
          return _module.Option.create_Some(_module.Type.create_Int());
        } else {
          return _module.Option.create_None();
        }
      } else {
        let _12___mcc_h6 = (_source0).cond;
        let _13___mcc_h7 = (_source0).thn;
        let _14___mcc_h8 = (_source0).els;
        let _15_els = _14___mcc_h8;
        let _16_thn = _13___mcc_h7;
        let _17_cond = _12___mcc_h6;
        let _18_t = _module.__default.GetType(_16_thn);
        let _19_e = _module.__default.GetType(_15_els);
        if ((_dafny.areEqual(_module.__default.GetType(_17_cond), _module.Option.create_Some(_module.Type.create_Bool()))) && (_dafny.areEqual(_18_t, _19_e))) {
          return _18_t;
        } else {
          return _module.Option.create_None();
        }
      }
    };
    static WellTyped(term) {
      return !_dafny.areEqual(_module.__default.GetType(term), _module.Option.create_None());
    };
    static IsSuccs(term) {
      return (_dafny.areEqual(term, _module.Term.create_Zero())) || (((term).is_Succ) && (_module.__default.IsSuccs((term).dtor_e)));
    };
    static IsPreds(term) {
      return (_dafny.areEqual(term, _module.Term.create_Zero())) || (((term).is_Pred) && (_module.__default.IsPreds((term).dtor_e)));
    };
    static IsFinalValue(term) {
      return ((((_dafny.areEqual(term, _module.Term.create_True())) || (_dafny.areEqual(term, _module.Term.create_False()))) || (_dafny.areEqual(term, _module.Term.create_Zero()))) || (_module.__default.IsSuccs(term))) || (_module.__default.IsPreds(term));
    };
    static OneStepEvaluate(e) {
      let _source1 = e;
      if (_source1.is_Succ) {
        let _20___mcc_h0 = (_source1).e;
        let _source2 = _20___mcc_h0;
        if (_source2.is_True) {
          let _21_succ = _20___mcc_h0;
          return _module.Term.create_Succ(_module.__default.OneStepEvaluate(_21_succ));
        } else if (_source2.is_False) {
          let _22_succ = _20___mcc_h0;
          return _module.Term.create_Succ(_module.__default.OneStepEvaluate(_22_succ));
        } else if (_source2.is_Zero) {
          let _23_succ = _20___mcc_h0;
          return _module.Term.create_Succ(_module.__default.OneStepEvaluate(_23_succ));
        } else if (_source2.is_Succ) {
          let _24___mcc_h1 = (_source2).e;
          let _25_succ = _20___mcc_h0;
          return _module.Term.create_Succ(_module.__default.OneStepEvaluate(_25_succ));
        } else if (_source2.is_Pred) {
          let _26___mcc_h3 = (_source2).e;
          let _27_x = _26___mcc_h3;
          return _27_x;
        } else if (_source2.is_IsZero) {
          let _28___mcc_h5 = (_source2).e;
          let _29_succ = _20___mcc_h0;
          return _module.Term.create_Succ(_module.__default.OneStepEvaluate(_29_succ));
        } else if (_source2.is_Double) {
          let _30___mcc_h7 = (_source2).e;
          let _31_succ = _20___mcc_h0;
          return _module.Term.create_Succ(_module.__default.OneStepEvaluate(_31_succ));
        } else if (_source2.is_Add) {
          let _32___mcc_h9 = (_source2).left;
          let _33___mcc_h10 = (_source2).right;
          let _34_succ = _20___mcc_h0;
          return _module.Term.create_Succ(_module.__default.OneStepEvaluate(_34_succ));
        } else {
          let _35___mcc_h13 = (_source2).cond;
          let _36___mcc_h14 = (_source2).thn;
          let _37___mcc_h15 = (_source2).els;
          let _38_succ = _20___mcc_h0;
          return _module.Term.create_Succ(_module.__default.OneStepEvaluate(_38_succ));
        }
      } else if (_source1.is_Pred) {
        let _39___mcc_h19 = (_source1).e;
        let _source3 = _39___mcc_h19;
        if (_source3.is_True) {
          let _40_pred = _39___mcc_h19;
          return _module.Term.create_Pred(_module.__default.OneStepEvaluate(_40_pred));
        } else if (_source3.is_False) {
          let _41_pred = _39___mcc_h19;
          return _module.Term.create_Pred(_module.__default.OneStepEvaluate(_41_pred));
        } else if (_source3.is_Zero) {
          let _42_pred = _39___mcc_h19;
          return _module.Term.create_Pred(_module.__default.OneStepEvaluate(_42_pred));
        } else if (_source3.is_Succ) {
          let _43___mcc_h20 = (_source3).e;
          let _44_x = _43___mcc_h20;
          return _44_x;
        } else if (_source3.is_Pred) {
          let _45___mcc_h22 = (_source3).e;
          let _46_pred = _39___mcc_h19;
          return _module.Term.create_Pred(_module.__default.OneStepEvaluate(_46_pred));
        } else if (_source3.is_IsZero) {
          let _47___mcc_h24 = (_source3).e;
          let _48_pred = _39___mcc_h19;
          return _module.Term.create_Pred(_module.__default.OneStepEvaluate(_48_pred));
        } else if (_source3.is_Double) {
          let _49___mcc_h26 = (_source3).e;
          let _50_pred = _39___mcc_h19;
          return _module.Term.create_Pred(_module.__default.OneStepEvaluate(_50_pred));
        } else if (_source3.is_Add) {
          let _51___mcc_h28 = (_source3).left;
          let _52___mcc_h29 = (_source3).right;
          let _53_pred = _39___mcc_h19;
          return _module.Term.create_Pred(_module.__default.OneStepEvaluate(_53_pred));
        } else {
          let _54___mcc_h32 = (_source3).cond;
          let _55___mcc_h33 = (_source3).thn;
          let _56___mcc_h34 = (_source3).els;
          let _57_pred = _39___mcc_h19;
          return _module.Term.create_Pred(_module.__default.OneStepEvaluate(_57_pred));
        }
      } else if (_source1.is_IsZero) {
        let _58___mcc_h38 = (_source1).e;
        let _source4 = _58___mcc_h38;
        if (_source4.is_True) {
          let _59_e = _58___mcc_h38;
          if (_module.__default.IsFinalValue(_59_e)) {
            return _module.Term.create_False();
          } else {
            return _module.Term.create_IsZero(_module.__default.OneStepEvaluate(_59_e));
          }
        } else if (_source4.is_False) {
          let _60_e = _58___mcc_h38;
          if (_module.__default.IsFinalValue(_60_e)) {
            return _module.Term.create_False();
          } else {
            return _module.Term.create_IsZero(_module.__default.OneStepEvaluate(_60_e));
          }
        } else if (_source4.is_Zero) {
          return _module.Term.create_True();
        } else if (_source4.is_Succ) {
          let _61___mcc_h39 = (_source4).e;
          let _62_e = _58___mcc_h38;
          if (_module.__default.IsFinalValue(_62_e)) {
            return _module.Term.create_False();
          } else {
            return _module.Term.create_IsZero(_module.__default.OneStepEvaluate(_62_e));
          }
        } else if (_source4.is_Pred) {
          let _63___mcc_h41 = (_source4).e;
          let _64_e = _58___mcc_h38;
          if (_module.__default.IsFinalValue(_64_e)) {
            return _module.Term.create_False();
          } else {
            return _module.Term.create_IsZero(_module.__default.OneStepEvaluate(_64_e));
          }
        } else if (_source4.is_IsZero) {
          let _65___mcc_h43 = (_source4).e;
          let _66_e = _58___mcc_h38;
          if (_module.__default.IsFinalValue(_66_e)) {
            return _module.Term.create_False();
          } else {
            return _module.Term.create_IsZero(_module.__default.OneStepEvaluate(_66_e));
          }
        } else if (_source4.is_Double) {
          let _67___mcc_h45 = (_source4).e;
          let _68_e = _58___mcc_h38;
          if (_module.__default.IsFinalValue(_68_e)) {
            return _module.Term.create_False();
          } else {
            return _module.Term.create_IsZero(_module.__default.OneStepEvaluate(_68_e));
          }
        } else if (_source4.is_Add) {
          let _69___mcc_h47 = (_source4).left;
          let _70___mcc_h48 = (_source4).right;
          let _71_e = _58___mcc_h38;
          if (_module.__default.IsFinalValue(_71_e)) {
            return _module.Term.create_False();
          } else {
            return _module.Term.create_IsZero(_module.__default.OneStepEvaluate(_71_e));
          }
        } else {
          let _72___mcc_h51 = (_source4).cond;
          let _73___mcc_h52 = (_source4).thn;
          let _74___mcc_h53 = (_source4).els;
          let _75_e = _58___mcc_h38;
          if (_module.__default.IsFinalValue(_75_e)) {
            return _module.Term.create_False();
          } else {
            return _module.Term.create_IsZero(_module.__default.OneStepEvaluate(_75_e));
          }
        }
      } else if (_source1.is_Double) {
        let _76___mcc_h57 = (_source1).e;
        let _77_a = _76___mcc_h57;
        if (_module.__default.IsFinalValue(_77_a)) {
          return _module.Term.create_Add(_77_a, _77_a);
        } else {
          return _module.Term.create_Double(_module.__default.OneStepEvaluate(_77_a));
        }
      } else if (_source1.is_Add) {
        let _78___mcc_h58 = (_source1).left;
        let _79___mcc_h59 = (_source1).right;
        let _80_b = _79___mcc_h59;
        let _81_a = _78___mcc_h58;
        if (!(_module.__default.IsFinalValue(_81_a))) {
          return _module.Term.create_Add(_module.__default.OneStepEvaluate(_81_a), _80_b);
        } else if (!(_module.__default.IsFinalValue(_80_b))) {
          return _module.Term.create_Add(_81_a, _module.__default.OneStepEvaluate(_80_b));
        } else if ((_81_a).is_Zero) {
          return _80_b;
        } else if ((_80_b).is_Zero) {
          return _81_a;
        } else if ((_81_a).is_Succ) {
          return _module.Term.create_Succ(_module.Term.create_Add((_81_a).dtor_e, _80_b));
        } else {
          return _module.Term.create_Pred(_module.Term.create_Add((_81_a).dtor_e, _80_b));
        }
      } else {
        let _82___mcc_h60 = (_source1).cond;
        let _83___mcc_h61 = (_source1).thn;
        let _84___mcc_h62 = (_source1).els;
        let _85_els = _84___mcc_h62;
        let _86_thn = _83___mcc_h61;
        let _87_cond = _82___mcc_h60;
        if (_module.__default.IsFinalValue(_87_cond)) {
          if (_dafny.areEqual(_87_cond, _module.Term.create_True())) {
            return _86_thn;
          } else {
            return _85_els;
          }
        } else {
          return _module.Term.create_If(_module.__default.OneStepEvaluate(_87_cond), _86_thn, _85_els);
        }
      }
    };
  };
  return $module;
})(); // end of module _module
