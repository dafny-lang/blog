/*
 * S-Expression Parser in Dafny
 * This file contains a parser for S-expressions using Dafny's parser combinators library.
 */
module SExprParser {
  import opened Std.Parsers.StringBuilders

  datatype SExpr =
    | Atom(name: string)
    | List(items: seq<SExpr>)
  {
    function ToString(indent: string := ""): string {
      match this {
        case Atom(name) => name
        case List(items) =>
          if |items| == 0 then
            "()"
          else
            "(" + 
            JoinSExprs(items, indent + "  ") + 
            ")"
      }
    }
  }

  function JoinSExprs(items: seq<SExpr>, indent: string): string {
    if |items| == 0 then ""
    else if |items| == 1 then items[0].ToString(indent)
    else items[0].ToString(indent) + "\n" + indent + JoinSExprs(items[1..], indent)
  }

  const charNotParenNotSpace :=
    CharTest((c: char) => c !in "\r\n \t)" && c != '(', "non-space and not a parenthesis")
    
  const noParensNoSpace :=
    charNotParenNotSpace.I_I(charNotParenNotSpace.Rep()).M((r: (char, string)) => [r.0] + r.1)
    
  const notNewline :=
    CharTest((c: char) => c !in "\n", "anything except newline")

  const WSOrComment: B<string> :=
    WS

  // Parse an S-expression
  const parserSExpr: B<SExpr> :=
    Rec((SExpr: B<SExpr>) =>
      O([
        // Either a list: (expr1 expr2 ...)
        S("(").e_I(WSOrComment).Then(
          (r: string) =>
            SExpr.I_e(WSOrComment)
            .Rep().I_e(S(")")).I_e(WSOrComment)
        ).M((r: seq<SExpr>) => List(r)),
        
        // Or an atom: symbol
        noParensNoSpace.M((r: string) => Atom(r)).I_e(WSOrComment)
      ]))

  const p: B<SExpr> :=
    parserSExpr.I_e(WSOrComment).End()

  method ParseSExpr(input: string) returns (result: string)
  {
    var parseResult := p.Apply(input);
    match parseResult {
      case ParseSuccess(value, _) =>
        result := value.ToString();
      case ParseFailure(error, _) =>
        result := "Parse error";
    }
  }

  method {:extern "SExprParser", "ParseSExprJS"} 
  ParseSExprJS(input: string) returns (result: string)
  {
    result := ParseSExpr(input);
  }

  method Main() {
    var input := "(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1)))))";
    var result := ParseSExpr(input);
    print "Parsed: ", result, "\n";
  }
}