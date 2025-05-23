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
     * Clear the map of active notes.
     * @returns {null}
     */
    clear: function() {
        this._noteMap.clear();
    }
}
/**
 * Parameter name for number of delay repeats
 * @type {string} 
 */
const NUM_REPEATS = 'Number of delay repeats';
/**
 * Parameter name for the delay acceleration rate.
 * Positive values slow down.
 * Negative values speed up.
 * 0 maintains rate
 * @type {string} 
 */
const DELAY_ACCEL_RATE = 'Delay acceleration rate';
/**
 * Parameter name for the velocity acceleration rate
 * Positive values increase volume.
 * Negative values decrease volume.
 * 0 maintains volume.
 * @type {string} 
 */
const VELOCITY_ACCEL_RATE = 'Velocity acceleration rate';
/**
 * Min length of a delay note in quarter notes.
 * Delay will not coninute if the note length less than this
 * @type {number} 
 */
const MIN_DELAY = 15.0 / 240.0;
/**
 * Max length of a delay note in quarter notes.
 * Delay will not coninute if the note length exceeds this
 * @type {number} 
 */
const MAX_DELAY = 1.5;
/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var NeedsTimingInfo = true;
/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var notesOffSent = false;
/** 
 * Handle incoming event
 * @param {Event} event MIDI event to process
 * @returns {null}
 */
function HandleMIDI(event) {
    noteDuration.processNoteStream(event);
    // Calculate the note duration in beats.  Begin execution of delayed notes.
    if (event instanceof NoteOff) {
        noteRepeater(event.pitch, event.beatPos)
    }
    event.send();
}
/** 
 * Note repeater.  
 * @param {number} pitch MIDI NoteOn pitch
 * @param {number} velocity MIDI NoteOn pitch
 * @param {number} startBeat Beat to start the delayed notes
 * @param {number} noteDuration Duration of the original note
 * @returns {void}
 */
function noteRepeater(pitch, delayStart) {
    var thisDuration = 0.0;
    var thisVelocity = 64;
    var thisStartBeat = delayStart;
    for (i = 1; i <= GetParameter(NUM_REPEATS); i++) {
        thisDuration = randomDuration();
        thisVelocity = Math.floor(Math.random() * (80.0 - 40.0)) + 40.0;
        // if (thisDuration < 1 / 240) break;
        var noteOnEvent = new NoteOn;
        noteOnEvent.pitch = pitch;
        noteOnEvent.velocity = thisVelocity;
        noteOnEvent.beatPos = thisStartBeat;
        var noteOffEvent = new NoteOff;
        noteOffEvent.pitch = pitch;
        noteOffEvent.beatPos = thisStartBeat + thisDuration;
        // next iteration
        thisStartBeat += thisDuration + randomDuration();
        noteOnEvent.send();
        noteOffEvent.send();
    }
}

function randomDuration() {
    return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY)) + MIN_DELAY;
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
        Trace('ALL NOTES OFF!!!!');
        MIDI.allNotesOff();
        noteDuration.clear();
        notesOffSent = true;
    }
    //reset the notesOffSent flag
    if (info.playing && notesOffSent) {
        notesOffSent = false;
    }
}
var PluginParameters = [{
    name: 'start length',
    type: 'lin',
    minValue: 4 * 1.0 / 64.0,
    maxValue: 4 * 1.0 / 2.0,
    numberOfSteps: 15,
    defaultValue: 1
}, {
    name: NUM_REPEATS,
    type: 'lin',
    minValue: 1,
    maxValue: 30,
    numberOfSteps: 29,
    defaultValue: 10
}, {
    name: DELAY_ACCEL_RATE,
    type: 'lin',
    minValue: -50,
    maxValue: 50,
    numberOfSteps: 100,
    defaultValue: 33,
    unit: '%'
}, {
    name: VELOCITY_ACCEL_RATE,
    type: 'lin',
    minValue: -50,
    maxValue: 50,
    numberOfSteps: 100,
    defaultValue: 33,
    unit: '%'
}];
