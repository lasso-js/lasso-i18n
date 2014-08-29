var I18nContext = require('./I18nContext');
var logger = require('raptor-logging').logger(module);

module.exports = function create(config) {
    return {
        properties: {
            path: 'string'
        },

        // we don't actually produce JavaScript or CSS
        contentType: 'none',

        init: function() {
            this.path = this.resolvePath(this.path);
        },

        onAddToPageBundle: function(bundle, optimizerContext) {
            I18nContext.getI18nContext(optimizerContext, config).addI18nJsonPath(this.path);
            if (logger.isDebugEnabled()) {
                logger.debug('Added i18n dictionary: ' + this.path);
            }
        },

        onAddToAsyncPageBundle: function(bundle, optimizerContext) {
            I18nContext.getI18nContext(optimizerContext, config).addI18nJsonPath(this.path);
            if (logger.isDebugEnabled()) {
                logger.debug('Added i18n dictionary: ' + this.path);
            }
        },

        read: function(optimizerContext, callback) {
            return null;
        },

        calculateKey: function() {
            return this.path;
        }
    };
};