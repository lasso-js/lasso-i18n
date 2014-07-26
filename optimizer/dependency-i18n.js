var I18nContext = require('./I18nContext');

var CONTEXT_ATTRIBUTE_KEY = 'raptor-i18n';

module.exports = function create(config) {

    var locales = config.locales;

    if (!locales || !locales.length) {
        locales = [''];
    } else {
        locales.push('');
    }

    if (!config.srcDir) {
        throw new Error('"srcDir" configuration option is required');
    }

    if (!config.localizedDir) {
        throw new Error('"localizedDir" configuration option is required');
    }

    return {
        properties: {
            path: 'string'
        },

        init: function() {
            this.path = this.resolvePath(this.path);
        },

        loadPackageManifest: function(optimizerContext, callback) {

            var manifest = null;
            var i18nContext = optimizerContext.attributes[CONTEXT_ATTRIBUTE_KEY];
            if (i18nContext === undefined) {
                i18nContext = optimizerContext.attributes[CONTEXT_ATTRIBUTE_KEY] = new I18nContext({
                    srcDir: config.srcDir,
                    localizedDir: config.localizedDir
                });

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

                manifest = {
                    dependencies: [
                        // make sure raptor-i18n is included on page
                        'require: raptor-i18n',
                        {
                            type: 'i18n-init',
                            config: {
                                locales: locales
                            }
                        }
                    ],
                    async: async
                };
            }

            i18nContext.addI18nJsonPath(this.path);

            callback(null, manifest);
        },

        calculateKey: function() {
            return 'i18n: ' + this.path;
        }
    };
};