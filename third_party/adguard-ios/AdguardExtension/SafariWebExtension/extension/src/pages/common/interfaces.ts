import { Configuration } from '@adguard/safari-extension';

/**
 * Data returned by the background script to the content script.
 */
export interface ContentScriptData {
    /**
     * Rules configuration to be applied by the content script.
     */
    configuration?: Configuration;

    /**
     * If true, the response was received from the background page's cache.
     */
    cached?: boolean;

    /**
     * Timestamp of the initialization of the native host.
     */
    init_ts: number;

    /**
     * Timestamp of the request received by the native host.
     */
    request_received_ts: number;

    /**
     * Timestamp of the response created by the native host.
     */
    response_created_ts: number;
}
