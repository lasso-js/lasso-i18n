var transport = require('raptor-modules/transport');
module.exports = function create(config) {
    return {
        properties: {
            path: 'string'
        },

        read: function(optimizerContext, callback) {
            var initConfig = {
                locales: config.locales
            };

            return transport.defineCode(
                // path:
                '/raptor-i18n/config',
                // code:
                'module.exports = ' + JSON.stringify(initConfig, null, ' ') + ';');
        },

        calculateKey: function() {
            return 'raptor-i18n-config-def';
        }
    };
};