module Vacuous {
method Find(xs: seq<int>, x: int, start: int, end: int) returns (i: int)
  requires start < |xs|
  requires end < |xs|
  ensures start < i < end

method CallFind() {
  var xs := [42, 43];
  var i := Find(xs, 43, 0, 1);
  assert xs[i] == 42;
}
}
