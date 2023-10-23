module BinarySearch {
method BinarySearchRedundant(a: array<int>, key: int) returns (r: int)
  requires forall i,j :: 0 <= i < j < a.Length ==> a[i] <= a[j]
{
  var lo, hi := 0, a.Length;
  while lo < hi
    invariant 0 <= lo <= hi <= a.Length
  {
    var mid := (lo + hi) / 2;
    if key < a[mid] {
      hi := mid;
    } else if a[mid] < key {
      lo := mid + 1;
    } else {
      return mid;
    }
  }
  return -1;
}
}
