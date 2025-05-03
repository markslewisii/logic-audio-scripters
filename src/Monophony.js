/**
 * Monophony
 * MIDI effect for Logic Audio that will convert a polyphony MIDI patch to monophonic.
 * @version 1.0.0
 * @author Mark Lewis <mark.lewis@configuredbase.com>
 * @see {@link https://github.com/markslewisii/logic-audio-scripters}
 */

var notesPlayingStack = [];
var notesPlayingMap = new Map();

function HandleMIDI(event) {
    if (event instanceof NoteOn) {
        Trace('noteOn:' + event.pitch);
        if (!notesPlayingMap.has(event.pitch)) {
            //if (notesPlayingStack.length > 0) {
            // turn off previous note
            var prevNote = notesPlayingStack.at(-1);

            var noteOffEvent = new NoteOff(prevNote);
            // Trace('prev note off: ' + noteOffEvent);
            noteOffEvent.send();
            //}
            event.send();

            notesPlayingStack.push(event);
            notesPlayingMap.set(event.pitch, notesPlayingStack.at(-1));
            // Trace('new note on: ' + event);
        }
        // Trace('noteOn:' + notesPlayingStack.length);
    }
    if (event instanceof NoteOff) {

        if (notesPlayingStack.length > 0) {
            if (notesPlayingStack.at(-1).pitch == event.pitch) {
                Trace('noteOff - pop:' + event.pitch);
                notesPlayingStack.pop();
                if (notesPlayingStack.length > 0) {
                    var fallbackNote = notesPlayingStack.at(-1);
                    fallbackNote.send();
                }
            } else {
                Trace('noteOff - just remove:' + event.pitch);
            }
        }
        notesPlayingMap.delete(event.pitch);
        event.send();
        // Trace('noteOff:' + event);
    }

    //Trace('stk:' + notesPlayingStack.length);
    //Trace('map:' + Array.from(notesPlayingMap.keys()).length);
}
