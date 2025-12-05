include "/Users/bhaveshbhatia/blog/blog/assets/src/test-generation/chess.dfy"
module UsersbhaveshbhatiablogblogassetssrctestgenerationchessdfyUnitTests {
import Chess
method {:test} Test0() {
var color0 : Chess.Color := Chess.Color.White;
var kind0 : Chess.Kind := Chess.Kind.King(c:=color0);
var chessPos0 : Chess.ChessPos := Chess.Pos.Pos(row:=2,col:=1);
expect 0 <= chessPos0.row < 8 && 0 <= chessPos0.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece0 : Chess.Piece := Chess.Piece.Piece(kind:=kind0,at:=chessPos0);
var color1 : Chess.Color := Chess.Color.Black;
var kind1 : Chess.Kind := Chess.Kind.Knight(c:=color1);
var chessPos1 : Chess.ChessPos := Chess.Pos.Pos(row:=2,col:=5);
expect 0 <= chessPos1.row < 8 && 0 <= chessPos1.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece1 : Chess.Piece := Chess.Piece.Piece(kind:=kind1,at:=chessPos1);
var color2 : Chess.Color := Chess.Color.Black;
var kind2 : Chess.Kind := Chess.Kind.Knight(c:=color2);
var chessPos2 : Chess.ChessPos := Chess.Pos.Pos(row:=0,col:=6);
expect 0 <= chessPos2.row < 8 && 0 <= chessPos2.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece2 : Chess.Piece := Chess.Piece.Piece(kind:=kind2,at:=chessPos2);
var color3 : Chess.Color := Chess.Color.Black;
var kind3 : Chess.Kind := Chess.Kind.Pawn(c:=color3);
var chessPos3 : Chess.ChessPos := Chess.Pos.Pos(row:=4,col:=4);
expect 0 <= chessPos3.row < 8 && 0 <= chessPos3.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece3 : Chess.Piece := Chess.Piece.Piece(kind:=kind3,at:=chessPos3);
var color4 : Chess.Color := Chess.Color.Black;
var kind4 : Chess.Kind := Chess.Kind.Pawn(c:=color4);
var chessPos4 : Chess.ChessPos := Chess.Pos.Pos(row:=0,col:=7);
expect 0 <= chessPos4.row < 8 && 0 <= chessPos4.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece4 : Chess.Piece := Chess.Piece.Piece(kind:=kind4,at:=chessPos4);
var piece5 : seq<Chess.Piece> := [piece0, piece1, piece2, piece3, piece4];
var validBoard0 : Chess.ValidBoard := Chess.Board.Board(pieces:=piece5);
expect Chess.BoardIsValid(validBoard0), "If this check fails at runtime, the test does not meet the type constraints";
Chess.Describe(validBoard0);
}
method {:test} Test1() {
var color0 : Chess.Color := Chess.Color.White;
var kind0 : Chess.Kind := Chess.Kind.King(c:=color0);
var chessPos0 : Chess.ChessPos := Chess.Pos.Pos(row:=0,col:=7);
expect 0 <= chessPos0.row < 8 && 0 <= chessPos0.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece0 : Chess.Piece := Chess.Piece.Piece(kind:=kind0,at:=chessPos0);
var color1 : Chess.Color := Chess.Color.Black;
var kind1 : Chess.Kind := Chess.Kind.Knight(c:=color1);
var chessPos1 : Chess.ChessPos := Chess.Pos.Pos(row:=1,col:=5);
expect 0 <= chessPos1.row < 8 && 0 <= chessPos1.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece1 : Chess.Piece := Chess.Piece.Piece(kind:=kind1,at:=chessPos1);
var color2 : Chess.Color := Chess.Color.Black;
var kind2 : Chess.Kind := Chess.Kind.Knight(c:=color2);
var chessPos2 : Chess.ChessPos := Chess.Pos.Pos(row:=1,col:=4);
expect 0 <= chessPos2.row < 8 && 0 <= chessPos2.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece2 : Chess.Piece := Chess.Piece.Piece(kind:=kind2,at:=chessPos2);
var color3 : Chess.Color := Chess.Color.Black;
var kind3 : Chess.Kind := Chess.Kind.Pawn(c:=color3);
var chessPos3 : Chess.ChessPos := Chess.Pos.Pos(row:=0,col:=5);
expect 0 <= chessPos3.row < 8 && 0 <= chessPos3.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece3 : Chess.Piece := Chess.Piece.Piece(kind:=kind3,at:=chessPos3);
var color4 : Chess.Color := Chess.Color.Black;
var kind4 : Chess.Kind := Chess.Kind.Pawn(c:=color4);
var chessPos4 : Chess.ChessPos := Chess.Pos.Pos(row:=0,col:=6);
expect 0 <= chessPos4.row < 8 && 0 <= chessPos4.col < 8, "If this check fails at runtime, the test does not meet the type constraints";
var piece4 : Chess.Piece := Chess.Piece.Piece(kind:=kind4,at:=chessPos4);
var piece5 : seq<Chess.Piece> := [piece0, piece1, piece2, piece3, piece4];
var validBoard0 : Chess.ValidBoard := Chess.Board.Board(pieces:=piece5);
expect Chess.BoardIsValid(validBoard0), "If this check fails at runtime, the test does not meet the type constraints";
Chess.Describe(validBoard0);
}

}
