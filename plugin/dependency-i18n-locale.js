var logger = require('raptor-logging').logger(module);
var parallel = require('raptor-async/parallel');
var nodePath = require('path');
var extend = require('raptor-util/extend');
var markoCompiler = require('marko/compiler');
var extend = require('raptor-util/extend');
var util = require('../util');

var sanizeVarNameRegExp = /[^a-zA-Z]/g;

function _sanitizeVarName(varName) {
    return varName.replace(sanizeVarNameRegExp, '_');
}

var types = {
    'marko': function(compilerContext, callback) {
        var value = compilerContext.value;

        if (Array.isArray(value)) {
            value = value.join('\n');
        }

        var initCode = compilerContext.initCode;
        var requires = compilerContext.requires;
        var dependencies = compilerContext.dependencies;

        if (!requires['marko']) {
            requires['marko'] = 'marko';
        }

        var dirname = nodePath.dirname(compilerContext.dictionaryInfo.absolutePath);
        var templatePath = nodePath.join(dirname, compilerContext.key + '.marko');

        var moduleName = compilerContext.dictionaryModuleName + '/' + compilerContext.key + '.marko';

        markoCompiler.compile('---\n' + value + '\n---', templatePath, function(err, code) {
            if (err) {
                return callback(err);
            }

            dependencies.push({
                type: 'require',
                virtualModule: {
                    path: templatePath,
                    clientPath: moduleName,
                    read: function(lassoContext, callback) {
                        callback(null, code);
                    },
                    getDefaultBundleName: compilerContext.getDefaultBundleName
                }
            });

            var templateVarName = _sanitizeVarName(compilerContext.key) + 'Template';

            initCode.push('var ' + templateVarName +
                ' = marko.load(' + JSON.stringify(moduleName) + ');');

            var out = '';
            out += 'function(data) {\n';
            out += '        return ' + templateVarName + '.renderSync(data);\n';
            out += '    }';

            callback(null, out);
        });
    }
};

function writeDictionary(dictionary, dictionaryInfo, localeContext, callback) {

    var code = [];
    var initCode = [];
    var requires = {};

    function createCompileTask(compiler, compilerContext) {
        return function(callback) {
            logger.info('Compiling property "' + compilerContext.key + '" in dictionary "' + compilerContext.dictionaryModuleName + '"...');
            compiler(compilerContext, function(err, compiledCode) {
                if (err) {
                    logger.error('Error compiling property "' + compilerContext.key + '" in dictionary "' + compilerContext.dictionaryModuleName + '".', err);
                    return callback(err);
                }

                logger.info('Compiled property "' + compilerContext.key + '" in dictionary "' + compilerContext.dictionaryModuleName + '".');
                code.push('    ' + JSON.stringify(compilerContext.key) + ': ' + compiledCode);
                callback();
            });
        };
    }

    var work = [];

    var keys = Object.keys(dictionary);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        if (dictionary.hasOwnProperty(key)) {
            var value = dictionary[key];
            var compiler = null;

            var pos = key.indexOf(':');
            if (pos !== -1) {
                var type = key.substring(0, pos).trim().toLowerCase();
                compiler = types[type];
                if (compiler) {
                    key = key.substring(pos + 1).trim();
                }
            }

            if (compiler) {
                var compilerContext = {
                    key: key,
                    value: value,
                    dictionaryInfo: dictionaryInfo,
                    dependencies: localeContext.dependencies,
                    initCode: initCode,
                    requires: requires,
                    locale: localeContext.locale,
                    dictionaryModuleName: localeContext.localeModuleName + '/' + dictionaryInfo.name,
                    getDefaultBundleName: localeContext.getDefaultBundleName
                };

                work.push(createCompileTask(compiler, compilerContext));
            } else {
                code.push('    ' + JSON.stringify(key) + ': ' + JSON.stringify(value));
            }
        }
    }

    parallel(work, function(err) {
        var finalCode = '';

        Object.keys(requires).forEach(function(varName) {
            var moduleName = requires[varName];
            finalCode += 'var ' + varName + ' = require(' + JSON.stringify(moduleName) + ');\n';
        });

        finalCode += '\n' + initCode.join('\n');
        finalCode += '\nmodule.exports = {\n' + code.join(',\n') + '\n}';

        callback(err, finalCode);
    });
}

function createReadDictionaryTask(dictionaryInfo, dependency, localeContext, out) {
    return function(callback) {
        var work = new Array(dependency.locales.length + 1);
        var i18nContext = dependency.i18nContext;

        work[0] = function(callback) {
            i18nContext.readRawDictionary(dictionaryInfo.absolutePath, callback);
        };

        dependency.locales.forEach(function(locale, index) {
            work[index + 1] = function(callback) {
                var path = nodePath.join(dictionaryInfo.localizedDir, locale + '.i18n.json');

                i18nContext.readRawDictionary(path, function(err, dict) {
                    if (err || !dict) {
                        return callback(err);
                    }

                    callback(null, dict[dictionaryInfo.relativePath]);
                });
            };
        });

        parallel(work, function(err, result) {
            if (err) {
                return callback(err);
            }

            var merged = (result.length) ? extend({}, result[0]) : {};
            for (var i = 1; i < result.length; i++) {
                var raw = result[i];
                if (raw) {
                    extend(merged, raw);
                }
            }

            var moduleName = localeContext.localeModuleName + '/' + dictionaryInfo.name;


            logger.info('Building dictionary "' + moduleName + '"...');
            writeDictionary(merged, dictionaryInfo, localeContext, function(err, dictionaryCode) {
                if (err) {
                    return callback(err);
                }

                logger.info('Built dictionary "' + moduleName + '".');

                localeContext.dependencies.push({
                    type: 'require',
                    virtualModule: {
                        path: __dirname + '/' + dictionaryInfo.name,
                        clientPath: moduleName,
                        read: function(lassoContext, callback) {
                            callback(null, dictionaryCode);
                        },
                        getDefaultBundleName: localeContext.getDefaultBundleName
                    }
                });

                callback();
            });
        });
    };
}

exports.create = function(config) {
    return {
        properties: {
            locale: 'string',
            i18nContext: 'object'
        },

        init: function() {
            var locale = util.normalizeLocaleCode(this.locale);

            this.name = 'i18n-' + locale;

            var locales = this.locales = new Array(2);

            if (this.locale.charAt(2) === '-') {
                locales[0] = locale.substring(0, 2);
                locales[1] = locale;
            } else if (locale.length > 0) {
                locales[0] = locale;
                locales.length = 1;
            } else {
                locales.length = 0;
            }
        },

        getDependencies: function(lassoContext, callback) {
            var self = this;

            var dependencies = [];

            var i18nContext = self.i18nContext;
            var localeContext = {
                // `dependencies` properties will collect all of the CommonJS
                // modules that were produced as part of the compilation
                // of dictionaries in this locale
                dependencies: dependencies,

                // The locale that we are building
                locale: self.locale,

                // The
                localeModuleName: '/i18n/' + (util.normalizeLocaleCode(self.locale) || '_'),

                getDefaultBundleName: function(pageBundleName, lassoContext) {
                    return self.name + '-' + pageBundleName;
                }
            };

            var work = [];
            var names = i18nContext.getDictionaryNames();

            logger.debug('Dictionary names:\n' + names.join('\n'));

            for (var i = 0; i < names.length; i++) {
                var dictionaryInfo = i18nContext.getDictionaryInfoByName(names[i]);
                work.push(createReadDictionaryTask(dictionaryInfo, self, localeContext));
            }

            logger.info('Compiling dictionaries for locale "' + self.locale + '"...');

            parallel(work, function(err, results) {
                if (err) {
                    logger.error('Error reading dictionaries for locale "' + self.locale + '"', err);
                    return callback(err);
                }

                logger.info('Finished compiling dictionaries for locale "' + self.locale + '".');
                callback(null, {
                    dependencies: dependencies
                });
            });
        },

        calculateKey: function() {
            return this.name;
        },

        toString: function() {
            return this.name;
        },

        getDefaultBundleName: function(pageBundleName, lassoContext) {
            return this.name + '-' + pageBundleName;
        }
    };
};
