#!/usr/bin/perl
$print = 0;
$seen_stack = 0;
while(<>) {
  if(/StackSpecification/) {
    $seen_stack = 1;
  }
  if(/{% highlight dafny %}/) {
    $print = 1;
  } elsif(/{% endhighlight %}/) {
    $print = 0;
  } elsif ($print == 1 && $seen_stack == 1) {
    print;
  }
}
