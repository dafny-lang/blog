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
    | Comment(comment: string)
  {
    function ToString(indent: string := ""): string {
      match this {
        case Atom(name) => name
        case List(items) =>
          if |items| == 0 then
            "()"
          else
            "(" +
            JoinItems(items, indent + "  ") +
            ")"
        case Comment(comment) => ";" + comment
      }
    }
  }

  datatype TopLevelExpr =
    | TopLevel(items: seq<SExpr>)
  {
    function ToString(indent: string := ""): string {
      match this {
        case TopLevel(items) =>
          if |items| == 0 then
            ""
          else
            JoinTopLevelItems(items, indent)
      }
    }
  }

  function JoinItems(items: seq<SExpr>, indent: string): string {
    if |items| == 0 then ""
    else if |items| == 1 then items[0].ToString(indent)
    else items[0].ToString(indent) + "\n" + indent + JoinItems(items[1..], indent)
  }

  function JoinTopLevelItems(items: seq<SExpr>, indent: string): string {
    if |items| == 0 then ""
    else if |items| == 1 then items[0].ToString(indent)
    else items[0].ToString(indent) + "\n" + JoinTopLevelItems(items[1..], indent)
  }
  // LOC_MARKER_END: DATATYPES_AND_HELPERS

  // LOC_MARKER_START: PARSER_COMBINATORS
  const noParensNoSpace :=
    CharTest((c: char) => c != '(' && c != ')' && c != ' ' && c != '\t' && c != '\n' && c != '\r', "atom character").Rep1()

  const notNewline :=
    CharTest((c: char) => c != '\n', "anything except newline")

  const commentParser: B<SExpr> :=
    S(";").e_I(notNewline.Rep()).M((commentText: string) => Comment(commentText))
    .I_e(O([S("\n"), EOS.M(x => "")]))

  const parserSExpr: B<SExpr> :=
    Rec((SExpr: B<SExpr>) =>
          O([ commentParser,
              S("(").e_I(WS).Then(
                (r: string) =>
                  SExpr.I_e(WS)
                  .Rep().I_e(S(")")).I_e(WS)
              ).M((r: seq<SExpr>) => List(r)),
              noParensNoSpace.M((r: string) => Atom(r)).I_e(WS)
            ]))

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