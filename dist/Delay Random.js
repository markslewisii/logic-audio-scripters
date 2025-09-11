/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var NeedsTimingInfo = true;
/**
 * Static object to translate note durations to beat values.
 * In Logic Audio, a 1/4 note = 1 beat.
 * @type {Object}
 */
var durationFactory = {
    /**
     * List of note durations.  Used to generate a parameter menu.
     * T = triplet
     * . = dotted
     * @type {Array}
     */
    durationList: ["1/32 T", "1/32", "1/32 .", "1/16 T", "1/16", "1/16 .", "1/8 T", "1/8", "1/8 .", "1/4 T", "1/4", "1/4 .", "1/2 T", "1/2", "1/2 .", "1"],
    /**
     * Convert the index to value.
     * @param {number} index 
     * @returns {string}
     */
    getDuration: function(index) {
        return this.durationList[index];
    },
    /**
     * Convert a duration string from durationList into a beat value.
     * @param {string} durationStr 
     * @returns {number}
     */
    convertDurationToBeat: function(durationStr) {
        var parts = String(durationStr).split(' ');
        var noteValue = eval(parts[0]);
        if (parts[1] == '.') {
            return this.dottedDurationToBeat(noteValue);
        } else if (parts[1] == 'T') {
            return this.tripletDurationToBeat(noteValue);
        } else {
            return this.noteDurationToBeat(noteValue);
        }
    },
    /**
     * Convert a straight note duration to a beat.
     * This is simply multiplying the note duration by 4.
     * @param {number} value 
     * @returns {number}
     */
    noteDurationToBeat: function(value) {
        return value * 4.0;
    },
    /**
     * Convert a dotted note duration to a beat.
     * This is performed by converting the straight duration to a beat then multiplying by 1.5
     * @param {number} value 
     * @returns {number}
     */
    dottedDurationToBeat: function(value) {
        return this.noteDurationToBeat(value) * 1.5;
    },
    /**
     * Convert a triplet note duration to a beat.
     * This is performed by converting the straight duration to a beat then multiplying by 2/3
     * @param {number} value 
     * @returns {number}
     */
    tripletDurationToBeat: function(value) {
        return this.noteDurationToBeat(value) * (2.0 / 3.0);
    },
    /**
     * Calculate the next beat after the provided beat that aligns with the quantize value
     * @param {number} currentBeat The current beat
     * @param {number} quantValue  The quantiaze value
     * @returns 
     */
    nextBeatQuantized: function(currentBeat, quantValue) {
        return Math.ceil(currentBeat / quantValue) * quantValue;
    },
    /**
     * Provide an object to add to the PluginParameters array to generate a menu of note durations
     * @param {string} name 
     * @returns {object}
     */
    generateDurationMenu: function(name) {
        return {
            name: name,
            type: 'menu',
            valueStrings: this.durationList,
            defaultValue: 0
        };
    },
    /**
     * Convert a beat value to milliseconds based on the current tempo
     * @param {Number} beat 
     * @returns 
     */
    beatToMilliseconds: function(beat) {
        var timingInfo = GetTimingInfo();
        // Convert beat to milliseconds based on the BPM
        return (beat * 60 * 1000) / timingInfo.tempo;
    },
    /**
     * Convert milliseconds to beat value based on the current tempo
     * @param {Number} milliseconds 
     * @returns 
     */
    millisecondsToBeat: function(milliseconds) {
        var timingInfo = GetTimingInfo();
        // Convert milliseconds to beat based on the BPM
        return (milliseconds * timingInfo.tempo) / (60 * 1000);
    }
}
/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var NeedsTimingInfo = true;
/**
 * Object to track NoteOff - NoteOn events of the same pitch to add a duration property to NoteOff events.
 * Send all incoming MIDI events to noteDuration.processNoteStream() in a HandleMIDI() method to track the events.
 * @type {Object}
 */
var noteDuration = {
    /**
     * Map to temporarily store NoteOn events until the NoteOff event arrives.
     * @type {Map}
     */
    _noteMap: new Map(),
    /**
     * Pass all MIDI events into this function.
     * The function will track NoteOn anf NoteOffs to calculate a note duration and assign it to the NoteOff event.
     * @param {NoteEvent} midiEvent 
     */
    processNoteStream: function(midiEvent) {
        if (midiEvent instanceof NoteOn) {
            this._noteMap.set(midiEvent.pitch, midiEvent);
        }
        if (midiEvent instanceof NoteOff) {
            var noteOnEvent = this._noteMap.get(midiEvent.pitch);
            if ((this._noteMap.get(midiEvent.pitch) !== null) && (noteOnEvent !== undefined)) {
                midiEvent.duration = midiEvent.beatPos - this._noteMap.get(midiEvent.pitch).beatPos;
                midiEvent.noteOnEvent = noteOnEvent;
            }
            this._noteMap.delete(midiEvent.pitch);
        }
    },
    /**
     * Get note Map of all current playing notes.
     * @returns {Map}
     */
    getActiveNotes: function() {
        return this._noteMap;
    },
    /**
     * 
     * @param {number} intNote 
     * @returns 
     */
    getActiveNote: function(intNote) {
        if (this._noteMap.has(intNote)) {
            return this._noteMap.get(intNote);
        } else {
            return null;
        }
    },
    /**
     * Is note playing?
     * @param {number} intNote 
     * @returns 
     */
    isPlaying: function(intNote) {
        return this._noteMap.has(intNote);
    },
    /**
     * Clear the map of active notes.
     * @returns {null}
     */
    clear: function() {
        this._noteMap.clear();
    }
}
/**
 * Parameter name for the pulse of the delay.
 * @type {string} 
 */
const DELAY_PULSE = 'Pulse of delay';
const DELAY_LENGTH_S = 'Length of delay';
const DELAY_DENSITY = 'Density of delay';
const DELAY_MIN_VELOCTIY = 'Minimum velocity of delay';
const DELAY_MAX_VELOCTIY = 'Maximum velocity of delay';
const TAPER_DELAY = 'Decay delay over time';
/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var NeedsTimingInfo = true;
/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var notesOffSent = true;
/** 
 * Handle incoming event
 * @param {Event} event MIDI event to process
 * @returns {null}
 */
function HandleMIDI(event) {
    noteDuration.processNoteStream(event);
    // Calculate the note duration in beats.  Begin execution of delayed notes.
    if (event instanceof NoteOff) {
        var selectedPulseAsDuration = durationFactory.convertDurationToBeat(durationFactory.getDuration(GetParameter(DELAY_PULSE)));
        delayPulse(event, durationFactory.nextBeatQuantized(event.beatPos + selectedPulseAsDuration, selectedPulseAsDuration), selectedPulseAsDuration);
    }
    event.send();
}

function delayPulse(ne, startBeat, pulse) {
    var numRepeats = Math.ceil(GetParameter(DELAY_LENGTH_S) / (durationFactory.beatToMilliseconds(pulse) / 1000.0));
    var thisBeat = startBeat;
    var info = GetTimingInfo();
    var diff = startBeat - info.blockStartBeat;
    // Trace(info.beatPos);
    for (let i = 0; i < numRepeats; i++) {
        if (randomIntInRange(0, 100) <= GetParameter(DELAY_DENSITY)) {
            var thisVelocity = ne.noteOnEvent.velocity * randomIntInRange(GetParameter(DELAY_MIN_VELOCTIY), GetParameter(DELAY_MAX_VELOCTIY)) * 0.01;
            //var thisVelocity = randomIntInRange(GetParameter(DELAY_MIN_VELOCTIY), GetParameter(DELAY_MAX_VELOCTIY));
            if (GetParameter(TAPER_DELAY)) {
                thisVelocity *= (1 - (i / numRepeats)); // taper the velocity
            }
            var noteOnEvent = new NoteOn();
            noteOnEvent.pitch = ne.noteOnEvent.pitch;
            noteOnEvent.velocity = thisVelocity;
            // noteOnEvent.sendAtBeat(thisBeat);
            noteOnEvent.sendAfterMilliseconds(durationFactory.beatToMilliseconds(diff + (i * pulse)));
            // noteOnEvent.sendAfterBeats(thisBeat);
            var noteOffEvent = new NoteOff();
            noteOffEvent.pitch = ne.noteOnEvent.pitch;
            noteOffEvent.velocity = thisVelocity;
            // noteOffEvent.sendAtBeat(thisBeat + pulse - 0.001); // subtract a small amount to avoid overlap issues
            noteOffEvent.sendAfterMilliseconds(durationFactory.beatToMilliseconds((diff + (i + 1) * pulse) - 0.001));
        }
        thisBeat += pulse;
    }
}

function randomIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Executed every time a parameter is changed
 * @param {Number} param 
 * @param {*} value 
 */
function ParameterChanged(param, value) {
    switch (PluginParameters[param].name) {
        case DELAY_MAX_VELOCTIY:
            if (GetParameter(DELAY_MAX_VELOCTIY) < GetParameter(DELAY_MIN_VELOCTIY)) {
                SetParameter(DELAY_MIN_VELOCTIY, GetParameter(DELAY_MAX_VELOCTIY));
            }
            break;
        case DELAY_MIN_VELOCTIY:
            if (GetParameter(DELAY_MIN_VELOCTIY) > GetParameter(DELAY_MAX_VELOCTIY)) {
                SetParameter(DELAY_MAX_VELOCTIY, GetParameter(DELAY_MIN_VELOCTIY));
            }
            break;
        default:
            //no action
    }
}
/** 
 * Handle incoming event
 * @param {Event} event MIDI event to process
 * @returns {null}
 */
function ProcessMIDI() {
    var info = GetTimingInfo();
    //if the transport stops, and allNotesOff() has not yet been sent
    if (!info.playing && !notesOffSent) {
        MIDI.allNotesOff();
        noteDuration.clear();
        notesOffSent = true;
    }
    //reset the notesOffSent flag
    if (info.playing && notesOffSent) {
        notesOffSent = false;
    }
}
var PluginParameters = [
    durationFactory.generateDurationMenu(DELAY_PULSE), {
        name: DELAY_LENGTH_S,
        type: 'lin',
        minValue: 1,
        maxValue: 30,
        numberOfSteps: 30 - 1,
        defaultValue: 5,
        unit: 'seconds'
    }, {
        name: DELAY_DENSITY,
        type: 'lin',
        minValue: 1,
        maxValue: 100,
        numberOfSteps: 100 - 1,
        defaultValue: 75,
        unit: '%'
    }, {
        name: DELAY_MIN_VELOCTIY,
        type: 'lin',
        minValue: 1,
        maxValue: 100,
        numberOfSteps: 100 - 1,
        defaultValue: 30,
        unit: '%'
    }, {
        name: DELAY_MAX_VELOCTIY,
        type: 'lin',
        minValue: 1,
        maxValue: 100,
        numberOfSteps: 100 - 1,
        defaultValue: 60,
        unit: '%'
    }, {
        name: TAPER_DELAY,
        type: "checkbox",
        defaultValue: 0
    }
];
