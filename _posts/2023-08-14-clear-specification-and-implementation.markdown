---
layout: post
title:  "Clear Separation of Specification and Implementation in Dafny"
date:   2023-08-14 00:00:00 +0100
author: Aaron Tomb
categories:
---

Dafny allows you to describe computations in several ways,
primarily pure functions and imperative methods, each with its
own tradeoffs. Because of these tradeoffs, it can be useful to
combine mechanisms and relate them to each other. This post
describes one particularly effective technique for doing so, by
clearly separating a _specification_ from an _implementation_,
proving properties of the specification, and proving equivalence (or
refinement) between the specification and the implementation.

To get started, let's go over the tools Dafny provides. The two most
common computational descriptions in Dafny are terminating,
deterministic functions and imperative, stateful methods.

By writing a `function`, you can describe a mathematical object that
maps each input deterministically to a single output. Functions are
typically concise, and, given their genesis as one of the
foundational concepts in mathematics, they tend to be the most
straightforward to reason about. Because of this, the bodies of
functions are made directly available to the verifier by default,
unless a function is marked `{:opaque}`. Functions can often also be
compiled to executable programs, though sometimes inefficiently (and
not at all if they make use of infinite data types).

By writing a `method`, you can describe an imperative computation that
performs a sequence of steps to yield an output state or a set of output
states from each initial program state. Methods more closely match the
operations performed by actual computing hardware, and are capable of
describing non-deterministic or non-terminating computations. They are
also generally meant to be compiled to executable programs. However,
reasoning about methods is somewhat different than reasoning about
functions. You can prove that a method agrees with a single contract,
written as `requires`, `ensures`, `modifies`, and `decreases` clauses,
but you generally do not expand the body of a method as part of
performing a separate proof (though it is sometimes possible to do so,
as will be described in a future post).

These differing attributes come into play particularly starkly when
developing programs that have either or both of the following
attributes:

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

To start with, let's specify what it means to be a stack in the
following module.

{% highlight dafny %}
module StackSpecification {
  // Most clients, including clients of implementations, get no details.
  // This means that _all_ they know about stacks is what the two lemmas
  // describe.
  export
    // The operations on a stack.
    provides StackModel, PushModel, PopModel, EmptyModel, IsEmptyModel
    // The properties of those operations.
    provides PushPopVal, PushPopStack

  // Implementation modules can access the definition of the model
  // operations, to allow proofs of equivalence, by importing the
  // `Private export set.
  export Private
    reveals StackModel, PushModel, PopModel, EmptyModel, IsEmptyModel
    provides PushPopVal, PushPopStack

  // We provide a concrete type to model a stack for simplicity of
  // proof, since Dafny knows how to prove things about sequences. Note,
  // however, that most clients don't get to see what this type is.
  type StackModel<T> = seq<T>

  // Check to see whether a stack is empty.
  ghost function IsEmptyModel<T>(stk: StackModel<T>) : bool
  {
    |stk| == 0
  }

  // Construct an empty stack (and ensure that it's empty).
  ghost function EmptyModel<T>() : StackModel<T>
    ensures(IsEmptyModel(EmptyModel<T>()))
  {
    []
  }

  // Push an item onto the stack, ensuring that it's non-empty as a
  // result.
  ghost function PushModel<T>(stk: StackModel<T>, val : T) : StackModel<T>
    ensures !IsEmptyModel(PushModel(stk, val))
  {
    [val] + stk
  }

  // Pop an item from a non-empty stack, yielding both an item and the
  // rest of the stack.
  ghost function PopModel<T>(stk: StackModel<T>) : (T, StackModel<T>)
    requires !IsEmptyModel(stk)
  {
    (stk[0], stk[1..])
  }

  // The first core property of stacks, for use by clients. Pushing and
  // then popping yields the pushed value.
  lemma PushPopVal<T>(stk: StackModel<T>, val : T)
    ensures PopModel(PushModel(stk, val)).0 == val {}

  // The second core property of stacks, for use by clients. Pushing and
  // then popping yields the original stack.
  lemma PushPopStack<T>(stk: StackModel<T>, val : T)
    ensures PopModel(PushModel(stk, val)).1 == stk {}
}
{% endhighlight %}

Several things are important about this implementation. First, it
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
functional properties are specified in lemmas.

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
  // Get access to the implementation details.
  import opened StackSpecification`Private

  // This allows `elts` below to include default values in unused
  // positions.
  datatype GhostOption<T> = ghost None | Some(value: T)

  // An array-based stack can contain elements of most types, but they
  // must have default values because sometimes the end of the allocated
  // array contains excess, unused elements.
  class Stack<T> {

    // The elements themselves are stored in an array.
    var elts : array<GhostOption<T>>

    // We need a separate size tracker to know how much of the array is
    // being used, because the size of `elts` itself will always be a
    // power of two, and some entries will usually be unused.
    var size : nat

    // A ghost variable keeps track of the correspondence between the
    // concrete storage in the array and the model used by the
    // specification.
    ghost var model : StackModel<T>

    // A stack agrees with its model if `size` matches the size of the
    // model, the array has at least that much room, and all of the
    // elements within the size of the model match the model. Note,
    // however, that the model prepends to the beginning and the array
    // adds at the end! Finally, the array always needs to have _room_
    // for some elements, even if they're all unused.
    ghost predicate ValidModel()
      reads this, elts
    {
      && elts.Length > 0
      && elts.Length >= |model|
      && size == |model|
      && forall i :: 0 <= i < |model| ==>
           elts[i] == Some(model[size - (i + 1)])
    }

    // An initial stack has room for a few elements (the exact number
    // was chosen arbitrarily) but none of them are used. It is empty
    // and valid.
    constructor InitStack()
      ensures ValidModel()
      ensures IsEmpty()
    {
      elts := new GhostOption<T>[4];
      size := 0;
      model := EmptyModel();
    }

    // To push an element on the stack, write to the first unused
    // element of the array and increment the size. If there's not room,
    // however, it's necessary to allocate a new array and copy the old
    // elements over. Like all operations except `InitStack`, it
    // requires a valid model. Like all operations that modify the
    // stack, it ensures a valid model.
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

    // To pop an element, return the last used element of the array and
    // decrement the size. Ensures that both the return value and the
    // internal changes match the stack specification.
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

    // The size variable alone is sufficient to tell us whether the
    // stack is empty very efficiently.
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

    // The actual content of the stack is stored in a linked sequence of
    // Node objects, defined below.
    var top : Node?<T>

    // The model is exactly the same as for the array-based
    // implementation.
    ghost var model : StackModel<T>

    // The footprint keeps track of all objects reachable from this
    // object. This is used to prove termination.
    ghost var footprint : set<object>

    // Validity is a bit more complex, as it needs to recursively
    // traverse the list and use the associated footprint to ensure
    // termination.
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

    // As before, an initial stack is easy to construct and show to be
    // empty and valid.
    constructor InitStack()
      ensures ValidModel()
      ensures IsEmpty()
    {
      top := null;
      model := EmptyModel();
      footprint := {this};
    }

    // Pushing a value is simpler than in the array case, and satisfies
    // the same equivalence with the specification.
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

    // Popping a value is very symmetrical with pushing.
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

    // Checking emptiness is very simple, as in the array case.
    predicate IsEmpty()
      reads this, top, footprint
      requires ValidModel()
      ensures IsEmpty() <==> IsEmptyModel(model)
    {
      top == null
    }
  }

  // This class, that implements the actual linked data structure, is
  // where the complexity lives. If you already had a linked list
  // implementation, you could potentially use that, and share the
  // burden of implementation and verification with any other uses of
  // linked lists. Although it would require some cleverness to
  // integrate the ghost model and node validity notions with a
  // general-purpose list.
  class Node<T> {

    // Each node has a value.
    var val : T

    // Each node points to the next node, which may be null if this is
    // the last node (the bottom of the stack).
    var next : Node?<T>

    // The model is the same as in the array-based case.
    ghost var model : StackModel<T>

    // The footprint keeps track of all objects used in this node or any
    // reachable from its `next` field. This is used to prove
    // termination.
    ghost var footprint : set<object>

    // The validity of a node is complex, mostly to keep track of the
    // footprint.
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

    // Creating a node requires keeping track of the footprint, as well.
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

  // The model corresponding to a node is computed by a non-member
  // function, because it needs to handle the case where the node is
  // null, corresponding to an empty model.
  ghost function NodeModel<T>(node: Node?<T>) : StackModel<T>
    reads node
  {
    if node == null then EmptyModel() else node.model
  }
}
{% endhighlight %}

Finally, given Dafny's built-in types, it's possible to create an
imperative stack building on the immutable `seq` type. This
implementation is wrapped by a set of methods in a class but is
essentially the same as the specification itself.

{% highlight dafny %}
module SeqStackImplementation {
  import opened StackSpecification`Private

  class Stack<T> {

    // The `elts` field should be an identical copy of the `model` field.
    var elts : seq<T>
    ghost var model : StackModel<T>

    // The stack is valid when `elts` is, indeed, identical to `model`.
    ghost predicate ValidModel()
      reads this
    {
      elts == model
    }

    // Initialization is just like in the specification.
    constructor InitStack()
      ensures ValidModel()
      ensures IsEmpty()
    {
      elts := []; // Could be `EmptyModel()`, but we don't want to break
                  // that abstraction any more than necessary.
      model := EmptyModel();
    }

    // Pushing is just like in the specification.
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

    // Popping is just like in the specification.
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

    // Checking for emptiness is just like in the specification.
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
