
// include ./lib/note-duration.js

// include ./lib/duration-factory.js

/**
 * Parameter name starting duration
 * @type {string} 
 */
const DUR_START = 'Starting duration';

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
const MIN_DELAY = 1.0 / 240.0;

/**
 * Max length of a delay note in quarter notes.
 * Delay will not coninute if the note length exceeds this
 * @type {number} 
 */
const MAX_DELAY = 8.0;

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
	// Need a better way to do this, but get the NoteOn event if this is a NoteOff event so we can at least get the velocity
	if (event instanceof NoteOff) {
		var prevNoteOn = noteDuration.getActiveNote(event.pitch);
	}

	noteDuration.processNoteStream(event);

	// Calculate the note duration in beats.  Begin execution of delayed notes.
	if (event instanceof NoteOff) {
        var noteDur = (GetParameter(DUR_START) > 0) ? 
			durationFactory.convertDurationToBeat(durationFactory.getDuration(GetParameter(DUR_START))) :
			event.duration;
		Trace(noteDur);
		noteRepeater(event.pitch,
			prevNoteOn.velocity,
			event.beatPos + noteDur,
			noteDur
		)
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

	for (i = 1; i <= GetParameter(NUM_REPEATS); i++) {

		// safeguards
		if ((thisDuration > MAX_DELAY) && (GetParameter(DELAY_ACCEL_RATE) > 0)) {
			Trace('ABORT');
			return;
		}
		if ((thisDuration < MIN_DELAY) && (GetParameter(DELAY_ACCEL_RATE) < 0)) {
			Trace('ABORT');
			return;
		}

		if (thisVelocity > 127) {
			thisVelocity = 127;
		}

		if (thisVelocity < 1) {
			thisVelocity = 1;
		}

		// if (thisDuration < 1 / 240) break;
		var noteOnEvent = new NoteOn;
		noteOnEvent.pitch = pitch;
		noteOnEvent.velocity = thisVelocity;
		noteOnEvent.beatPos = thisStartBeat;

		var noteOffEvent = new NoteOff;
		noteOffEvent.pitch = pitch;
		noteOffEvent.beatPos = thisStartBeat + thisDuration;

		// next iteration
		thisStartBeat = noteOffEvent.beatPos + Math.abs(thisDuration);
		thisDuration += thisDuration * (GetParameter(DELAY_ACCEL_RATE) / 100.0);
		thisVelocity += thisVelocity * (GetParameter(VELOCITY_ACCEL_RATE) / 100.0);


		noteOnEvent.send();
		noteOffEvent.send();
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


durationFactory.durationList.unshift('off');

/**
 * List of parameter controls
 * @type {Array} 
 */
var PluginParameters =
	[
		durationFactory.generateDurationMenu(DUR_START),
		{
			name: NUM_REPEATS,
			type: 'lin',
			minValue: 1,
			maxValue: 30,
			numberOfSteps: 29,
			defaultValue: 10
		},
		{
			name: DELAY_ACCEL_RATE,
			type: 'lin',
			minValue: -50,
			maxValue: 50,
			numberOfSteps: 100,
			defaultValue: 0,
			unit: '%'
		},
		{
			name: VELOCITY_ACCEL_RATE,
			type: 'lin',
			minValue: -50,
			maxValue: 50,
			numberOfSteps: 100,
			defaultValue: 0,
			unit: '%'
		}

	];

	function ParameterChanged(param, value) {
		// param is index in PluginParameters array
		Trace(`"${PluginParameters[param].name}" changed to ${value}`);
		if (PluginParameters[param].name == DUR_START) {
			if (value == 0) {
				Trace(DUR_START + ' is off');
			} else  {
				Trace(DUR_START + ':' + durationFactory.convertDurationToBeat(durationFactory.getDuration(GetParameter(DUR_START))));

			}
		}
	}
	