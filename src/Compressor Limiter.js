/**
 * Compressor Limiter
 * MIDI effect to set note velocity to the maximum allowed value when it exceeds a certain threshold.
 * @version 1.0.0
 * @author Mark Lewis <mark.lewis@configuredbase.com>
 * @see {@link https://github.com/markslewisii/logic-audio-scripters}
 */

/**
 * Parameter name maximum velocity
 * @type {string} 
 */
const THRESHOLD_LIMITER = 'Limiter threshold';

/**
 * Parameter name ratio
 * @type {string} 
 */
const RATIO_LIMITER = 'Limiter ratio';

/**
 * Parameter name minimum velocity
 * @type {string} 
 */
const THRESHOLD_GAIN = 'Gain threshold';

/**
 * Parameter name ratio
 * @type {string} 
 */
const RATIO_GAIN = 'Gain ratio';


/**
 * Parameter name normalize
 * @type {string} 
 */
const NORMALIZE = 'Normalize';

/**
 * Parameter name max ratio
 * @type {Number} 
 */
const MAX_RATIO = 5;

/**
 * Number of steps for the ratio sliders
 * @type {Number} 
 */
const NUM_STEPS = MAX_RATIO * 4;

/**
 * Executed every time a parameter is changed
 * @param {Number} param 
 * @param {*} value 
 */
function ParameterChanged(param, value) {
    switch (PluginParameters[param].name) {
        case THRESHOLD_LIMITER:
            if (GetParameter(THRESHOLD_LIMITER) < GetParameter(THRESHOLD_GAIN)) {
                // if the limiter threshold is less than the gain threshold, set the gain threshold to the limiter threshold
                SetParameter(THRESHOLD_GAIN, GetParameter(THRESHOLD_LIMITER));
            }
            break;
        case THRESHOLD_GAIN:
            if (GetParameter(THRESHOLD_GAIN) > GetParameter(THRESHOLD_LIMITER)) {
                // if the limiter threshold is less than the gain threshold, set the gain threshold to the limiter threshold
                SetParameter(THRESHOLD_LIMITER, GetParameter(THRESHOLD_GAIN));
            }
            break;

        default:
        //no action
    }

}

/**
 * Calulate the velocity based on the threshold and ratio
 * @param {Number} velocity 
 * @todo threshold should be calculated from 64?
 */
function calculateVelocity(velocity) {

    if (velocity > GetParameter(THRESHOLD_LIMITER)) {

        if (GetParameter(RATIO_LIMITER) == MAX_RATIO) {
            // if the limiter ratio is 1:∞, set the velocity to the threshold
            return GetParameter(THRESHOLD_LIMITER);

        } else {
            // if the velocity is above the threshold, apply the limiter ratio
            var diff = velocity - GetParameter(THRESHOLD_LIMITER);
            var ratio = 1.0 / GetParameter(RATIO_LIMITER);
            return Math.floor(GetParameter(THRESHOLD_LIMITER) + (diff * ratio));
        }

    } else if (velocity < GetParameter(THRESHOLD_GAIN)) {
        if (GetParameter(RATIO_GAIN) == MAX_RATIO) {
            // if the gain ratio is 1:∞, set the velocity to the threshold
            return GetParameter(THRESHOLD_GAIN);

        } else {
            // if the velocity is below the threshold, apply the gain ratio
            var diff = GetParameter(THRESHOLD_GAIN) - velocity;
            var ratio = 1.0 / GetParameter(RATIO_GAIN);
            return Math.floor(GetParameter(THRESHOLD_GAIN) - (diff * ratio));
        }
    } else {

        // return velocity unchanged
        return velocity;
    }

}

/**
 * Adjusts velocity by the different of the adjusted maximum velocity and the maximum velocity
 * @param {Number} velocity 
 * @returns {Number}
 */
function normalize(velocity) {
    return velocity + (127 - calculateVelocity(127));
}

/**
 * Executed for each incoming MIDI message
 * @returns {null}
 */
function HandleMIDI(event) {
    if ((event instanceof NoteOn) || (event instanceof NoteOff)) {
        event.velocity = calculateVelocity(event.velocity);
        if (GetParameter(NORMALIZE)) {
            event.velocity = normalize(event.velocity);
        }
    }
    event.send();
}



/**
 * List of parameter controls
 * @type {Array} 
 */
var PluginParameters = [
    /* 
    Parameter: Limiter threshold.  Any note with a velocity above this value will have its velocity adjusted according to the limiter ratio.
    */
    {
        name: THRESHOLD_LIMITER,
        type: 'lin',
        minValue: 0,
        maxValue: 127,
        numberOfSteps: 127,
        defaultValue: 100
    },

    /* 
    Parameter: Ratio.  The amount of compression when the limiter threshold is exceeded.
    */
    {
        name: RATIO_LIMITER,
        type: 'lin',
        minValue: 1,
        maxValue: MAX_RATIO,
        numberOfSteps: NUM_STEPS,
        defaultValue: 1,
        unit: ':1'
    },

    /* 
    Parameter: Maximum velocity.  Any note with a velocity above this value will have its velocity set to this maximum.
    */
    {
        name: THRESHOLD_GAIN,
        type: 'lin',
        minValue: 0,
        maxValue: 127,
        numberOfSteps: 127,
        defaultValue: 64
    },

    /* 
    Parameter: Gain ratio.  The amount of gain when the velocity is below the gain threshold.
    */
    {
        name: RATIO_GAIN,
        type: 'lin',
        minValue: 1,
        maxValue: MAX_RATIO,
        numberOfSteps: NUM_STEPS,
        defaultValue: 1,
        unit: ':1'
    },

    /* 
    Parameter: Normalize.  Adjust all velocities.
    */
    {
        name: NORMALIZE,
        type: "checkbox",
        defaultValue: 1
    }

];

