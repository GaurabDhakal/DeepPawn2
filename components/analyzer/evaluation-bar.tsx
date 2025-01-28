import React from "react";

const EvaluationBar = ({
    score,
    mateIn,
    favoredSide,
    checkMateState,
}: {
    score: string;
    mateIn?: string | null | undefined;
    favoredSide?: "w" | "b" | null;
    checkMateState: boolean | null;
}) => {
    // Handle mate display and full bar coloring
    const isMate = !!mateIn && !checkMateState; // Disable mate display if checkmated
    const numericMate = mateIn ? parseInt(mateIn, 10) : 0;
    const absoluteMate = Math.abs(numericMate);

    // Convert score string to number (fix sign handling)
    const numericScore = -parseFloat(score);

    // Calculate height percentage based on evaluation type
    const getDisplayHeight = () => {
        if (checkMateState) {
            // If checkmated, show full bar for the winning side
            return favoredSide === "w" ? 100 : 0;
        }

        if (isMate) {
            // Full bar for forced mate
            return favoredSide === "w" ? 100 : 0;
        }

        // Normal centipawn evaluation handling
        const clampedScore = Math.max(-10, Math.min(10, numericScore));
        const percentage = 50 - clampedScore * 5;
        return Math.max(0, Math.min(100, percentage));
    };

    const whiteHeight = getDisplayHeight();

    return (
        <div className="flex items-center justify-center gap-2">
            {/* Score/Mate display */}
            <div className="font-mono text-sm text-center min-w-[70px]">
                {checkMateState ? (
                    // Hide mate display when checkmated
                    <div className="text-neutral-400">-</div>
                ) : isMate ? (
                    <div className="text-amber-500">{`M${absoluteMate}`}</div>
                ) : (
                    score
                )}
            </div>

            {/* Bar container */}
            <div className="w-4 h-[400px] relative overflow-hidden">
                {/* White's section - dynamically colored based on mate */}
                <div
                    className={`absolute top-0 w-full border transition-colors duration-300 ${
                        (isMate || checkMateState) && favoredSide === "w"
                            ? "bg-white border-neutral-300"
                            : "bg-white/80 border-neutral-200"
                    }`}
                    style={{
                        height: `${whiteHeight}%`,
                        transition: "height 0.3s ease",
                    }}
                />

                {/* Black's section - show pulsating animation for mate */}
                <div
                    className={`absolute bottom-0 w-full transition-colors duration-300 ${
                        (isMate || checkMateState) && favoredSide === "b"
                            ? "bg-black/90"
                            : "bg-black/80"
                    }`}
                    style={{
                        height: `${100 - whiteHeight}%`,
                        transition: "height 0.3s ease",
                    }}
                />
            </div>
        </div>
    );
};

export default EvaluationBar;