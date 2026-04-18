// 音声読み上げロジック
// SpeechSynthesis API を使用して日本語テキストを読み上げる。

/** 音声セグメントの種別 */
export type AudioSegment =
  | { type: "position"; suji: number; dan: number }
  | { type: "piece"; name: string }
  | { type: "count"; count: number }
  | { type: "phrase"; name: string };

/** セグメントに対応する読み上げテキストを返す */
function segmentToText(segment: AudioSegment): string {
  const SUJI: Record<number, string> = {
    1: "いち", 2: "にー", 3: "さん", 4: "よん", 5: "ごう",
    6: "ろく", 7: "なな", 8: "はち", 9: "きゅう",
  };
  const DAN: Record<number, string> = {
    1: "いち", 2: "にー", 3: "さん", 4: "し", 5: "ごう",
    6: "ろく", 7: "なな", 8: "はち", 9: "きゅう",
  };
  const PIECE: Record<string, string> = {
    OU: "ぎょく", GY: "ぎょく", HI: "ひ", KA: "かく", KI: "きん",
    GI: "ぎん", KE: "けい", KY: "きょう", FU: "ふ", TO: "と",
    NY: "なりきょう", NK: "なりけい", NG: "なりぎん", UM: "うま", RY: "りゅう",
  };
  const COUNT: Record<number, string> = {
    1: "いちまい", 2: "にまい", 3: "さんまい", 4: "よんまい",
    5: "ごまい", 6: "ろくまい", 7: "ななまい", 8: "はちまい",
    9: "きゅうまい", 10: "じゅうまい", 11: "じゅういちまい",
    12: "じゅうにまい", 13: "じゅうさんまい", 14: "じゅうよんまい",
    15: "じゅうごまい", 16: "じゅうろくまい", 17: "じゅうななまい",
    18: "じゅうはちまい",
  };
  const PHRASE: Record<string, string> = {
    semegata: "せめかた", gyokugata: "ぎょくがた",
    mochigoma: "もちごまは", desu: "です", arimasen: "ありません",
  };

  switch (segment.type) {
    case "position":
      return (SUJI[segment.suji] ?? "") + (DAN[segment.dan] ?? "");
    case "piece":
      return PIECE[segment.name] ?? segment.name;
    case "count":
      return COUNT[segment.count] ?? `${segment.count}まい`;
    case "phrase":
      return PHRASE[segment.name] ?? segment.name;
  }
}

/** SpeechSynthesisで読み上げて完了を待つ */
function speakText(text: string): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 1.0;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    speechSynthesis.speak(utterance);
  });
}

/** 再生を中断するためのAbortController */
let currentAbort: AbortController | null = null;

/** 現在の再生を停止 */
export function stopPlayback(): void {
  currentAbort?.abort();
  currentAbort = null;
  speechSynthesis.cancel();
}

/** セグメント列を順番に読み上げる */
export async function playSegments(
  segments: AudioSegment[],
): Promise<void> {
  stopPlayback();
  const abort = new AbortController();
  currentAbort = abort;

  for (const segment of segments) {
    if (abort.signal.aborted) return;

    const text = segmentToText(segment);
    await speakText(text);

    // セグメント間に短いポーズ
    if (!abort.signal.aborted) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  if (currentAbort === abort) {
    currentAbort = null;
  }
}

/** 攻め方の駒配置を読み上げるセグメント列を生成 */
export function buildAttackerSegments(
  pieces: { suji: number; dan: number; pieceCode: string }[],
): AudioSegment[] {
  const segments: AudioSegment[] = [{ type: "phrase", name: "semegata" }];
  for (const p of pieces) {
    segments.push({ type: "position", suji: p.suji, dan: p.dan });
    segments.push({ type: "piece", name: p.pieceCode });
  }
  return segments;
}

/** 受け方の駒配置を読み上げるセグメント列を生成 */
export function buildDefenderSegments(
  pieces: { suji: number; dan: number; pieceCode: string }[],
): AudioSegment[] {
  const segments: AudioSegment[] = [{ type: "phrase", name: "gyokugata" }];
  for (const p of pieces) {
    segments.push({ type: "position", suji: p.suji, dan: p.dan });
    segments.push({ type: "piece", name: p.pieceCode });
  }
  return segments;
}

/** 持ち駒を読み上げるセグメント列を生成 */
export function buildHandSegments(
  hand: { pieceCode: string; count: number }[],
): AudioSegment[] {
  const segments: AudioSegment[] = [{ type: "phrase", name: "mochigoma" }];
  if (hand.length === 0) {
    segments.push({ type: "phrase", name: "arimasen" });
  } else {
    for (const h of hand) {
      segments.push({ type: "piece", name: h.pieceCode });
      segments.push({ type: "count", count: h.count });
    }
    segments.push({ type: "phrase", name: "desu" });
  }
  return segments;
}

/** 全読み上げセグメント列を生成 */
export function buildFullSegments(
  attackerPieces: { suji: number; dan: number; pieceCode: string }[],
  defenderPieces: { suji: number; dan: number; pieceCode: string }[],
  hand: { pieceCode: string; count: number }[],
): AudioSegment[] {
  return [
    ...buildAttackerSegments(attackerPieces),
    ...buildDefenderSegments(defenderPieces),
    ...buildHandSegments(hand),
  ];
}
