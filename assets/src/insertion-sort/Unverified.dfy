
module M1 {

  method {:verify false} InsertionSort(a: array<int>)
  {
    for i := 0 to a.Length
    {
      var minValue := a[i];
      var minPos := i;
      for j := i + 1 to a.Length
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

module M2 {

  import opened M1

  method Main()
  {
    var a: array<int> := new int[3];
    a[0] := 2; a[1] := 4; a[2] := 1;
    InsertionSort(a);
    print a[..];
  }

}