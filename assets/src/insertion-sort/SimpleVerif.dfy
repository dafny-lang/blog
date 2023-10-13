
module M1 {

  method SelectionSort(a: array<int>)
    modifies a
  {
    for i := 0 to a.Length
    {
      var minValue := a[i];
      var minPos := i;
      for j := i + 1 to a.Length
        invariant minPos < a.Length
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

