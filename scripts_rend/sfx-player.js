class SFXPlayer {
    constructor(audioCtx) {
        this.audioCtx = audioCtx;

        this._loadedSFX = {};
        for (let i = 1; i < 40; i++) {
            this._loadSFX("sfx/" + i + ".wav")
                .then(sample => { this._loadedSFX[i] = sample; });
        }
        this._loadSFX("sfx/CLICK.WAV")
            .then(sample => { this._loadedSFX["click"] = sample; });
    }

    _loadSFX(url) {
        return fetch(url)
            .then(res => res.arrayBuffer())
            .then(buf => this.audioCtx.decodeAudioData(buf));
    }

    play_sfx(sfx) {
        if (!this._loadedSFX.hasOwnProperty(sfx)) {
            console.log("WARNING: tried to play sound", sfx, "- not found!");
            return;
        }

        const src = this.audioCtx.createBufferSource();
        src.buffer = this._loadedSFX[sfx];
        src.connect(this.audioCtx.destination);
        src.start(0);
    }
}