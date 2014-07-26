var util = require('./util');

module.exports = {
    normalizeLocaleCode: util.normalizeLocaleCode,

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
    findBestLocale: util.findBestLocale
};
