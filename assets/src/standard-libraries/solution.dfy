
import Std.BoundedInts
import Std.Collections.Seq
import Std.FileIO
import Std.Strings.DecimalConversion
import Std.Unicode.UnicodeStringsWithUnicodeChar
import Std.Wrappers
 
method Main() {
  var input :- expect ReadPuzzleInputAsString();

  var lines := Lines(input);

  var calibrationValues :- expect Seq.MapWithResult(CalibrationValue, lines);

  var total := Seq.FoldLeft((x, y) => x + y, 0, calibrationValues);
  print total, "\n";
}

method ReadPuzzleInputAsString() returns (input: Wrappers.Result<string, string>) {
  var bytesAsBVs :- FileIO.ReadBytesFromFile("input.txt");
  var bytes := seq(|bytesAsBVs|, i requires 0 <= i < |bytesAsBVs| => bytesAsBVs[i] as BoundedInts.uint8);
  
  input := UnicodeStringsWithUnicodeChar.FromUTF8Checked(bytes).ToResult("Invalid UTF8");
}

function Lines(s: string): seq<string> {
  var result := Seq.Split(s, '\n');
  // Discard the last entry if empty
  if 0 < |result| && result[|result| - 1] == "" then
    result[..(|result| - 1)]
  else
    result
}

function CalibrationValue(line: string): Wrappers.Result<nat, string> {
  var firstDigitIndex :- Seq.IndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");
  var lastDigitIndex :- Seq.LastIndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");

  var resultStr := [line[firstDigitIndex], line[lastDigitIndex]];

  Wrappers.Success(DecimalConversion.ToNat(resultStr))
}