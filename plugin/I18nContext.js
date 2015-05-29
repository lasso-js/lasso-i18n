var logger = require('raptor-logging').logger(module);
var AsyncValue = require('raptor-async/AsyncValue');
var fs = require('fs');

var CONTEXT_ATTRIBUTE_KEY = 'lasso-i18n';

function I18nContext(options) {
    this.config = options.config;
    this.dictionaryNames = [];
    this.dictionaryByName = {};
    this.rawDictionaryByPath = {};
}

I18nContext.getI18nContext = function(lassoContext, config) {
    var i18nContext = lassoContext.data[CONTEXT_ATTRIBUTE_KEY];
    if (i18nContext === undefined) {
        i18nContext = lassoContext.data[CONTEXT_ATTRIBUTE_KEY] = new I18nContext({
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
            var relativeToSrcDir;

            relativeToSrcDir = name = path.substring(candidate.srcDir.length + 1);

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
            this.rawDictionaryByPath[path] = rawDictionaryHolder = new AsyncValue();

            fs.readFile(path, 'utf8', function(err, json) {
                if (err) {
                    logger.info('Unable to read dictionary at "' + path + '"');
                    return rawDictionaryHolder.resolve(null);
                }

                logger.info('Read dictionary at "' + path + '"');

                json = json.trim();

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
