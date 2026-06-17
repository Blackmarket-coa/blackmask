/**
 * This file is part of AdGuard's Block YouTube Ads (https://github.com/AdguardTeam/BlockYouTubeAdsShortcut).
 *
 * AdGuard's Block YouTube Ads is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard's Block YouTube Ads is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard's Block YouTube Ads.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global Response, window, navigator, document, MutationObserver */

/**
 * The function that implements all the logic.
 * Returns the run status.
 */
function runBlockYoutube() {
    const locales = {
        en: {
            wrongDomain: 'This shortcut is supposed to be launched only on YouTube.',
        },
        ru: {
            wrongDomain: 'Эта быстрая команда предназначена для использования только на YouTube.',
        },
        es: {
            wrongDomain: 'Se supone que este atajo se lanza sólo en YouTube.',
        },
        de: {
            wrongDomain: 'Dieser Kurzbefehl soll nur auf YouTube gestartet werden.',
        },
        fr: {
            wrongDomain: 'Ce raccourci est censé d’être lancé uniquement sur YouTube.',
        },
        it: {
            wrongDomain: 'Questa scorciatoia dovrebbe essere lanciata solo su YouTube.',
        },
        'zh-cn': {
            wrongDomain: '快捷指令只能在 YouTube 上被启动。',
        },
        'zh-tw': {
            wrongDomain: '此捷徑應該只於 YouTube 上被啟動。',
        },
        ko: {
            wrongDomain: '이 단축어는 YouTube에서만 사용 가능합니다.',
        },
        ja: {
            wrongDomain: '※このショートカットは、YouTubeでのみ適用されることを想定しています。',
        },
        uk: {
            wrongDomain: 'Цю швидку команду слід запускати лише на YouTube.',
        },
    };

    /**
     * Gets a localized message for the specified key
     *
     * @param {string} key message key
     * @returns {string} message for that key
     */
    const getMessage = (key) => {
        try {
            let locale = locales[navigator.language.toLowerCase()];
            if (!locale) {
                const lang = navigator.language.split('-')[0];
                locale = locales[lang];
            }
            if (!locale) {
                locale = locales.en;
            }

            return locale[key];
        } catch (ex) {
            return locales.en[key];
        }
    };

    if (window.location.hostname !== 'www.youtube.com'
        && window.location.hostname !== 'm.youtube.com'
        && window.location.hostname !== 'music.youtube.com') {
        return {
            success: false,
            status: 'wrongDomain',
            message: getMessage('wrongDomain'),
        };
    }

    // Starting from app version 4.5.11, we decided to intercept user-shared YouTube links
    // and open them directly in the app, stopping JavaScript injection used for ad blocking.
    return {
        success: true,
        status: 'success',
        href: window.location.href,
    };
}

// eslint-disable-next-line func-names
const ExtensionJavaScriptClass = function () { };

ExtensionJavaScriptClass.prototype = {
    run: (arguments) => {
        // The JSON message will be handled in the iOS extension and parsed by the `YouTubeAdsJsResult` structure, which extracts relevant values from it.
        arguments.completionFunction(runBlockYoutube());
    },
    finalize: () => {
        // Do nothing
        console.log('finalize called');
    },
};
// The JavaScript file must contain a global object named "ExtensionPreprocessingJS".
// eslint-disable-next-line no-unused-vars
var ExtensionPreprocessingJS = new ExtensionJavaScriptClass();
