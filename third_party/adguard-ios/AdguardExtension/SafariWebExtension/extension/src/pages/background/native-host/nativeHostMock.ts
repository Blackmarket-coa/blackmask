/* eslint-disable no-console,class-methods-use-this */
import browser from 'webextension-polyfill';
import { APPEARANCE_THEME_DEFAULT, AppearanceTheme, Platform } from '../../common/constants';
import { NativeHostInitData, NativeHostInterface } from './NativeHost';
import { getDomain } from '../../common/utils/url';
import { ContentScriptData } from '../../common/interfaces';

const sleep = (timeout: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
};

/**
 * Represents application state.
 */
interface ApplicationState {
    /**
     * Application theme.
     */
    appearanceTheme: AppearanceTheme,

    /**
     * Current platform (iPhone or iPad).
     */
    platform: Platform,

    /**
     * True if the app is paid.
     */
    premiumApp: boolean,

    /**
     * True if advanced blocking is enabled in the app.
     * This is a setting that the user can change in the app.
     */
    advancedBlockingEnabled: boolean,

    /**
     * True if Safari protection is enabled in the app.
     * This is a setting that the user can switch in the app.
     */
    safariProtectionEnabled: boolean,

    /**
     * True when at least some content blocking extensions are enabled.
     * The user need to enable at least one content blocking extension
     * in **Safari settings** to have this true.
     */
    contentBlockersEnabled: boolean,

    /**
     * True if the user has enabled "inverted allowlist" in the app settings.
     */
    allowlistInverted: boolean,
}

/**
 * Represents website state.
 */
interface WebsiteState {
    /**
     * Website-specific.
     *
     * True if there are user rules for this website.
     */
    hasUserRules: boolean,

    /**
     * Website-specific.
     *
     * True if protection is enabled for this particular website.
     */
    protectionEnabled: boolean,
}

class NativeHostMock implements NativeHostInterface {
    private DEFAULT_APPLICATION_STATE: ApplicationState = {
        appearanceTheme: APPEARANCE_THEME_DEFAULT,
        platform: Platform.IPad,
        premiumApp: true,
        advancedBlockingEnabled: true,
        safariProtectionEnabled: true,
        contentBlockersEnabled: true,
        allowlistInverted: false,
    };

    private DEFAULT_WEBSITE_STATE: WebsiteState = {
        protectionEnabled: true,
        hasUserRules: false,
    };

    /**
     * Current application state.
     */
    private applicationState: ApplicationState = this.DEFAULT_APPLICATION_STATE;

    /**
     * Holds websites state. If state for the domain is not found, uses
     * DEFAULT_WEBSITE_STATE.
     */
    private websites: Map<string, WebsiteState> = new Map();

    /**
     * Helper function that is required to mock slow async functions.
     *
     * @param result result to return.
     * @returns Promise with the result.
     */
    private withSleep = async (result?: any) => {
        await sleep(1000);
        return result;
    };

    /**
     * Helper function that opens a URL in a new tab and prints
     * the specified string on the page
     *
     * @param text string to print on the page.
     */
    private openLinkToAction = async (text: string) => {
        console.log('openLinkToAction', text);

        const encodedText = btoa(`[mock action] ${text}`);
        const url = `https://httpbin.agrd.dev/base64/decode/${encodedText}`;
        await browser.tabs.create({ url });

        await this.withSleep();
    };

    async getInitData(url: string): Promise<NativeHostInitData> {
        console.log('getInitData', url);

        const appState = this.applicationState;

        const domain = getDomain(url);
        const websiteState = this.websites.get(domain) || this.DEFAULT_WEBSITE_STATE;

        const initData: NativeHostInitData = { ...appState, ...websiteState };

        return this.withSleep(initData);
    }

    async getContentScriptData(url: string, topUrl?: string): Promise<ContentScriptData> {
        console.log('getContentScriptData', url, topUrl);

        const contentScriptData: ContentScriptData = {
            configuration: {
                css: [],
                extendedCss: [],
                js: ['console.log("Content script loaded")'],
                scriptlets: [],
                engineTimestamp: 0,
            },
            init_ts: Date.now(),
            request_received_ts: Date.now(),
            response_created_ts: Date.now(),
        };

        return contentScriptData;
    }

    enableProtection = async (url: string): Promise<void> => {
        console.log('enableProtection', url);

        const domain = getDomain(url);
        const websiteState = this.websites.get(domain) || this.DEFAULT_WEBSITE_STATE;
        websiteState.protectionEnabled = true;
        this.websites.set(domain, websiteState);

        return this.openLinkToAction(`enable site protection: ${url}`);
    };

    disableProtection = async (url: string): Promise<void> => {
        console.log('disableProtection', url);

        const domain = getDomain(url);
        const websiteState = this.websites.get(domain) || this.DEFAULT_WEBSITE_STATE;
        websiteState.protectionEnabled = false;
        this.websites.set(domain, websiteState);

        return this.openLinkToAction(`disable site protection: ${url}`);
    };

    enableSafariProtection(url: string): Promise<void> {
        console.log('enableSafariProtection', url);

        const domain = getDomain(url);
        const websiteState = this.websites.get(domain) || this.DEFAULT_WEBSITE_STATE;
        websiteState.protectionEnabled = true;
        this.websites.set(domain, websiteState);

        return this.openLinkToAction(`enable safari protection: ${url}`);
    }

    enableAdvancedBlocking(): Promise<void> {
        console.log('enableAdvancedBlocking');

        return this.openLinkToAction('enable advanced blocking');
    }

    addToUserRules(ruleText: string): Promise<void> {
        console.log('addToUserRules', ruleText);

        const domain = ruleText.split('##')[0];
        const websiteState = this.websites.get(domain) || this.DEFAULT_WEBSITE_STATE;
        websiteState.hasUserRules = true;
        this.websites.set(domain, websiteState);

        return this.openLinkToAction(`add user rule: ${ruleText}`);
    }

    removeUserRulesBySite = async (url: string) => {
        console.log('removeUserRulesBySite', url);

        const domain = getDomain(url);
        const websiteState = this.websites.get(domain) || this.DEFAULT_WEBSITE_STATE;
        websiteState.hasUserRules = false;
        this.websites.set(domain, websiteState);

        return this.openLinkToAction(`remove user rules by site: ${url}`);
    };

    reportProblem(url: string): Promise<void> {
        console.log('reportProblem', url);

        return this.openLinkToAction(`report problem: ${url}`);
    }

    upgradeMe(): Promise<void> {
        console.log('upgradeMe');

        return this.openLinkToAction('upgrade me');
    }
}

export const nativeHostMock = new NativeHostMock();
