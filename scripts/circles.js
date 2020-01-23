var canvas = document.getElementById('circles');
var context = canvas.getContext('2d');
var audio = new AudioContext();

function index2frequency(index) {
    const aFrequency = 440;
    const aMidi = 69;
    const cMidi = 60;
    const octaveRatio = 2;
    return aFrequency * (octaveRatio ** ((index + cMidi - aMidi)/pitchNames.length))
}

const pitchNames = 'cndseftglahb'

var playing = false;

function createOscillator(index) {
    var oscillator = audio.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(
        index2frequency(index),
        audio.currentTime
    );
    oscillator.connect(audio.destination);
    return oscillator;
}

var clearButton = document.getElementById('clear');
var playButton = document.getElementById('play');
var stopButton = document.getElementById('stop');
stopButton.disabled = true;

function normalize(interval) {
    if(interval > pitchNames.length) {
        return normalize(interval - pitchNames.length);
    } else if(interval > (pitchNames.length / 2)) {
        return pitchNames.length - interval;
    } else if(interval < -pitchNames.length) {
        return normalize(interval + pitchNames.length);
    } else if(interval < (-pitchNames.length / 2)) {
        return -pitchNames.length - interval;
    } else {
        return interval;
    }
}

function distance(start, end) {
    return Math.hypot(start.x - end.x, start.y - end.y);
}

class PitchDot {
    constructor(pitchCircle, semitoneIndex) {
        if(!pitchCircle || !(semitoneIndex !== 'undefined')) {
            return;
        }
        this.pitchCircle = pitchCircle;
        this.semitoneIndex = semitoneIndex;
        this.center = pitchCircle.getDotCenter(semitoneIndex);
        this.radius = pitchCircle.radius / 20;
        this.oscillator = createOscillator(this.semitoneIndex);
    }

    play() {
        this.oscillator.start(audio.currentTime);
    }

    stop() {
        this.oscillator.stop(audio.currentTime);
        this.oscillator = createOscillator(this.semitoneIndex);
    }

    onclick(mouse) {
        if(distance(this.center, mouse) < this.radius) {
            this.pitchCircle.togglePitch(this.semitoneIndex);
        }
    }

    draw(verticality) {
        for(var pitch in this.pitchCircle.dots) {
            if(verticality[this.pitchCircle.dots[pitch].semitoneIndex] && verticality[this.semitoneIndex]) {
                var interval = this.pitchCircle.dots[pitch].semitoneIndex - this.semitoneIndex;
                switch (normalize(interval)) {
                    case 1:
                        context.strokeStyle = 'yellow';
                        break;
                    case 2:
                        context.strokeStyle = 'violet';
                        break;
                    case 3:
                        context.strokeStyle = 'green';
                        break;
                    case 4:
                        context.strokeStyle = 'lime';
                        break;
                    case 5:
                        context.strokeStyle = 'blue'
                        break;
                    case 6:
                        context.strokeStyle = 'red';
                        break;
                    default:
                        continue;
                }

                context.beginPath();
                context.moveTo(
                    this.center.x,
                    this.center.y
                );
                context.lineTo(
                    this.pitchCircle.dots[pitch].center.x,
                    this.pitchCircle.dots[pitch].center.y
                );
                context.stroke();
            }
        }

        context.fillStyle = verticality[this.semitoneIndex] ? 'green' : 'white';
        context.beginPath();
        context.moveTo(
            this.center.x,
            this.center.y
        );
        context.arc(
            this.center.x,
            this.center.y,
            this.radius,
            0,
            2 * Math.PI
        );
        context.fill();
    }
}

class PitchCircle {
    defaults = {
        interval: 7,
        center: {
            x: canvas.width/2,
            y: canvas.width/2
        },
        radius: Math.min(
            canvas.width/2,
            canvas.height/2
        ) - 20,
        verticality: new Array(pitchNames.length).fill(false)
    }

    constructor(config) {
        config = config || this.defaults;
        this.interval = config.interval || this.defaults.interval;
        this.center = config.center || this.defaults.center;
        this.radius = config.radius || this.defaults.radius;
        this.verticality = this.defaults.verticality.slice(0);
        this.dots = {};
        for(var i = 0; i < pitchNames.length; i++) {
            this.dots[pitchNames[i]] = new PitchDot(this, i);
        }
        this.draw();
    }

    togglePitch(index) {
        this.verticality[index] = !this.verticality[index];
        this.draw();
        if(playing) {
            if(this.verticality[index]) {
                this.dots[pitchNames[index]].play();
            } else {
                this.dots[pitchNames[index]].stop();
            }
        }
    }

    resetVerticality() {
        this.verticality = this.defaults.verticality.slice(0);
        this.draw();
    }

    getDotCenter(index) {
        return {
            x: this.center.x + (this.radius * Math.cos(index * this.interval * 2 * Math.PI / pitchNames.length)),
            y: this.center.y + (this.radius * Math.sin(index * this.interval * 2 * Math.PI / pitchNames.length))
        }
    }

    onclick(mouse) {
        for(var pitch in this.dots) {
            this.dots[pitch].onclick(mouse);
        }
    }

    draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        var start = this.getDotCenter(0);
        context.strokeStyle = 'grey';
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        context.stroke();

        for(var pitch in this.dots) {
            this.dots[pitch].draw(this.verticality);
        }
    }
}

var cof = new PitchCircle();

canvas.onclick = function() {
    cof.onclick({
        x: event.offsetX,
        y: event.offsetY
    });
}

clearButton.onclick = function() {
    stopButton.onclick();
    cof.resetVerticality();
}

playButton.onclick = function() {
    for(var i = 0; i < cof.verticality.length; i++) {
        if(cof.verticality[i]) {
            cof.dots[pitchNames[i]].play();
        }
        console.log('debug');
    }
    playButton.disabled = true;
    stopButton.disabled = false;
    playing = true;
}

stopButton.onclick = function() {
    for(var i = 0; i < cof.verticality.length; i++) {
        if(cof.verticality[i]) {
            cof.dots[pitchNames[i]].stop();
        }
    }
    stopButton.disabled = true;
    playButton.disabled = false;
    playing = false;
}
