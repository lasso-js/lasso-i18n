var I18nContext = require('./I18nContext');
var logger = require('raptor-logging').logger(module);

exports.create = function create(config) {
    return {
        properties: {
            path: 'string'
        },

        // we don't actually produce JavaScript or CSS
        contentType: 'none',

        init: function() {
            this.path = this.resolvePath(this.path);
        },

        onAddToPageBundle: function(bundle, lassoContext) {
            I18nContext.getI18nContext(lassoContext, config).addI18nJsonPath(this.path);
            if (logger.isDebugEnabled()) {
                logger.debug('Added i18n dictionary: ' + this.path);
            }
        },

        onAddToAsyncPageBundle: function(bundle, lassoContext) {
            I18nContext.getI18nContext(lassoContext, config).addI18nJsonPath(this.path);
            if (logger.isDebugEnabled()) {
                logger.debug('Added i18n dictionary: ' + this.path);
            }
        },

        read: function(lassoContext, callback) {
            return null;
        },

        calculateKey: function() {
            return this.path;
        }
    };
};