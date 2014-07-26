var logger = require('raptor-logging').logger(module);
var transport = require('raptor-modules/transport');
var Readable = require('stream').Readable;
var parallel = require('raptor-async/parallel');
var nodePath = require('path');
var extend = require('raptor-util/extend');

function createReadDictionaryTask(info, dependency, out) {
    return function(callback) {
        var work = new Array(dependency.locales.length + 1);

        work[0] = function(callback) {
            dependency.i18nContext.readRawDictionary(info.absolutePath, callback);
        };

        dependency.locales.forEach(function(locale, index) {
            work[index + 1] = function(callback) {
                var path = nodePath.join(dependency.i18nContext.localizedDir, info.relativePath + '_' + locale + info.extension);
                dependency.i18nContext.readRawDictionary(path, callback);
            };
        });

        parallel(work, function(err, result) {
            var merged = result[0] || {};
            for (var i = 1; i < result.length; i++) {
                var raw = result[i];
                if (raw) {
                    extend(merged, raw);
                }
            }

            out.push(transport.defineCode.sync(
                '/i18n/' + (dependency.locale || '_') + '/' + info.name,
                'module.exports = ' + JSON.stringify(merged, null, ' ')));
            out.push('\n');
            callback();

        });
    };
}

module.exports = {
    properties: {
        locale: 'string',
        i18nContext: 'object'
    },

    init: function() {

        var locales = this.locales = new Array(2);

        if (this.locale.charAt(2) === '_') {
            locales[0] = this.locale.substring(0, 2);
            locales[1] = this.locale.substring(3);
        } else {
            locales[0] = this.locale;
            locales.length = 1;
        }
    },

    read: function(optimizerContext, callback) {
        var out = new Readable();

        out._read = function() {

        };

        var i18nContext = this.i18nContext;

        var work = [];
        var names = i18nContext.getDictionaryNames();
        for (var i = 0; i < names.length; i++) {
            var info = i18nContext.getDictionaryInfoByName(names[i]);
            work.push(createReadDictionaryTask(info, this, out));
        }

        parallel(work, function(err) {
            if (err) {
                logger.error('Error reading dictionaries for locale "' + this.locale + '"', err);
            }

            out.push(null);
        });

        return out;

        //var codeBlocks = [];

        //codeBlocks.push(transport.defineCode.sync('/i18n/locales'), 'module.exports = ' + JSON.stringify())
        //this.i18nContext.forEachDictionary()
        //callback(null, '// i18n ' + this.locale + '\n' + this.i18nContext.getDictionaryNames().join('\n'));
    },

    calculateKey: function() {
        return 'i18n-' + this.locale;
    }
};