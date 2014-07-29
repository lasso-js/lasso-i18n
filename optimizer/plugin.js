var dependencyI18nFactory = require('./dependency-i18n.js');
var dependencyI18nInitFactory = require('./dependency-i18n-config.js');

module.exports = function plugin(optimizer, config) {
    if (!config.locales || !config.locales.length) {
        config.locales = [''];
    } else {
        config.locales.push('');
    }

    optimizer.dependencies.registerPackageType('i18n', dependencyI18nFactory(config));
    optimizer.dependencies.registerJavaScriptType('i18n-config', dependencyI18nInitFactory(config));
    optimizer.dependencies.registerJavaScriptType('i18n-locale', require('./dependency-i18n-locale.js'));
    optimizer.dependencies.registerExtension('i18n.json', 'i18n');
    optimizer.dependencies.registerExtension('i18n-config', 'i18n-config');
};