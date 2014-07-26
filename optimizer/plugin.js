var dependencyI18nFactory = require('./dependency-i18n.js');

module.exports = function plugin(optimizer, config) {
    optimizer.dependencies.registerPackageType('i18n', dependencyI18nFactory(config));
    optimizer.dependencies.registerJavaScriptType('i18n-locale', require('./dependency-i18n-locale.js'));
    optimizer.dependencies.registerJavaScriptType('i18n-init', require('./dependency-i18n-init.js'));
    optimizer.dependencies.registerExtension('i18n.json', 'i18n');
};