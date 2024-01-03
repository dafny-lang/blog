#!/bin/sh
print=0
seen_stack=0
IFS=
while read line ; do
  if [[ "$line" =~ "StackSpecification" ]] ; then
    seen_stack=1
  fi

  if [[ "$line" =~ "{% highlight dafny %}" ]] ; then
    print=1
  elif [[ "$line" =~ "{% endhighlight %}" ]] ; then
    print=0
  elif [[ "$print" -eq 1 && "$seen_stack" -eq 1 ]] ; then
    echo "$line"
  fi
done
