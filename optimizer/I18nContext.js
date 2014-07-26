var logger = require('raptor-logging').logger(module);
var DataHolder = require('raptor-async/DataHolder');
var fs = require('fs');
require('raptor-polyfill/string/endsWith');
var SUFFIX = 'i18n.json';

function I18nContext(options) {
    this.srcDir = options.srcDir;
    this.localizedDir = options.localizedDir;
    this.dictionaryNames = [];
    this.dictionaryByName = {};
    this.rawDictionaryByPath = {};
}

function getDictionaryName(path) {
    var name = path;

    if (name.endsWith(SUFFIX)) {
        name = name.substring(0, name.length - SUFFIX.length);
    }

    var lastChar = name.charAt(name.length - 1);
    if ((lastChar === '/') || (lastChar === '.')) {
        name = name.substring(0, name.length - 1);
    }

    return name;
}

I18nContext.prototype = {
    addI18nJsonPath: function(path) {
        if (path.indexOf(this.srcDir) === 0) {
            var relativePath = path.substring(this.srcDir.length + 1);

            var name = getDictionaryName(relativePath);

            var extension;

            var pos = relativePath.indexOf('.');
            if (pos === -1) {
                extension = '';
            } else {
                extension = relativePath.substring(pos);
                relativePath = relativePath.substring(0, pos);
            }

            var info;

            this.dictionaryByName[name] = info = {
                name: name,
                absolutePath: path,
                relativePath: relativePath,
                extension: extension,
                rawDictionary: new DataHolder({
                    loader: function(callback) {
                        
                    }
                })
            };

            this.dictionaryNames.push(name);
        } else {
            logger.warn('Ignoring "' + path + '" because it is not under srcDir.');
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
                    return rawDictionaryHolder.resolve(null);
                }

                rawDictionaryHolder.resolve(JSON.parse(json));
            });
        }

        rawDictionaryHolder.done(callback);
    }
};

module.exports = I18nContext;