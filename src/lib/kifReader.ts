// tsshogiを使ったKIF読み込み・盤面解析モジュール

import { importKIF, type ImmutableRecord, Color, type ImmutablePosition, type Piece, Square } from "tsshogi";
import { positionToYomi, pieceToYomi, countToYomi } from "./notation";

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
    promBishop: "UM",
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
  yomi: string; // "よんよん ぎん" のような完全な読み
}

/** 読み上げ用の持ち駒情報 */
export interface HandReading {
  pieceCode: string;
  count: number;
  yomi: string; // "きん にまい" のような読み
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
        const yomi = `${positionToYomi(x, y)} ${pieceToYomi(code)}`;
        pieces.push({ suji: x, dan: y, pieceCode: code, yomi });
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
        const yomi = `${positionToYomi(x, y)} ${pieceToYomi(code)}`;
        pieces.push({ suji: x, dan: y, pieceCode: code, yomi });
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
    { type: "rook", code: "HI" },
    { type: "bishop", code: "KA" },
    { type: "gold", code: "KI" },
    { type: "silver", code: "GI" },
    { type: "knight", code: "KE" },
    { type: "lance", code: "KY" },
    { type: "pawn", code: "FU" },
  ] as const;

  for (const { type, code } of pieceTypes) {
    const count = hand.count(type);
    if (count > 0) {
      const yomi = `${pieceToYomi(code)} ${countToYomi(count)}`;
      readings.push({ pieceCode: code, count, yomi });
    }
  }

  return readings;
}

/** 詰将棋の全情報を読み上げテキストとして生成 */
export function generateFullReading(kifText: string): {
  attacker: string;
  defender: string;
  hand: string;
} {
  const record = parseKIF(kifText);
  const position = record.position;

  const attackerPieces = getAttackerPieces(position);
  const defenderPieces = getDefenderPieces(position);
  const handPieces = getHandPieces(position);

  const attackerText = "攻め方 " + attackerPieces.map((p) => p.yomi).join(" ");
  const defenderText = "玉方 " + defenderPieces.map((p) => p.yomi).join(" ");
  const handText =
    handPieces.length > 0
      ? "持ち駒は " + handPieces.map((p) => p.yomi).join(" ") + " です"
      : "持ち駒は ありません";

  return { attacker: attackerText, defender: defenderText, hand: handText };
}
