class Speaker {
    constructor( freq ) {
        this.ctx = new ( window.AudioContext || window.webkitAudioContext )();

        const tone = this.ctx.createOscillator();

        tone.type = "square";
        tone.frequency.setValueAtTime( freq, this.ctx.currentTime ); // value in hertz

        this.tone = tone;
        this.tone.start();
    }

    play() {
        this.tone.connect( this.ctx.destination );
    }

    stop() {
        this.tone.disconnect();
    }
}

export default Speaker;
