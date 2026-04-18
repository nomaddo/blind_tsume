import { useState, useEffect, useCallback, useRef } from "react";
import {
  parseKIF,
  getAttackerPieces,
  getDefenderPieces,
  getHandPieces,
  type PieceReading,
  type HandReading,
} from "../lib/kifReader";
import {
  playSegments,
  stopPlayback,
  buildAttackerSegments,
  buildDefenderSegments,
  buildHandSegments,
  buildFullSegments,
} from "../lib/audioPlayer";
import { exportKIF, type ImmutableRecord } from "tsshogi";
import { decodeText } from "../lib/encoding";

/** KIFファイルの情報 */
interface KifFile {
  name: string;
  content: string;
}

/** Tauriが利用可能かどうか */
function isTauri(): boolean {
  return "__TAURI__" in window;
}

/** KIFファイル一覧をロード（Tauri or Web） */
async function loadKifFiles(folderPath?: string): Promise<KifFile[]> {
  if (isTauri() && folderPath) {
    const { readDir, readFile } = await import("@tauri-apps/plugin-fs");
    const entries = await readDir(folderPath);
    const kifFiles: KifFile[] = [];
    for (const entry of entries) {
      if (entry.name && /\.kif$/i.test(entry.name)) {
        const bytes = await readFile(`${folderPath}/${entry.name}`);
        const content = decodeText(bytes);
        kifFiles.push({ name: entry.name, content });
      }
    }
    kifFiles.sort((a, b) => a.name.localeCompare(b.name));
    return kifFiles;
  }
  return [];
}

/** Tauriのフォルダ選択ダイアログ */
async function selectFolder(): Promise<string | null> {
  if (!isTauri()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  const result = await open({ directory: true });
  return typeof result === "string" ? result : null;
}

/** 設定の保存・読み込み */
async function saveLastFolder(path: string): Promise<void> {
  if (isTauri()) {
    try {
      const { load } = await import("@tauri-apps/plugin-store");
      const store = await load("settings.json");
      await store.set("lastFolder", path);
      await store.save();
    } catch {
      // プラグイン未設定時は無視
    }
  } else {
    localStorage.setItem("lastFolder", path);
  }
}

async function loadLastFolder(): Promise<string | null> {
  if (isTauri()) {
    try {
      const { load } = await import("@tauri-apps/plugin-store");
      const store = await load("settings.json");
      return (await store.get<string>("lastFolder")) ?? null;
    } catch {
      return null;
    }
  }
  return localStorage.getItem("lastFolder");
}

export default function Player() {
  const [kifFiles, setKifFiles] = useState<KifFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [boardText, setBoardText] = useState("");
  const [statusMessage, setStatusMessage] = useState("フォルダを選択してください");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 現在のKIFの解析結果
  const [record, setRecord] = useState<ImmutableRecord | null>(null);
  const [attackerPieces, setAttackerPieces] = useState<PieceReading[]>([]);
  const [defenderPieces, setDefenderPieces] = useState<PieceReading[]>([]);
  const [handPieces, setHandPieces] = useState<HandReading[]>([]);

  // KIFファイルをパースして状態を更新
  const loadCurrentKif = useCallback(
    (files: KifFile[], index: number) => {
      if (files.length === 0 || index < 0 || index >= files.length) return;
      const file = files[index];
      try {
        const rec = parseKIF(file.content);
        setRecord(rec);
        const pos = rec.position;
        setAttackerPieces(getAttackerPieces(pos));
        setDefenderPieces(getDefenderPieces(pos));
        setHandPieces(getHandPieces(pos));
        setBoardText(exportKIF(rec));
        setShowBoard(false);
        setStatusMessage(`${index + 1} / ${files.length} : ${file.name}`);
      } catch (e) {
        setStatusMessage(`読み込みエラー: ${file.name} - ${e}`);
      }
    },
    [],
  );

  // 初回ロード: 前回のフォルダを復元
  useEffect(() => {
    (async () => {
      const last = await loadLastFolder();
      if (last && isTauri()) {
        setFolderPath(last);
        const files = await loadKifFiles(last);
        if (files.length > 0) {
          setKifFiles(files);
          loadCurrentKif(files, 0);
        }
      }
    })();
  }, [loadCurrentKif]);

  // フォルダ選択ハンドラ
  const handleSelectFolder = useCallback(async () => {
    if (isTauri()) {
      const path = await selectFolder();
      if (!path) return;
      setFolderPath(path);
      await saveLastFolder(path);
      const files = await loadKifFiles(path);
      setKifFiles(files);
      setCurrentIndex(0);
      if (files.length > 0) {
        loadCurrentKif(files, 0);
        // 自動読み上げ
        const pos = parseKIF(files[0].content).position;
        const ap = getAttackerPieces(pos);
        const dp = getDefenderPieces(pos);
        const hp = getHandPieces(pos);
        await playSegments(buildFullSegments(ap, dp, hp));
      } else {
        setStatusMessage("KIFファイルが見つかりません");
      }
    } else {
      // Web版: file input を使う
      fileInputRef.current?.click();
    }
  }, [loadCurrentKif]);

  // Web版: ファイル選択ハンドラ
  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList) return;
      const files: KifFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        if (/\.kif$/i.test(f.name)) {
          const buf = await f.arrayBuffer();
          const content = decodeText(new Uint8Array(buf));
          files.push({ name: f.name, content });
        }
      }
      files.sort((a, b) => a.name.localeCompare(b.name));
      setKifFiles(files);
      setCurrentIndex(0);
      if (files.length > 0) {
        loadCurrentKif(files, 0);
        const pos = parseKIF(files[0].content).position;
        const ap = getAttackerPieces(pos);
        const dp = getDefenderPieces(pos);
        const hp = getHandPieces(pos);
        await playSegments(buildFullSegments(ap, dp, hp));
      } else {
        setStatusMessage("KIFファイルが見つかりません");
      }
    },
    [loadCurrentKif],
  );

  // 次/前のKIFに移動
  const goToKif = useCallback(
    async (index: number) => {
      if (index < 0 || index >= kifFiles.length) return;
      stopPlayback();
      setCurrentIndex(index);
      loadCurrentKif(kifFiles, index);
      // 自動読み上げ
      try {
        const pos = parseKIF(kifFiles[index].content).position;
        const ap = getAttackerPieces(pos);
        const dp = getDefenderPieces(pos);
        const hp = getHandPieces(pos);
        await playSegments(buildFullSegments(ap, dp, hp));
      } catch {
        // 読み込みエラー時は無視
      }
    },
    [kifFiles, loadCurrentKif],
  );

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // テキスト入力中は無視
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;

      switch (e.key) {
        case " ":
        case "ArrowRight":
          e.preventDefault();
          goToKif(currentIndex + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToKif(currentIndex - 1);
          break;
        case "a":
        case "A":
          e.preventDefault();
          stopPlayback();
          await playSegments(buildAttackerSegments(attackerPieces));
          break;
        case "s":
        case "S":
          e.preventDefault();
          stopPlayback();
          await playSegments(buildDefenderSegments(defenderPieces));
          break;
        case "d":
        case "D":
          e.preventDefault();
          stopPlayback();
          await playSegments(buildHandSegments(handPieces));
          break;
        case "f":
        case "F":
          e.preventDefault();
          setShowBoard((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, attackerPieces, defenderPieces, handPieces, goToKif]);

  return (
    <div className="player">
      <div className="toolbar">
        <button onClick={handleSelectFolder}>フォルダ選択</button>
        <span className="folder-path">{folderPath ?? ""}</span>
        {/* Web版用の隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          /* @ts-expect-error webkitdirectory is not in standard types */
          webkitdirectory=""
          multiple
          style={{ display: "none" }}
          onChange={handleFileInput}
        />
      </div>

      <div className="status">{statusMessage}</div>

      {record && (
        <div className="controls">
          <div className="nav-buttons">
            <button
              onClick={() => goToKif(currentIndex - 1)}
              disabled={currentIndex <= 0}
            >
              ← 前へ
            </button>
            <span className="problem-number">
              問題 {currentIndex + 1} / {kifFiles.length}
            </span>
            <button
              onClick={() => goToKif(currentIndex + 1)}
              disabled={currentIndex >= kifFiles.length - 1}
            >
              次へ →
            </button>
          </div>

          <div className="action-buttons">
            <button onClick={() => playSegments(buildAttackerSegments(attackerPieces))}>
              [A] 攻め方
            </button>
            <button onClick={() => playSegments(buildDefenderSegments(defenderPieces))}>
              [S] 玉方
            </button>
            <button onClick={() => playSegments(buildHandSegments(handPieces))}>
              [D] 持ち駒
            </button>
            <button onClick={() => setShowBoard((prev) => !prev)}>
              [F] {showBoard ? "盤面を隠す" : "盤面を表示"}
            </button>
          </div>

          {showBoard && (
            <pre className="board-display">{boardText}</pre>
          )}

          <div className="shortcuts-help">
            <p>
              <kbd>Space</kbd>/<kbd>→</kbd> 次の問題　
              <kbd>←</kbd> 前の問題　
              <kbd>A</kbd> 攻め方　
              <kbd>S</kbd> 玉方　
              <kbd>D</kbd> 持ち駒　
              <kbd>F</kbd> 盤面表示
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
