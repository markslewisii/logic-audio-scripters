
// include ./lib/duration-factory.js
// include ./lib/note-duration.js

/**
 * Parameter name for the pulse of the delay.
 * @type {string} 
 */
const DELAY_PULSE = 'Pulse of delay';
const DELAY_LENGTH_S = 'Length of delay';
const DELAY_DENSITY = 'Density of delay';
const DELAY_MIN_VELOCTIY = 'Minimum velocity of delay';
const DELAY_MAX_VELOCTIY = 'Maximum velocity of delay';
const TAPER_DELAY = 'Decay delay over time';



/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var NeedsTimingInfo = true;

/**
 * Option to receiving timing info
 * @type {boolean} 
 */
var notesOffSent = true;

/** 
 * Handle incoming event
 * @param {Event} event MIDI event to process
 * @returns {null}
 */
function HandleMIDI(event) {
	noteDuration.processNoteStream(event);

	// Calculate the note duration in beats.  Begin execution of delayed notes.
	if (event instanceof NoteOff) {
		var selectedPulseAsDuration = durationFactory.convertDurationToBeat(durationFactory.getDuration(GetParameter(DELAY_PULSE)));
		delayPulse(
			event, 
			durationFactory.nextBeatQuantized(
				event.beatPos + selectedPulseAsDuration, 
				selectedPulseAsDuration
			), 
			selectedPulseAsDuration
		);
	}
	event.send();
}


function delayPulse(ne, startBeat, pulse) {
    var numRepeats = Math.ceil(GetParameter(DELAY_LENGTH_S) / (durationFactory.beatToMilliseconds(pulse) / 1000.0));
    var thisBeat = startBeat;
    var info = GetTimingInfo();
    var diff = startBeat - info.blockStartBeat;
    // Trace(info.beatPos);
    for (let i = 0; i < numRepeats; i++) {
        if (randomIntInRange(0, 100) <= GetParameter(DELAY_DENSITY)) {

			var thisVelocity = ne.noteOnEvent.velocity * randomIntInRange(GetParameter(DELAY_MIN_VELOCTIY), GetParameter(DELAY_MAX_VELOCTIY)) * 0.01;
			//var thisVelocity = randomIntInRange(GetParameter(DELAY_MIN_VELOCTIY), GetParameter(DELAY_MAX_VELOCTIY));
			if (GetParameter(TAPER_DELAY)) {
				thisVelocity *= (1 - (i / numRepeats)); // taper the velocity
			}

            var noteOnEvent = new NoteOn();
            noteOnEvent.pitch = ne.noteOnEvent.pitch;
			noteOnEvent.velocity = thisVelocity;
            // noteOnEvent.sendAtBeat(thisBeat);
            noteOnEvent.sendAfterMilliseconds(durationFactory.beatToMilliseconds(diff + (i * pulse)));
            // noteOnEvent.sendAfterBeats(thisBeat);

            var noteOffEvent = new NoteOff();
            noteOffEvent.pitch = ne.noteOnEvent.pitch;
			noteOffEvent.velocity = thisVelocity;
            // noteOffEvent.sendAtBeat(thisBeat + pulse - 0.001); // subtract a small amount to avoid overlap issues
            noteOffEvent.sendAfterMilliseconds(durationFactory.beatToMilliseconds((diff + (i+1) * pulse) - 0.001));
        }
        thisBeat += pulse;
    }
}


function randomIntInRange(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * Executed every time a parameter is changed
 * @param {Number} param 
 * @param {*} value 
 */
function ParameterChanged(param, value) {
    switch (PluginParameters[param].name) {
        case DELAY_MAX_VELOCTIY:
            if (GetParameter(DELAY_MAX_VELOCTIY) < GetParameter(DELAY_MIN_VELOCTIY)) {
                SetParameter(DELAY_MIN_VELOCTIY, GetParameter(DELAY_MAX_VELOCTIY));
            }
            break;
        case DELAY_MIN_VELOCTIY:
            if (GetParameter(DELAY_MIN_VELOCTIY) > GetParameter(DELAY_MAX_VELOCTIY)) {
                SetParameter(DELAY_MAX_VELOCTIY, GetParameter(DELAY_MIN_VELOCTIY));
            }
            break;

        default:
        //no action
    }

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
		MIDI.allNotesOff();
		noteDuration.clear();
		notesOffSent = true;
	}

	//reset the notesOffSent flag
	if (info.playing && notesOffSent) {
		notesOffSent = false;
	}
}

var PluginParameters =
	[
		durationFactory.generateDurationMenu(DELAY_PULSE),

		{
			name: DELAY_LENGTH_S,
			type: 'lin',
			minValue: 1,
			maxValue: 30,
			numberOfSteps: 30-1,
			defaultValue: 5,
			unit: 'seconds'
		},
		{
			name: DELAY_DENSITY,
			type: 'lin',
			minValue: 1,
			maxValue: 100,
			numberOfSteps: 100-1,
			defaultValue: 75,
			unit: '%'
		},
		{
			name: DELAY_MIN_VELOCTIY,
			type: 'lin',
			minValue: 1,
			maxValue: 100,
			numberOfSteps: 100-1,
			defaultValue: 30,
			unit: '%'
		},
		{
			name: DELAY_MAX_VELOCTIY,
			type: 'lin',
			minValue: 1,
			maxValue: 100,
			numberOfSteps: 100-1,
			defaultValue: 60,
			unit: '%'
		},
		{
			name: TAPER_DELAY,
			type:"checkbox",
        	defaultValue: 0
		}


	];

