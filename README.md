# blind_tsume — 詰将棋読み上げツール

KIF ファイルに記述された詰将棋の駒配置を音声で読み上げるデスクトップアプリです。  
目隠し将棋（ブラインド詰将棋）のトレーニングに使用できます。

## 機能

- フォルダ内の KIF ファイルを順番に読み込み
- 攻め方・玉方・持ち駒を日本語で音声読み上げ
- キーボードショートカットで操作（Space/→: 次、←: 前、A: 攻め方、S: 玉方、D: 持ち駒、F: 盤面表示）
- 前回開いたフォルダを記憶
- Windows / Linux デスクトップアプリ、Web ブラウザの両方で動作

## 必要環境

### 共通

- [Node.js](https://nodejs.org/) 20 以上
- npm 10 以上

### デスクトップ版（Tauri）ビルド時に追加で必要

- [Rust](https://www.rust-lang.org/tools/install) 1.77.2 以上（`rustup` で導入）

#### Windows

```powershell
# WebView2 は Windows 10/11 に標準搭載
# Visual Studio Build Tools (C++ デスクトップ開発) が必要
winget install Microsoft.VisualStudio.2022.BuildTools
```

#### Ubuntu / Debian

```bash
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf
```

## セットアップ

```bash
git clone https://github.com/<your-account>/blind_tsume.git
cd blind_tsume
npm install
```

## 開発

```bash
# フロントエンドのみ（ブラウザ版）
npm run dev
# → http://localhost:5173 で起動

# Tauri デスクトップアプリとして起動
npx tauri dev
```

### テスト

```bash
npm test           # テスト実行
npm run test:watch # ウォッチモード
```

### Lint

```bash
npm run lint
```

## ビルド

### Web 版

```bash
npm run build
```

`dist/` ディレクトリに静的ファイルが出力されます。任意の Web サーバでホスティングできます。

### デスクトップ版（Tauri）

```bash
npx tauri build
```

ビルド成果物は `src-tauri/target/release/bundle/` に出力されます。

| OS | 出力形式 | パス |
|---|---|---|
| Windows | NSIS インストーラ (.exe) | `bundle/nsis/blind-tsume_*_x64-setup.exe` |
| Windows | MSI インストーラ (.msi) | `bundle/msi/blind-tsume_*_x64_en-US.msi` |
| Linux | Debian パッケージ (.deb) | `bundle/deb/blind-tsume_*_amd64.deb` |
| Linux | AppImage (.AppImage) | `bundle/appimage/blind-tsume_*_amd64.AppImage` |
| macOS | ディスクイメージ (.dmg) | `bundle/dmg/blind-tsume_*_x64.dmg` |

> **Note:** 各プラットフォームのバイナリは、そのプラットフォーム上でビルドする必要があります。  
> クロスコンパイルは公式にはサポートされていません。

### 特定フォーマットのみビルド

```bash
# Windows: NSIS インストーラのみ
npx tauri build --bundles nsis

# Linux: deb のみ
npx tauri build --bundles deb

# Linux: AppImage のみ
npx tauri build --bundles appimage
```

## CI/CD での自動ビルド（GitHub Actions）

GitHub Actions で各プラットフォーム向けのバイナリを自動ビルドし、Release に添付できます。

`.github/workflows/release.yml` の例:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
          # - os: macos-latest
          #   target: aarch64-apple-darwin

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: dtolnay/rust-toolchain@stable

      - name: Install system dependencies (Linux)
        if: runner.os == 'Linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf

      - name: Install npm dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'blind-tsume ${{ github.ref_name }}'
          releaseBody: 'See CHANGELOG for details.'
          releaseDraft: true
```

### リリース手順

```bash
# 1. バージョンを更新
#    - package.json の "version"
#    - src-tauri/tauri.conf.json の "version"
#    - src-tauri/Cargo.toml の "version"

# 2. タグを打って push
git tag v0.1.0
git push origin v0.1.0
# → GitHub Actions が自動でビルド＆Draft Release 作成
```

## 配布方法

### Windows ユーザへの配布

1. `npx tauri build --bundles nsis` でインストーラを作成
2. `blind-tsume_*_x64-setup.exe` を配布
3. ユーザはダブルクリックでインストール

> インストーラは未署名のため、SmartScreen 警告が表示されます。  
> 署名が必要な場合は [Tauri コード署名ドキュメント](https://v2.tauri.app/distribute/sign/windows/) を参照してください。

### Linux ユーザへの配布

- `.deb`: `sudo dpkg -i blind-tsume_*_amd64.deb`
- `.AppImage`: `chmod +x blind-tsume_*.AppImage && ./blind-tsume_*.AppImage`

### Web 版の公開

```bash
npm run build
# dist/ を Netlify, Vercel, GitHub Pages 等にデプロイ
```

Web 版ではフォルダ選択に `<input webkitdirectory>` を使用するため、Chrome / Edge 推奨です。

## KIF ファイルの準備

`sample_kif/` にサンプルファイルがあります。  
任意の詰将棋 KIF ファイル（`.kif`）をフォルダにまとめて、アプリから開いてください。

## 技術スタック

| 層 | 技術 |
|---|---|
| デスクトップ | Tauri v2 (Rust) |
| フロントエンド | React 19 + TypeScript + Vite |
| KIF パーサー | tsshogi |
| 音声再生 | SpeechSynthesis |

## ライセンス

MIT
