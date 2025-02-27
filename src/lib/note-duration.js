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

function processNoteStream(noteEvent) {
    if (noteEvent instanceof NoteOn) {
        _noteHash[noteEvent.pitch] = noteEvent;
    }
    if (noteEvent instanceof NoteOff) {
        if (_noteHash[noteEvent.pitch] !== null) {
            noteEvent.duration = noteEvent.beatPos - _noteHash[noteEvent.pitch].beatPos;
        }
        _noteHash[noteEvent.pitch] = null;
    }
}