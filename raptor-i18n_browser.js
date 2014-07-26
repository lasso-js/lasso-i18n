var locales;
var util = require('./util');

module.exports = {
    initialize: function(config) {
        locales = config.locales;
    },

    getSupportedLocales: function() {
        return locales;
    },

    findBestLocale: function(preferredLocaleCode) {
        return util.findBestLocale(preferredLocaleCode, locales);
    },

    loadLocale: function(localeCode, callback) {
        require('raptor-loader').async(
            'i18n-' + localeCode,
            callback);
    },

    getDictionary: function(name, localeCode) {
        return require('/i18n/' + (localeCode || '_') + '/' + name);
    }
};