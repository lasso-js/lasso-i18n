var I18nContext = require('./I18nContext');

module.exports = function create(config) {

    var locales = config.locales;

    return {

        properties: {
            path: 'string'
        },

        loadPackageManifest: function(optimizerContext, callback) {
            var i18nContext = I18nContext.getI18nContext(optimizerContext, config);
            var async = {};

            for (var i = 0; i < locales.length; i++) {
                var locale = locales[i];
                var asyncPackageName = 'i18n-' + locale;

                // add the dependency for the current locale
                async[asyncPackageName] = [
                    {
                        type: 'i18n-locale',
                        locale: locale,
                        i18nContext: i18nContext
                    }
                ];
            }

            var manifest = {
                dependencies: [
                    // make sure raptor-i18n is included on page
                    'require: raptor-i18n',

                    // The config needs to be written as JavaScript
                    'i18n-config-def'
                ],
                async: async
            };

            callback(null, manifest);
        },

        calculateKey: function() {
            return 'raptor-i18n-config';
        }
    };
};