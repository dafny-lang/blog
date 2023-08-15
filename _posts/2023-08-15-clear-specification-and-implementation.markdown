---
layout: post
title:  "Clear Separation of Specification and Implementation in Dafny"
date:   2023-08-15 00:00:00 +0100
author: Aaron Tomb
categories:
---

# The Problem

Dafny provides a rich collection of features for proving properties
about code. However, sometimes it may seem that common and important
properties are difficult to prove, particularly when those properties
involve the combined behavior of a sequence of methods calls. For
example, consider the follow very simple description of an account.

{% highlight dafny %}
class Account {
    var balance: int

    method Deposit(amount: int)
      modifies this
    {
        balance := balance + amount;
    }
}
{% endhighlight %}

This class has a `balance` (which can potentially be negative), and a
method for making deposits to adjust that balance (which can also cover
withdrawals, by using a negative `amount`). Given this code, it's
natural to want to prove that, for example, depositing `x` followed by
depositing `-x` results in a balance equal to the starting balance.
However, you'll find that this is impossible to prove, with the code as
written.

To make it possible to prove that property, it may be tempting to add an
ensures clause that `balance == old(balance) + amount`. With that in
place, you can write the following code, which verifies.

{% highlight dafny %}
method TwoOppositeDepositsCancelOut(account: Account, amount: int)
  modifies account
{
    account.Deposit(amount);
    account.Deposit(-amount);
    assert account.balance == old(account.balance);
}
{% endhighlight %}

However, this is a method rather than a lemma (because lemmas aren't
allowed to call methods), and even if it were a lemma, it would be
impossible to state the desired fact as a postcondition so that it could
be used to prove a higher-level property of a larger system. For
example, you might want to use the fact proven above to show that a
large sequence of equal positive and negative deposits would leave the
account balance unchanged. Even though that property is clearly a
repeated application of the property proved in the method above, there's
no way to reuse that proof.

You might argue that you don't need to prove this in a lemma, because
you can re-prove the equivalent property wherever the `Deposit` method
is used in practice. However, for a more complex method, the `ensures`
clauses needed to make it possible to prove anything you might want
about a sequence of method calls would quickly get out of hand.

One approach to solving this problem is to maintain a clear separation
between the _specification_ and _implementation_ of your program, prove
properties of the specification, and prove only equivalence (or
refinement) between the specification and the implementation.

# Specifications and implementations

To get started, let's go over the tools Dafny provides. The two most
common computational descriptions in Dafny are terminating,
deterministic functions and imperative, stateful methods.

By writing a `function`, you can describe a mathematical object that
maps each input deterministically to a single output. Functions are
typically concise, and they tend to be the most straightforward to
reason about, so they're ideal for specifying what a program should do
in the abstract. The bodies of functions are made directly available to
the verifier by default, unless a function is declared with the `opaque`
keyword. Functions can also be compiled to executable programs when the
are computable, though sometimes inefficient programs.

By writing a `method`, you can describe an imperative computation that
performs a sequence of steps to yield an output state or a set of output
states from each initial program state. Methods more closely match the
operations performed by actual computing hardware, and are capable of
describing non-deterministic or non-terminating computations. They are
also generally meant to be compiled to executable programs. This makes
them ideal for describing how a computation should be performed during
actual execution. However, reasoning about methods is somewhat different
than reasoning about functions. You can prove that a method agrees with
a single contract, written as `requires`, `ensures`, `modifies`, and
`decreases` clauses, but you generally do not expand the body of a
method as part of performing a separate proof.^[It is sometimes possible
to expand the body of a method during proof. A future blog post will
describe the process.]

The differences between functions and methods come into play
particularly starkly when developing programs that have either or both
of the following attributes:

* The most natural specification of an API involves describing the
_relationship_ between the available operations, rather than
individual descriptions of each operation in isolation.

* There's more than one way to implement a particular bit of
functionality and, due to the tradeoffs between the available
approaches, you don't want to choose just one. Perhaps you'll use
one in some circumstances and another in other circumstances.

In this situation, it is particularly valuable to clearly
distinguish between the specification and implementation of a
program, and to restrict proofs about the implementation to those
that guarantee agreement with the specification, performing all
other reasoning on the specification. The rest of this post will
explore a simple library that has both of the attributes listed
above: a specification and implementation of the well-known stack
data type.

The (arguably) most concise and natural specification of a stack
comes from a description of a relationship between the push and pop
operations. Namely, if you push an item onto a stack, and then pop
an item off of the resulting stack, you should get back the item you
originally pushed. Similarly, the value of the stack itself after
these two operations should be unchanged: when you add something to
the top and immediately remove it, the rest of the stack stays the
same.

On the implementation side, there are multiple ways to build a
stack. Common implementation techniques include custom linked lists,
consecutive arrays (reallocated when full), and the re-use of
built-in data types with appropriate properties, such as sequences
or vectors. Perhaps you wouldn't use more than one of these in a
given application, but we can still look at how to straightforwardly
show that multiple implementations, using different techniques, all
fit the same notion of what it means to be a stack.

# Specifying a stack

To start with, let's specify what it means to be a stack in the
following module.

{% highlight dafny %}
module StackSpecification {
{% endhighlight %}

Most clients, including clients of implementations, get no details.
This means that _all_ they know about stacks is what the two lemmas
describe.

{% highlight dafny %}
  export
    provides StackModel, PushModel, PopModel, EmptyModel, IsEmptyModel
    provides PushPopVal, PushPopStack
{% endhighlight %}

Implementation modules can access the definition of the model
operations, to allow proofs of equivalence, by importing the `Private`
export set.

{% highlight dafny %}
  export Private
    reveals StackModel, PushModel, PopModel, EmptyModel, IsEmptyModel
    provides PushPopVal, PushPopStack
{% endhighlight %}

We provide a concrete type to model a stack for simplicity of proof,
since Dafny knows how to prove things about sequences. Note, however,
that most clients don't get to see what this type is.

{% highlight dafny %}
  type StackModel<T> = seq<T>
{% endhighlight %}

To check to see whether a stack is empty, check that the length of the
model sequence is 0.

{% highlight dafny %}
  ghost function IsEmptyModel<T>(stk: StackModel<T>) : bool
  {
    |stk| == 0
  }
{% endhighlight %}

To construct an empty stack, construct an empty sequence. This is always
empty.

{% highlight dafny %}
  ghost function EmptyModel<T>() : StackModel<T>
    ensures(IsEmptyModel(EmptyModel<T>()))
  {
    []
  }
{% endhighlight %}

To push an item onto the stack, append it to the model sequence. It will
always be non-empty as a result.

{% highlight dafny %}
  ghost function PushModel<T>(stk: StackModel<T>, val : T) : StackModel<T>
    ensures !IsEmptyModel(PushModel(stk, val))
  {
    [val] + stk
  }
{% endhighlight %}

To pop an item from a non-empty stack, return both the first element of
the sequence and the rest of the sequence.

{% highlight dafny %}
  ghost function PopModel<T>(stk: StackModel<T>) : (T, StackModel<T>)
    requires !IsEmptyModel(stk)
  {
    (stk[0], stk[1..])
  }
{% endhighlight %}

The first core property of stacks is that pushing and then popping
yields the pushed value.

{% highlight dafny %}
  lemma PushPopVal<T>(stk: StackModel<T>, val : T)
    ensures PopModel(PushModel(stk, val)).0 == val {}
{% endhighlight %}

The second core property of stacks is that pushing and then popping
yields the original stack.

{% highlight dafny %}
  lemma PushPopStack<T>(stk: StackModel<T>, val : T)
    ensures PopModel(PushModel(stk, val)).1 == stk {}
}
{% endhighlight %}

Several things are important about this specification. First, it
provides a number of functions with bodies that describe one way of
constructing a stack out of built-in primitives. Second, it hides
the bodies of those functions from most clients, except
implementation modules that need to prove equivalence with them.
And, third, it describes the _relationship_ between those operations
in a couple of lemmas.

One further note: you'll see that some of the operations on a stack
have pre- and post-conditions, specified on the functions themselves
rather than in lemmas. These are exactly the properties required to
ensure that each operation is well-defined without specifying
anything else about behavior. Besides well-definedness, all
functional properties are specified in lemmas. This is sometimes
known as the "extrinsic" approach to specification, in contrast to
the "intrinsic" approach of specifying all behavior in pre- and
post-conditions.

# Implementing an array-based stack

Now let's look at how a common implementation of this data type
might be structured. This approach uses a consecutive array to store
elements, which we look at first because it's somewhat simpler than
the linked-list implementation we'll consider next.

Before digging into the implementation, there's one subtlety we need
to discuss. The array-based approach sometimes requires allocating
more space than is currently used, making it necessary to have a
value available to fill unused entries. Many Dafny types have
default values that can be used for this purpose, but not all types
do. It is possible to constrain type parameters to those that do
have default values by, for instance, using the declaration `class
Stack<T(0)>`, to insist that `T` have type characteristic `0`, the
notation for having a default value.

However, doing this would make the array-based stack have different
constraints on its type parameter than other stack implementations,
which isn't ideal. An alternative is to make use of the fact that Dafny
can define datatypes with ghost alternatives, and that datatypes with
only one non-ghost alternative with only one argument have no runtime
overhead. Therefore, the array-based stack implementation uses an
(internal) datatype called `GhostOption` that makes it possible for
`Stack` to be parameterized by an arbitrary type because the
`GhostOption` type always has a default value.

{% highlight dafny %}
module ArrayStackImplementation {
  import opened StackSpecification`Private

  datatype GhostOption<T> = ghost None | Some(value: T)

  class Stack<T> {
{% endhighlight %}

The elements of the are stored in an array, using `GhostOption` to allow
uninitialized values.

{% highlight dafny %}
    var elts : array<GhostOption<T>>
{% endhighlight %}

We need a separate size tracker to know how much of the array is being
used, because the size of `elts` itself will always be a power of two,
and some entries will usually be unused.

{% highlight dafny %}
    var size : nat
{% endhighlight %}

A ghost variable keeps track of the correspondence between the concrete
storage in the array and the model used by the specification. This could
also be used as a (slightly less efficient) implementation, as is done
in a later example. As a ghost variable, it has no impact on
performance.

{% highlight dafny %}
    ghost var model : StackModel<T>
{% endhighlight %}

A stack agrees with its model if `size` matches the size of the model,
the array has at least that much room, and all of the elements within
the size of the model match the model. Note, however, that the model
prepends to the beginning and the array adds at the end! Finally, the
array always needs to have _room_ for some elements, even if they're all
unused.

{% highlight dafny %}
    ghost predicate ValidModel()
      reads this, elts
    {
      && elts.Length > 0
      && elts.Length >= |model|
      && size == |model|
      && forall i :: 0 <= i < |model| ==>
           elts[i] == Some(model[size - (i + 1)])
    }
{% endhighlight %}

An initial stack has room for a few elements (the exact number was
chosen arbitrarily) but none of them are used. It is empty and valid.

{% highlight dafny %}
    constructor InitStack()
      ensures ValidModel()
      ensures IsEmpty()
    {
      elts := new GhostOption<T>[4];
      size := 0;
      model := EmptyModel();
    }
{% endhighlight %}

To push an element on the stack, write to the first unused element of
the array and increment the size. If there's not room, however, it's
necessary to allocate a new array and copy the old elements over. Like
all operations except `InitStack`, it requires a valid model. Like all
operations that modify the stack, it ensures a valid model.

{% highlight dafny %}
    method Push(val : T)
      requires ValidModel()
      modifies this, elts
      ensures old(size) >= old(elts.Length) ==> fresh(elts)
      ensures ValidModel()
      ensures !IsEmpty()
      ensures model == PushModel(old(model), val)
    {
      if size >= elts.Length {
        var newElts : array<GhostOption<T>> := new [elts.Length * 2];
        for i := 0 to size
          modifies newElts
          invariant forall j :: 0 <= j < i ==>
            newElts[j] == Some(model[size - (j + 1)])
        {
          newElts[i] := elts[i];
        }
        elts := newElts;
      }
      model := PushModel(model, val);
      elts[size] := Some(val);
      size := size + 1;
    }
{% endhighlight %}

To pop an element, return the last used element of the array and
decrement the size. Ensures that both the return value and the internal
changes match the stack specification.

{% highlight dafny %}
    method Pop() returns (result : T)
      requires ValidModel()
      requires !IsEmpty()
      modifies this
      ensures ValidModel()
      ensures model == PopModel(old(model)).1
      ensures result == PopModel(old(model)).0
    {
      model := PopModel(model).1;
      size := size - 1;
      result := elts[size].value;
    }
{% endhighlight %}

The size variable alone is sufficient to tell us whether the stack is
empty very efficiently.

{% highlight dafny %}
    predicate IsEmpty()
      reads this, elts
      requires ValidModel()
      ensures IsEmpty() <==> IsEmptyModel(model)
    {
      size == 0
    }
  }
}
{% endhighlight %}

# Implementing a stack with a linked list

The previous implementation could allocate more space than necessary,
about twice as much in the worst case, and may be hard to extend to
support other operations. An alternative is to use a linked data
structure to store the stack. This approach involves dramatically
different implementation code, but we can guarantee that it satisfies
exactly the same functional specification as the array-based code above.

{% highlight dafny %}
module LinkedStackImplementation {
  import opened StackSpecification`Private

  class Stack<T> {
{% endhighlight %}

The actual content of the stack is stored in a linked sequence of Node
objects, defined below.

{% highlight dafny %}
    var top : Node?<T>
{% endhighlight %}

The model is exactly the same as for the array-based implementation.

{% highlight dafny %}
    ghost var model : StackModel<T>
{% endhighlight %}

The footprint keeps track of all objects reachable from this object.
This is used to prove termination.

{% highlight dafny %}
    ghost var footprint : set<object>
{% endhighlight %}

Validity is a bit more complex, as it needs to recursively traverse the
list and use the associated footprint to ensure termination.

{% highlight dafny %}
    ghost predicate ValidModel()
      reads this, top, footprint
    {
      this in footprint &&
      model == NodeModel(top) &&
      (top != null ==>
        top in footprint &&
        this !in top.footprint &&
        top.footprint <= footprint &&
        top.ValidModel())
    }
{% endhighlight %}

As before, an initial stack is easy to construct and show to be empty
and valid.

{% highlight dafny %}
    constructor InitStack()
      ensures ValidModel()
      ensures IsEmpty()
    {
      top := null;
      model := EmptyModel();
      footprint := {this};
    }
{% endhighlight %}

Pushing a value is simpler than in the array case, and satisfies the
same equivalence with the specification.

{% highlight dafny %}
    method Push(val : T)
      requires ValidModel()
      modifies this
      ensures ValidModel()
      ensures !IsEmpty()
      ensures model == PushModel(old(model), val)
    {
      top := new Node<T>.InitNode(val, top);
      footprint := footprint + top.footprint;
      model := PushModel(model, val);
    }
{% endhighlight %}

Popping a value is very symmetrical with pushing.

{% highlight dafny %}
    method Pop() returns (result : T)
      requires ValidModel()
      requires !IsEmpty()
      modifies this
      ensures ValidModel()
      ensures model == PopModel(old(model)).1
      ensures result == PopModel(old(model)).0
    {
      result := top.val;
      top := top.next;
      model := PopModel(model).1;
    }
{% endhighlight %}

Checking emptiness is very simple, as in the array case.

{% highlight dafny %}
    predicate IsEmpty()
      reads this, top, footprint
      requires ValidModel()
      ensures IsEmpty() <==> IsEmptyModel(model)
    {
      top == null
    }
  }
{% endhighlight %}

The following class, that implements the actual linked data structure,
is where the complexity lives. If you already had a linked list
implementation, you could potentially use that, and share the burden of
implementation and verification with any other uses of linked lists.
Although it would require some cleverness to integrate the ghost model
and node validity notions with a general-purpose list.

{% highlight dafny %}
  class Node<T> {
{% endhighlight %}

Each node has a value of type `T`.

{% highlight dafny %}
    var val : T
{% endhighlight %}

Each node points to the next node, which may be null if this is
the last node (the bottom of the stack).

{% highlight dafny %}
    var next : Node?<T>
{% endhighlight %}

The model is the same as in the array-based case.

{% highlight dafny %}
    ghost var model : StackModel<T>
{% endhighlight %}

The footprint keeps track of all objects used in this node or any
reachable from its `next` field. This is used to prove termination.

{% highlight dafny %}
    ghost var footprint : set<object>
{% endhighlight %}

The validity of a node is complex, mostly to keep track of the
footprint.

{% highlight dafny %}
    ghost predicate ValidModel()
      reads this, footprint
      decreases footprint + {this}
    {
      this in footprint &&
      (next == null ==> model == PushModel(EmptyModel(), val)) &&
      (next != null ==> (next in footprint &&
                         next.footprint <= footprint &&
                         this !in next.footprint &&
                         model == PushModel(next.model, val) &&
                         next.ValidModel()))
    }
{% endhighlight %}

Creating a node requires keeping track of the footprint, as well.

{% highlight dafny %}
    constructor InitNode(val: T, next: Node?<T>)
      requires next != null ==> next.ValidModel()
      ensures ValidModel()
      ensures model == PushModel(if next == null
                                 then EmptyModel()
                                 else next.model, val)
      ensures next == null ==>
        footprint == {this}
      ensures next != null ==>
        footprint == {this} + next.footprint
    {
      this.val := val;
      this.next := next;
      this.model := PushModel(if next == null then EmptyModel() else next.model, val);
      this.footprint := if next == null then {this} else {this} + next.footprint;
    }
  }
{% endhighlight %}

The model corresponding to a node is computed by a non-member function,
because it needs to handle the case where the node is null,
corresponding to an empty model.

{% highlight dafny %}
  ghost function NodeModel<T>(node: Node?<T>) : StackModel<T>
    reads node
  {
    if node == null then EmptyModel() else node.model
  }
}
{% endhighlight %}

# Implementing a stack with sequences

Finally, given Dafny's built-in types, it's possible to create an
imperative-looking interface to a stack building on the
persistent `seq` type. This
implementation is wrapped by a set of methods in a class but is
essentially the same as the specification itself.

{% highlight dafny %}
module SeqStackImplementation {
  import opened StackSpecification`Private

  class Stack<T> {
{% endhighlight %}

The `elts` field should be an identical copy of the `model` field.

{% highlight dafny %}
    var elts : seq<T>
    ghost var model : StackModel<T>
{% endhighlight %}

The stack is valid when `elts` is, indeed, identical to `model`.

{% highlight dafny %}
    ghost predicate ValidModel()
      reads this
    {
      elts == model
    }
{% endhighlight %}

Initialization is just like in the specification.

{% highlight dafny %}
    constructor InitStack()
      ensures ValidModel()
      ensures IsEmpty()
    {
      elts := []; // Could be `EmptyModel()`, but we don't want to break
                  // that abstraction any more than necessary.
      model := EmptyModel();
    }
{% endhighlight %}

Pushing is just like in the specification.

{% highlight dafny %}
    method Push(val : T)
      requires ValidModel()
      modifies this
      ensures ValidModel()
      ensures !IsEmpty()
      ensures model == PushModel(old(model), val)
    {
      elts := [val] + elts; // Could be `PushModel(model, val)`, but we
                            // don't want to break that abstraction.
      model := PushModel(model, val);
    }
{% endhighlight %}

Popping is just like in the specification.

{% highlight dafny %}
    method Pop() returns (result : T)
      requires ValidModel()
      requires !IsEmpty()
      modifies this
      ensures ValidModel()
      ensures model == PopModel(old(model)).1
      ensures result == PopModel(old(model)).0
    {
      model := PopModel(model).1;
      result := elts[0];
      elts := elts[1..];
    }
{% endhighlight %}

Checking for emptiness is just like in the specification.

{% highlight dafny %}
    predicate IsEmpty()
      reads this
      requires ValidModel()
      ensures IsEmpty() <==> IsEmptyModel(model)
    {
      |elts| == 0
    }
  }
}
{% endhighlight %}

# Proving things about stack clients

Given this variety of implementations, we can build clients that can
conclude properties about the results of pushing and popping,
relying only on the lemmas proved about the model used in the
specification, without knowing what that model is. Note that the
code in each method is identical, and is duplicated only because
each method operates on a different type.

{% highlight dafny %}
module StackClient {
  import opened StackSpecification
  import LS = LinkedStackImplementation
  import AS = ArrayStackImplementation
  import SS = SeqStackImplementation

  method PushPopLinked<T>(stk : LS.Stack<T>, val : T)
    requires stk.ValidModel()
    modifies stk
  {
    stk.Push(val);
    var val2 := stk.Pop();
    assert val2 == val by {
        PushPopVal(old(stk.model), val);
    }
  }

  method PushPopArray<T>(stk : AS.Stack<T>, val : T)
    requires stk.ValidModel()
    modifies stk, stk.elts
  {
    stk.Push(val);
    var val2 := stk.Pop();
    assert val2 == val by {
        PushPopVal(old(stk.model), val);
    }
  }

  method PushPopSeq<T>(stk : SS.Stack<T>, val : T)
    requires stk.ValidModel()
    modifies stk
  {
    stk.Push(val);
    var val2 := stk.Pop();
    assert val2 == val by {
        PushPopVal(old(stk.model), val);
    }
  }
}
{% endhighlight %}

# Conclusion

Through this series of examples, we've shown an approach that
consists of proving equivalence between a single, concise functional
specification and several imperative implementations of varying
complexity. Doing this has a number of benefits:

* It allows proving properties about the relationship between imperative
methods, even though Dafny does not provide a mechanism to do that
directly. Each of the `Push` methods performs an equivalent operation,
for example.

* It allows one implementation to be replaced by another without
impacting client code, which is often not the case in verified
programs. Similarly, modifications to the details of the
implementation, without wholesale replacement, do not affect client
code.

* It encourages modularity and a clear separation of concerns.

* It typically makes proofs of the behavioral properties of a system
simpler, by separating proofs of precise correctness properties of a
concise specification from proofs about the equivalence to an
imperative implementation. Intertwining these two proofs, as you
might otherwise need to do, can often make them more difficult.

* It likely makes SMT solver performance more predictable by
reducing the amount of information the solver needs to take into
account.
