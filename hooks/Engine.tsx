"use client";
import { ChessInstance } from "chess.js";
import { useEffect, useRef, useState } from "react";

// Helper function to convert raw centipawn score to human-readable format
const formatScore = (score: number, color: "w" | "b"): string => {
    const adjustedScore = color === "b" ? -score : score;
    const pawns = Math.abs(adjustedScore / 100).toFixed(2);
    return adjustedScore > 0 ? `+${pawns}` : `-${pawns}`;
};

export const useEngine = (
    stockfishPath: string,
    depth: number,
    game: ChessInstance,
    threads: number
) => {
    const stockfishRef = useRef<Worker | null>(null);
    const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [formattedScore, setFormattedScore] = useState<string>("0.00");
    const [mateIn, setMateIn] = useState<string | null | undefined>(null);
    const messageBufferRef = useRef<string[]>([]);
    const [favoredSide, setFavoredSide] = useState<"w" | "b" | null>(null);
    const [debugCount, setDebugCount] = useState<number>(0);

    const currentFen = game.fen();
    useEffect(() => {
        if (!stockfishRef.current) {
            const stockfish = new Worker(stockfishPath);
            stockfishRef.current = stockfish;
            stockfish.postMessage("uci");
        }

        return () => {
            if (stockfishRef.current) {
                stockfishRef.current.postMessage("setoption name Clear Hash");
                stockfishRef.current.postMessage("stop");
                stockfishRef.current.postMessage("quit");
                stockfishRef.current.terminate();
                stockfishRef.current = null;
            }
            if (analysisTimeoutRef.current) {
                clearTimeout(analysisTimeoutRef.current);
            }
        };
    }, [stockfishPath]);

    useEffect(() => {
        const currentWorker = stockfishRef.current;
        if (!currentWorker || game.in_checkmate()) {
            currentWorker?.postMessage("stop");
            return;
        }

        if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
        }
        currentWorker.postMessage("stop");

        analysisTimeoutRef.current = setTimeout(() => {
            const currentFen = game.fen();
            /**
             * Use this when change in game instance
             */
            currentWorker.postMessage("ucinewgame");
            currentWorker.postMessage(
                `setoption name Threads value ${threads}`
            );
            currentWorker.postMessage(`position fen ${currentFen}`);
            currentWorker.postMessage(
                `go depth ${Math.min(depth, 25)} searchmovetime 6000`
            );
            const messageHandler = (e: MessageEvent) => {
                const engineMessage = e.data.toString();
                if (engineMessage) {
                    console.log(engineMessage);
                    const scoreMatch = engineMessage.match(/score cp (-?\d+)/);
                    const mateMatch = engineMessage.match(/score mate (-?\d+)/);

                    if (mateMatch) {
                        const mateValue = parseInt(mateMatch[1], 10);
                        // Determine favored side based on mate value sign
                        let mateFavoredSide: "w" | "b" = game.turn();
                        if (mateValue < 0) {
                            mateFavoredSide = game.turn() === "w" ? "b" : "w";
                        }
                        setFavoredSide(mateFavoredSide);
                        setMateIn(mateMatch[1].toString());
                    }

                    if (scoreMatch) {
                        const rawScore = parseInt(scoreMatch[1], 10);
                        const currentTurn = game.turn();

                        // Calculate adjusted score relative to White's perspective
                        const adjustedScore =
                            currentTurn === "b" ? -rawScore : rawScore;

                        // Determine favored side based on adjusted score
                        const favored = adjustedScore > 0 ? "w" : "b";
                        setFavoredSide(favored);

                        const formattedScore = formatScore(
                            rawScore,
                            currentTurn
                        );
                        setFormattedScore(formattedScore);
                    }

                    setMessage(engineMessage);
                }
                messageBufferRef.current.push(engineMessage);
                // console.log(engineMessage);
                console.log(`This has been triggered ${debugCount} times. `);
                setDebugCount((prev) => prev + 1);
            };

            currentWorker.onmessage = messageHandler;
        }, 100);
    }, [depth, currentFen, game, threads]);

    return {
        message,
        messageHandler: () => message,
        formattedScore,
        mateIn,
        favoredSide,
        setMateIn,
    };
};
