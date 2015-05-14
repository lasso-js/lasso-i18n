var transport = require('raptor-modules/transport');
module.exports = function create(config) {
    return {
        properties: {
            path: 'string'
        },

        read: function(lassoContext, callback) {
            var initConfig = {
                locales: config.locales
            };

            return transport.defineCode(
                // path:
                '/lasso-i18n/config',
                // code:
                'module.exports = ' + JSON.stringify(initConfig, null, ' ') + ';');
        },

        calculateKey: function() {
            return 'lasso-i18n-config-def';
        }
    };
};