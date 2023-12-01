module Rat {

  ghost predicate Rational(x: real) {
    exists n: int, m: int :: m > 0 && x == (n as real) / (m as real)
  }

  type rat = x: real | Rational(x) witness (0 as real / 1 as real)

}

module M1 { import opened Rat

  ghost function add(x: rat, y: rat): rat
    requires Rational(x)
    requires Rational(y)
    ensures Rational(add(x,y))  // Comment -> postcondition not verified
    ensures add(x, y) == x + y
  {
    var n1: int, m1: int :| m1 > 0 && x == (n1 as real) / (m1 as real);
    var n2: int, m2: int :| m2 > 0 && y == (n2 as real) / (m2 as real);
    //var r1 := x + y;          // Uncomment -> postcondition not verified
    var r: rat := ((n1 * m2 + n2 * m1) as real) / ((m1 * m2) as real);
    assert Rational(r);
    //assert r == x + y;        // Uncomment -> much higher resource use
    r
  }
}

module M2 { import opened Rat

  ghost function add2(x: rat, y: rat): rat
    requires Rational(x)
    requires Rational(y)
    // ensures Rational(add2(x,y))  // Uncomment -> higher resource use with 3.13, failure with 4.3
    ensures add2(x, y) == x + y
  {
    var x1: int, x2: int :| x2 > 0 && x == (x1 as real) / (x2 as real);
    var y1: int, y2: int :| y2 > 0 && y == (y1 as real) / (y2 as real);
    var r: real := x + y;
    var final_d: int := x2 * y2;
    // var r1 := x + y;         // Uncomment -> higher resource use with 3.13, failure with 4.3
    assert (x1 as real) / (x2 as real) == ((x1 * y2) as real) / ((x2 * y2) as real);
    assert r == (((x1 * y2) + (y1 * x2)) as real) / (final_d as real);
    // assert Rational(r);      // Uncomment -> higher resource use with 3.13, failure with 4.3
    // assert r == x + y;       // Uncomment -> higher resource use with 3.13, failure with 4.3
    r
  }

}

module M3 { import opened Rat

  lemma AddStep1(x1: int, x2: int, y1: int, y2: int)
    requires x2 > 0
    requires y2 > 0
    ensures (x1 as real) / (x2 as real) == ((x1 * y2) as real) / ((x2 * y2) as real)
  {}

  lemma AddStep2(r: real, x:real, y: real, x1: int, x2: int, y1: int, y2: int)
    requires x2 > 0
    requires x == (x1 as real) / (x2 as real)
    requires y2 > 0
    requires y == (y1 as real) / (y2 as real)
    requires r == x + y
    ensures r == (((x1 * y2) + (y1 * x2)) as real) / ((x2 * y2) as real)
  {}

  lemma AddStep3(r: real, x:real, y: real, x1: int, x2: int, y1: int, y2: int)
    requires x2 > 0
    requires x == (x1 as real) / (x2 as real)
    requires y2 > 0
    requires y == (y1 as real) / (y2 as real)
    requires r == x + y
    requires (x1 as real) / (x2 as real) == ((x1 * y2) as real) / ((x2 * y2) as real)
    requires r == (((x1 * y2) + (y1 * x2)) as real) / ((x2 * y2) as real)
    ensures Rational(r)
  {}

  ghost function add3(x: rat, y: rat): rat
    requires Rational(x)
    requires Rational(y)
    //ensures Rational(add3(x, y)) // Fine
    ensures add3(x, y) == x + y
  {
    var x1: int, x2: int :| x2 > 0 && x == (x1 as real) / (x2 as real);
    var y1: int, y2: int :| y2 > 0 && y == (y1 as real) / (y2 as real);
    var r: real := x + y;
    // var r1 := x + y;            // Fine
    AddStep1(x1,x2,y1,y2);
    AddStep2(r,x,y,x1,x2,y1,y2);
    AddStep3(r,x,y,x1,x2,y1,y2);   // Higher resource use if left out, even without postcondition
    // assert r == x + y;          // Fine
    r
  }

}
