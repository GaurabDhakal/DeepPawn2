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

    useEffect(() => {
        if (!stockfishRef.current) {
            const stockfish = new Worker(stockfishPath);
            stockfishRef.current = stockfish;

            // Listen for the UCIOK message before setting options
            stockfish.onmessage = (e) => {
                const engineMessage = e.data.toString();
                messageBufferRef.current.push(engineMessage);

                if (engineMessage === "uciok") {
                    stockfish.postMessage(
                        "setoption name Skill Level value 20"
                    );
                    stockfish.postMessage("setoption name MultiPV value 3");
                    stockfish.postMessage("setoption name Hash value 128");
                    stockfish.postMessage(
                        `setoption name Threads value ${threads}`
                    );
                }

                // Process messages in the buffer
                while (messageBufferRef.current.length > 0) {
                    const msg = messageBufferRef.current.shift();

                    if (msg) {
                        if (msg.includes("Threads")) {
                            console.log("Thread Info from Stockfish:", msg);
                        }
                    }
                }
            };

            stockfish.onerror = (error) => {
                console.error("Stockfish worker error:", error);
            };

            stockfish.postMessage("uci");
        }

        return () => {
            if (stockfishRef.current) {
                stockfishRef.current.postMessage("stop");
                stockfishRef.current.postMessage("quit");
                stockfishRef.current.terminate();
                stockfishRef.current = null;
            }
            if (analysisTimeoutRef.current) {
                clearTimeout(analysisTimeoutRef.current);
            }
        };
    }, [stockfishPath, threads]);

    const currentFen = game.fen();

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

            currentWorker.postMessage("ucinewgame");
            currentWorker.postMessage(`position fen ${currentFen}`);
            currentWorker.postMessage(
                `go depth ${Math.min(depth, 25)} searchmovetime 6000`
            );

            const messageHandler = (e: MessageEvent) => {
                const engineMessage = e.data.toString();
                messageBufferRef.current.push(engineMessage);
                console.log(engineMessage);
                // Process messages in the buffer

                // Inside your message handler processing loop:
                while (messageBufferRef.current.length > 0) {
                    const msg = messageBufferRef.current.shift();
                    if (msg) {
                        const scoreMatch = msg.match(/score cp (-?\d+)/);
                        const mateMatch = msg.match(/score mate (-?\d+)/);

                        if (mateMatch) {
                            const mateValue = parseInt(mateMatch[1], 10);
                            // Determine favored side based on mate value sign
                            let mateFavoredSide: "w" | "b" = game.turn();
                            if (mateValue < 0) {
                                mateFavoredSide =
                                    game.turn() === "w" ? "b" : "w";
                            }
                            console.log(favoredSide);
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

                        setMessage(msg);
                    }
                }
            };

            currentWorker.onmessage = messageHandler;
        }, 100);
    }, [depth, currentFen, game, threads, favoredSide]);

    return {
        message,
        messageHandler: () => message,
        formattedScore,
        mateIn,
        favoredSide,
        setMateIn,
    };
};
