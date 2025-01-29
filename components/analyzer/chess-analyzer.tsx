"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Chess, ChessInstance, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Toaster, toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { LoadingSpinner } from "../loading-spinner";
import EvaluationBar from "./evaluation-bar";
import {
    BoardOrientation,
    Piece,
    Square,
} from "react-chessboard/dist/chessboard/types";
import { Slider } from "../ui/slider";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { playAudio } from "@/utils/soundeffects";
import { useEngine } from "@/hooks/Engine";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    RotateCcw,
    User,
} from "lucide-react";
import { AudioLinks } from "@/data/playbackAudio";
import { JSX } from "react/jsx-runtime";

const ChessApp = () => {
    const [game, setGame] = useState(new Chess());
    const [checkmateState, setCheckmateState] = useState<boolean>(false);
    const [orientation, setOrientation] = useState<BoardOrientation>("white");
    const [gameHistory, setGameHistory] = useState<Move[]>([]);
    const [possibleMoves, setPossibleMoves] = useState<{
        [square: string]: React.CSSProperties;
    }>({});
    const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
    const [checkmateMessage, setCheckmateMessage] = useState<string>("");
    const [stockfishState, setStockfishState] = useState(false);
    const [bestMove, setBestMove] = useState<string | undefined>(undefined);
    const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);

    const [depth, setDepth] = useState<number>(10);
    const [highlightedSquares, setHighlightedSquares] = useState<{
        [key: string]: React.CSSProperties;
    }>({});
    const [rightClickedSquares, setRightClickedSquares] = useState<{
        [key: string]: React.CSSProperties;
    }>({});
    const [pgn, setPgn] = useState<string>("");
    const [fen, setFen] = useState<string>(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );

    const { message, formattedScore, mateIn, favoredSide, setMateIn } =
        useEngine("/from-chess-com/stockfish-17-aaa11cd.js", depth, game, 12);

    // Memoized callbacks
    const handlePlayback = useCallback(
        (move: Move, gameCopy: ChessInstance) => {
            if (!move) return;
            if (
                move.captured &&
                !gameCopy.in_check() &&
                !gameCopy.in_checkmate()
            ) {
                playAudio(AudioLinks["capture"]);
            } else if (gameCopy.in_checkmate()) {
                setCheckmateMessage("Game over, Checkmate!");
                toast("Game over, Checkmate!");
                setCheckmateState(true);
                playAudio(AudioLinks["check"]);
                playAudio(AudioLinks["checkmate"], 500);
            } else if (gameCopy.in_check()) {
                playAudio(AudioLinks["check"], 0, 1);
            } else if (move.san === "O-O" || move.san === "O-O-O") {
                playAudio(AudioLinks["castle"]);
            } else {
                playAudio(AudioLinks["move-self"]);
            }
        },
        []
    ); // No dependencies needed now

    const onDrop = useCallback(
        (sourceSquare: Square, targetSquare: Square, piece: Piece) => {
            if (checkmateState) {
                playAudio("assets/sound/error.mp3");
                return false;
            }
            setBestMove(undefined);
            const gameCopy = new Chess(game.fen());
            const promotionPiece = piece[1].toLowerCase() as
                | "q"
                | "b"
                | "n"
                | "r";
            const move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: promotionPiece,
            });
            if (move === null) {
                playAudio(AudioLinks["invalid-move"], 0, 0.5);
                return false;
            }
            // Reset mateIn if the new position is not a forced mate
            if (!gameCopy.in_checkmate()) {
                setMateIn(null); // Reset mateIn when the position changes
            }
            if (gameCopy.in_draw() || gameCopy.in_stalemate()) {
                toast.message("Draw");
                setCheckmateState(false);
                return false;
            }
            handlePlayback(move, gameCopy); // <-- Pass BOTH move and gameCopy
            setRightClickedSquares({});
            setPossibleMoves({});
            setHighlightedSquares({
                [sourceSquare]: { backgroundColor: "rgba(255, 238, 56, 0.4)" },
                [targetSquare]: { backgroundColor: "rgba(255, 238, 56, 0.4)" },
            });
            setGame(gameCopy); // Update state AFTER handling playback
            setGameHistory((prev) => [...prev, move]);
            setCurrentMoveIndex((prev) => prev + 1);
            return true;
        },
        [game, checkmateState, handlePlayback, setMateIn]
    );

    const loadFen = useCallback(
        (fenString: string) => {
            if (game.validate_fen(fenString)) {
                const newGame = new Chess(fenString);
                setGame(newGame);
                setHighlightedSquares({});
                setRightClickedSquares({});
                setBestMove("");
                setCheckmateState(false);
                setCheckmateMessage("");
                setGameHistory([]);
                setCurrentMoveIndex(-1);
                setFen("");
            } else {
                toast.error("Invalid FEN string");
            }
        },
        [game]
    );

    const loadPgn = useCallback(() => {
        try {
            const newGame = new Chess();
            setBestMove("");
            newGame.load_pgn(pgn);
            setGame(newGame);
            const moves = newGame.history({ verbose: true });
            setGameHistory(moves);
        } catch (e: unknown) {
            toast.error(e as string);
        }
        setPgn("");
    }, [pgn, setGame, setGameHistory]);

    const handleMoveNavigation = useCallback(
        (direction: "first" | "prev" | "next" | "last") => {
            const moveIndexMap: Record<typeof direction, number> = {
                first: -1,
                prev: Math.max(-1, currentMoveIndex - 1),
                next: Math.min(gameHistory.length - 1, currentMoveIndex + 1),
                last: gameHistory.length - 1,
            };

            const newIndex = moveIndexMap[direction];
            const gameClone = new Chess();
            const currentGameState = [...gameHistory];

            if (newIndex >= 0) {
                for (let i = 0; i <= newIndex; i++) {
                    gameClone.move(currentGameState[i].san);
                }
            }

            setGame(gameClone);
            setCurrentMoveIndex(newIndex);
            setFen(gameClone.fen());
            setHighlightedSquares({});
            setRightClickedSquares({});
        },
        [currentMoveIndex, gameHistory]
    );

    const onSquareClick = useCallback(
        (square: Square) => {
            const moves = game.moves({
                square,
                verbose: true,
            }) as Move[];

            if (
                selectedPiece &&
                game.get(selectedPiece)?.color === game.turn()
            ) {
                const move = game.move({
                    from: selectedPiece,
                    to: square,
                    promotion: "q",
                });

                if (move) {
                    handlePlayback(move, game);
                    setRightClickedSquares({});
                    setPossibleMoves({});
                    setHighlightedSquares({
                        [selectedPiece]: {
                            backgroundColor: "rgba(255, 238, 56, 0.4)",
                        },
                        [square]: {
                            backgroundColor: "rgba(255, 238, 56, 0.4)",
                        },
                    });
                    setGameHistory((prev) => [...prev, move]);
                    setCurrentMoveIndex((prev) => prev + 1);
                    setSelectedPiece(null);
                    return;
                }
            }

            if (game.get(square)?.color === game.turn()) {
                const newHighlightedSquares: {
                    [square: string]: React.CSSProperties;
                } = {
                    [square]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
                };

                moves.forEach((move) => {
                    newHighlightedSquares[move.to] = {
                        background:
                            game &&
                            game.get(move.to) &&
                            game?.get(move.to)?.color !== game?.get(square)?.color
                                ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
                                : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
                        borderRadius: "50%",
                    };
                });

                setPossibleMoves(newHighlightedSquares);
                setSelectedPiece(square);
                setRightClickedSquares({});
            } else if (selectedPiece) {
                setPossibleMoves({});
                setSelectedPiece(null);
            }
        },
        [game, selectedPiece, handlePlayback]
    );

    const onSquareRightClick = useCallback((square: Square) => {
        setRightClickedSquares((prev) => ({
            ...prev,
            [square]: { backgroundColor: "rgba(255, 0, 0, 0.4)" },
        }));
    }, []);

    const handleLoad = useCallback(() => {
        if (pgn) {
            loadPgn();
        } else if (fen) {
            loadFen(fen);
        } else {
            toast.error("Please insert pgn or fen!");
        }
    }, [pgn, fen, loadPgn, loadFen]);

    const toggleOrientation = useCallback(() => {
        setOrientation((prev) => (prev === "white" ? "black" : "white"));
    }, []);

    const handleReset = useCallback(() => {
        setCheckmateMessage("");
        setGame(new Chess());
        setMateIn(null);
        setCheckmateState(false);
        setHighlightedSquares({});
        setGameHistory([]);
        setCurrentMoveIndex(-1);
    }, [setMateIn]);

    const getPlayerInfo = useCallback(
        (position: "top" | "bottom") => {
            const isWhiteBottom = orientation === "white";
            const isTopPlayer = position === "top";
            return {
                name: isWhiteBottom
                    ? isTopPlayer
                        ? "Black Player"
                        : "White Player"
                    : isTopPlayer
                    ? "White Player"
                    : "Black Player",
                rating: "Elo: N/A",
            };
        },
        [orientation]
    );

    useEffect(() => {
        if (message) {
            setStockfishState(true);
            setBestMove(message.match(/bestmove\s+(\S+)/)?.[1]);
        }
    }, [message]);

    return (
        <div className="container mx-auto p-4">
            {/* Player Info Top */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                    <User className="h-6 w-6" />
                    <span className="font-medium">
                        {getPlayerInfo("top").name}
                    </span>
                </div>
                <div className="text-sm text-muted-foreground">
                    {getPlayerInfo("top").rating}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-[1fr_600px_1fr] gap-4 md:grid-cols-[1fr_450px_1fr] sm:grid-cols-1">
                {/* Left Panel - Analysis */}
                <Card className="p-4 h-[600px] flex flex-col">
                    <div className="font-medium mb-4">Analysis</div>
                    <EvaluationBar
                        score={formattedScore || "0.00"}
                        mateIn={mateIn}
                        favoredSide={favoredSide}
                        checkMateState={checkmateState}
                    />
                    <ScrollArea className="flex-grow">
                        <div className="space-y-2">
                            <div className="p-2 hover:bg-accent rounded-md">
                                <div className="font-medium">Main Line</div>
                                <div className="text-sm text-muted-foreground">
                                    {bestMove
                                        ? `Best move: ${bestMove}`
                                        : checkmateState
                                        ? "Game over."
                                        : "Calculating...."}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </Card>

                {/* Chessboard */}
                <div className="flex flex-col">
                    {stockfishState ? (
                        <div className="relative">
                            <Chessboard
                                position={game.fen()}
                                boardWidth={600}
                                onPieceDrop={onDrop}
                                promotionDialogVariant="vertical"
                                boardOrientation={orientation}
                                onSquareRightClick={onSquareRightClick}
                                onSquareClick={onSquareClick}
                                customArrows={
                                    bestMove
                                        ? [
                                              [
                                                  bestMove.substring(
                                                      0,
                                                      2
                                                  ) as Square,
                                                  bestMove.substring(
                                                      2,
                                                      4
                                                  ) as Square,
                                                  "rgb(0, 128, 0)",
                                              ],
                                          ]
                                        : []
                                }
                                customSquareStyles={{
                                    ...highlightedSquares,
                                    ...rightClickedSquares,
                                    ...possibleMoves,
                                }}
                            />
                            <div className="absolute -top-10 right-0 flex space-x-2">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="w-8 h-8 rounded-full"
                                    onClick={toggleOrientation}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col w-full items-center h-[600px]">
                            <LoadingSpinner />
                            <p>Loading stockfish...</p>
                        </div>
                    )}

                    {/* Move Navigation */}
                    <div className="flex justify-center space-x-2 mt-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveNavigation("first")}
                            disabled={currentMoveIndex === -1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveNavigation("prev")}
                            disabled={currentMoveIndex === -1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveNavigation("next")}
                            disabled={
                                currentMoveIndex === gameHistory.length - 1
                            }
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveNavigation("last")}
                            disabled={
                                currentMoveIndex === gameHistory.length - 1
                            }
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Right Panel - Controls */}
                <Card className="p-4 h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div className="font-medium">Moves</div>
                    </div>

                    <ScrollArea className="flex-grow mb-4">
                        <div className="space-y-1">
                            {gameHistory.reduce<JSX.Element[]>(
                                (acc, move, index) => {
                                    if (index % 2 === 0) {
                                        const moveNumber =
                                            Math.floor(index / 2) + 1;
                                        const whiteMove = move.san;
                                        const blackMove =
                                            gameHistory[index + 1]?.san;

                                        acc.push(
                                            <div
                                                key={index}
                                                className="grid grid-cols-[auto_1fr_1fr] gap-2"
                                            >
                                                <span className="text-muted-foreground w-8">
                                                    {moveNumber}.
                                                </span>
                                                <span
                                                    className={`hover:bg-accent p-1 rounded cursor-pointer ${
                                                        currentMoveIndex ===
                                                        index
                                                            ? "bg-accent"
                                                            : ""
                                                    }`}
                                                >
                                                    {whiteMove}
                                                </span>
                                                {blackMove && (
                                                    <span
                                                        className={`hover:bg-accent p-1 rounded cursor-pointer ${
                                                            currentMoveIndex ===
                                                            index + 1
                                                                ? "bg-accent"
                                                                : ""
                                                        }`}
                                                    >
                                                        {blackMove}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    }
                                    return acc;
                                },
                                []
                            )}
                        </div>
                    </ScrollArea>

                    {/* Controls Section */}
                    <div className="space-y-4">
                        <div>
                            <Label>PGN</Label>
                            <Textarea
                                value={pgn}
                                onChange={(e) => setPgn(e.target.value)}
                                placeholder="Enter PGN"
                                className="min-h-[100px]"
                            />
                        </div>
                        <div>
                            <Label>FEN</Label>
                            <Input
                                defaultValue={fen}
                                onChange={(e) => setFen(e.target.value)}
                                placeholder="Enter FEN"
                            />
                        </div>
                        <div>
                            <Label>Engine Depth: {depth}</Label>
                            <Slider
                                defaultValue={[depth]}
                                onValueChange={(value: number[]) =>
                                    setDepth(value[0])
                                }
                                max={25}
                                step={1}
                                className="mt-2"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <Button onClick={handleLoad}>Load Game</Button>
                            <Button onClick={handleReset}>Reset</Button>
                        </div>
                        {checkmateMessage && (
                            <div className="text-sm text-red-500">
                                {checkmateMessage}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Player Info Bottom */}
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-2">
                    <User className="h-6 w-6" />
                    <span className="font-medium">
                        {getPlayerInfo("bottom").name}
                    </span>
                </div>
                <div className="text-sm text-muted-foreground">
                    {getPlayerInfo("bottom").rating}
                </div>
            </div>

            <Toaster />
        </div>
    );
};

export default ChessApp;
