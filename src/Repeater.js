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

var thisBeat = 0;
var lastBlockStartBeat = 0;
var needReset = false;
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


    if (timingInfo.blockStartBeat > thisBeat) {
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
var PluginParameters =
    [
        durationFactory.generateDurationMenu(PULSE_DUR),
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