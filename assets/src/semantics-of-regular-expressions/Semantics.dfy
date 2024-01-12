include "Expressions.dfy"
include "Languages.dfy"

module Semantics0 {
  import opened Languages0
  import opened Languages1
  import opened Languages2
  import opened Expressions0

  function Denotational<A(==)>(e: Exp): Lang {
    match e
    case Zero => Languages1.Zero()
    case One => Languages2.One()
    case Char(a) => Languages2.Singleton(a)
    case Plus(e1, e2) => Languages2.Plus(Denotational(e1), Denotational(e2))
    case Comp(e1, e2) => Languages2.Comp(Denotational(e1), Denotational(e2))
    case Star(e1) => Languages2.Star(Denotational(e1))
  }
}

module Semantics1 {
  import opened Languages0
  import opened Languages3
  import opened Expressions0

  ghost predicate IsAlgebraHomomorphism<A(!new)>(f: Exp -> Lang) {
    forall e :: IsAlgebraHomomorphismPointwise(f, e)
  }

  ghost predicate IsAlgebraHomomorphismPointwise<A(!new)>(f: Exp -> Lang, e: Exp) {
    Bisimilar<A>(
      f(e),
      match e
      case Zero => Languages1.Zero()
      case One => Languages2.One()
      case Char(a) => Languages2.Singleton(a)
      case Plus(e1, e2) => Languages2.Plus(f(e1), f(e2))
      case Comp(e1, e2) => Languages2.Comp(f(e1), f(e2))
      case Star(e1) => Languages2.Star(f(e1))
    )
  }
}

module Semantics2 {
  import opened Semantics0
  import opened Semantics1
  import opened Languages4

  lemma DenotationalIsAlgebraHomomorphism<A(!new)>()
    ensures IsAlgebraHomomorphism<A>(Denotational)
  {
    forall e
      ensures IsAlgebraHomomorphismPointwise<A>(Denotational, e)
    {
      BisimilarityIsReflexive<A>(Denotational(e));
    }
  }
}

module Semantics3 {
  import opened Expressions0
  import opened Expressions1
  import opened Languages0

  function Operational<A(==)>(e: Exp): Lang {
    Alpha(Eps(e), (a: A) => Operational(Delta(e)(a)))
  }
}

module Semantics4 {
  import opened Expressions0
  import opened Expressions1
  import opened Languages0
  import opened Languages3

  ghost predicate IsCoalgebraHomomorphism<A(!new)>(f: Exp -> Lang) {
    && (forall e :: f(e).eps == Eps(e))
    && (forall e, a :: Bisimilar(f(e).delta(a), f(Delta(e)(a))))
  }
}

module Semantics5 {
  import opened Semantics3
  import opened Semantics4
  import opened Languages3
  import opened Languages4
  import opened Expressions1

  lemma OperationalIsCoalgebraHomomorphism<A(!new)>()
    ensures IsCoalgebraHomomorphism<A>(Operational)
  {
    forall e, a
      ensures Bisimilar<A>(Operational(e).delta(a), Operational(Delta(e)(a)))
    {
      BisimilarityIsReflexive(Operational(e).delta(a));
    }
  }
}

module Semantics6 {
  import opened Semantics0
  import opened Semantics1
  import opened Semantics2
  import opened Semantics3
  import opened Semantics4

  lemma DenotationalIsCoalgebraHomomorphism<A(!new)>()
    ensures IsCoalgebraHomomorphism<A>(Denotational)
}

module Semantics6WithProof refines Semantics6 {
  import opened Expressions0
  import opened Expressions1
  import opened Languages0
  import opened Languages3
  import opened Languages4
  import opened Languages5

  lemma DenotationalIsCoalgebraHomomorphism<A(!new)>()
    ensures IsCoalgebraHomomorphism<A>(Denotational)
  {
    forall e
      ensures Denotational<A>(e).eps == Eps(e)
    {
      DenotationalIsCoalgebraHomomorphismHelper1(e);
    }
    forall e, a
      ensures Bisimilar(Denotational<A>(e).delta(a), Denotational<A>(Delta(e)(a)))
    {
      DenotationalIsCoalgebraHomomorphismHelper2(e, a);
    }
  }

  lemma DenotationalIsCoalgebraHomomorphismHelper1<A>(e: Exp)
    ensures Denotational<A>(e).eps == Eps(e)
  {
    match e
    case Zero =>
    case One =>
    case Char(a) =>
    case Plus(e1, e2) =>
      DenotationalIsCoalgebraHomomorphismHelper1(e1);
      DenotationalIsCoalgebraHomomorphismHelper1(e2);
    case Comp(e1, e2) =>
      DenotationalIsCoalgebraHomomorphismHelper1(e1);
      DenotationalIsCoalgebraHomomorphismHelper1(e2);
    case Star(e1) =>
      DenotationalIsCoalgebraHomomorphismHelper1(e1);
  }

  lemma DenotationalIsCoalgebraHomomorphismHelper2<A(!new)>(e: Exp, a: A)
    ensures Bisimilar(Denotational<A>(e).delta(a), Denotational<A>(Delta(e)(a)))
  {
    match e
    case Zero => BisimilarityIsReflexive<A>(Languages1.Zero());
    case One => BisimilarityIsReflexive<A>(Languages2.One());
    case Char(b) =>
      if a == b {
        BisimilarityIsReflexive<A>(Languages2.One());
      } else {
        BisimilarityIsReflexive<A>(Languages1.Zero());
      }
    case Plus(e1, e2) =>
      DenotationalIsCoalgebraHomomorphismHelper2(e1, a);
      DenotationalIsCoalgebraHomomorphismHelper2(e2, a);
      PlusCongruence(Denotational(e1).delta(a), Denotational(Delta(e1)(a)), Denotational(e2).delta(a), Denotational(Delta(e2)(a)));
    case Comp(e1, e2) =>
      DenotationalIsCoalgebraHomomorphismHelper1(e1);
      DenotationalIsCoalgebraHomomorphismHelper2(e1, a);
      DenotationalIsCoalgebraHomomorphismHelper2(e2, a);
      BisimilarityIsReflexive<A>(Denotational(e2));
      BisimilarityIsReflexive<A>(if Eps(e1) then Languages2.One() else Languages1.Zero());
      CompCongruence(
        Denotational(e1).delta(a),
        Denotational(Delta(e1)(a)),
        Denotational(e2),
        Denotational(e2)
      );
      CompCongruence(
        if Eps(e1) then Languages2.One() else Languages1.Zero(),
        if Eps(e1) then Languages2.One() else Languages1.Zero(),
        Denotational(e2).delta(a),
        Denotational(Delta(e2)(a))
      );
      PlusCongruence(
        Languages2.Comp(Denotational(e1).delta(a), Denotational(e2)),
        Languages2.Comp(Denotational(Delta(e1)(a)), Denotational(e2)),
        Languages2.Comp(if Eps(e1) then Languages2.One() else Languages1.Zero(), Denotational(e2).delta(a)),
        Languages2.Comp(if Eps(e1) then Languages2.One() else Languages1.Zero(), Denotational(Delta(e2)(a)))
      );
    case Star(e1) =>
      DenotationalIsCoalgebraHomomorphismHelper2(e1, a);
      BisimilarityIsReflexive(Languages2.Star(Denotational(e1)));
      CompCongruence(Denotational(e1).delta(a), Denotational(Delta(e1)(a)), Languages2.Star(Denotational(e1)), Languages2.Star(Denotational(e1)));
  }
}

module Semantics7 {
  import opened Expressions0
  import opened Languages0
  import opened Languages3
  import opened Semantics4

  lemma UniqueCoalgebraHomomorphism<A(!new)>(f: Exp -> Lang, g: Exp -> Lang, e: Exp)
    requires IsCoalgebraHomomorphism(f)
    requires IsCoalgebraHomomorphism(g)
    ensures Bisimilar(f(e), g(e))
}

module Semantics7WithProof refines Semantics7 {
  import opened Languages4
  import opened Semantics8

  lemma UniqueCoalgebraHomomorphism<A(!new)>(f: Exp<A> -> Lang<A>, g: Exp<A> -> Lang<A>, e: Exp<A>)
    ensures Bisimilar(f(e), g(e))
  {
    BisimilarityIsReflexive(f(e));
    BisimilarityIsReflexive(g(e));
    UniqueCoalgebraHomomorphismHelper(f, g, f(e), g(e));
  }

  lemma UniqueCoalgebraHomomorphismHelper<A(!new)>(f: Exp -> Lang, g: Exp -> Lang, L1: Lang, L2: Lang)
    requires IsCoalgebraHomomorphism(f)
    requires IsCoalgebraHomomorphism(g)
    requires exists e :: Bisimilar(L1, f(e)) && Bisimilar(L2, g(e))
    ensures Bisimilar(L1, L2)
  {
    forall k: nat
      ensures Bisimilar#[k](L1, L2)
    {
      if k != 0 {
        UniqueCoalgebraHomomorphismHelperPointwise(k, f, g, L1, L2);
      }
    }
  }
}

module Semantics8 {
  import opened Expressions0
  import opened Expressions1
  import opened Languages0
  import opened Languages3
  import opened Semantics4

  lemma UniqueCoalgebraHomomorphismHelperPointwise<A(!new)>(k: nat, f: Exp -> Lang, g: Exp -> Lang, L1: Lang, L2: Lang)
    requires IsCoalgebraHomomorphism(f)
    requires IsCoalgebraHomomorphism(g)
    requires exists e :: Bisimilar#[k](L1, f(e)) && Bisimilar#[k](L2, g(e))
    ensures Bisimilar#[k](L1, L2)
  {
    var e :| Bisimilar#[k](L1, f(e)) && Bisimilar#[k](L2, g(e));
    if k != 0 {
      forall a
        ensures Bisimilar#[k-1](L1.delta(a), L2.delta(a))
      {
        BisimilarityIsTransitivePointwise(k-1, L1.delta(a),  f(e).delta(a), f(Delta(e)(a)));
        BisimilarityIsTransitivePointwise(k-1, L2.delta(a),  g(e).delta(a), g(Delta(e)(a)));
        UniqueCoalgebraHomomorphismHelperPointwise(k-1, f, g, L1.delta(a), L2.delta(a));
      }
    }
  }

  lemma BisimilarityIsTransitivePointwise<A(!new)>(k: nat, L1: Lang, L2: Lang, L3: Lang)
    ensures Bisimilar#[k](L1, L2) && Bisimilar#[k](L2, L3) ==> Bisimilar#[k](L1, L3)
  {
    if k != 0 {
      if Bisimilar#[k](L1, L2) && Bisimilar#[k](L2, L3) {
        assert Bisimilar#[k](L1, L3) by {
          forall a
            ensures Bisimilar#[k-1](L1.delta(a), L3.delta(a))
          {
            BisimilarityIsTransitivePointwise(k-1, L1.delta(a), L2.delta(a), L3.delta(a));
          }
        }
      }
    }
  }
}

module Semantics9 {
  import opened Expressions0
  import opened Languages3
  import opened Semantics5
  import opened Semantics0
  import opened Semantics3
  import opened Semantics6WithProof
  import opened Semantics7WithProof

  lemma OperationalAndDenotationalAreBisimilar<A(!new)>(e: Exp)
    ensures Bisimilar<A>(Operational(e), Denotational(e))
  {
    OperationalIsCoalgebraHomomorphism<A>();
    DenotationalIsCoalgebraHomomorphism<A>();
    UniqueCoalgebraHomomorphism<A>(Operational, Denotational, e);
  }
}

module Semantics10 {
  import opened Semantics1
  import opened Semantics3

  lemma OperationalIsAlgebraHomomorphism<A(!new)>()
    ensures IsAlgebraHomomorphism<A>(Operational)
}

module Semantics10WithProof refines Semantics10 {
  import opened Expressions0
  import opened Semantics0
  import opened Semantics2
  import opened Semantics9
  import opened Languages1
  import opened Languages2
  import opened Languages6
  import opened Languages5
  import opened Languages7

  lemma OperationalIsAlgebraHomomorphism<A(!new)>()
    ensures IsAlgebraHomomorphism<A>(Operational)
  {
    forall e
      ensures IsAlgebraHomomorphismPointwise<A>(Operational, e)
    {
      OperationalAndDenotationalAreBisimilar<A>(e);
      assert IsAlgebraHomomorphismPointwise(Denotational, e) by {
        DenotationalIsAlgebraHomomorphism<A>();
      }
      match e
      case Zero =>
        BisimilarityIsTransitive(Operational<A>(Zero), Denotational<A>(Zero), Languages1.Zero());
      case One =>
        BisimilarityIsTransitive(Operational<A>(One), Denotational<A>(One), Languages2.One());
      case Char(a) =>
        BisimilarityIsTransitive(Operational<A>(Char(a)), Denotational<A>(Char(a)), Languages2.Singleton(a));
      case Plus(e1, e2) =>
        BisimilarityIsTransitive(Operational<A>(Plus(e1, e2)), Denotational<A>(Plus(e1, e2)), Languages2.Plus(Denotational(e1), Denotational(e2)));
        OperationalAndDenotationalAreBisimilar(e1);
        BisimilarityIsSymmetric(Denotational(e1), Operational(e1));
        OperationalAndDenotationalAreBisimilar(e2);
        BisimilarityIsSymmetric(Denotational(e2), Operational(e2));
        PlusCongruence<A>(Denotational(e1), Operational(e1), Denotational(e2), Operational(e2));
        BisimilarityIsTransitive(Operational<A>(Plus(e1, e2)), Languages2.Plus(Denotational(e1), Denotational(e2)), Languages2.Plus(Operational(e1), Operational(e2)));
      case Comp(e1, e2) =>
        BisimilarityIsTransitive(Operational<A>(Comp(e1, e2)), Denotational<A>(Comp(e1, e2)), Languages2.Comp(Denotational(e1), Denotational(e2)));
        OperationalAndDenotationalAreBisimilar(e1);
        BisimilarityIsSymmetric(Denotational(e1), Operational(e1));
        OperationalAndDenotationalAreBisimilar(e2);
        BisimilarityIsSymmetric(Denotational(e2), Operational(e2));
        CompCongruence<A>(Denotational(e1), Operational(e1), Denotational(e2), Operational(e2));
        BisimilarityIsTransitive(Operational<A>(Comp(e1, e2)), Languages2.Comp(Denotational(e1), Denotational(e2)), Languages2.Comp(Operational(e1), Operational(e2)));
      case Star(e1) =>
        BisimilarityIsTransitive(Operational<A>(Star(e1)), Denotational<A>(Star(e1)), Languages2.Star(Denotational(e1)));
        OperationalAndDenotationalAreBisimilar(e1);
        BisimilarityIsSymmetric(Denotational(e1), Operational(e1));
        StarCongruence(Denotational(e1), Operational(e1));
        BisimilarityIsTransitive(Operational<A>(Star(e1)), Languages2.Star(Denotational(e1)), Languages2.Star(Operational(e1)));
    }
  }
}