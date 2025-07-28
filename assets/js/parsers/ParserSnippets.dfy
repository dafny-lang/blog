/*
 * Parser Snippets in Dafny
 * This file is auto-generated from the HTML file
 * DO NOT EDIT DIRECTLY
 */
module ParserSnippets {
  import opened Std.Parsers.StringBuilders

  // Parser: AngerParser
  const AngerParser := CharTest(c => c == '😠' || c == '😡' || c == '🤬' || c == '😤', "anger")

  // Parser: JoyParser
  const JoyParser := CharTest(c => c == '😀' || c == '😃' || c == '😄' || c == '😁' || c == '🥳', "joy").Rep()

  // Parser: JoyScoreParser
  const JoyScoreParser := CharTest(c => c == '😀' || c == '😃' || c == '😄' || c == '😁' || c == '🥳', "joy").Rep().M(joyString => |joyString| * 2)

  // Parser: WSParser
  const WSParser := WS

  // Parser: IdentifierParser
  const IdentifierParser := CharTest(c => 'a' <= c <= 'z' || 'A' <= c <= 'Z', "letter").Rep1()

  // Parser: SExprStart_I_I
  const SExprStart_I_I := S("(").I_I(IdentifierParser)

  // Parser: SExprStart_e_I
  const SExprStart_e_I := S("(").e_I(IdentifierParser)

  // Parser: SExprStart_I_e
  const SExprStart_I_e := S("(").I_e(IdentifierParser)

  // Parser: EmotionParser
  const EmotionParser := O([AngerParser, CharTest(c => c == '😀' || c == '😃' || c == '😄' || c == '😁' || c == '🥳', "joy")])

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
