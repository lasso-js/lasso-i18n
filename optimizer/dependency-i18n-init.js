var transport = require('raptor-modules/transport');

module.exports = {
    properties: {
        config: 'object'
    },

    init: function() {
        
    },

    read: function(optimizerContext, callback) {
        var out = transport.defineCode(
            // path:
            '/raptor-i18n/init',

            // code:
            'require("raptor-i18n").initialize(' + JSON.stringify(this.config) + ');',
            {
                run: true
            });


        return out;
    },

    calculateKey: function() {
        return 'i18n-init';
    }
};