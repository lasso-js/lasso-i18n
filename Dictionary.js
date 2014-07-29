function Dictionary(name, dictionary, localeCode) {
    this._name = name;
    this._dictionary = dictionary;
    this._localeCode = localeCode;
}

Dictionary.prototype = {

    raw: function() {
        return this._dictionary;
    },

    getLocaleCode: function() {
        return this._localeCode;
    },

    /**
     * This method will lookup a value from the dictionary.
     * If no value is found then undefined is returned.
     * Use $get if you'd like the key returned wrapped with "$$$"
     * if the value does not exist.
     *
     * @param key the name of the property to look up
     * @param substitution an optional JavaScript object that contains values for placeholders in a template
     *      (this argument is ignored if the value is not a template)
     * @return the value for the given key or undefined if dictionary does not contain value for given key
     */
    getIfExists: function(key, substitutions) {
        var rawValue = this._dictionary[key];
        if (rawValue === undefined) {
            return undefined;
        }

        if (rawValue.constructor === String) {
            return rawValue;
        } else if (rawValue.constructor === Function) {
            return rawValue.call(this, substitutions);
        }

        return rawValue;
    },

    /**
     * This method will lookup a value from the dictionary.
     * If no value is found then the key wrapped with "$$$" is returned.
     * Use "getIfExists" if you'd like undefined returned if the value does not exist.
     *
     * @param key the name of the property to look up
     * @param substitution an optional JavaScript object that contains values for placeholders in a template
     *      (this argument is ignored if the value is not a template)
     * @return the value for the given key or the key wrapped with "$$$" if dictionary does not contain value for given key
     */
    get: function(key, substitutions) {
        var value = this.getIfExists(key, substitutions);
        return (value === undefined) ? '$$$' + key + '$$$': value;
    },

    set: function(key, value) {
        this._dictionary[key] = value;
    }
};

module.exports = Dictionary;