var canvas = document.getElementById('circles');
var context = canvas.getContext('2d');
var audio = new AudioContext();

var pitchNames = 'cndseftglahb';

function index2frequency(index) {
    const aFrequency = 440;
    const aMidi = 69;
    const cMidi = 60;
    const octaveRatio = 2;
    return aFrequency * (octaveRatio ** ((index + cMidi - aMidi) / pitchNames.length))
}

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

class Pitch {
    constructor(name, on = false) {
        this.name = name;
        this.semitoneIndex = pitchNames.indexOf(name);
        this.oscillator = new PitchOscillator(index2frequency(this.semitoneIndex));
        this.on = on;
    }

    toggle(playing) {
        if(this.on) {
            this.turnOff();
        } else {
            this.turnOn(playing);
        }
    }

    turnOn(playing) {
        this.on = true;
        verticality.draw();
        if(playing) {
            console.log('debug');
            this.play();
        }
    }

    turnOff() {
        this.on = false;
        verticality.draw();
        this.stop();
    }

    play() {
        if(this.on) {
            this.oscillator.play();
        }
    }

    stop() {
        this.oscillator.stop();
    }
}

function generateEmptyVerticality() {
    return new Array(pitchNames.length).fill(false);
}

class Verticality {
    constructor(verticality = generateEmptyVerticality()) {
        this.playing = false;
        this.pitches = {};
        this.pitchCircles = [];
        for(var i = 0; i < pitchNames.length; i++) {
            this.pitches[pitchNames[i]]= new Pitch(pitchNames[i], verticality[i]);
        }
    }

    registerPitchCircle(pc) {
        this.pitchCircles.push(pc);
    }

    set(verticality) {
        for(var name in this.pitches) {
            if(verticality[pitchNames.indexOf(name)]) {
                this.pitches[name].turnOn(this.playing);
            } else {
                this.pitches[name].turnOff();
            }
        }
    }

    reset() {
        this.set(generateEmptyVerticality());
    }

    togglePitch(name) {
        this.pitches[name].toggle(this.playing);
    }

    play() {
        if(this.playing) {
            return;
        }

        this.playing = true;
        for(var name in this.pitches) {
            this.pitches[name].play();
        }
    }

    stop() {
        if(!this.playing) {
            return;
        }

        this.playing = false;
        for(var name in this.pitches) {
            this.pitches[name].stop();
        }
    }

    transpose(n) {
        var buffer = {};

        for(var name in this.pitches) {
            buffer[name] = this.pitches[name].on;
        }

        for(var name in this.pitches) {
            if(buffer[pitchNames[mod(pitchNames.indexOf(name) - n, pitchNames.length)]]) {
                this.pitches[name].turnOn(this.playing);
            } else {
                this.pitches[name].turnOff();
            }
        }
    }

    draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for(var pc of this.pitchCircles) {
            pc.draw();
        }
    }
}

var verticality = new Verticality();

class PitchDot {
    constructor(pitchCircle, pitch) {
        if(!pitchCircle || !pitch) {
            return;
        }

        this.pitch = pitch;
        this.pitchCircle = pitchCircle;
        this.center = pitchCircle.getDotCenter(pitch.name);
        this.radius = pitchCircle.radius / 20;
    }

    onclick(mouse) {
        if(distance(this.center, mouse) < this.radius) {
            verticality.togglePitch(this.pitch.name);
        }
    }

    draw() {
        for(var name in verticality.pitches) {
            if(verticality.pitches[name].on && this.pitch.on) {
                var interval = verticality.pitches[name].semitoneIndex - this.pitch.semitoneIndex;
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
                line(this.center, this.pitchCircle.dots[name].center);
            }
        }

        context.fillStyle = this.pitch.on ? 'green' : 'white';
        circle(this.center, this.radius, true);
    }
}

var semitoneInterval = 1;
var fifthInterval = 7;

class PitchCircle {
    defaults() {
        return {
            interval: fifthInterval,
            center: {
                x: canvas.width/2,
                y: canvas.width/2
            },
            radius: Math.min(
                canvas.width/2,
                canvas.height/2
            ) - 20
        }
    }

    constructor(config) {
        config = config || this.defaults();
        this.interval = config.interval || this.defaults().interval;
        this.center = config.center || this.defaults().center;
        this.radius = config.radius || this.defaults().radius;
        this.mouseTheta = NaN;
        this.dots = {};
        for(var name in verticality.pitches) {
            this.dots[name] = new PitchDot(this, verticality.pitches[name]);
        }
        this.draw();
    }

    rotate(n) {
        verticality.transpose(this.interval * n);
    }

    getDotCenter(pitchName) {
        return {
            x: this.center.x + (this.radius * Math.cos(pitchNames.indexOf(pitchName) * this.interval * 2 * Math.PI / pitchNames.length)),
            y: this.center.y + (this.radius * Math.sin(pitchNames.indexOf(pitchName) * this.interval * 2 * Math.PI / pitchNames.length))
        }
    }

    onmousedown(mouse) {
        this.mouseTheta = cart2pol(mouse, this.center).theta;
        for(var pitch in this.dots) {
            this.dots[pitch].onclick(mouse);
        }
    }

    onmousemove(mouse) {
        if(!this.mouseTheta && (this.mouseTheta !== 0)) {
            return;
        }

        if(distance(mouse, this.center) > this.radius) {
            return;
        }

        var pitchDotOffsetAngle = 2 * Math.PI / pitchNames.length;
        var dtheta = cart2pol(getMouse(), this.center).theta - this.mouseTheta;

        if(Math.abs(dtheta) < pitchDotOffsetAngle) {
            return;
        };

        this.rotate(truncate(dtheta / pitchDotOffsetAngle));
        this.mouseTheta += dtheta;
    }

    onmouseup(mouse) {
        this.mouseTheta = NaN;
    }

    draw() {
        context.strokeStyle = 'grey';
        circle(this.center, this.radius, false);

        for(var pitch in this.dots) {
            this.dots[pitch].draw();
        }
    }
}

var cof = new PitchCircle({
    interval: fifthInterval,
    center: {
        x: 0.75 * canvas.width,
        y: 0.5 * canvas.height
    },
    radius: Math.min(
        canvas.width/4,
        canvas.height/2
    ) - 20
});
verticality.registerPitchCircle(cof);

var cosemi = new PitchCircle({
    interval: semitoneInterval,
    center: {
        x: 0.25 * canvas.width,
        y: 0.5 * canvas.height
    },
    radius: Math.min(
        canvas.width/4,
        canvas.height/2
    ) - 20
});
verticality.registerPitchCircle(cosemi);

function getMouse() {
    return {
        x: event.offsetX,
        y: event.offsetY
    };
}

clearButton.onclick = function() {
    verticality.reset();
}

playButton.onclick = function() {
    verticality.play();
    playButton.disabled = true;
    stopButton.disabled = false;
    playing = true;
}

stopButton.onclick = function() {
    verticality.stop();
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
    for(var pc of verticality.pitchCircles) {
        pc.onmousedown(mouse);
    }
}

canvas.onmousemove = function() {
    var mouse = getMouse();
    for(var pc of verticality.pitchCircles) {
        pc.onmousemove(mouse);
    }
}

canvas.onmouseup = function() {
    var mouse = getMouse();
    for(var pc of verticality.pitchCircles) {
        pc.onmouseup(mouse);
    }
}
