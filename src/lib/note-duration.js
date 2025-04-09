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
    processNoteStream: function (midiEvent) {
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
    getActiveNotes: function () {
        return this._noteMap;
    },

    /**
     * 
     * @param {number} intNote 
     * @returns 
     */
    getActiveNote: function (intNote) {
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
    clear: function () {
        this._noteMap.clear();
    }
    
}