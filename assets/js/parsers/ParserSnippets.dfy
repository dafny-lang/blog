/*
 * Parser Snippets in Dafny
 * This file is auto-generated from the HTML file
 * DO NOT EDIT DIRECTLY
 */
module ParserSnippets {
  import opened Std.Parsers.StringBuilders

  // Parser: WSParser
  const WSParser := WS

  // Parser: HelloParser
  const HelloParser := S("Hello")

  // Parser: HelloSpace_I_I
  const HelloSpace_I_I := S("Hello").I_I(S(" "))

  // Parser: HelloSpace_I_e
  const HelloSpace_I_e := S("Hello").I_e(S(" "))

  // Parser: HelloSpace_e_I
  const HelloSpace_e_I := S("Hello").e_I(S(" "))

  // Parser: Digits
  const Digits := CharTest(c => '0' <= c <= '9', "digit").Rep()

  // Parser: Digits1
  const Digits1 := CharTest(c => '0' <= c <= '9', "digit").Rep1()

  // Parser: Greeting
  const Greeting := O([S("Hello"), S("Hi")])

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
