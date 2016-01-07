var logger = require('raptor-logging').logger(module);
var transport = require('raptor-modules/transport');
var parallel = require('raptor-async/parallel');
var nodePath = require('path');
var extend = require('raptor-util/extend');
var markoCompiler = require('marko/compiler');
var extend = require('raptor-util/extend');
var util = require('../util');

var types = {
    'marko': function(config, callback) {
        var value = this.value;

        if (Array.isArray(value)) {
            value = value.join('\n');
        }

        var dirname = nodePath.dirname(this.dictionaryInfo.absolutePath);
        var templatePath = nodePath.join(dirname, this.key + '.marko');
        var _this = this;

        var moduleName = this.dictionaryModuleName + '/' + this.key + '.marko';

        markoCompiler.compile(value, templatePath, function(err, code) {
            if (err) {
                return callback(err);
            }

            _this.beforeCode.push(transport.defineCode.sync(moduleName, code, {
                modulesRuntimeGlobal: config.modulesRuntimeGlobal
            }));

            var out = '';
            out += 'function(data) {\n';
            out += '        return require("marko").load(module.id + ' + JSON.stringify('/' + _this.key + '.marko') + ').renderSync(data);\n';
            out += '    }';
            callback(null, out);
        });
    }
};

function writeDictionary(config, dictionary, info, localeContext, callback) {

    var code = [];

    function createCompileTask(compiler, compilerContext, theLast, index, length) {
        return function(callback) {
            compiler.call(compilerContext, config, function(err, compiledCode) {
                if (err) {
                    return callback(err);
                }
                code.push('    ' + JSON.stringify(compilerContext.key) + ': ' + compiledCode);
                callback();
            });
        };
    }

    var work = [];

    var keys = Object.keys(dictionary);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var last = (i === keys.length - 1);

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
                    value: value,
                    key: key,
                    dictionaryInfo: info,
                    beforeCode: localeContext.beforeCode,
                    afterCode: localeContext.afterCode,
                    attributes: localeContext.attributes,
                    locale: localeContext.locale,
                    dictionaryModuleName: localeContext.localeModuleName + '/' + info.name
                };

                work.push(createCompileTask(compiler, compilerContext, last, i, keys.length));
            } else {
                code.push('    ' + JSON.stringify(key) + ': ' + JSON.stringify(value));
            }
        }
    }

    parallel(work, function(err) {
        callback(err, code.join(',\n'));
    });
}

function createReadDictionaryTask(config, info, dependency, localeContext, out) {
    return function(callback) {
        var work = new Array(dependency.locales.length + 1);

        work[0] = function(callback) {
            dependency.i18nContext.readRawDictionary(info.absolutePath, callback);
        };

        dependency.locales.forEach(function(locale, index) {
            work[index + 1] = function(callback) {
                var path = nodePath.join(info.localizedDir, locale + '.i18n.json');
                dependency.i18nContext.readRawDictionary(path, function(err, dict) {
                    if (err || !dict) {
                        return callback(err);
                    }

                    callback(null, dict[info.relativePath]);
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

            writeDictionary(config, merged, info, localeContext, function(err, dictionaryCode) {
                if (err) {
                    return callback(err);
                }

                var code = '\nmodule.exports = {\n';

                code += dictionaryCode;

                code += '\n}';

                var moduleName = localeContext.localeModuleName + '/' + info.name;

                callback(null, transport.defineCode.sync(moduleName, code, {
                    modulesRuntimeGlobal: config.modulesRuntimeGlobal
                }) + '\n');
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

            this.defaultBundleName = 'i18n-' + locale;

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

        read: function(lassoContext, callback) {
            var self = this;
            var out = lassoContext.deferredStream(function() {
                var i18nContext = self.i18nContext;
                var localeContext = {
                    beforeCode: [],
                    afterCode: [],
                    attributes: {},
                    locale: self.locale,
                    localeModuleName: '/i18n/' + (util.normalizeLocaleCode(self.locale) || '_')
                };

                var work = [];
                var names = i18nContext.getDictionaryNames();

                for (var i = 0; i < names.length; i++) {
                    var info = i18nContext.getDictionaryInfoByName(names[i]);
                    work.push(createReadDictionaryTask(config, info, self, localeContext, out));
                }

                logger.info('Compiling dictionaries for locale "' + self.locale + '"...');

                parallel(work, function(err, results) {
                    if (err) {
                        logger.error('Error reading dictionaries for locale "' + self.locale + '"', err);
                    } else {
                        out.push('(function(){\n');

                        var i;

                        for (i = 0; i < localeContext.beforeCode.length; i++) {
                            out.push(localeContext.beforeCode[i]);
                            out.push('\n');
                        }

                        for (i = 0; i < results.length; i++) {
                            out.push(results[i]);
                        }

                        for (i = 0; i < localeContext.afterCode.length; i++) {
                            out.push(localeContext.afterCode[i]);
                            out.push('\n');
                        }

                        out.push('})();\n');
                    }

                    logger.info('Done compiling dictionaries for locale "' + self.locale + '"');

                    out.push(null);
                });
            }, {
                encoding: 'utf8'
            });

            return out;
        },

        calculateKey: function() {
            return this.defaultBundleName;
        },

        toString: function() {
            return this.defaultBundleName;
        }
    };
};
