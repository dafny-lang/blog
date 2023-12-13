
include "../utils.dfy"

import opened Std.Wrappers
import opened Std.Collections.Seq
import opened Std.Strings.DecimalConversion
 
method Main() {
  var input := Utils.ReadPuzzleInputAsString();
  var lines := Utils.Lines(input);

  var calibrationValues :- expect Seq.MapWithResult(CalibrationValue, lines);

  var total := Seq.FoldLeft((x, y) => x + y, 0, calibrationValues);
  print total, "\n";
}

function CalibrationValue(line: string): Result<nat, string> {
  var firstDigitIndex :- Seq.IndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");

  var lastDigitIndex :- Seq.LastIndexByOption(line, DecimalConversion.IsDigitChar).ToResult("No digits");

  var resultStr := [line[firstDigitIndex]] + [line[lastDigitIndex]];

  Success(ToNat(resultStr))
}