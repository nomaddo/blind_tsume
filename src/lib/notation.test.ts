import { describe, it, expect } from "vitest";
import { positionToYomi, pieceToYomi, countToYomi } from "./notation";

describe("positionToYomi", () => {
  it("4四 → よんよん", () => {
    expect(positionToYomi(4, 4)).toBe("よんよん");
  });

  it("4二 → よんにー", () => {
    expect(positionToYomi(4, 2)).toBe("よんにー");
  });

  it("7六 → ななろく", () => {
    expect(positionToYomi(7, 6)).toBe("ななろく");
  });

  it("5三 → ごうさん", () => {
    expect(positionToYomi(5, 3)).toBe("ごうさん");
  });

  it("1一 → いちいち", () => {
    expect(positionToYomi(1, 1)).toBe("いちいち");
  });

  it("9九 → きゅうきゅう", () => {
    expect(positionToYomi(9, 9)).toBe("きゅうきゅう");
  });

  it("無効な筋でエラー", () => {
    expect(() => positionToYomi(0, 1)).toThrow("無効な位置");
  });
});

describe("pieceToYomi", () => {
  it("OU → ぎょく", () => {
    expect(pieceToYomi("OU")).toBe("ぎょく");
  });

  it("GI → ぎん", () => {
    expect(pieceToYomi("GI")).toBe("ぎん");
  });

  it("KI → きん", () => {
    expect(pieceToYomi("KI")).toBe("きん");
  });

  it("FU → ふ", () => {
    expect(pieceToYomi("FU")).toBe("ふ");
  });

  it("RY → りゅう", () => {
    expect(pieceToYomi("RY")).toBe("りゅう");
  });

  it("UM → うま", () => {
    expect(pieceToYomi("UM")).toBe("うま");
  });

  it("未知の駒でエラー", () => {
    expect(() => pieceToYomi("XX")).toThrow("未知の駒種");
  });
});

describe("countToYomi", () => {
  it("1 → いちまい", () => {
    expect(countToYomi(1)).toBe("いちまい");
  });

  it("2 → にまい", () => {
    expect(countToYomi(2)).toBe("にまい");
  });

  it("18 → じゅうはちまい", () => {
    expect(countToYomi(18)).toBe("じゅうはちまい");
  });

  it("無効な枚数でエラー", () => {
    expect(() => countToYomi(0)).toThrow("無効な枚数");
  });
});
