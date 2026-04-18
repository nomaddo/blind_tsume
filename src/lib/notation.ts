// 将棋の符号を読み上げ用テキストに変換するモジュール

// 筋（列）の読み: 1〜9
const SUJI_YOMI: Record<number, string> = {
  1: "いち",
  2: "にー",
  3: "さん",
  4: "よん",
  5: "ごう",
  6: "ろく",
  7: "なな",
  8: "はち",
  9: "きゅう",
};

// 段（行）の読み: 1〜9
const DAN_YOMI: Record<number, string> = {
  1: "いち",
  2: "にー",
  3: "さん",
  4: "よん",
  5: "ごう",
  6: "ろく",
  7: "なな",
  8: "はち",
  9: "きゅう",
};

// 駒種の読み（CSA形式の駒コードから）
const PIECE_YOMI: Record<string, string> = {
  OU: "ぎょく",
  GY: "ぎょく",
  HI: "ひ",
  KA: "かく",
  KI: "きん",
  GI: "ぎん",
  KE: "けい",
  KY: "きょう",
  FU: "ふ",
  TO: "と",
  NY: "なりきょう",
  NK: "なりけい",
  NG: "なりぎん",
  UM: "うま",
  RY: "りゅう",
};

// 持ち駒の枚数の読み
const COUNT_YOMI: Record<number, string> = {
  1: "いちまい",
  2: "にまい",
  3: "さんまい",
  4: "よんまい",
  5: "ごまい",
  6: "ろくまい",
  7: "ななまい",
  8: "はちまい",
  9: "きゅうまい",
  10: "じゅうまい",
  11: "じゅういちまい",
  12: "じゅうにまい",
  13: "じゅうさんまい",
  14: "じゅうよんまい",
  15: "じゅうごまい",
  16: "じゅうろくまい",
  17: "じゅうななまい",
  18: "じゅうはちまい",
};

/** 筋・段から位置の読みを返す (例: 4,4 → "よんし") */
export function positionToYomi(suji: number, dan: number): string {
  const s = SUJI_YOMI[suji];
  const d = DAN_YOMI[dan];
  if (!s || !d) {
    throw new Error(`無効な位置: ${suji},${dan}`);
  }
  return `${s}${d}`;
}

/** 駒種コード(CSA形式)から読みを返す (例: "GI" → "ぎん") */
export function pieceToYomi(pieceCode: string): string {
  const yomi = PIECE_YOMI[pieceCode];
  if (!yomi) {
    throw new Error(`未知の駒種: ${pieceCode}`);
  }
  return yomi;
}

/** 枚数の読みを返す (例: 2 → "にまい") */
export function countToYomi(count: number): string {
  const yomi = COUNT_YOMI[count];
  if (!yomi) {
    throw new Error(`無効な枚数: ${count}`);
  }
  return yomi;
}
