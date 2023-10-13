
module M1 {

  method SelectionSort(a: array<int>)
    modifies a
  {
    for i := 0 to a.Length
    {
      ghost var minValue := a[i];
      for j := i + 1 to a.Length
        invariant a[i] == minValue
      {
        if a[j] < minValue {
          minValue := a[j];
        }
        if a[j] < a[i] {
          a[i], a[j] := a[j], a[i];
        }
      }
      assert a[i] == minValue;
    }
  }

}

