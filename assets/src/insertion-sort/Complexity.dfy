
module M0 {

  trait {:termination false} Comparable<T(==)> {

    function Lt(x: T, y: T): bool

  }

  trait {:termination false} Sorted<T(==)> extends Comparable<T> {

    ghost predicate Ordered(a: array<T>, left: nat, right: nat)
      reads a
      requires left <= right <= a.Length
    {
      forall i: nat :: 0 < left <= i < right ==> Lt(a[i-1],a[i]) || a[i-1] == a[i]
    }

    twostate predicate Preserved(a: array<T>, left: nat, right: nat)
      reads a
      requires left <= right <= a.Length
    {
      multiset(a[left..right]) == multiset(old(a[left..right]))
    }

    twostate predicate Sorted(a: array<T>)
      reads a
    {
      Ordered(a,0,a.Length) && Preserved(a,0,a.Length)
    }

  }

}

module M1 {

  import opened M0

  trait {:termination false} Measurable<T(==)> extends Comparable<T> {

    ghost var comparisonCount: nat

    method Ltm(x: T, y: T) returns (b: bool)
      modifies this`comparisonCount
      ensures b ==> Lt(x,y)
      ensures comparisonCount == old(comparisonCount) + 1
    {
      comparisonCount := comparisonCount + 1;
      b := Lt(x,y);
    }

  }

}

module M2 {

  ghost function Sum(x: int): nat
  {
    if x <= 0 then 0 else x + Sum(x-1)
  }

}

module M3 {

  import opened M0
  import opened M1
  import opened M2

  trait {:termination false} InsertionSort<T(==)> extends Comparable<T>, Measurable<T>, Sorted<T> {

    method InsertionSort(a: array<T>)
      modifies a, this
      requires comparisonCount == 0
      ensures Sorted(a)
      ensures comparisonCount <= a.Length * a.Length
    {

      for i := 0 to a.Length
        invariant Ordered(a,0,i)
        invariant Preserved(a,0,a.Length)
        invariant comparisonCount == i * a.Length - Sum(i)
      {
        var minValue := a[i];
        var minPos := i;
        assert comparisonCount == i * a.Length - Sum(i) + (i + 1 - i) - 1;
        for j := i + 1 to a.Length
          invariant minPos < a.Length
          invariant a[minPos] == minValue
          invariant Preserved(a,0,a.Length)
          invariant comparisonCount == i * a.Length - Sum(i) + (j - i) - 1
        {
          label L:
          var cmp := Ltm(a[j], minValue);
          assert a[..] == old@L(a[..]);
          if cmp {
            minValue := a[j];
            minPos := j;
          }
          assert(i * a.Length - Sum(i) + (j - i) - 1) + 1 == i * a.Length - Sum(i) + ((j + 1) - i) - 1;
        }
        if i != minPos {
          a[i], a[minPos] := minValue, a[i];
        }
        assert comparisonCount == (i+1) * a.Length - Sum(i+1);
      }
    }

  }

}

module M4 {

  import opened M0
  import opened M1
  import opened M3

  class Sort<T(==)> extends InsertionSort<T> {

    const CMP: (T,T) -> bool

    constructor(cmp: (T,T) -> bool)
      ensures CMP == cmp
      ensures comparisonCount == 0
    {
      CMP := cmp;
      comparisonCount := 0;
    }

    function Lt(x: T, y: T): bool {
      CMP(x,y)
    }

  }

}

module M5 {

  import opened M0
  import opened M1
  import opened M3
  import opened M4

  method Main()
  {
    var a: array<int> := new int[3];
    a[0] := 2; a[1] := 4; a[2] := 1;
    var Sort := new Sort((x: int, y: int) => x < y);
    Sort.InsertionSort(a);
    print a[..];
  }

}

