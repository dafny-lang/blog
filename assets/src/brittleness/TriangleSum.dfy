module A1 {

  ghost function TriangleSum(n: nat): nat

  lemma TriangleSumBase()
    ensures TriangleSum(0) == 0

  lemma TriangleSumRec()
    ensures forall n: nat :: n > 0 ==> TriangleSum(n) == n + TriangleSum(n - 1)

}

module A2 refines A1 {

  lemma Proof1(n: nat)
    ensures TriangleSum(n) == (n * (n + 1)) / 2
  {
    TriangleSumBase();
    TriangleSumRec();
    if n > 0 {
      Proof1(n - 1);
    }
  }

}

module A3 refines A1 {

  lemma Proof2(n: nat)
    ensures TriangleSum(n) == (n * (n + 1)) / 2
  {
    if n == 0 {
      TriangleSumBase();
    } else {
      assert TriangleSum(n) == n + TriangleSum(n - 1) by {
        TriangleSumRec();
      }
      Proof2(n - 1);
    }
  }

}

module A4 refines A1 {

  lemma Proof3(n: nat)
    ensures TriangleSum(n) == (n * (n + 1)) / 2
  {
    TriangleSumBase();
    TriangleSumRec();
    if n == 0 {
    } else {
      assert TriangleSum(n) == n + TriangleSum(n - 1);
      Proof3(n - 1);
    }
  }

}

module A5 refines A1 {

  lemma TriangleSumRecExplicit(n: nat)
    requires n > 0
    ensures TriangleSum(n) == n + TriangleSum(n - 1)

  lemma Proof4(n: nat)
    ensures TriangleSum(n) == (n * (n + 1)) / 2
  {
    if n == 0 {
      TriangleSumBase();
    } else {
      assert TriangleSum(n) == n + TriangleSum(n - 1) by {
        TriangleSumRecExplicit(n);
      }
      Proof4(n - 1);
    }
  }

}
