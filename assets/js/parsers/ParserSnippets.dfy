/*
 * Parser Snippets in Dafny
 * This file is auto-generated from the HTML file
 * DO NOT EDIT DIRECTLY
 */
module ParserSnippets {
  import opened Std.Parsers.StringBuilders

  // Parser: AngerParser
  const AngerParser := CharTest( c => c == '😠' || c == '😡' || c == '🤬' || c == '😤', "Angry Smily")

  // Parser: JoyParser
  const JoyParser := CharTest( c => c == '😀' || c == '😃' || c == '😄' || c == '😁' || c == '🥳', "joy").Rep()

  // Parser: JoyScoreParser
  const JoyScoreParser := CharTest( c => c == '😀' || c == '😃' || c == '😄' || c == '😁' || c == '🥳', "joy").Rep().M(joyString => |joyString| * 2)

  // Parser: AtomParser
  const AtomParser := CharTest( c => c != '(' && c != ')' && c != ';' && c != ' ' && c != '\t' && c != '\n', "atom character" ).Rep1()

  // Parser: NumberOrSymbol
  const NumberOrSymbol := O([ CharTest(c => '0' <= c <= '9', "digit").Rep1().M(digits => "NUMBER:" + digits), AtomParser.M(atom => "SYMBOL:" + atom) ])

  // Parser: ConcatDemo_I_I
  const ConcatDemo_I_I := S("(").I_I(AtomParser).M( (pair: (string, string)) => "BOTH: (" + pair.0 + ", " + pair.1 + ")" )

  // Parser: ConcatDemo_e_I
  const ConcatDemo_e_I := S("(").e_I(AtomParser).M( name => "RIGHT: " + name )

  // Parser: ConcatDemo_I_e
  const ConcatDemo_I_e := S("(").I_e(AtomParser).M( paren => "LEFT: " + paren )

  // Parser: AtomWithSpaces
  const AtomWithSpaces := AtomParser.I_e(WS)

  // Generic result type for parser results
  datatype Result<T> = 
    | Success(value: T)
    | Failure(error: string)

  // Generic parse method that works with any parser
  method {:extern "ParserSnippets", "ParseJS"} 
  Parse<T>(parser: B<T>, input: string) returns (result: Result<(T, string)>)
  {
    var parseResult := parser.Apply(input);
    match parseResult {
      case ParseSuccess(value, remaining) =>
        result := Success((value, InputToString(remaining)));
      case ParseFailure(_, _) =>
        result := Failure(FailureToString(input, parseResult));
    }
  }
}
