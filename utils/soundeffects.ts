export const playAudio = (src:string, delay=0, volume=1) => {
    const audio = new Audio(src);
    audio.volume=volume;
    setTimeout(()=>{
        audio.play()
    },delay)
};
