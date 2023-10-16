module M1 {

  trait {:termination false} Comparable<T(==)> {

    function Lt(x: T, y: T): bool

  }

}

module M2 {

  import opened M1

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

module M3 {

  import opened M1
  import opened M2

  trait {:termination false} SelectionSort<T(==)> extends Comparable<T>, Sorted<T> {

    method SelectionSort(a: array<T>)
      modifies a
      ensures Sorted(a)
    {
      for i := 0 to a.Length
        invariant Ordered(a,0,i)
        invariant Preserved(a,0,a.Length)
      {
        var minValue := a[i];
        var minPos := i;
        for j := i + 1 to a.Length
          invariant minPos < a.Length
          invariant a[minPos] == minValue
        {
          if Lt(a[j], minValue) {
            minValue := a[j];
            minPos := j;
          }
        }
        if i != minPos {
          a[i], a[minPos] := minValue, a[i];
        }
      }
    }

  }

}

module M4 {

  import opened M1
  import opened M2
  import opened M3

  class Sort<T(==)> extends SelectionSort<T> {

    const CMP: (T,T) -> bool

    constructor(cmp: (T,T) -> bool)
      ensures CMP == cmp
    {
      CMP := cmp;
    }

    function Lt(x: T, y: T): bool {
      CMP(x,y)
    }

  }

}

module M5 {

  import opened M1
  import opened M2
  import opened M3
  import opened M4

  method Main()
  {
    var a: array<int> := new int[3];
    a[0] := 2; a[1] := 4; a[2] := 1;
    var Sort := new Sort((x: int, y: int) => x < y);
    Sort.SelectionSort(a);
    print a[..];
  }

}

