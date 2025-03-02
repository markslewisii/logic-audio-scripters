/**
 * Array to temporarily store NoteOn events until the NoteOff event arrives.
 * @type {Array} 
 */
var _noteHash = [];

/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var NeedsTimingInfo = true;

/**
 * Pass all MIDI events into this function.
 * The function will track NoteOn anf Note Offs to calculate a note duration and assign it to the NoteOFf event.
 * @param {NoteEvent} noteEvent 
 */
function processNoteStream(noteEvent) {
    if (noteEvent instanceof NoteOn) {
        _noteHash[noteEvent.pitch] = noteEvent;
    }
    if (noteEvent instanceof NoteOff) {
        if ((_noteHash[noteEvent.pitch] !== null) && (_noteHash[noteEvent.pitch] !== undefined)) {
            noteEvent.duration = noteEvent.beatPos - _noteHash[noteEvent.pitch].beatPos;
        }
        _noteHash[noteEvent.pitch] = null;
    }
}