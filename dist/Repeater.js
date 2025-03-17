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
    durationList: ["1/16 T", "1/16", "1/16 .", "1/8 T", "1/8", "1/8 .", "1/4 T", "1/4", "1/4 .", "1/2 T", "1/2", "1/2 .", "1"],
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
        return value * 4;
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
        var quantBeat = Math.floor(currentBeat / quantValue) * quantValue;
        if (quantBeat >= currentBeat) {
            return currentBeat;
        } else {
            return quantBeat + quantValue;
        }
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
    }
};
/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var NeedsTimingInfo = true;
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
            if ((this._noteMap.get(midiEvent.pitch) !== null) && (this._noteMap.get(midiEvent.pitch) !== undefined)) {
                midiEvent.duration = midiEvent.beatPos - this._noteMap.get(midiEvent.pitch).beatPos;
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
     * Clear the map of active notes.
     * @returns {null}
     */
    clear: function() {
        this._noteMap.clear();
    }
}
/**
 * Parameter name pulse duration
 * @type {string} 
 */
const PULSE_DUR = 'Pulse duration';
/**
 * Parameter name duration percentage
 * @type {string} 
 */
const DURATION_PERC = 'Duration percentage'

/**
 * Next beat based on the current pulse the repeater should invoke
 * @type {number}
 */
var thisBeat = 0.0;

/**
 * Previous beat of the last block.  Use to sense when the transport goes back in time.
 * @type {number}
 */
var lastBlockStartBeat = 0;

/**
 * Flag to determine if things need to be reset when the transport stops
 * @type {boolean}
 */
var needReset = false;

/**
 * Percentage to adjust the pulse from the modulation wheel value.
 * @type {number}
 */
var pulsePerc = 1.0;

/**
 * Get the pulse set for the repeater from the Parameter
 * @returns {number}
 */
function getPulse() {
    return pulsePerc * durationFactory.convertDurationToBeat(durationFactory.getDuration(GetParameter(PULSE_DUR)));
}
/**
 * Adjust the pulse from the modulation value.  Makes the pulse goe faster as the value approaches 127.
 * @param {number} modValue 
 */
function adjustPulseFromModulation(modValue) {
    if (modValue == 127.0) modValue = 126.0;
    pulsePerc = (127.0 - modValue) / 127.0;
}
/**
 * Generate a note with a specified duration.  This will create a NoteOn and NoteOff event.
 * @param {number} pitch 
 * @param {number} velocity 
 * @param {number} start 
 * @param {number} duration 
 */
function createNote(pitch, velocity, start, duration) {
    noteOn = new NoteOn();
    noteOn.pitch = pitch;
    noteOn.velocity = velocity;
    noteOn.sendAtBeat(start);
    noteOff = new NoteOff();
    noteOff.pitch = pitch;
    noteOff.sendAtBeat(duration);
}
/** 
 * Handle incoming event
 * @param {Event} event MIDI event to process
 * @returns {null}
 */
function HandleMIDI(event) {
    noteDuration.processNoteStream(event);
    if (event instanceof NoteOn) {
        createNote(event.pitch, event.velocity, event.beatPos, event.beatPos + (getPulse() / 2.0));
    }
    if (event instanceof ControlChange) {
        switch (event.number) {
            case 1: // modulation
                adjustPulseFromModulation(event.value);
                Trace('modulation:' + event.value);
                break;
            default:
                //nothing
                break;
        }
    }
}
/**
 * Executed each block
 * @returns {null}
 */
function ProcessMIDI() {
    var timingInfo = GetTimingInfo();
    if (timingInfo.playing) {
        needReset = true;
    }
    if (!timingInfo.playing && needReset) {
        Trace('Stopped play - reset');
        thisBeat = 0;
        noteDuration.clear();
        needReset = false;
        return;
    }
    if (lastBlockStartBeat > timingInfo.blockStartBeat) {
        thisBeat = 0;
    }
    if (timingInfo.blockStartBeat >= thisBeat) {
        var pulse = getPulse();
        thisBeat = durationFactory.nextBeatQuantized(timingInfo.blockStartBeat, pulse);
        noteDuration.getActiveNotes().forEach((activeNote) => {
            createNote(activeNote.pitch, activeNote.velocity, thisBeat, thisBeat + (pulse * (GetParameter(DURATION_PERC) / 100.0)));
        });
    }
    lastBlockStartBeat = timingInfo.blockStartBeat;
}
/**
 * List of parameter controls
 * @type {Array} 
 */
var PluginParameters = [
    durationFactory.generateDurationMenu(PULSE_DUR), {
        name: DURATION_PERC,
        type: 'lin',
        minValue: 1,
        maxValue: 99,
        numberOfSteps: 98,
        defaultValue: 50,
        unit: '%'
    }
];
