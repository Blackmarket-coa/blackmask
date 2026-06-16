# AdGuard IOSWebExtension

WebExtension for AdGuard for IOS

## Development

You'll need node v22 to build it.

### Build

- Build once: `yarn build`
- Watch build: `yarn watch`

### Lint

`yarn lint`

### Test

`yarn test`

### Debugging

Note, that you can debug the extension in desktop Safari using the following approach:

- You may want to not minimize the build when debugging, i.e. set
  `minimize: false` in [webpack.config.ts]
- Set `mockNativeHost` to `true` in [src/pages/background/adguard.ts]
- Build the extension using `yarn build`
- Install the extension in Safari as explained [here][installwebext]
- You may also want to enable verbose logging in the content script by setting
  `verbose = true` in [src/pages/content/content.ts]

[webpack.config.ts]: ./tools/bundle/webpack.config.ts
[src/pages/background/adguard.ts]: ./src/pages/background/adguard.ts
[installwebext]: https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension#Temporarily-install-a-web-extension-folder-in-macOS-Safari
[src/pages/content/content.ts]: ./src/pages/content/content.ts

### Locales import/export

Instructions about how to update locales can be found in [readme](./tools/locales/README.md). Do not forget to install libraries npm modules `yarn install`
