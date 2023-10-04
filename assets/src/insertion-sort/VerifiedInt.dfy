
module M1 {

  ghost predicate Ordered(a: array<int>, left: nat, right: nat)
    reads a
    requires left <= right <= a.Length
  {
    forall i: nat :: 0 < left <= i < right ==> a[i-1] <= a[i]
  }

}

module M2 {

  import opened M1

  twostate predicate Preserved(a: array<int>, left: nat, right: nat)
    reads a
    requires left <= right <= a.Length
  {
    multiset(a[left..right]) == multiset(old(a[left..right]))
  }

}

module M3 {

  import opened M1
  import opened M2

  twostate predicate Sorted(a: array<int>)
    reads a
  {
    Ordered(a,0,a.Length) && Preserved(a,0,a.Length)
  }

}

module M4 {

  import opened M1
  import opened M2
  import opened M3

  method InsertionSort(a: array<int>)
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
        if a[j] < minValue {
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