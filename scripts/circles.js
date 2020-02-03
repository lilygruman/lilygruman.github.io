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

var clearButton = document.getElementById('clear');
var playButton = document.getElementById('play');
var stopButton = document.getElementById('stop');
stopButton.disabled = true;
var rotateButtons = {
    flat: document.getElementById('flat'),
    sharp: document.getElementById('sharp'),
    semis: document.getElementById('numSemis'),
    fifths: document.getElementById('numFifths')
};

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

function mod(n, modulus) {
    while(n < 0) {
        n += modulus;
    }
    return n % modulus;
}

function distance(start, end) {
    return Math.hypot(start.x - end.x, start.y - end.y);
}

function line(start, end) {
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
}

function circle(center, radius, fill) {
    context.beginPath();
    context.moveTo(
        center.x + radius,
        center.y
    );
    context.arc(
        center.x,
        center.y,
        radius,
        0,
        2 * Math.PI
    );
    if(fill) {
        context.fill();
    } else {
        context.stroke();
    }
}

class PitchOscillator {
    constructor(frequency) {
        this.frequency = frequency;
        this.oscillator = null;
    }

    play() {
        if(this.oscillator !== null) {
            return;
        }

        this.oscillator = audio.createOscillator();
        this.oscillator.type = 'triangle';
        this.oscillator.frequency.setValueAtTime(
            this.frequency,
            audio.currentTime
        );
        this.oscillator.connect(audio.destination);
        this.oscillator.start(audio.currentTime);
    }

    stop() {
        if(this.oscillator === null) {
            return;
        }

        this.oscillator.stop(audio.currentTime);
        this.oscillator.disconnect(audio.destination);
        this.oscillator = null;
    }
};

class PitchDot {
    constructor(pitchCircle, semitoneIndex) {
        if(!pitchCircle || !(semitoneIndex !== 'undefined')) {
            return;
        }
        this.pitchCircle = pitchCircle;
        this.semitoneIndex = semitoneIndex;
        this.center = pitchCircle.getDotCenter(semitoneIndex);
        this.radius = pitchCircle.radius / 20;
        this.oscillator = new PitchOscillator(index2frequency(this.semitoneIndex));
    }

    play() {
        this.oscillator.play();
    }

    stop() {
        this.oscillator.stop();
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
                line(this.center, this.pitchCircle.dots[pitch].center);
            }
        }

        context.fillStyle = verticality[this.semitoneIndex] ? 'green' : 'white';
        circle(this.center, this.radius, true);
    }
}

var fifthInterval = 7;

class PitchCircle {
    defaults = {
        interval: fifthInterval,
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

    play() {
        for(var i = 0; i < this.verticality.length; i++) {
            if(this.verticality[i]) {
                this.dots[pitchNames[i]].play();
            }
        }
    }

    stop() {
        for(var i = 0; i < this.verticality.length; i++) {
            this.dots[pitchNames[i]].stop();
        }
    }

    resetVerticality(verticality) {
        this.stop();
        this.verticality = verticality || this.defaults.verticality.slice(0);
        this.draw();
        if(playing) {
            this.play();
        }
    }

    rotate(n) {
        this.resetVerticality(this.verticality.map((_, i, verticality) => {
            return verticality[mod(
                i - (this.interval * n),
                this.verticality.length
            )];
        }));
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

        context.strokeStyle = 'grey';
        circle(this.center, this.radius, false);

        for(var pitch in this.dots) {
            this.dots[pitch].draw(this.verticality);
        }
    }
}

var cof = new PitchCircle();

function getMouse() {
    return {
        x: event.offsetX,
        y: event.offsetY
    };
}

clearButton.onclick = function() {
    stopButton.onclick();
    cof.resetVerticality();
}

playButton.onclick = function() {
    cof.play();
    playButton.disabled = true;
    stopButton.disabled = false;
    playing = true;
}

stopButton.onclick = function() {
    cof.stop();
    stopButton.disabled = true;
    playButton.disabled = false;
    playing = false;
}

rotateButtons.flat.onclick = function() {
    cof.rotate(-parseInt(rotateButtons.fifths.value));
}

rotateButtons.sharp.onclick = function() {
    cof.rotate(parseInt(rotateButtons.fifths.value));
}

rotateButtons.fifths.onchange = function() {
    rotateButtons.semis.value = normalize(fifthInterval * rotateButtons.fifths.value);
}

rotateButtons.semis.onchange = function() {
    rotateButtons.fifths.value = normalize(fifthInterval * rotateButtons.semis.value);
}

function cart2pol(point, origin = {x: 0, y: 0}) {
    return {
        r: distance(point, origin),
        theta: Math.atan2(
            point.y - origin.y,
            point.x - origin.x
        )
    }
}

function truncate(num) {
    if(num < 0) {
        return Math.ceil(num);
    } else {
        return Math.floor(num);
    }
}

var theta = NaN;
canvas.onmousedown = function() {
    var mouse = getMouse();
    cof.onclick(mouse);
    theta = cart2pol(mouse, cof.center).theta;
}

canvas.onmousemove = function() {
    if(!theta && (theta !== 0)) {
        return;
    }

    var pitchDotOffsetAngle = 2 * Math.PI / pitchNames.length;
    var dtheta = cart2pol(getMouse(), cof.center).theta - theta;

    if(Math.abs(dtheta) < pitchDotOffsetAngle) {
        return;
    };

    cof.rotate(truncate(dtheta / pitchDotOffsetAngle));
    theta += dtheta;
}

canvas.onmouseup = function() {
    theta = NaN;
}
