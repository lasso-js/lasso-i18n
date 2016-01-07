var I18nContext = require('./I18nContext');
var util = require('../util');

exports.create = function create(config) {
    var locales = config.locales;

    return {
        properties: {
            path: 'string'
        },

        loadPackageManifest: function(lassoContext, callback) {
            var i18nContext = I18nContext.getI18nContext(lassoContext, config);
            var async = {};

            for (var i = 0; i < locales.length; i++) {
                var locale = util.normalizeLocaleCode(locales[i]);
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
                    // make sure lasso-i18n is included on page
                    'require: lasso-i18n',

                    // The config needs to be written as JavaScript
                    'i18n-config-def'
                ],
                async: async
            };

            callback(null, manifest);
        },

        calculateKey: function() {
            return 'lasso-i18n-config';
        }
    };
};