module StackSpecification {
  export
    provides StackModel, PushModel, PopModel, EmptyModel, IsEmptyModel
    provides PushPopVal, PushPopStack
  export Private
    reveals StackModel, PushModel, PopModel, EmptyModel, IsEmptyModel
    provides PushPopVal, PushPopStack
  type StackModel<T> = seq<T>
  ghost function IsEmptyModel<T>(stk: StackModel<T>) : bool
  {
    |stk| == 0
  }
  ghost function EmptyModel<T>() : StackModel<T>
    ensures(IsEmptyModel(EmptyModel<T>()))
  {
    []
  }
  ghost function PushModel<T>(stk: StackModel<T>, val : T) : StackModel<T>
    ensures !IsEmptyModel(PushModel(stk, val))
  {
    [val] + stk
  }
  ghost function PopModel<T>(stk: StackModel<T>) : (T, StackModel<T>)
    requires !IsEmptyModel(stk)
  {
    (stk[0], stk[1..])
  }
  lemma PushPopVal<T>(stk: StackModel<T>, val : T)
    ensures PopModel(PushModel(stk, val)).0 == val {}
  lemma PushPopStack<T>(stk: StackModel<T>, val : T)
    ensures PopModel(PushModel(stk, val)).1 == stk {}
}
module ArrayStackImplementation {
  import opened StackSpecification`Private

  datatype GhostOption<T> = ghost None | Some(value: T)

  class Stack<T> {
    var elts : array<GhostOption<T>>
    var size : nat
    ghost var model : StackModel<T>
    ghost predicate ValidModel()
      reads this, elts
    {
      && elts.Length > 0
      && elts.Length >= |model|
      && size == |model|
      && forall i :: 0 <= i < |model| ==>
           elts[i] == Some(model[size - (i + 1)])
    }
    constructor InitStack()
      ensures ValidModel()
      ensures IsEmpty()
    {
      elts := new GhostOption<T>[4];
      size := 0;
      model := EmptyModel();
    }
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
    predicate IsEmpty()
      reads this, elts
      requires ValidModel()
      ensures IsEmpty() <==> IsEmptyModel(model)
    {
      size == 0
    }
  }
}
module LinkedStackImplementation {
  import opened StackSpecification`Private

  class Stack<T> {
    var top : Node?<T>
    ghost var model : StackModel<T>
    ghost var footprint : set<object>
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
    constructor InitStack()
      ensures ValidModel()
      ensures IsEmpty()
    {
      top := null;
      model := EmptyModel();
      footprint := {this};
    }
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
    predicate IsEmpty()
      reads this, top, footprint
      requires ValidModel()
      ensures IsEmpty() <==> IsEmptyModel(model)
    {
      top == null
    }
  }
  class Node<T> {
    var val : T
    var next : Node?<T>
    ghost var model : StackModel<T>
    ghost var footprint : set<object>
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
  ghost function NodeModel<T>(node: Node?<T>) : StackModel<T>
    reads node
  {
    if node == null then EmptyModel() else node.model
  }
}
module SeqStackImplementation {
  import opened StackSpecification`Private

  class Stack<T> {
    var elts : seq<T>
    ghost var model : StackModel<T>
    ghost predicate ValidModel()
      reads this
    {
      elts == model
    }
    constructor InitStack()
      ensures ValidModel()
      ensures IsEmpty()
    {
      elts := []; // Could be `EmptyModel()`, but we don't want to break
                  // that abstraction any more than necessary.
      model := EmptyModel();
    }
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
    predicate IsEmpty()
      reads this
      requires ValidModel()
      ensures IsEmpty() <==> IsEmptyModel(model)
    {
      |elts| == 0
    }
  }
}
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
