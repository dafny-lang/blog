---
layout: post
title:  "Types and Programming Languages"
date:   2023-06-30 18:00:00 +0100
author: Mikael Mayer
usemathjax: true
---
<script type="text/javascript" async src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
<link rel="stylesheet" href="/blog/assets/css/types-and-programming-languages.css">
<img class="clickable" id="img-intro" src="/blog/assets/images/type-and-programming-languages/introimage.png" alt="A type checker on the term If(True, 0, 1)" style="display:block;margin-left:auto;margin-right:auto;width:500px;max-width:95%;"/>
As recalled in the [last blog post](2023-04-19-making-verification-compelling-visual-verification-feedback-for-dafny.html),
the last thing you want in a software business is that the program written by your developers goes wrong. And there are many ways programs can go wrong. One of these ways is of using a value in a way it was not intended to be used, and for that, static typing often solves entirely the problem.

This blog post takes a deep dive... take a deep breath... on how to write _terms of a programming language_, and both a _type-checker_ and an _evaluator_ on such terms, such that the following _soundness property_ holds:

> If a type checker accepts a term, then the evaluator will _not get stuck_ on that term.

We will illustrate this using the infrastructure of the following Blockly workspace.
If you build a full term and pass it to "Type check", if the type checker succeeds, the block is surrounded with green, otherwise with red.
If surrounded with green, then attaching the term to "Evaluate" and clicking on "Evaluate" will always return a value.

# Play with the evaluator and the type checker
<button id="Evaluate">Evaluate</button>
<script src="https://unpkg.com/blockly/blockly.min.js"></script>
<script src="https://unpkg.com/blockly/javascript_compressed"></script>
<div id="blocklyDiv" style="height: 520px; width: 600px;"></div>
<script src="/blog/assets/js/types-and-programming-languages.js"></script>
<script src="/blog/assets/js/bignumber.js"></script>
<script src="/blog/assets/js/types-and-programming-languages.dfy.js"></script>

# Examples (click to load)

<img class="clickable" id="example1" src="/blog/assets/images/type-and-programming-languages/example1.png" alt="A type checker on the term If(True, 0, 1)" style="display:block;margin-left:auto;margin-right:auto;width:500px;max-width:95%;"/>
<img class="clickable" id="example2" src="/blog/assets/images/type-and-programming-languages/example2.png" alt="A type checker on the term If(True, 0, 1)" style="display:block;margin-left:auto;margin-right:auto;width:500px;max-width:95%;"/>

# The journey to a type-based soundness checker.

Writing a type-checker that guarantees that evaluation of an term won't get stuck is not an easy task if we dive into maths, but it's a rewarding experience, and today I want to share with you that experience.

We will follow the following path:

1. Model the small-step evaluation of terms as a _relation_ that satisfy some given _rules_.
2. Model the type-checking system also as a relation that satisfies some given rules
3. Write a small-step evaluator that is proven to be unstuck on typing relations
4. Take the shortcut Dafny provides to write this very quickly and without hassle.

## Writing a type checker in Dafny

First, let's define the term language used in the Blockly interface above:

{% highlight javascript %}
datatype Term  =
  | True
  | False
  | Zero
  | Succ(e: Term)
  | Pred(e: Term)
  | IsZero(e: Term)
  | Double(e: Term)
  | Add(left: Term, right: Term)
  | If(cond: Term, thn: Term, els: Term)
{% endhighlight %}

Let's also add the two types our expressions can have.

{% highlight javascript %}
datatype Type =
  | Bool
  | Int
{% endhighlight %}

We can now write a type checker for the expressions above. First, an expression might or might not have a type, so we need a `Option<A>` type like this;

{% highlight javascript %}
datatype Option<A> = Some(value: A) | None
{% endhighlight %}

Now we can define a function to compute the possible type of an expression.
Note that, for a conditional expression, the condition has to be a boolean,
while we only require the "then" and "else" part to have the same, defined type.

{% highlight javascript %}
function GetType(term: Term): Option<Type> {
  match term {
    case True  => Some(Bool)
    case False => Some(Bool)
    case Zero  => Some(Int)
    case Succ(e) =>
      if GetType(e) == Some(Int) then
        Some(Int)
      else
        None

    case Pred(e) =>
      if GetType(e) == Some(Int) then
        Some(Int)
      else
        None

    case IsZero(e) =>
      if GetType(e) == Some(Int) then
        Some(Bool)
      else
        None

    case Add(left, right) =>
      if GetType(left) == Some(Int) == GetType(right) then
        Some(Int)
      else
        None

    case Double(e) =>
      if GetType(e) == Some(Int) then
        Some(Int)
      else
        None

    case If(cond, thn, els) => 
      var t := GetType(thn);
      var e := GetType(els);
      if GetType(cond) == Some(Bool) && t == e then
        t
      else
        None
  }
}
{% endhighlight %}

Now, a term to be well-typed just means it has a type.

{% highlight javascript %}
predicate WellTyped(term: Term) {
  GetType(term) != None
}
{% endhighlight %}

At first, we can define the notion of evaluating a term. We can evaluate a term using small-step semantics, meaning we only replace a term or a subterm by another one.
**Not being stuck** means that we will always be able to find a term to "replace" or to "compute", it's a bit of a synonym here.

There are terms that we know we won't be able to do any replacement on them: Value terms.
Here is what we want them to look like: Either Positive numbers, zero, negative numbers, or booleans.

{% highlight javascript %}
predicate IsSuccs(term: Term) {
  term == Zero || (term.Succ? && IsSuccs(term.e))
}
predicate IsPreds(term: Term) {
  term == Zero || (term.Pred? && IsPreds(term.e))
}
predicate IsFinalValue(term: Term) {
  term == True || term == False || term == Zero ||
  IsSuccs(term) || IsPreds(term)
}
{% endhighlight %}

Now, we can write our one-step evaluation method. As a requirement, we add that the term must be well-typed and is not a final value.

{% highlight javascript %}
function OneStepEvaluate(e: Term): (r: Term)
  requires WellTyped(e) && !IsFinalValue(e)
{
  match e {
    case Succ(Pred(x)) =>
      x

    case Succ(succ) => 
      Succ(OneStepEvaluate(succ))

    case Pred(Succ(x)) =>
      x

    case Pred(pred) =>
      Pred(OneStepEvaluate(pred))

    case IsZero(Zero) =>
      True

    case IsZero(e) =>
      if IsFinalValue(e) then
        assert e.Pred? || e.Succ?;
        False
      else
        IsZero(OneStepEvaluate(e))
  
    case Add(a, b) =>
      if !IsFinalValue(a) then
        Add(OneStepEvaluate(a), b)
      else if !IsFinalValue(b) then
        Add(a, OneStepEvaluate(b))
      else if a.Zero? then
        b
      else if b.Zero? then
        a
      else if a.Succ? then
        Succ(Add(a.e, b))
      else
        assert a.Pred?;
        Pred(Add(a.e, b))

    case Double(a) =>
      if IsFinalValue(a) then
        Add(a, a)
      else
        Double(OneStepEvaluate(a))

    case If(cond, thn, els) =>
      if IsFinalValue(cond) then
        assert GetType(cond) == Some(Bool);
        assert cond == True || cond == False;
        if cond == True then
          thn
        else
          assert cond == False;
          els
      else
        If(OneStepEvaluate(cond), thn, els)
  }
}
{% endhighlight %}

The interesting points are the following:

* Every call consist either of OneStepEvaluate on one sub-argument, or a transformation that reduces the size of the tree. So something is always happening here.
* All the cases are covered, Dafny does not complain!
  * For example, when encountering the case `IsZero(e)`, if `e` is a final value, we know it's either `Pred` or `Succ`, not `True` or `False`, so we can conclude
  * Similarly, if the condition is a final Value, because of type-checking, Dafny knows it's either True or False.

That concludes the progress part: Whenever a term type-checks, it small step evaluation rule is never stuck until it reaches a final value.

Soundness also contains another part. It says that, if we evaluate a typed term, not only it's not going to get stuck, but the result will have the same type.
Dafny can also prove it!

{% highlight javascript %}
lemma OneStepEvaluateWellTyped(e: Term)
  requires WellTyped(e) && !IsFinalValue(e)
  ensures GetType(OneStepEvaluate(e)) == GetType(e)
{
  // Amazing: Dafny can prove this soundness property automatically
}
{% endhighlight %}

This is the end of the blog post. I hope you enjoyed it so far, but if you are looking for some advanced concepts, feel free to continue reading!

## Bonus: More advanced modeling

Sometimes, modeling evaluator and type-checker as functions is not enough. One wants to model them as relations, and determine some properties about these relations, such as the order of evaluation does not matter for the final result.

In the rest of this blog post largely inspired by the book "Types and Programming Languages", Chapter 8, written by Benjamin Pierce, we will illustrate one element of the proof: the one that inductive and constructive versions of the set of Terms are equivalent.
Once this proof trick is gained, it becomes possible to do the same for,
- The set of `(Expr, Expr)` of small-step evaluations
- The set of `(Expr, Type)` of type checking
but I leave these as an exercise for the interested reader.

In Dafny, we can define the infinite set of all terms, which obviously cannot be represented at compile-time so we use the keywords "ghost" and "iset" for potentially infinite set:

In Types and Programming Languages, chapter 3.2, we discover that there are two other mathematical definitions of the "set of all terms".
The first one in definition 3.2.1 states that the set of _terms_ is the smallest set 𝒯 such that:

1. $$\{\texttt{true}, \texttt{false}, 0\} \subseteq 𝒯$$;
2. if $$t_1 \in 𝒯$$, then $$\{\texttt{succ}\;t_1, \texttt{pred}\;t_1, \texttt{is_zero}\;t_1\} \subseteq 𝒯$$;
3. if $$t_1 \in 𝒯$$, $$\;\; t_2 \in 𝒯$$ and $$t_3 \in 𝒯$$, then $$\texttt{if}\;t_1\;\texttt{then}\;t_2\;\texttt{else}\;t_3 \in 𝒯$$.

Note that these terms omit `Double` and `Add` above. This means we cannot state that this set is the same as `set t: Term | true` as one would like to write. But let's continue.

We can write the inductive definition above in Dafny too:

{% highlight javascript %}
ghost const AllTermsInductively: iset<Term>

ghost predicate SatisfyInductionCriteria(terms: iset<Term>) {
  && iset{True, False, Zero} <= terms
  && (forall t1 <- terms
        :: iset{Succ(t1), Pred(t1), IsZero(t1)} <= terms)
  && (forall t1 <- terms, t2 <- terms, t3 <- terms
        :: If(t1, t2, t3) in terms)
}
lemma {:axiom} InductiveAxioms()
  ensures SatisfyInductionCriteria(AllTermsInductively)
  ensures forall setOfTerms: iset<Term> | SatisfyInductionCriteria(setOfTerms)
            :: AllTermsInductively <= setOfTerms
{% endhighlight %}

The second definition for the set of all terms in section 3.2.3 is done constructively. We first define a set $$S_i$$ for each natural number $$i$$, as follows

$$S_0 = ∅ $$;  
$$\begin{aligned}S_{i+1} = && && \{\texttt{true}, \texttt{false}, 0\} \\ && \bigcup && \{\texttt{succ}\;t_1, \texttt{pred}\;t_1, \texttt{is_zero}\;t_1 \mid t_1 \in S_i \} \\ && \bigcup && \{\texttt{if}\;t_1\;\texttt{then}\;t_2\;\texttt{else}\;t_3\mid t_1 \in S_i,\; t_2 \in S_i,\; t_3 \in S_i\}\end{aligned}$$.

This we can enter in Dafny too:

{% highlight javascript %}
ghost function S(i: nat): iset<Term> {
  if i == 0 then
    iset{}
  else
    iset{True, False, Zero}
    + (iset t1 <- S(i-1) :: Succ(t1))
    + (iset t1 <- S(i-1) :: Pred(t1))
    + (iset t1 <- S(i-1) :: IsZero(t1))
    + (iset t1 <- S(i-1), t2 <- S(i-1), t3 <- S(i-1) :: If(t1, t2, t3))
}
ghost const AllTermsConstructively: iset<Term> := iset i: nat, t <- S(i) :: t
{% endhighlight %}

But now, we are left with the existential question: Are these two sets the same?
We rush in Dafny and write a lemma ensuring `AllTermsConstructively == AllTermsInductively` by invoking the lemma `InductiveAxioms()`, but... Dafny can't prove it.

If you think deeply about it, how do you know that the two are the same? It seems obvious but why? Its obvious to show that `AllTermsInductively <= AllTermsConstructively` because by definition, `AllTermsConstructively` obeys induction rules. But is it the smallest of such sets? But what if there was an element of `AllTermsConstructively` that is not in `AllTermsInductively`? It could actually happen if, instead of a datatype, we only had a trait, and some external user could implement new terms yet unknown to us.

