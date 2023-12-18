
// Module contents not indented so they match the indentation
// of the rest of the snippets when included by inline-dafny
module M1 {

import Std.BoundedInts
import Std.Collections.Seq
import Std.FileIO
import Std.Strings
import Std.Strings.DecimalConversion
import Std.Unicode.UnicodeStringsWithUnicodeChar
import Std.Wrappers

method Main() {
  var input :- expect ReadPuzzleInput();

  var lines := Seq.Split(input, '\n');

  var calibrationValues :- expect Seq.MapWithResult(CalibrationValue, lines);

  var total := Seq.FoldLeft((x, y) => x + y, 0, calibrationValues);
  print total, "\n";
}

method ReadPuzzleInput() returns (input: Wrappers.Result<string, string>) {
  var bytesAsBVs :- FileIO.ReadBytesFromFile("input.txt");
  var bytes := seq(|bytesAsBVs|, i requires 0 <= i < |bytesAsBVs| => bytesAsBVs[i] as BoundedInts.uint8);
  
  input := UnicodeStringsWithUnicodeChar.FromUTF8Checked(bytes).ToResult("Invalid UTF8");
}

function CalibrationValue(line: string): Wrappers.Result<nat, string> {
  var firstDigitIndex :- Seq.IndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");
  var lastDigitIndex :- Seq.LastIndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");

  var resultStr := [line[firstDigitIndex], line[lastDigitIndex]];

  Wrappers.Success(Strings.ToNat(resultStr))
}

}
