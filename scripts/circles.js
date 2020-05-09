var canvas = document.getElementById('circles');
var context = canvas.getContext('2d');
var audio = new AudioContext();
var mixer = audio.createGain();
mixer.connect(audio.destination);

const pitchNames = 'cndseftglahb';
const octaveRatio = 2;

mixer.gain.setValueAtTime(
    1 / pitchNames.length,
    audio.currentTime
);

function index2frequency(index) {
    const aFrequency = 440;
    const aMidi = 69;
    const cMidi = 60;
    return aFrequency * (octaveRatio ** ((index + cMidi - aMidi) / pitchNames.length))
}

var buttons = {
    clear: document.getElementById('clear'),
    play: document.getElementById('play'),
    stop: document.getElementById('stop'),
    rotate: {
        flat: document.getElementById('flat'),
        sharp: document.getElementById('sharp'),
    },
    mirror: document.getElementById('mirror'),
    transition: {}
}
buttons.stop.disabled = true;

for(var p of pitchNames) {
    var buttondiv = document.getElementById('buttons');
    var keydiv = document.createElement('div');
    keydiv.id = p;
    keydiv.innerHTML = p.toUpperCase();
    keydiv.style.width = (100 / pitchNames.length) + '%';
    buttondiv.appendChild(keydiv);
}

var inputs = {
    rotate: {
        semis: document.getElementById('numSemis'),
        fifths: document.getElementById('numFifths')
    },
    mirror: {
        center: document.getElementById('mirror-center')
    }
}

for(var pitch of pitchNames) {
    var option = document.createElement('option');
    option.value = pitch;
    option.text = pitch.toUpperCase();
    inputs.mirror.center.add(option);
}
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

function pitchName(index) {
    return pitchNames[mod(
        index,
        pitchNames.length
    )];
}

function pitchIndex(name) {
    return pitchNames.indexOf(name);
}

function transpose(pitch, n) {
    return pitchName(pitchIndex(pitch) + n);
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

function semicircle(center, radius, angle, fill) {
    context.beginPath();
    context.moveTo(
        center.x + (radius * Math.cos(angle)),
        center.y + (radius * Math.sin(angle))
    );
    context.arc(
        center.x,
        center.y,
        radius,
        angle,
        angle + Math.PI
    )
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
        this.oscillator.connect(mixer);
        this.oscillator.start(audio.currentTime);
    }

    stop() {
        if(this.oscillator === null) {
            return;
        }

        this.oscillator.stop(audio.currentTime);
        this.oscillator.disconnect(mixer);
        this.oscillator = null;
    }
};

class Pitch {
    constructor(name, on = false) {
        this.name = name;
        this.semitoneIndex = pitchIndex(name);
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

const indices = {
    diminished: [3, 6],
    minor: [3, 7],
    major: [4, 7],
    italian: [4, 10],
    dominant: [4, 7, 10],
    french: [4, 6, 10]
}

const functionInfo = {
    I: {
        quality: 'major',
        relativeRoot: 0,
        destinations: ['i', 'N', 'ii', 'IV', 'V', 'V7', 'Ger', 'vi']
    },
    i: {
        quality: 'minor',
        relativeRoot: 0,
        destinations: ['I', 'N', 'iv', 'V', 'V7', 'Ger', 'VI']
    },
    N: {
        quality: 'major',
        relativeRoot: 1,
        destinations: ['V', 'V7']
    },
    ii: {
        quality: 'minor',
        relativeRoot: 2,
        destinations: ['V', 'V7', 'Ger']
    },
    iv: {
        quality: 'minor',
        relativeRoot: 5,
        destinations: ['i', 'V', 'V7', 'Ger']
    },
    IV: {
        quality: 'major',
        relativeRoot: 5,
        destinations: ['I', 'ii', 'V', 'V7', 'Ger']
    },
    V: {
        quality: 'major',
        relativeRoot: 7,
        destinations: ['i', 'I', 'VI', 'V7', 'vi']
    },
    V7: {
        quality: 'dominant',
        relativeRoot: 7,
        destinations: ['i', 'I', 'VI', 'vi']
    },
    Ger: {
        quality: 'dominant',
        relativeRoot: 8,
        destinations: ['V', 'V7']
    },
    VI: {
        quality: 'major',
        relativeRoot: 8,
        destinations: ['iv', 'Ger']
    },
    vi: {
        quality: 'minor',
        relativeRoot: 9,
        destinations: ['ii', 'IV']
    }
}

function getChordInfo(root, quality) {
    var info = {
        spelling: '' + root,
        verticality: generateEmptyVerticality()
    };
    info.verticality[pitchIndex(root)] = true;
    for(var i of indices[quality]) {
        var pitch = transpose(root, i);
        info.spelling += pitch;
        info.verticality[pitchIndex(pitch)] = true;
    }
    return info;
}

function getFunctionInfo(numeral, key) {
    var info = {
        spelling: transpose(key, numeral.relativeRoot),
        verticality: generateEmptyVerticality()
    };
    info.verticality[numeral.relativeRoot] = true;
    for(var i of indices[numeral.quality]) {
        var pitch = numeral.relativeRoot + i;
        info.spelling += pitchName(pitch);
        info.verticality[pitch] = true;
    }
    return info;
}

class Verticality {
    constructor(verticality = generateEmptyVerticality()) {
        this.playing = false;
        this.pitches = {};
        this.pitchCircles = [];
        for(var i = 0; i < pitchNames.length; i++) {
            this.pitches[pitchName(i)]= new Pitch(
                pitchName(i),
                verticality[i]
            );
        }
    }

    registerPitchCircle(pc) {
        this.pitchCircles.push(pc);
    }

    set(verticality) {
        for(var name in this.pitches) {
            this.setPitch(name, verticality[pitchIndex(name)]);
        }
    }

    setPitch(name, value) {
        if(!(name in this.pitches)) {
            return;
        }

        if(value) {
            this.pitches[name].turnOn(this.playing);
        } else {
            this.pitches[name].turnOff();
        }
    }

    reset() {
        this.set(generateEmptyVerticality());
    }

    togglePitch(name) {
        if(!(name in this.pitches)) {
            return;
        }

        this.pitches[name].toggle(this.playing);
    }

    play() {
        this.playing = true;
        for(var name in this.pitches) {
            this.pitches[name].play();
        }
        buttons.play.disabled = true;
        buttons.stop.disabled = false;
    }

    stop() {
        this.playing = false;
        for(var name in this.pitches) {
            this.pitches[name].stop();
        }
        buttons.play.disabled = false;
        buttons.stop.disabled = true;
    }

    togglePlay() {
        if(this.playing) {
            this.stop();
        } else {
            this.play();
        }
    }

    get() {
        var buffer = {};

        for(var name in this.pitches) {
            buffer[name] = this.pitches[name].on;
        }
        return buffer;
    }

    transform(mapping) {
        var verticality = this.get();
        for(var name in this.pitches) {
            if(verticality[mapping(name)]) {
                this.pitches[name].turnOn(this.playing);
            } else {
                this.pitches[name].turnOff();
            }
        }
    }

    transpose(n) {
        var mapping = function(name) {
            return pitchName(pitchIndex(name) - n);
        }
        this.transform(mapping);
    }

    mirror(center) {
        var mapping = function(name) {
            return pitchName((2 * pitchIndex(center)) - pitchIndex(name));
        }
        this.transform(mapping);
    }

    draw() {
        for(var id in buttons.transition) {
            buttons.transition[id].remove();
        }
        buttons.transition = {};
        context.clearRect(0, 0, canvas.width, canvas.height);
        verticality.detect();
        for(var pc of this.pitchCircles) {
            pc.draw();
        }
    }

    detect() {
        var verticality = this.get();
        var match = false;
        this.chord = {};
        for(var pitch in verticality) {
            if(!verticality[pitch]) {
                continue;
            }
            for(var quality in indices) {
                match = true;
                for(var i = 1; match && (i < pitchNames.length); i++) {
                    match = match && (verticality[transpose(pitch, i)] === indices[quality].includes(i));
                }
                if(match) {
                    this.chord.quality = quality;
                    break;
                }
            }
            if(match) {
                this.chord.root = pitch;
                break;
            }
        }
        if(!match) {
            return;
        }
        for(var f in functionInfo) {
            if(functionInfo[f].quality !== this.chord.quality) {
                continue;
            }
            var key = transpose(this.chord.root, -functionInfo[f].relativeRoot);
            var destinations = {};
            for(var d of functionInfo[f].destinations) {
                destinations[d] = getChordInfo(
                    transpose(
                        key,
                        functionInfo[d].relativeRoot
                    ),
                    functionInfo[d].quality
                );
                var div = document.getElementById(key);
                var paragraph = document.createElement('p');
                var transitionButton = document.createElement('BUTTON');
                var transitionString = destinations[d].spelling + ' (' + f + ' -> ' + d + ')';
                var buttonText = document.createTextNode(transitionString);
                var buttonProc = function(verticalityObject, verticalityArray) {
                    return function() {
                        verticalityObject.set(verticalityArray);
                    };
                };
                transitionButton.onclick = buttonProc(this, destinations[d].verticality);
                transitionButton.appendChild(buttonText);
                transitionButton.id = transitionString;
                div.appendChild(paragraph);
                paragraph.appendChild(transitionButton);
                buttons.transition[transitionString] = transitionButton;
            }
        }
    }
}

var verticality = new Verticality();

const semitoneInterval = 1;
const fifthInterval = 7;
const intervalColors = {
    1: 'yellow',
    2: 'violet',
    3: 'green',
    4: 'lime',
    5: 'blue',
    6: 'red'
};

class PitchDot {
    constructor(pitchCircle, pitch) {
        if(!pitchCircle || !pitch) {
            return undefined;
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

    drawIntervalLines() {
        if(!this.pitch.on) {
            return;
        }
        for(var name in verticality.pitches) {
            if(!verticality.pitches[name].on) {
                continue;
            }
            var interval = normalize(verticality.pitches[name].semitoneIndex - this.pitch.semitoneIndex);
            if(!(interval in intervalColors)) {
                continue;
            }
            context.strokeStyle = intervalColors[interval];
            line(this.center, this.pitchCircle.dots[name].center);
        }
    }

    draw() {
        this.drawIntervalLines();

        context.fillStyle = this.pitch.on ? 'green' : 'white';
        circle(this.center, this.radius, true);

        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = 'black';
        context.fillText(this.pitch.name.toUpperCase(), this.center.x, this.center.y);
    }
}

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
        this.mouse = undefined;
        this.dots = {};
        for(var name in verticality.pitches) {
            this.dots[name] = new PitchDot(this, verticality.pitches[name]);
        }
        this.draw();
    }

    rotate(n) {
        verticality.transpose(this.interval * n);
    }

    getDotCenter(name) {
        return {
            x: this.center.x + (this.radius * Math.cos(pitchIndex(name) * this.interval * 2 * Math.PI / pitchNames.length)),
            y: this.center.y + (this.radius * Math.sin(pitchIndex(name) * this.interval * 2 * Math.PI / pitchNames.length))
        }
    }

    onmousedown(mouse) {
        for(var pitch in this.dots) {
            this.dots[pitch].onclick(mouse);
        }
        this.mouse = cart2pol(mouse, this.center);
        if(mouse.r > this.radius) {
            this.mouse = undefined;
        }
    }

    onmousemove(mouse) {
        if(!this.mouse) {
            return;
        }

        var mousePolar = cart2pol(mouse, this.center);
        if(mousePolar.r > this.radius) {
            this.mouse = undefined;
            return;
        }

        const pitchDotOffsetAngle = 2 * Math.PI / pitchNames.length;
        var dtheta = moushePolar.theta - this.mouse.theta;

        if(Math.abs(dtheta) < pitchDotOffsetAngle) {
            return;
        };

        this.rotate(truncate(dtheta / pitchDotOffsetAngle));
        this.mouse = mousePolar;
    }

    onmouseup() {
        this.mouse = undefined;
    }

    draw() {
        context.strokeStyle = 'grey';
        circle(this.center, this.radius, false);
        if(this.interval === fifthInterval) {
            this.drawDiatonic();
            this.drawHarmonicMode();
        }
        for(var pitch in this.dots) {
            this.dots[pitch].draw();
        }
    }

    drawDiatonic() {
        context.fillStyle = 'rgba(255, 255, 255, 0.1)';
        var v = verticality.get();
        for(var pitch in this.dots) {
            var diatonic = true;
            for(var i = 1; diatonic && (i < 6); i++) {
                diatonic = diatonic && !v[transpose(
                    pitch,
                    -fifthInterval * i
                )];
            }
            if(diatonic) {
                semicircle(
                    this.center,
                    this.radius,
                    this.interval * pitchIndex(pitch) * 2 * Math.PI / pitchNames.length,
                    true
                );
            }
        }
    }

    drawHarmonicMode() {
        if(!verticality.chord || !(verticality.chord.quality === 'major' || verticality.chord.quality === 'dominant')) {
            return;
        }
        context.fillStyle = 'rgba(255, 55, 55, 0.1)';
        var VI = transpose(verticality.chord.root, 1);
        semicircle(
            this.center,
            this.radius,
            this.interval * pitchIndex(VI) * 2 * Math.PI / pitchNames.length,
            true
        );
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

buttons.clear.onclick = function() {
    verticality.reset();
}

buttons.play.onclick = function() {
    if(buttons.play.disabled) {
        return;
    }
    verticality.play();
}

buttons.stop.onclick = function() {
    if(buttons.stop.disabled) {
        return;
    }
    verticality.stop();
}

buttons.rotate.flat.onclick = function() {
    cof.rotate(-parseInt(inputs.rotate.fifths.value));
}

buttons.rotate.sharp.onclick = function() {
    cof.rotate(parseInt(inputs.rotate.fifths.value));
}

inputs.rotate.fifths.onchange = function() {
    inputs.rotate.semis.value = normalize(fifthInterval * inputs.rotate.fifths.value);
}

inputs.rotate.semis.onchange = function() {
    inputs.rotate.fifths.value = normalize(fifthInterval * inputs.rotate.semis.value);
}

buttons.mirror.onclick = function() {
    verticality.mirror(inputs.mirror.center.value);
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

window.onkeydown = function() {
    switch(event.key) {
        case "ArrowRight":
            cof.rotate(-1);
            break;
        case "ArrowLeft":
            cof.rotate(1);
            break;
        case "ArrowDown":
            cosemi.rotate(-1);
            break;
        case "ArrowUp":
            cosemi.rotate(1);
            break;
        case ' ':
            verticality.togglePlay();
            break;
        default:
            verticality.togglePitch(event.key);
            break;
    }
}
