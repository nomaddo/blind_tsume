// tsshogiを使ったKIF読み込み・盤面解析モジュール

import { importKIF, type ImmutableRecord, Color, type ImmutablePosition, type Piece, Square, PieceType } from "tsshogi";

/** 駒種を表すCSA形式コードに変換 */
function pieceTypeToCSA(piece: Piece): string {
  // tsshogi の Piece は type プロパティを持つ
  // PieceType: king, rook, bishop, gold, silver, knight, lance, pawn
  // 成駒: promRook, promBishop, promSilver, promKnight, promLance, promPawn
  const map: Record<string, string> = {
    king: "OU",
    rook: "HI",
    bishop: "KA",
    gold: "KI",
    silver: "GI",
    knight: "KE",
    lance: "KY",
    pawn: "FU",
    promRook: "RY",
    dragon: "RY",
    promBishop: "UM",
    horse: "UM",
    promSilver: "NG",
    promKnight: "NK",
    promLance: "NY",
    promPawn: "TO",
  };
  const code = map[piece.type];
  if (!code) {
    throw new Error(`未知の駒タイプ: ${piece.type}`);
  }
  return code;
}

/** 読み上げ用の駒配置情報 */
export interface PieceReading {
  suji: number;
  dan: number;
  pieceCode: string;
}

/** 読み上げ用の持ち駒情報 */
export interface HandReading {
  pieceCode: string;
  count: number;
}

/** KIF文字列をパースしてRecordを返す */
export function parseKIF(kifText: string): ImmutableRecord {
  const record = importKIF(kifText);
  if (record instanceof Error) {
    throw record;
  }
  return record;
}

/** 攻め方（先手）の駒配置の読みを取得 */
export function getAttackerPieces(position: ImmutablePosition): PieceReading[] {
  const pieces: PieceReading[] = [];
  // 盤面を走査して先手の駒を探す（玉を除く）
  for (let x = 1; x <= 9; x++) {
    for (let y = 1; y <= 9; y++) {
      const piece = position.board.at(new Square(x, y));
      if (piece && piece.color === Color.BLACK && piece.type !== "king") {
        const code = pieceTypeToCSA(piece);
        pieces.push({ suji: x, dan: y, pieceCode: code });
      }
    }
  }
  return pieces;
}

/** 受け方（後手=玉方）の駒配置の読みを取得 */
export function getDefenderPieces(position: ImmutablePosition): PieceReading[] {
  const pieces: PieceReading[] = [];
  for (let x = 1; x <= 9; x++) {
    for (let y = 1; y <= 9; y++) {
      const piece = position.board.at(new Square(x, y));
      if (piece && piece.color === Color.WHITE) {
        const code = pieceTypeToCSA(piece);
        pieces.push({ suji: x, dan: y, pieceCode: code });
      }
    }
  }
  return pieces;
}

/** 攻め方（先手）の持ち駒の読みを取得 */
export function getHandPieces(position: ImmutablePosition): HandReading[] {
  const hand = position.hand(Color.BLACK);
  const readings: HandReading[] = [];

  const pieceTypes = [
    { type: PieceType.ROOK, code: "HI" },
    { type: PieceType.BISHOP, code: "KA" },
    { type: PieceType.GOLD, code: "KI" },
    { type: PieceType.SILVER, code: "GI" },
    { type: PieceType.KNIGHT, code: "KE" },
    { type: PieceType.LANCE, code: "KY" },
    { type: PieceType.PAWN, code: "FU" },
  ] as const;

  for (const { type, code } of pieceTypes) {
    const count = hand.count(type);
    if (count > 0) {
      readings.push({ pieceCode: code, count });
    }
  }

  return readings;
}


