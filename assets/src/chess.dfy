module Chess {
  datatype Color = Black | White
  datatype Kind = Knight(c: Color) | King(c: Color) | Pawn(c: Color)
  datatype Pos = Pos(row: int, col: int)
  type ChessPos = pos: Pos | // in this declaration, "|" means "such that" 
    && 0 <= pos.row < 8
    && 0 <= pos.col < 8 witness Pos(0, 0) // "witness" proves that the type is nonempty

  datatype Piece = Piece(kind: Kind, at: ChessPos) {
    predicate Threatens(pos: ChessPos) {
      && at != pos
      && match this.kind {
        case Knight(c) =>
          || ( && abs(pos.col - at.col) == 2
              && abs(pos.row - at.row) == 1)
          || ( && abs(pos.col - at.col) == 1
              && abs(pos.row - at.row) == 2)
        case King(c) => abs(pos.col - at.col) < 2 && abs(pos.row - at.row) < 2
        case Pawn(c) =>
          && pos.row == at.row + (if c.White? then -1 else 1)
          && (pos.col == at.col + 1 || pos.col == at.col - 1)
      }
    }
  }
  function abs(n: int): nat { if n > 0 then n else -n }

  datatype Board = Board(pieces: seq<Piece>) 
  predicate BoardIsValid(board: Board) { // See Section 4 for how we can simplify this
    // We want boards with specific pieces on it:
    && |board.pieces| == 5
    && board.pieces[0].kind == King(White) 
    && board.pieces[1].kind == Knight(Black) && board.pieces[2].kind == Knight(Black)
    && board.pieces[3].kind == Pawn(Black)   && board.pieces[4].kind == Pawn(Black)
    // No pair of pieces occupy the same square:
    && board.pieces[0].at != board.pieces[1].at && board.pieces[0].at != board.pieces[2].at && board.pieces[0].at != board.pieces[3].at && board.pieces[0].at != board.pieces[4].at 
    && board.pieces[1].at != board.pieces[2].at && board.pieces[1].at != board.pieces[3].at && board.pieces[1].at != board.pieces[4].at 
    && board.pieces[2].at != board.pieces[3].at && board.pieces[2].at != board.pieces[4].at 
    && board.pieces[3].at != board.pieces[4].at
  }
  type ValidBoard = board: Board | BoardIsValid(board) 
    witness Board([Piece(King(White), Pos(0, 0)), 
                    Piece(Knight(Black), Pos(0, 1)), Piece(Knight(Black), Pos(0, 2)),
                    Piece(Pawn(Black), Pos(0, 3)),   Piece(Pawn(Black), Pos(0, 4))])
  predicate CheckedByPlayer(board: ValidBoard, king: Piece, byPlayer: Color) {
    || CheckedByPiece(board, king, Knight(byPlayer)) 
    || CheckedByPiece(board, king, Pawn(byPlayer))
  }
  predicate CheckedByPiece(board: ValidBoard, king: Piece, byPiece: Kind) {
    match byPiece {
      case Knight(Black) => board.pieces[1].Threatens(king.at) || board.pieces[2].Threatens(king.at)
      case Pawn(Black) =>   board.pieces[3].Threatens(king.at) || board.pieces[4].Threatens(king.at)
      case _ => false
    } 
  } 
  predicate CheckmatedByPlayer(board: ValidBoard, king: Piece, byPlayer: Color) {
    && (king.at.row == 0 || king.at.col == 7 || CheckedByPlayer(board, Piece(king.kind, Pos(king.at.row - 1, king.at.col + 1)), byPlayer))
    && (                    king.at.col == 7 || CheckedByPlayer(board, Piece(king.kind, Pos(king.at.row,     king.at.col + 1)), byPlayer))
    && (king.at.row == 7 || king.at.col == 7 || CheckedByPlayer(board, Piece(king.kind, Pos(king.at.row + 1, king.at.col + 1)), byPlayer))
    && (king.at.row == 0                     || CheckedByPlayer(board, Piece(king.kind, Pos(king.at.row - 1, king.at.col)),     byPlayer))   
    &&                                          CheckedByPlayer(board, king, byPlayer)     
    && (king.at.row == 7                     || CheckedByPlayer(board, Piece(king.kind, Pos(king.at.row + 1, king.at.col)),     byPlayer))
    && (king.at.row == 0 || king.at.col == 0 || CheckedByPlayer(board, Piece(king.kind, Pos(king.at.row - 1, king.at.col - 1)), byPlayer))
    && (                 || king.at.col == 0 || CheckedByPlayer(board, Piece(king.kind, Pos(king.at.row,     king.at.col - 1)), byPlayer))
    && (king.at.row == 7 || king.at.col == 0 || CheckedByPlayer(board, Piece(king.kind, Pos(king.at.row + 1, king.at.col - 1)), byPlayer))
  }

  // {:testEntry} tells Dafny to use this method as an entry point
  method {:testEntry} Describe(board: ValidBoard) {
    var whiteKing := board.pieces[0];
    if CheckedByPlayer(board, whiteKing, Black) {
      print("White king is in check\n");
    } else {
      print("White king is safe\n");
    }
    if CheckmatedByPlayer(board, whiteKing, Black) {
      print("It is checkmate for white\n");
    } else {
      print("No checkmate yet\n"); 
    }
    SerializeToSVG(board);
  }

  method SerializeToSVG(board:Board) {
    var scale:int := 30; // default size of one square in pixels
    print "<svg width=\"",  scale * 8, 
            "\" height=\"", scale * 8, 
            "\" xmlns=\"http://www.w3.org/2000/svg\">";
    for row := 0 to 8 {
      for col := 0 to 8 {
        var pos:ChessPos := Pos(row, col);
        var image := "assets/" + if (col + row) % 2 == 0 then "light_square" else "dark_square";
        for n := 0 to |board.pieces| {
          if board.pieces[n].at != pos {
            continue;
          }
          image := image + "_" +
            (match board.pieces[n].kind.c {
              case White => "white" 
              case Black => "black"})
            + "_" + 
            (match board.pieces[n].kind {
              case King(_) => "king"
              case Knight(_) => "knight"
              case Pawn(_) => "pawn"
            });
        }
        print "\n<image x=\"",      col*scale, 
                    "\" y=\"",      row*scale, 
                    "\" width=\"",  scale,
                    "\" height=\"", scale,
                    "\" href=\"",   image,
              ".svg\" />";
      }
      print "\n";
    }
    print "</svg>\n\n";
  }
}