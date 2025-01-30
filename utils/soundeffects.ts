export const playAudio = (src: string, delay = 0, volume = 1) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = volume;
    const play = () => {
        audio.play().catch((error) => {
            console.log(error)
        })
    }
    if (delay > 0) {
        setTimeout(play, delay)
    } else {
        play()
    }
};
