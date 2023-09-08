// Rustan Leino
// 29 Oct 2022

module {:options "/functionSyntax:4"} Streams {
  export
    reveals Stream, IsFinite
    provides Length, AboutLength
    reveals Last
    // provides LengthNil

  codatatype Stream<X> = Nil | Cons(head: X, tail: Stream<X>)

  least predicate IsFinite(s: Stream) {
    s == Nil || IsFinite(s.tail)
  }

  function Length(s: Stream): nat
    requires IsFinite(s)
  {
    ghost var k := PickK(s);
    Length'(k, s)
  }

  ghost function PickK(s: Stream): ORDINAL
    requires IsFinite(s)
  {
    var k :| IsFinite#[k](s); k
  }

  function Length'(ghost k: ORDINAL, s: Stream): nat
    requires IsFinite#[k](s)
  {
    if s == Nil then
      0
    else
      1 + Length'(ReduceK(k, s), s.tail)
  }

  ghost function ReduceK(k: ORDINAL, s: Stream): (k': ORDINAL)
    requires s != Nil && IsFinite#[k](s)
    ensures k' < k && IsFinite#[k'](s.tail)
  {
    if k.Offset != 0 then
      k - 1
    else
      var k' :| k' < k && IsFinite#[k'](s);
      ReduceK(k', s)
  }

  lemma Length'AnyK(k0: ORDINAL, k1: ORDINAL, s: Stream)
    requires IsFinite#[k0](s) && IsFinite#[k1](s)
    ensures Length'(k0, s) == Length'(k1, s)
  {
  }

  lemma LengthNil(s: Stream)
    requires IsFinite(s)
    ensures Length(s) == 0 <==> s == Nil
  {
  }

  lemma AboutLength(s: Stream)
    requires s != Nil && IsFinite(s)
    ensures Length(s) == 1 + Length(s.tail)
  {
    // Length'AnyK(ReduceK(PickK(s), s), PickK(s.tail), s.tail);
    calc {
      Length(s);
    ==  // def. Length
      Length'(PickK(s), s);
    ==  // def. Length'
      1 + Length'(ReduceK(PickK(s), s), s.tail);
    ==  { Length'AnyK(ReduceK(PickK(s), s), PickK(s.tail), s.tail); }
      1 + Length'(PickK(s.tail), s.tail);
    ==  // def. Length
      1 + Length(s.tail);
    }
  }

  function Last<X>(s: Stream<X>): X
    requires s != Nil && IsFinite(s)
    decreases Length(s)
  {
    match s
    case Cons(x, Nil) =>
      x
    case _ =>
      AboutLength(s);
      Last(s.tail)
  }

  // Exercise: Define IsFinite' as a greatest predicate and show that it is
  // equal to true.

  greatest predicate IsFinite'(s: Stream) {
    s == Nil || IsFinite'(s.tail)
  }

  greatest lemma IsFinite'True(s: Stream)
    ensures IsFinite'(s)
  {
  }

}

module {:options "/functionSyntax:4"} AbstractDomain {
  import opened Streams

  /* We assume a nonempty type A whose elements can be compared at run-time for equality. */

  type A(==,0,!new)

  // ------------------------------------------------------------------------------

  /* "le" is an ordering on A. Actually, we only need the fact that it is a relation on A. */
  predicate le(x: A, y: A)

  /* "lt" is the strict version of (the possibly already pretty strict) "le". */
  predicate lt(x: A, y: A) {
    le(x, y) && x != y
  }

  /* We assume A to have a bottom element. */
  const bot: A

  lemma {:axiom} BotSmallest(x: A)
	  ensures le(bot, x)

  // ------------------------------------------------------------------------------

  /* Predicate "Acc(x)" says that every ascending chain starting at "x" is finite. */
  least predicate Acc(x: A) {
	  forall y :: lt(x, y) ==> Acc(y)
  }

  /* We assume A to be well-founded. That is, every ascending chain is finite. */
  lemma {:axiom} BotAcc()
    ensures Acc(bot)

  /* From Acc(bot), we can prove Acc(x) for any element x. */
  lemma WellFounded(x: A)
    ensures Acc(x)
  {
    /*
    BotSmallest(x);
    BotAcc();
    */
    calc {
      true;
    ==> { BotSmallest(x); }
      le(bot, x);
    ==> // def. lt
      bot == x || lt(bot, x);
    ==> { BotAcc(); }
      Acc(x);
    }
  }

  // ------------------------------------------------------------------------------

  greatest predicate Ascending(s: Stream<A>) {
    match s
    case Nil => true
    case Cons(x, Nil) => true
    case Cons(x, Cons(y, _)) => lt(x, y) && Ascending(s.tail)
  }

  least lemma AscendingIsFinite(s: Stream<A>)
    requires (s == Nil || Acc(s.head)) && Ascending(s)
    ensures IsFinite(s)
  {
    // Dafny rocks!

    // Dafny completes the proof automatically. But if you were to write it
    // manually, here's what it would look like:
    /*
    if s == Nil {
    } else if s.tail == Nil {
      AscendingIsFinite(s.tail);
    } else {
      assert lt(s.head, s.tail.head) && Ascending(s.tail); // by Ascending(s)
      assert forall y :: lt(s.head, y) ==> Acc(y); // by Acc(s.head)
      assert Acc(s.tail.head); // by the previous two lines
      AscendingIsFinite(s.tail);
    }
    */
  }

  lemma {:induction false} AscendingIsFinite'(k: ORDINAL, s: Stream<A>)
    requires (s == Nil || Acc#[k](s.head)) && Ascending(s)
    ensures IsFinite(s)
  {
    if k.Offset != 0 {
      if s == Nil {
      } else if s.tail == Nil {
        AscendingIsFinite'(k - 1, s.tail);
      } else {
        assert lt(s.head, s.tail.head) && Ascending(s.tail); // by Ascending(s)
        assert forall y :: lt(s.head, y) ==> Acc#[k - 1](y); // by Acc(s.head)
        assert Acc#[k - 1](s.tail.head); // by the previous two lines
        AscendingIsFinite'(k - 1, s.tail);
      }
    } else {
      forall k' | k' < k && (s == Nil || Acc#[k'](s.head)) && Ascending(s) {
        AscendingIsFinite'(k', s);
      }
    }
  }

  least predicate FiniteAndAscending(s: Stream<A>) {
    match s
    case Nil => true
    case Cons(x, Nil) => true
    case Cons(x, Cons(y, _)) => lt(x, y) && FiniteAndAscending(s.tail)
  }

  // ------------------------------------------------------------------------------

  /* "F" is a monotonic function on A. */
  function F(x: A): A

  lemma {:axiom} FMonotonic(x: A, y: A)
	  requires le(x, y)
  	ensures le(F(x), F(y))

  predicate IsFixpoint(x: A) {
    x == F(x)
  }

  // ------------------------------------------------------------------------------

  /* Function "Iterates" returns the stream
   *   x, F(x), F^2(x), F^3(x), ...
   * until, if ever, a fix-point of F is reached.
   * The self-call of Iterates is a co-recursive call, so there's no obligation to
   * prove termination--this allows the result of the function to be an infinite stream.
   */

  function Iterates(x: A): Stream<A> {
    if x == F(x) then
      Cons(x, Nil)
    else
      Cons(x, Iterates(F(x)))
  }

  /* If there's a finite number of iterates, then the last iterate is a fix-point. */

  least lemma LastIterateIsFixpoint(x: A)
    requires IsFinite(Iterates(x))
    ensures IsFixpoint(Last(Iterates(x)))
  {
    if Iterates(x).tail != Nil {
      LastIterateIsFixpoint(F(x));
    }
  }

  lemma LastIterateIsFixpointRecursive(x: A)
    requires IsFinite(Iterates(x))
    ensures IsFixpoint(Last(Iterates(x)))
  {
    var k :| IsFinite#[k](Iterates(x));
    LastIterateIsFixpointRecursive'(k, x);
  }
  lemma LastIterateIsFixpointRecursive'(k: ORDINAL, x: A)
    requires IsFinite#[k](Iterates(x))
    ensures IsFixpoint(Last(Iterates(x)))
  {
    if Iterates(x).tail != Nil {
      if k.Offset != 0 {
        LastIterateIsFixpointRecursive'(k - 1, F(x));
      } else {
        var k' :| k' < k && IsFinite#[k'](Iterates(x));
        LastIterateIsFixpointRecursive'(k', x);
      }
    }
  }

  lemma LastIterateIsFixpointIterative(x: A)
    requires IsFinite(Iterates(x))
    ensures IsFixpoint(Last(Iterates(x)))
  {
    var s := Iterates(x);
    var k :| IsFinite#[k](s);
    while s.tail != Nil
      invariant IsFinite#[k](s)
      invariant s != Nil && s == Iterates(s.head)
      invariant Last(Iterates(x)) == Last(s)
      decreases k
    {
      if k.Offset != 0 {
        s, k := s.tail, k - 1;
      } else {
        var k' :| k' < k && IsFinite#[k'](s);
        k := k';
      }
    }
  }

  /* If x and its F-successor (that is, F(x)) are ordered by "le", then the entire
   * stream generated by "Iterates" is ascending.
   */

  greatest lemma IteratesAreAscending(x: A)
    requires le(x, F(x))
    ensures Ascending(Iterates(x))
  {
    if x != F(x) {
      /*
      FMonotonic(x, F(x));
      IteratesAreAscending(F(x));
       */
      calc {
        le(x, F(x));
      ==> { FMonotonic(x, F(x)); }
        le(x, F(x)) && le(F(x), F(F(x)));
      ==> { IteratesAreAscending(F(x)); }
        le(x, F(x)) && Ascending(Iterates(F(x)));
      ==> // def. Ascending
        Ascending#[_k](Iterates(x));
      }
    }
  }

  /* Since any ascending chain is finite, the iterates from x are finite, provided
   * le(x, F(x)) and provided the ascending chains from x are finite.
   */

  lemma IteratesAreFinite(x: A)
    requires Acc(x) && le(x, F(x))
    ensures IsFinite(Iterates(x))
  {
    IteratesAreAscending(x);
    AscendingIsFinite(Iterates(x));
  }

  /* Now, we have the ingredients for computing the least fix-point. */

  function LFP(): A {
    AboutIteratesOfBot();
    Last(Iterates(bot))
  }

  lemma AboutIteratesOfBot()
    ensures IsFinite(Iterates(bot))
  {
    BotAcc();
    BotSmallest(F(bot));
    IteratesAreFinite(bot);
  }

  lemma LFPIsLeastFixpoint()
    ensures var lfp := LFP();
      IsFixpoint(lfp) &&
      forall y :: IsFixpoint(y) ==> le(lfp, y)
  {
    var lfp := LFP();
    AboutIteratesOfBot();

    assert IsFixpoint(lfp) by {
      LastIterateIsFixpoint(bot);
    }

    forall y | IsFixpoint(y)
      ensures le(lfp, y)
    {
      /*
      BotSmallest(y);
      IteratesDon'tSkipAnyFixpoint(bot, y);
      */

      BotSmallest(y);
      var ii := Iterates(bot);
      while ii.tail != Nil
        invariant ii != Nil && ii == Iterates(ii.head)
        invariant IsFinite(ii)
        invariant le(ii.head, y)
        invariant lfp == Last(ii)
        decreases Length(ii)
      {
        AboutLength(ii);
        FMonotonic(ii.head, y);
        ii := ii.tail;
      }
    }
  }

  lemma IteratesDon'tSkipAnyFixpoint(x: A, y: A)
    requires IsFinite(Iterates(x))
    requires le(x, y) && IsFixpoint(y)
    ensures le(Last(Iterates(x)), y)
    decreases Length(Iterates(x))
  {
    if Iterates(x) == Cons(x, Nil) {
      // we're done
    } else {
      AboutLength(Iterates(x));
      FMonotonic(x, y);
      IteratesDon'tSkipAnyFixpoint(F(x), y);
    }
  }

  /* Function LFP() above compiles and computes the least fix-point. It does so by
   * computing the (finite) stream Iterates(bot) and then finding the last element of
   * that stream. At run time, the stream generated by Iterates is evaluated lazily
   * (because its self-call is co-recursive). Therefore, LFP() does not need to store
   * the entire stream of iterates. However, it is still inefficient that LFP() places
   * each iterate into a Cons node.
   *
   * Function FindLeastFixpoint() removes that inefficiency by computing the least fix-point without
   * ever using a stream. The self-call in FindFixpoint is tail recursive, so it will be
   * compiled into a loop.
   */

  function FindFixpoint(x: A): A
    requires IsFinite(Iterates(x))
    decreases Length(Iterates(x))
  {
    var y := F(x);
    if x == y then
      x
    else
      AboutLength(Iterates(x));
      FindFixpoint(y)
  }

  lemma FindFixpointFollowsIterates(x: A)
    requires IsFinite(Iterates(x))
    ensures FindFixpoint(x) == Last(Iterates(x))
    decreases Length(Iterates(x))
  {
    if Iterates(x).tail != Nil {
      AboutLength(Iterates(x));
      FindFixpointFollowsIterates(F(x));
    }
  }

  function FindLeastFixpoint(): (lfp: A)
    ensures IsFixpoint(lfp)
    ensures forall y :: IsFixpoint(y) ==> le(lfp, y)
  {
    AboutIteratesOfBot();
    FindFixpointFollowsIterates(bot);
    LFPIsLeastFixpoint();
    FindFixpoint(bot)
  }
}

// Module StreamsNat is like module Streams, except that it defines IsFinite
// as indexed by nat, not ORDINAL. Inside the module, the only difference is
// that ReduceK is not needed and ReduceK(k, s) is replaced by k - 1.
module {:options "/functionSyntax:4"} StreamsNat {
  export
    reveals Stream, IsFinite
    reveals Last
    provides Length, AboutLength

  codatatype Stream<X> = Nil | Cons(head: X, tail: Stream<X>)

  least predicate IsFinite[nat](s: Stream) {
    s == Nil || IsFinite(s.tail)
  }

  function Length(s: Stream): nat
    requires IsFinite(s)
  {
    ghost var k := PickK(s);
    Length'(k, s)
  }

  ghost function PickK(s: Stream): nat
    requires IsFinite(s)
  {
    var k :| IsFinite#[k](s); k
  }

  function Length'(ghost k: nat, s: Stream): nat
    requires IsFinite#[k](s)
  {
    if s == Nil then
      0
    else
      1 + Length'(k - 1, s.tail)
  }

  lemma Length'AnyK(k0: nat, k1: nat, s: Stream)
    requires IsFinite#[k0](s) && IsFinite#[k1](s)
    ensures Length'(k0, s) == Length'(k1, s)
  {
  }

  lemma AboutLength(s: Stream)
    requires s != Nil && IsFinite(s)
    ensures Length(s) == 1 + Length(s.tail)
  {
    calc {
      Length(s);
    ==  // def. Length
      Length'(PickK(s), s);
    ==  // def. Length'
      1 + Length'(PickK(s) - 1, s.tail);
    ==  { Length'AnyK(PickK(s) - 1, PickK(s.tail), s.tail); }
      1 + Length'(PickK(s.tail), s.tail);
    ==  // def. Length
      1 + Length(s.tail);
    }
  }

  function Last<X>(s: Stream<X>): X
    requires s != Nil && IsFinite(s)
    decreases Length(s)
  {
    match s
    case Cons(x, Nil) =>
      x
    case _ =>
      AboutLength(s);
      Last(s.tail)
  }
}
