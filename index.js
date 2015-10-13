var util = require('./util');
var nodePath = require('path');
var markoLoader = require('marko/runtime/loader');
var Dictionary = require('./Dictionary');
var rootDir = require('app-root-dir').get();

var types = {
    'marko': function(context) {
        var value = context.value;

        if (Array.isArray(value)) {
            value = value.join('\n');
        }

        var templatePath = nodePath.join(rootDir, context.name, context.key + '.marko');
        var template = markoLoader(templatePath, value);

        return function(data) {
            return template.renderSync(data);
        };
    }
};

exports.normalizeLocaleCode = util.normalizeLocaleCode;

/**
 * The method will return the most appropriate locale based on the
 * end-user's locale preference and available locales. This method will
 * handle both the "_" and "-" separator characters equally well.
 *
 * @param preferredLocale an array of locales (e.g. ['en', 'en_US'])
 *  or a string in the format of the Accept-Language header value
 *  (e.g. "en-US,en;q=0.8")
 *
 * @param availableLocales an array of locale codes
 *  (e.g. ["en", "en_US", ])
 *
 * @return the item in the availableLocales that is a best match or
 *  the empty string to indicate default locale
 */
exports.findBestLocale = util.findBestLocale;

exports.compileDictionary = function(obj, name, localeCode) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = obj[key];
        var compiler = null;

        var pos = key.indexOf(':');
        if (pos !== -1) {
            var type = key.substring(0, pos).trim().toLowerCase();
            compiler = types[type];
            if (compiler) {
                delete obj[key];
                key = key.substring(pos + 1).trim();
            }
        }

        if (compiler) {
            obj[key] = compiler({
                value: value,
                key: key,
                name: name
            });
        }
    }

    return new Dictionary(name, obj, localeCode);
};