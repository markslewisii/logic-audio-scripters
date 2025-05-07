/**
 * Monophony
 * MIDI effect for Logic Audio that will convert a polyphony MIDI patch to monophonic.
 * @version 1.0.0
 * @author Mark Lewis <mark.lewis@configuredbase.com>
 * @see {@link https://github.com/markslewisii/logic-audio-scripters}
 */
/**
 * Stack of notes currently held.  Top is the only one playing.
 * @type {string} 
 */
var notesPlayingStack = [];
/**
 * Map of notes to track which ones are on
 * @type {string} 
 */
var notesPlayingMap = new Map();
/**
 * Executed for each incoming MIDI message
 * @returns {null}
 */
function HandleMIDI(event) {
    if (event instanceof NoteOn) {
        // process NoteOn
        // process if it's not already playing
        if (!notesPlayingMap.has(event.pitch)) {
            // turn off previous note
            if (notesPlayingStack.length > 0) {
                var noteOffEvent = new NoteOff(notesPlayingStack.at(-1));
                noteOffEvent.send();
            }
            // log note and send the noteOn event
            notesPlayingStack.push(event);
            notesPlayingMap.set(event.pitch, notesPlayingStack.at(-1));
            event.send();
        }
    } else if (event instanceof NoteOff) {
        // process NoteOff
        // if nothing is being tracked, reset
        if ((notesPlayingStack.length == 0) || (notesPlayingMap.size == 0)) {
            MIDI.allNotesOff();
            notesPlayingStack = [];
            notesPlayingMap = new Map();
        } else {
            //  If the noteOff pitch is the top of the stack, find the previous note
            var topNote = notesPlayingStack.at(-1);
            if (topNote.pitch == event.pitch) {
                // pop stack until we deplete the stack or find a note that is still playing in notesPlayingMap
                do {
                    notesPlayingStack.pop();
                } while ((notesPlayingStack.length > 0) && (!notesPlayingMap.has(notesPlayingStack.at(-1).pitch)));
                // is there still a note playing, then play the top of the stack
                if (notesPlayingStack.length > 0) {
                    // if, somehow, the noteOff is the same note as the one we're about to fall back to, don't play, else we get a stuck note
                    if (notesPlayingStack.at(-1).pitch != event.pitch) {
                        var fallbackNote = notesPlayingStack.at(-1);
                        // inherit the velocity from the note that was on top of the stack so we don't get surprising loud or soft notes
                        fallbackNote.velocity = topNote.velocity;
                        fallbackNote.send();
                    }
                }
            }
        }
        // delete this note and send the noteOff event
        notesPlayingMap.delete(event.pitch);
        event.send();
    } else {
        // send all other events
        event.send();
    }
}
