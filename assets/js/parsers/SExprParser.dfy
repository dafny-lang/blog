/*
 * S-Expression Parser in Dafny
 * This file contains a parser for S-expressions using Dafny's parser combinators library.
 */
module SExprParser {
  import opened Std.Parsers.StringBuilders

  // LOC_MARKER_START: DATATYPES_AND_HELPERS
  datatype SExpr =
    | Atom(name: string)
    | List(items: seq<SExpr>)
    | Comment(comment: string, underlyingNode: SExpr)
  {
    function ToString(indent: string := ""): string
      decreases this
    {
      match this {
        case Atom(name) => name
        case List(items) =>
          if |items| == 0 then
            "()"
          else
            // Try to format as special patterns first
            assert forall i :: 0 <= i < |items| ==> items[i] < this;
            var (isDefine, defineStr) := TryFormatAsDefine(this, items, indent);
            if isDefine then
              defineStr
            else
              var (isIf, ifStr) := TryFormatAsIf(this, items, indent);
              if isIf then
                ifStr
              else
                var (isLet, letStr) := TryFormatAsLet(this, items, indent);
                if isLet then
                  letStr
                else
                  var (isLambda, lambdaStr) := TryFormatAsLambda(this, items, indent);
                  if isLambda then
                    lambdaStr
                  else
                    var (isList, listStr) := TryFormatAsList(this, items, indent);
                    if isList then
                      listStr
                    else
                      var (isInfix, infixStr) := TryFormatAsInfix(this, items, indent);
                      if isInfix then
                        infixStr
                      else if |items| == 2 && items[0].Atom? then
                        items[0].name + "("+items[1].ToString(indent+"  ")+")" 
                      else
                        // Default list formatting
                        "(" +
                        JoinItems(this, items, indent + "  ") +
                        ")"
        case Comment(comment, underlyingNode) =>
          ";" + comment + "\n" + indent + underlyingNode.ToString(indent)
      }
    }
  }

  datatype TopLevelExpr =
    | TopLevel(items: seq<SExpr>)
  {
    function ToString(indent: string := ""): string
      decreases this
    {
      match this {
        case TopLevel(items) =>
          if |items| == 0 then
            ""
          else
            assert forall i :: 0 <= i < |items| ==> items[i] < this;
            JoinTopLevelItems(this, items, indent)
      }
    }
  }

  function JoinItems(ghost parent: SExpr, items: seq<SExpr>, indent: string): string
    requires forall i :: 0 <= i < |items| ==> items[i] < parent
    decreases parent, |items|
  {
    if |items| == 0 then ""
    else if |items| == 1 then items[0].ToString(indent)
    else items[0].ToString(indent) + "\n" + indent + JoinItems(parent, items[1..], indent)
  }

  function JoinTopLevelItems(ghost parent: TopLevelExpr, items: seq<SExpr>, indent: string): string
    requires forall i :: 0 <= i < |items| ==> items[i] < parent
    decreases |items|
  {
    if |items| == 0 then ""
    else if |items| == 1 then items[0].ToString(indent)
    else items[0].ToString(indent) + "\n" + JoinTopLevelItems(parent, items[1..], indent)
  }

  // Helper function to unwrap comments to get the underlying node
  function UnwrapComments(expr: SExpr): (r: SExpr)
    decreases expr
    ensures r < expr || (r == expr && !expr.Comment?)
  {
    match expr {
      case Comment(_, underlyingNode) => UnwrapComments(underlyingNode)
      case _ => expr
    }
  }

  // Helper function to check if an SExpr is an atom with a specific name (unwrapping comments)
  predicate IsAtom(expr: SExpr, name: string) {
    var unwrapped := UnwrapComments(expr);
    unwrapped.Atom? && unwrapped.name == name
  }

  // Helper function to get the underlying list items (unwrapping comments)
  function GetListItems(expr: SExpr): (result: seq<SExpr>)
    ensures forall r <- result :: r < expr
  {
    var unwrapped := UnwrapComments(expr);
    if unwrapped.List? then unwrapped.items else []
  }

  // Helper function to format infix expressions
  function FormatInfix(ghost parent: SExpr, op: string, left: SExpr, right: SExpr, indent: string): string
    requires left < parent && right < parent
    decreases parent, 0
  {
    left.ToString(indent) + " " + op + " " + right.ToString(indent)
  }

  // Helper function to check if an expression should be formatted as infix
  function TryFormatAsInfix(ghost parent: SExpr, items: seq<SExpr>, indent: string): (bool, string)
    requires forall i :: 0 <= i < |items| ==> items[i] < parent
    decreases parent, 1, |items|
  {
    if |items| == 3 && (IsAtom(items[0], "+") || IsAtom(items[0], "-") || IsAtom(items[0], "*") || IsAtom(items[0], "/") || IsAtom(items[0], "=") || IsAtom(items[0], "<") || IsAtom(items[0], ">") || IsAtom(items[0], "<=") || IsAtom(items[0], ">=")) then
      var unwrapped := UnwrapComments(items[0]);
      var op := unwrapped.name;
      (true, FormatInfix(parent, op, items[1], items[2], indent))
    else
      (false, "")
  }

  // Helper function to format define expressions
  function TryFormatAsDefine(ghost parent: SExpr, items: seq<SExpr>, indent: string): (bool, string)
    requires forall i :: 0 <= i < |items| ==> items[i] < parent
    decreases parent, |items|
  {
    if |items| >= 3 && IsAtom(items[0], "define") then
      var funcDefItems := GetListItems(items[1]);
      if |funcDefItems| >= 1 && IsAtom(funcDefItems[0], "") then
        var unwrappedFunc := UnwrapComments(funcDefItems[0]);
        if unwrappedFunc.Atom? then
          var funcName := unwrappedFunc.name;
          var params := if |funcDefItems| > 1 then funcDefItems[1..] else [];
          var paramStr := if |params| == 0 then "()"
                          else if |params| == 1 then "(" + params[0].ToString("") + ")"
                          else "(" + JoinParams(items[1], params) + ")";
          var body := if |items| == 3 then items[2].ToString(indent + "  ")
                      else JoinItems(parent, items[2..], indent + "  ");
          (true, "function " + funcName + paramStr + "\n" + indent + "  " + body)
        else
          (false, "")
      else if |funcDefItems| >= 1 then
        var unwrappedFunc := UnwrapComments(funcDefItems[0]);
        if unwrappedFunc.Atom? then
          var funcName := unwrappedFunc.name;
          var params := if |funcDefItems| > 1 then funcDefItems[1..] else [];
          var paramStr := if |params| == 0 then "()"
                          else if |params| == 1 then "(" + params[0].ToString("") + ")"
                          else "(" + JoinParams(items[1], params) + ")";
          var body := if |items| == 3 then items[2].ToString(indent + "  ")
                      else JoinItems(parent, items[2..], indent + "  ");
          (true, "function " + funcName + paramStr + "\n" + indent + "  " + body)
        else
          (false, "")
      else
        (false, "")
    else
      (false, "")
  }

  // Helper function to format if expressions
  function TryFormatAsIf(ghost parent: SExpr, items: seq<SExpr>, indent: string): (bool, string)
    requires forall i :: 0 <= i < |items| ==> items[i] < parent
    decreases parent, |items|
  {
    if |items| == 4 && IsAtom(items[0], "if") then
      var condition := items[1].ToString("");
      var thenBranch := items[2].ToString(indent + "  ");
      var elseBranch := items[3].ToString(indent + "  ");
      (true, "if " + condition + " then\n" + indent + "  " + thenBranch + "\n" + indent + "else\n" + indent + "  " + elseBranch)
    else
      (false, "")
  }

  // Helper function to join parameters
  function JoinParams(ghost parent: SExpr, params: seq<SExpr>): string
    requires forall i :: 0 <= i < |params| ==> params[i] < parent
    decreases parent, |params|
  {
    if |params| == 0 then ""
    else if |params| == 1 then params[0].ToString("")
    else params[0].ToString("") + ", " + JoinParams(parent, params[1..])
  }

  // Helper function to format let expressions
  function TryFormatAsLet(ghost parent: SExpr, items: seq<SExpr>, indent: string): (bool, string)
    requires forall i :: 0 <= i < |items| ==> items[i] < parent
    decreases parent, |items|
  {
    if |items| >= 3 && IsAtom(items[0], "let") then
      var bindings := GetListItems(items[1]);
      var body := if |items| == 3 then items[2].ToString(indent + "  ")
                  else JoinItems(parent, items[2..], indent + "  ");
      var bindingStr := FormatBindings(parent, bindings, indent + "  ");
      (true, "let\n" + indent + "  " + bindingStr + "\n" + indent + "in\n" + indent + "  " + body)
    else
      (false, "")
  }

  // Helper function to format bindings in let expressions
  function FormatBindings(ghost parent: SExpr, bindings: seq<SExpr>, indent: string): string
    requires forall i :: 0 <= i < |bindings| ==> bindings[i] < parent
    decreases parent, 1, |bindings|
  {
    if |bindings| == 0 then ""
    else if |bindings| == 1 then FormatBinding(parent, bindings[0], indent)
    else FormatBinding(parent, bindings[0], indent) + "\n" + indent + FormatBindings(parent, bindings[1..], indent)
  }

  // Helper function to format a single binding
  function FormatBinding(ghost parent: SExpr, binding: SExpr, indent: string): string
    requires binding < parent
    decreases parent, 0, binding
  {
    var bindingItems := GetListItems(binding);
    if |bindingItems| == 2 then
      bindingItems[0].ToString("") + " = " + bindingItems[1].ToString("")
    else
      binding.ToString("")
  }

  // Helper function to format lambda expressions
  function TryFormatAsLambda(ghost parent: SExpr, items: seq<SExpr>, indent: string): (bool, string)
    requires forall i :: 0 <= i < |items| ==> items[i] < parent
    decreases parent, |items|
  {
    if |items| >= 3 && IsAtom(items[0], "lambda") then
      var params := GetListItems(items[1]);
      var paramStr := if |params| == 0 then "()"
                      else if |params| == 1 then "(" + params[0].ToString("") + ")"
                      else "(" + JoinParams(items[1], params) + ")";
      var body := if |items| == 3 then items[2].ToString("")
                  else JoinItems(parent, items[2..], "");
      (true, "λ" + paramStr + " => " + body)
    else
      (false, "")
  }

  // Helper function to format list expressions
  function TryFormatAsList(ghost parent: SExpr, items: seq<SExpr>, indent: string): (bool, string)
    requires forall i :: 0 <= i < |items| ==> items[i] < parent
    decreases parent, |items|
  {
    if |items| >= 1 && IsAtom(items[0], "list") then
      var listItems := if |items| > 1 then items[1..] else [];
      var listStr := JoinListItems(parent, listItems);
      (true, "[" + listStr + "]")
    else
      (false, "")
  }

  // Helper function to join list items with commas
  function JoinListItems(ghost parent: SExpr, items: seq<SExpr>): string
    requires forall i :: 0 <= i < |items| ==> items[i] < parent
    decreases parent, |items|
  {
    if |items| == 0 then ""
    else if |items| == 1 then items[0].ToString("")
    else items[0].ToString("") + ", " + JoinListItems(parent, items[1..])
  }
  // LOC_MARKER_END: DATATYPES_AND_HELPERS

  // LOC_MARKER_START: PARSER_COMBINATORS
  const noParensNoSpace :=
    CharTest((c: char) => c != '(' && c != ')' && c != ' ' && c != '\t' && c != '\n' && c != '\r', "atom character").Rep1()

  const notNewline :=
    CharTest((c: char) => c != '\n', "anything except newline")

  const commentText: B<string> :=
    S(";").e_I(notNewline.Rep()).I_e(O([S("\n"), EOS.M(x => "")]))

  const parserSExpr: B<SExpr> :=
    Rec(
      (SExpr: B<SExpr>) =>
        O([ commentText.I_e(WS).I_I(SExpr).M(
              (commentAndExpr: (string, SExpr)) =>
                Comment(commentAndExpr.0, commentAndExpr.1)),
            S("(").e_I(WS).Then(
              (r: string) => SExpr.I_e(WS).Rep().I_e(S(")")).I_e(WS)
            ).M((r: seq<SExpr>) => List(r)),
            noParensNoSpace.M((r: string) => Atom(r)).I_e(WS)]))

  const p: B<SExpr> :=
    parserSExpr.I_e(WS).End()

  const topLevelParser: B<TopLevelExpr> :=
    WS.e_I(parserSExpr.I_e(WS).Rep()).I_e(WS).End().M((items: seq<SExpr>) => TopLevel(items))
  // LOC_MARKER_END: PARSER_COMBINATORS

  method ParseSExpr(input: string) returns (result: string)
  {
    var parseResult := p.Apply(input);
    match parseResult {
      case ParseSuccess(value, _) =>
        result := value.ToString();
      case ParseFailure(error, _) =>
        result := FailureToString(input, parseResult);
    }
  }

  method ParseTopLevel(input: string) returns (result: string)
  {
    var parseResult := topLevelParser.Apply(input);
    match parseResult {
      case ParseSuccess(value, _) =>
        result := value.ToString();
      case ParseFailure(error, _) =>
        result := FailureToString(input, parseResult);
    }
  }

  method {:extern "SExprParser", "ParseSExprJS"}
    ParseSExprJS(input: string) returns (result: string)
  {
    result := ParseTopLevel(input);
  }

  method Main() {
    var input := "(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1)))))";
    var result := ParseTopLevel(input);
    print "Parsed: ", result, "\n";
  }
}