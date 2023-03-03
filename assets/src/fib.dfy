function Fib(i: nat): nat {
  if i <= 1 then
    i
  else
    Fib(i-1) + Fib(i-2)
} by method {
  if i <= 1 { return i; }
  var a, b, t := 0, 1, 1;
  for t := 1 to i
    invariant && b == Fib(t)
              && a == Fib(t-1) {
    a, b := b, a + b;
  }
  return b;
}
