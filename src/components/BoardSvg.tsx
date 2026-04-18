import { type ImmutablePosition, Color, Square, PieceType } from "tsshogi";

const PIECE_CHAR: Record<string, string> = {
    king: "玉",
    rook: "飛",
    bishop: "角",
    gold: "金",
    silver: "銀",
    knight: "桂",
    lance: "香",
    pawn: "歩",
    promPawn: "と",
    promLance: "杏",
    promKnight: "圭",
    promSilver: "全",
    horse: "馬",
    dragon: "龍",
};

const PROMOTED = new Set(["promPawn", "promLance", "promKnight", "promSilver", "horse", "dragon"]);

const HAND_ORDER = [
    PieceType.ROOK,
    PieceType.BISHOP,
    PieceType.GOLD,
    PieceType.SILVER,
    PieceType.KNIGHT,
    PieceType.LANCE,
    PieceType.PAWN,
] as const;

const RANK_CHARS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

const CELL = 48;
const MARGIN_TOP = 28;   // 段番号用
const MARGIN_LEFT = 28;
const MARGIN_RIGHT = 28; // 筋番号用

interface Props {
    position: ImmutablePosition;
}

function HandLabel({
    hand,
    label,
    color,
}: {
    hand: ReturnType<ImmutablePosition["hand"]>;
    label: string;
    color: string;
}) {
    const items = HAND_ORDER.map((t) => ({ type: t, count: hand.count(t) })).filter(
        ({ count }) => count > 0,
    );

    return (
        <div style={{ fontSize: 13, color, margin: "4px 0" }}>
            {label}：
            {items.length === 0
                ? "なし"
                : items.map(({ type, count }) => (
                    <span key={type} style={{ marginRight: 6 }}>
                        {PIECE_CHAR[type]}
                        {count > 1 ? `×${count}` : ""}
                    </span>
                ))}
        </div>
    );
}

export default function BoardSvg({ position }: Props) {
    const svgWidth = MARGIN_LEFT + CELL * 9 + MARGIN_RIGHT;
    const svgHeight = MARGIN_TOP + CELL * 9;

    const cells: React.ReactElement[] = [];

    // マス目と駒
    for (let x = 1; x <= 9; x++) {
        for (let y = 1; y <= 9; y++) {
            // 筋は右から1,2,...,9 → SVG上はxが大きいほど左
            const cx = MARGIN_LEFT + (9 - x) * CELL;
            const cy = MARGIN_TOP + (y - 1) * CELL;

            cells.push(
                <rect
                    key={`cell-${x}-${y}`}
                    x={cx}
                    y={cy}
                    width={CELL}
                    height={CELL}
                    fill="#f0d090"
                    stroke="#5a3a10"
                    strokeWidth={0.8}
                />,
            );

            const piece = position.board.at(new Square(x, y));
            if (piece) {
                const char = PIECE_CHAR[piece.type] ?? "?";
                const isWhite = piece.color === Color.WHITE;
                const isPromoted = PROMOTED.has(piece.type);
                const fill = isPromoted ? "#cc0000" : "#1a1a1a";
                const centerX = cx + CELL / 2;
                const centerY = cy + CELL / 2;

                cells.push(
                    <text
                        key={`piece-${x}-${y}`}
                        x={centerX}
                        y={centerY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={CELL * 0.62}
                        fill={fill}
                        fontFamily="serif"
                        transform={isWhite ? `rotate(180,${centerX},${centerY})` : undefined}
                    >
                        {char}
                    </text>,
                );
            }
        }
    }

    // 筋ラベル（上端：9〜1 左→右）
    const fileLabels = Array.from({ length: 9 }, (_, i) => {
        const x = 9 - i; // 左から i=0 → x=9, i=8 → x=1
        return (
            <text
                key={`file-${x}`}
                x={MARGIN_LEFT + i * CELL + CELL / 2}
                y={MARGIN_TOP / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={14}
                fill="#333"
            >
                {x}
            </text>
        );
    });

    // 段ラベル（右端：一〜九 上→下）
    const rankLabels = Array.from({ length: 9 }, (_, i) => (
        <text
            key={`rank-${i}`}
            x={MARGIN_LEFT + 9 * CELL + MARGIN_RIGHT / 2}
            y={MARGIN_TOP + i * CELL + CELL / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fill="#333"
        >
            {RANK_CHARS[i]}
        </text>
    ));

    return (
        <div style={{ display: "inline-block", userSelect: "none" }}>
            <HandLabel
                hand={position.hand(Color.WHITE)}
                label="玉方持ち駒"
                color="#888"
            />
            <svg
                width={svgWidth}
                height={svgHeight}
                style={{ display: "block", border: "1px solid #5a3a10" }}
            >
                {fileLabels}
                {cells}
                {rankLabels}
            </svg>
            <HandLabel
                hand={position.hand(Color.BLACK)}
                label="攻め方持ち駒"
                color="#333"
            />
        </div>
    );
}
