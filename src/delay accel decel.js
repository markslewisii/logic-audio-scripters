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
 * Array to temporarily store NoteOn events until the NoteOff event arrives.
 * @type {Array} 
 */
var noteHash = [];





/** 
 * Handle incoming event
 * @param {Event} event MIDI event to process
 * @returns {null}
 */
function HandleMIDI(event)
{
	// log NoteOn events to noteHash.  This is store to calculate note duration when the NoteOff event arrives.
	if (event instanceof NoteOn) {
		noteHash[event.pitch] = event;
		// Trace('noteOn: ' + event.pitch + ' : ' + noteHash[event.pitch].pitch);
	}
	
	// Calculate the note duration in beats.  Begin execution of delayed notes.
	if (event instanceof NoteOff) {
		if (noteHash[event.pitch] !== null) {
			var noteDiff = event.beatPos - noteHash[event.pitch].beatPos;
			noteRepeater(noteHash[event.pitch].pitch,
				noteHash[event.pitch].velocity,
				event.beatPos + noteDiff,
				noteDiff
			)
			noteHash[event.pitch] = null;
			// Trace('noteOff: ' + event.pitch + ' : ' + noteDiff);
		}
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
function noteRepeater(pitch, velocity, startBeat, noteDuration) {
	var thisDuration = noteDuration;
	var thisVelocity = velocity;
	var thisStartBeat = startBeat;
	var eventArr = [];
	for(i = 1; i <= GetParameter(NUM_REPEATS); i++) {
		// thisDuration = noteDuration / i;
		thisDuration = thisDuration + (thisDuration * (GetParameter(DELAY_ACCEL_RATE)/20));
		thisVelocity = thisVelocity + (GetParameter(VELOCITY_ACCEL_RATE) * 10);

	    if (thisDuration < 1 / 240) break;
		var noteOnEvent = new NoteOn;
		noteOnEvent.pitch = pitch;
		noteOnEvent.velocity = thisVelocity;
		noteOnEvent.beatPos = thisStartBeat;
		
		var noteOffEvent = new NoteOff;
		noteOffEvent.pitch = pitch;
		noteOffEvent.beatPos = thisStartBeat + thisDuration;
		
		if (thisVelocity > 127) {
			thisVelocity = 127;
		}

		thisStartBeat = noteOffEvent.beatPos + thisDuration;
		
		noteOnEvent.send();
		noteOffEvent.send();
	}
}


function ProcessMIDI() {

    var info = GetTimingInfo();
	 
    //if the transport stops, and allNotesOff() has not yet been sent
    if (!info.playing && !notesOffSent){
    		Trace('ALL NOTES OFF!!!!');
        MIDI.allNotesOff();
        noteHash = [];
        notesOffSent = true;
    }  
  
    //reset the notesOffSent flag
    if(info.playing && notesOffSent) {
        notesOffSent = false;
    }
}

var PluginParameters =
[
    {
        name: NUM_REPEATS,
        type:"lin",
        minValue:1,
        maxValue:30,
        numberOfSteps:29,
        defaultValue:10
    },
    {
        name: DELAY_ACCEL_RATE,
        type:"lin",
        minValue:-10,
        maxValue:10,
        numberOfSteps:20,
        defaultValue:0
    },
    {
        name: VELOCITY_ACCEL_RATE,
        type:"lin",
        minValue:-1,
        maxValue:1,
        numberOfSteps:20,
        defaultValue:0
    }
 
]

