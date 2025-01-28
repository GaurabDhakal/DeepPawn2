import Image from "next/image";
import { CustomPieces } from "react-chessboard/dist/chessboard/types";
import { Chessboard } from "react-chessboard";

export const pieceImages: Record<string, string> = {
    wP: "/assets/pieces/alpha/wP.png",
    wN: "/assets/pieces/alpha/wN.png",
    wB: "/assets/pieces/alpha/wB.png",
    wR: "/assets/pieces/alpha/wR.png",
    wQ: "/assets/pieces/alpha/wQ.png",
    wK: "/assets/pieces/alpha/wK.png",
    bP: "/assets/pieces/alpha/bP.png",
    bN: "/assets/pieces/alpha/bN.png",
    bB: "/assets/pieces/alpha/bB.png",
    bR: "/assets/pieces/alpha/bR.png",
    bQ: "/assets/pieces/alpha/bQ.png",
    bK: "/assets/pieces/alpha/bK.png",
};

export const customPieces: CustomPieces = {
    wP: ({ squareWidth }) => (
        <Image
            src={pieceImages.wP}
            alt="White Pawn"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    wN: ({ squareWidth }) => (
        <Image
            src={pieceImages.wN}
            alt="White Knight"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    wB: ({ squareWidth }) => (
        <Image
            src={pieceImages.wB}
            alt="White Bishop"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    wR: ({ squareWidth }) => (
        <Image
            src={pieceImages.wR}
            alt="White Rook"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    wQ: ({ squareWidth }) => (
        <Image
            src={pieceImages.wQ}
            alt="White Queen"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    wK: ({ squareWidth }) => (
        <Image
            src={pieceImages.wK}
            alt="White King"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    bP: ({ squareWidth }) => (
        <Image
            src={pieceImages.bP}
            alt="Black Pawn"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    bN: ({ squareWidth }) => (
        <Image
            src={pieceImages.bN}
            alt="Black Knight"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    bB: ({ squareWidth }) => (
        <Image
            src={pieceImages.bB}
            alt="Black Bishop"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    bR: ({ squareWidth }) => (
        <Image
            src={pieceImages.bR}
            alt="Black Rook"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    bQ: ({ squareWidth }) => (
        <Image
            src={pieceImages.bQ}
            alt="Black Queen"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
    bK: ({ squareWidth }) => (
        <Image
            src={pieceImages.bK}
            alt="Black King"
            width={squareWidth}
            height={squareWidth}
            priority
        />
    ),
};

interface ChessboardWrapperProps {
    position?: string;
    onPieceDrop?: (sourceSquare: string, targetSquare: string) => boolean;
}

export default function ChessboardWrapper({
    position,
    onPieceDrop,
}: ChessboardWrapperProps) {
    return (
        <div className="w-full max-w-[600px] aspect-square">
            <Chessboard
                position={position}
                onPieceDrop={onPieceDrop}
                customPieces={customPieces}
                boardWidth={600}
            />
        </div>
    );
}
