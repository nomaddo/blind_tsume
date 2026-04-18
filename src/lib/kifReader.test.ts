import { describe, it, expect } from "vitest";
import {
  parseKIF,
  getAttackerPieces,
  getDefenderPieces,
  getHandPieces,
} from "./kifReader";

// SPEC.mdに記載されている詰将棋の例
const SAMPLE_KIF = `後手の持駒：飛二 角二 金二 銀三 桂四 香四 歩十八 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・ ・ ・ ・ ・ ・ ・|一
| ・ ・ ・ ・ ・v玉 ・ ・ ・|二
| ・ ・ ・ ・ ・ ・ ・ ・ ・|三
| ・ ・ ・ ・ ・ 銀 ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| ・ ・ ・ ・ ・ ・ ・ ・ ・|六
| ・ ・ ・ ・ ・ ・ ・ ・ ・|七
| ・ ・ ・ ・ ・ ・ ・ ・ ・|八
| ・ ・ ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：金二 
先手：
後手：
手数----指手---------消費時間--
`;

describe("parseKIF", () => {
  it("KIF文字列を正常にパースできる", () => {
    const record = parseKIF(SAMPLE_KIF);
    expect(record).toBeDefined();
    expect(record.position).toBeDefined();
  });

});

describe("getAttackerPieces", () => {
  it("攻め方の駒配置を取得（4四銀）", () => {
    const record = parseKIF(SAMPLE_KIF);
    const pieces = getAttackerPieces(record.position);
    expect(pieces).toHaveLength(1);
    expect(pieces[0].suji).toBe(4);
    expect(pieces[0].dan).toBe(4);
    expect(pieces[0].pieceCode).toBe("GI");

  });
});

describe("getDefenderPieces", () => {
  it("受け方の駒配置を取得（4二玉）", () => {
    const record = parseKIF(SAMPLE_KIF);
    const pieces = getDefenderPieces(record.position);
    expect(pieces).toHaveLength(1);
    expect(pieces[0].suji).toBe(4);
    expect(pieces[0].dan).toBe(2);
    expect(pieces[0].pieceCode).toBe("OU");

  });
});

describe("getHandPieces", () => {
  it("持ち駒を取得（金2枚）", () => {
    const record = parseKIF(SAMPLE_KIF);
    const hand = getHandPieces(record.position);
    expect(hand).toHaveLength(1);
    expect(hand[0].pieceCode).toBe("KI");
    expect(hand[0].count).toBe(2);
  });
});

