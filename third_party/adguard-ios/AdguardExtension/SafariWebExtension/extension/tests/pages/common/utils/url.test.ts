import { getDomain, getHostname } from '../../../../src/pages/common/utils/url';

describe('common url helpers', () => {
    describe('getHostname', () => {
        test.each([
            {
                actual: 'https://example.com/',
                expected: 'example.com',
            },
            {
                actual: 'https://example.com/path',
                expected: 'example.com',
            },
            {
                actual: 'http://example.com/path?query=1',
                expected: 'example.com',
            },
            {
                actual: 'https://subdomain.example.com/',
                expected: 'subdomain.example.com',
            },
            // `www.` should NOT be cropped
            {
                actual: 'https://www.example.com/',
                expected: 'www.example.com',
            },
            {
                actual: 'https://www.subdomain.example.com/',
                expected: 'www.subdomain.example.com',
            },
        ])('$actual -> $expected', ({ actual, expected }) => {
            expect(getHostname(actual)).toBe(expected);
        });
    });

    describe('getDomain', () => {
        test.each([
            {
                actual: 'https://example.com/',
                expected: 'example.com',
            },
            {
                actual: 'https://example.com/path',
                expected: 'example.com',
            },
            {
                actual: 'http://example.com/path?query=1',
                expected: 'example.com',
            },
            {
                actual: 'https://subdomain.example.com/',
                expected: 'subdomain.example.com',
            },
            // `www.` should be cropped
            {
                actual: 'https://www.example.com/',
                expected: 'example.com',
            },
            {
                actual: 'https://www.subdomain.example.com/',
                expected: 'subdomain.example.com',
            },
        ])('$actual -> $expected', ({ actual, expected }) => {
            expect(getDomain(actual)).toBe(expected);
        });
    });
});
