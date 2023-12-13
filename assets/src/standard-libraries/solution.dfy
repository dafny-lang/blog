
import Std.Collections.Seq
import Std.FileIO
import Std.Strings.DecimalConversion
import Std.Wrappers
 
method Main() {
  var input := ReadPuzzleInputAsString();
  var lines := Lines(input);

  var calibrationValues :- expect Seq.MapWithResult(CalibrationValue, lines);

  var total := Seq.FoldLeft((x, y) => x + y, 0, calibrationValues);
  print total, "\n";
}

method ReadPuzzleInputAsString() returns (input: string) {
  var bytes :- expect FileIO.ReadBytesFromFile("input.txt");
  input := seq(|bytes|, i requires 0 <= i < |bytes| => bytes[i] as char);
}

function Lines(s: string): seq<string> {
  var result := Seq.Split(s, '\n');
  var numLines := |result|;
  if 0 < |result| && result[|result| - 1] == "" then
    result[..(numLines - 1)]
  else
    result
}

function CalibrationValue(line: string): Wrappers.Result<nat, string> {
  var firstDigitIndex :- Seq.IndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");

  var lastDigitIndex :- Seq.LastIndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");

  var resultStr := [line[firstDigitIndex]] + [line[lastDigitIndex]];

  Wrappers.Success(DecimalConversion.ToNat(resultStr))
}