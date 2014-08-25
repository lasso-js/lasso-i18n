var I18nContext = require('./I18nContext');

var CONTEXT_ATTRIBUTE_KEY = 'raptor-i18n';

function configurePaths(config) {
    var paths = this.paths = new Array(config.paths.length);

    for (var i = 0; i < config.paths.length; i++) {
        var path = config.paths[i];
        if (path.constructor === String) {
            path = {
                srcDir: path,
                localizedDir: path
            };
        } else {
            if (!path.localizedDir && !path.srcDir) {
                throw new Error('"srcDir" or "localizedDir" is required for i18n path');
            } else if(!path.localizedDir) {
                path.localizedDir = path.srcDir;
            } else if(!path.srcDir) {
                path.srcDir = path.localizedDir;
            }
        }

        paths[i] = path;
    }
    
    return paths;
}

module.exports = function create(config) {

    var locales = config.locales;

    if (!config.paths) {
        throw new Error('"paths" configuration option is required');
    }

    config.paths = configurePaths(config);
    
    return {
        properties: {
            path: 'string'
        },

        init: function() {
            this.path = this.resolvePath(this.path);
        },

        loadPackageManifest: function(optimizerContext, callback) {

            var manifest = null;
            var i18nContext = optimizerContext.data[CONTEXT_ATTRIBUTE_KEY];
            if (i18nContext === undefined) {
                i18nContext = optimizerContext.data[CONTEXT_ATTRIBUTE_KEY] = new I18nContext({
                    config: config
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
                        'i18n-config'
                    ],
                    async: async
                };
            }

            i18nContext.addI18nJsonPath(this.path);

            callback(null, manifest);
        },

        calculateKey: function() {
            return this.path;
        }
    };
};