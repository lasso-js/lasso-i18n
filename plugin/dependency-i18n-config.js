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

            var initConfig = {
                locales: config.locales
            };

            callback(null, {
                dependencies: [
                    // make sure lasso-i18n runtime is included on page
                    'require: lasso-i18n',

                    {
                        type: 'require',
                        virtualModule: {
                            path: __dirname + '/i18n-config',
                            clientPath: '/lasso-i18n/config',
                            read: function(lassoContext, callback) {
                                callback(null,
                                    'module.exports = ' +
                                    JSON.stringify(initConfig, null, ' ') +
                                    ';');
                            }
                        }
                    }
                ],
                async: async
            });
        },

        calculateKey: function() {
            return 'lasso-i18n-config';
        }
    };
};