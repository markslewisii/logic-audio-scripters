/**
 * Static object to translate note durations to beat values.
 * In Logic Audio, a 1/4 note = 1 beat.
 * @type {Object}
 */
var durationFactory = {
    
    /**
     * List of note durations.  Used to generate a parameter menu.
     * T = triplet
     * . = dotted
     * @type {Array}
     */
    durationList: ["1/32 T", "1/32", "1/32 .", "1/16 T", "1/16", "1/16 .", "1/8 T", "1/8", "1/8 .", "1/4 T", "1/4", "1/4 .", "1/2 T", "1/2", "1/2 .", "1"],

    /**
     * Convert the index to value.
     * @param {number} index 
     * @returns {string}
     */
    getDuration: function (index) {
        return this.durationList[index];
    },

    /**
     * Convert a duration string from durationList into a beat value.
     * @param {string} durationStr 
     * @returns {number}
     */
    convertDurationToBeat: function (durationStr) {
        var parts = String(durationStr).split(' ');
        var noteValue = eval(parts[0]);
        if (parts[1] == '.') {
            return this.dottedDurationToBeat(noteValue);
        } else if (parts[1] == 'T') {
            return this.tripletDurationToBeat(noteValue);
        } else {
            return this.noteDurationToBeat(noteValue);
        }
    },

    /**
     * Convert a straight note duration to a beat.
     * This is simply multiplying the note duration by 4.
     * @param {number} value 
     * @returns {number}
     */
    noteDurationToBeat: function (value) {
        return value * 4.0;
    },

    /**
     * Convert a dotted note duration to a beat.
     * This is performed by converting the straight duration to a beat then multiplying by 1.5
     * @param {number} value 
     * @returns {number}
     */
    dottedDurationToBeat: function (value) {
        return this.noteDurationToBeat(value) * 1.5;
    },

    /**
     * Convert a triplet note duration to a beat.
     * This is performed by converting the straight duration to a beat then multiplying by 2/3
     * @param {number} value 
     * @returns {number}
     */
    tripletDurationToBeat: function (value) {
        return this.noteDurationToBeat(value) * (2.0 / 3.0);
    },

    /**
     * Calculate the next beat after the provided beat that aligns with the quantize value
     * @param {number} currentBeat The current beat
     * @param {number} quantValue  The quantiaze value
     * @returns 
     */
    nextBeatQuantized: function (currentBeat, quantValue) {
        return Math.ceil(currentBeat / quantValue) * quantValue;
    },

    /**
     * Provide an object to add to the PluginParameters array to generate a menu of note durations
     * @param {string} name 
     * @returns {object}
     */
    generateDurationMenu: function (name) {
        return {
            name: name,
            type: 'menu',
            valueStrings: this.durationList,
            defaultValue: 0
        };
    }
}