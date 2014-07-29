var util = require('./util');

var CONFIG_MODULE_NAME = '/raptor-i18n/config';

var config = require(CONFIG_MODULE_NAME);

module.exports = {

    getSupportedLocales: function() {
        return config.locales;
    },

    findBestLocale: function(preferredLocaleCode) {
        return util.findBestLocale(preferredLocaleCode, this.getSupportedLocales());
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