var logger = require('raptor-logging').logger(module);
var DataHolder = require('raptor-async/DataHolder');
var fs = require('fs');
require('raptor-polyfill/string/endsWith');
var SUFFIX = 'i18n.json';
var CONTEXT_ATTRIBUTE_KEY = 'raptor-i18n';

function I18nContext(options) {
    this.config = options.config;
    this.dictionaryNames = [];
    this.dictionaryByName = {};
    this.rawDictionaryByPath = {};
}

I18nContext.getI18nContext = function(optimizerContext, config) {
    var i18nContext = optimizerContext.data[CONTEXT_ATTRIBUTE_KEY];
    if (i18nContext === undefined) {
        i18nContext = optimizerContext.data[CONTEXT_ATTRIBUTE_KEY] = new I18nContext({
            config: config
        });
    }
    return i18nContext;
};

function getDictionaryInfo(path, config) {
    var paths = config.paths;
    for (var i = 0; i < paths.length; i++) {
        var candidate = paths[i];
        if (path.indexOf(candidate.srcDir) === 0) {
            var name;
            
            var relativeToSrcDir = path.substring(candidate.srcDir.length + 1);

            if (relativeToSrcDir.endsWith(SUFFIX)) {
                // chop off the suffix
                name = relativeToSrcDir.substring(0, relativeToSrcDir.length - SUFFIX.length);

                var lastChar = name.charAt(name.length - 1);
                if ((lastChar === '/') || (lastChar === '.')) {
                    name = name.substring(0, name.length - 1);
                }
            } else {
                name = relativeToSrcDir;
            }

            return {
                name: name,
                absolutePath: path,
                relativePath: relativeToSrcDir,
                localizedDir: candidate.localizedDir
            };
        }
    }

    logger.warn('Ignoring "' + path + '" because it is not under srcDir.');
    return null;
}

I18nContext.prototype = {
    addI18nJsonPath: function(path) {
        var dictionaryInfo = getDictionaryInfo(path, this.config);
        if (dictionaryInfo) {
            var name = dictionaryInfo.name;
            this.dictionaryByName[name] = dictionaryInfo;
            this.dictionaryNames.push(name);
        }
    },

    getDictionaryNames: function() {
        return this.dictionaryNames;
    },

    getDictionaryInfoByName: function(name) {
        return this.dictionaryByName[name];
    },

    forEachDictionary: function(fn) {
        for (var i = 0; i < this.dictionaryNames.length; i++) {
            fn(this.dictionaryByName[this.dictionaryNames[i]]);
        }
    },

    readRawDictionary: function(path, callback) {
        var rawDictionaryHolder = this.rawDictionaryByPath[path];
        if (rawDictionaryHolder === undefined) {
            this.rawDictionaryByPath[path] = rawDictionaryHolder = new DataHolder();

            fs.readFile(path, 'utf8', function(err, json) {
                if (err) {
                    logger.info('Unable to read dictionary at "' + path + '"');
                    return rawDictionaryHolder.resolve(null);
                }

                logger.info('Read dictionary at "' + path + '"');

                var raw;
                try {
                    raw = JSON.parse(json);
                } catch(err) {
                    logger.error('Error invalid JSON in file "' + path + '"', err);
                    return rawDictionaryHolder.reject(err);
                }

                rawDictionaryHolder.resolve(raw);
            });
        }

        rawDictionaryHolder.done(callback);
    }
};

module.exports = I18nContext;