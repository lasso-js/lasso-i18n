var transport = require('raptor-modules/transport');

module.exports = function create(config) {

    return {

        properties: {
            path: 'string'
        },

        init: function() {
            
        },

        read: function(optimizerContext, callback) {

            var initConfig = {
                locales: config.locales
            };

            var out = transport.defineCode(
                // path:
                '/raptor-i18n/config',

                // code:
                'module.exports = ' + JSON.stringify(initConfig, null, ' ') + ';');


            return out;
        },

        calculateKey: function() {
            return 'raptor-i18n-config';
        }
    };
};