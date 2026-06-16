/**
 * Returns hostname from url.
 * Uses `URL` constructor to get hostname.
 *
 * Needed for getting correct cosmetic result for the current page,
 * e.g. used by getEngineCosmeticResult().
 *
 * @see {@link https://github.com/AdguardTeam/AdguardForiOS/issues/1897}
 *
 * @param url Url to get hostname from.
 * @returns Hostname.
 */
export const getHostname = (url: string) => {
    const { hostname } = new URL(url);
    return hostname;
};

/**
 * Crops `www.` from the beginning of the hostname if it exists.
 * Otherwise returns hostname as is.
 *
 * @param hostname Hostname to crop.
 * @returns Cropped domain.
 */
export const getCroppedDomain = (hostname: string) => {
    return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
};

/**
 * Returns domain name from url.
 * Uses `URL` constructor to get domain.
 *
 * Strips `www.` from the beginning of the domain if it exists,
 * e.g. used for disabling and enabling protection on the current site (allowlist).
 *
 * @param url Url to get domain from.
 * @returns Domain name.
 */
export const getDomain = (url: string) => {
    const hostname = getHostname(url);

    return getCroppedDomain(hostname);
};
