/**
 * Repeater
 * MIDI effect for Logic Audio that will repeat the notes at the pulse set for the effect.
 * @version 1.0.1
 * @author Mark Lewis <mark.lewis@configuredbase.com>
 * @see {@link https://github.com/markslewisii/logic-audio-scripters}
 */

// include ./lib/duration-factory.js
// include ./lib/note-duration.js

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
 * Previous beat of the last block.  Use to sense when the transport goes back in time.
 * @type {number}
 */
var lastBlockStartBeat = 0.0;

/**
 * Quantize value for mod wheel
 * @type {number}
 */
var modWheelValueQuant = 10.0;

/**
 * Shape of curve for mod wheel values.
 * < 1 - quick change then slower
 * 1 - linear
 * > 1 - slow change then quickly
 * @type {number}
 */
var modWheelValuePower = 0.9

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
    var numQuants = Math.floor(127.0 / modWheelValueQuant);
    modValue = (modValue >= 126.0) ? 126.0 : modValue;
    var newVal = Math.pow(Math.ceil(((127.0 - modValue) / 127.0) * numQuants) / numQuants, modWheelValuePower);
    pulsePerc = (newVal > 1.0) ? 1.0 : newVal;
}

/**
 * Get the length of a repeated note
 * @returns {number}
 */
function getRepeatedNoteDuration() {
    return getPulse() * (GetParameter(DURATION_PERC) / 100.0);
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

    if (event instanceof ControlChange) {
        switch (event.number) {
            case 1: // modulation
                adjustPulseFromModulation(event.value);
                break;
            default:
                // do nothing
                break;
        }
    }
    if ((!(event instanceof NoteOn)) &&
        (!(event instanceof NoteOff))) {
        event.send();
    }
}

/**
 * Executed each block
 * @returns {null}
 */
function ProcessMIDI() {
    var timingInfo = GetTimingInfo();

    // If playing, we'll need to reset on stop
    if (timingInfo.playing) {
        needReset = true;
    }

    // if we just stopped, reset.
    if (!timingInfo.playing && needReset) {
        nextBeat = 0;
        noteDuration.clear();
        needReset = false;
        return;
    }

    if (lastBlockStartBeat > timingInfo.blockStartBeat) {
        nextBeat = 0;
    }

    var pulse = getPulse();
    var nextBeat = durationFactory.nextBeatQuantized(timingInfo.blockStartBeat, pulse);

    while ((timingInfo.blockStartBeat <= nextBeat) && (nextBeat < timingInfo.blockEndBeat)) {
        var thisBeatEnd = nextBeat + getRepeatedNoteDuration();
        // Put the note off event that exceeds the loop end beat and schedule it from the loop start
        if (timingInfo.cycling && (thisBeatEnd >= timingInfo.rightCycleBeat)) {
            thisBeatEnd = timingInfo.leftCycleBeat + (timingInfo.rightCycleBeat - Math.floor(timingInfo.rightCycleBeat));
        }
        noteDuration.getActiveNotes().forEach((activeNote) => {
            createNote(activeNote.pitch, activeNote.velocity, nextBeat, thisBeatEnd);
        });
        pulse = getPulse();
        nextBeat = durationFactory.nextBeatQuantized(nextBeat + pulse, pulse);
    }

    lastBlockStartBeat = timingInfo.blockStartBeat;
}

// Remove the note values greater than 1/4 note.  Repeater formula not working with longer note values.
durationFactory.durationList.splice(-5);


/**
 * List of parameter controls
 * @type {Array} 
 */
var PluginParameters = [
    {
        name: 'Use mod wheel to increase pulse.',
        type: 'text',
    },

    // Parameter: pulse duration.  Choose a note value to the repeater to play at.
    durationFactory.generateDurationMenu(PULSE_DUR),

    /* 
    Parameter: duration percentage.  Choose how long each repeater note should play as a percent of the pulse duration.
    The higher the value the more "legato".
    */
    {
        name: DURATION_PERC,
        type: 'lin',
        minValue: 1,
        maxValue: 99,
        numberOfSteps: 98,
        defaultValue: 50,
        unit: '%'
    }

];
