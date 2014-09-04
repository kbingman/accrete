var ECCENTRICITY_COEFF = 0.077; /* Dole's was 0.077 */

function Utils() {}

Utils.prototype = Object.create({

    randomNumber: function(inner, outer) {
        var delta = Math.abs(outer - inner);
        if (inner < outer) {
            return (inner + delta * randomTool.genrand_real3());
        } else {
            return (outer + delta * randomTool.genrand_real3());
        }
    },

    randomEccentricity: function() {
        return (1.0 - Math.pow((randomTool.genrand_real3()), ECCENTRICITY_COEFF));
    },

    /*----------------------------------------------------------------------*/
    /* This function returns a value within a certain variation of the */
    /* exact value given it in 'value'. */
    /*----------------------------------------------------------------------*/
    about: function(value, variation) {
        var inner = value - variation;
        return (inner + 2.0 * variation * randomTool.genrand_real3());
    }

});
