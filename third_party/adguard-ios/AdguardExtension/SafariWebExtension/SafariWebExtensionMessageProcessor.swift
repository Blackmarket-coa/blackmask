//
// This file is part of Adguard for iOS (https://github.com/AdguardTeam/AdguardForiOS).
// Copyright © Adguard Software Limited. All rights reserved.
//
// Adguard for iOS is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Adguard for iOS is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Adguard for iOS. If not, see <http://www.gnu.org/licenses/>.
//

import SafariAdGuardSDK
import FilterEngine

protocol SafariWebExtensionMessageProcessorProtocol {
    func process(message: Message) -> [String: Any?]
}

final class SafariWebExtensionMessageProcessor: SafariWebExtensionMessageProcessorProtocol {

    private static let adguardForwarderUrl = "https://link.adtidy.org/forward.html"

    private let resources: AESharedResourcesProtocol
    private let productInfo: ADProductInfoProtocol
    private let webExtension: WebExtension

    init(
        resources: AESharedResourcesProtocol,
        productInfo: ADProductInfoProtocol,
        sharedStorageUrls: SharedStorageUrlsProtocol
    ) {
        self.resources = resources
        self.productInfo = productInfo

        // It can throw if it fails to create the work directory which is
        // a very unlikely fatal error.
        self.webExtension = try! WebExtension(
            containerURL: sharedStorageUrls.webExtFolderUrl
        )
    }

    func process(message: Message) -> [String: Any?]  {
        let requestReceivedTimestamp = Int(Date().timeIntervalSince1970 * 1000)

        switch message.type {
        case .getInitData:
            // URL of the website extension is open
            let url = message.data as? String
            return getInitData(url)
        case .getContentScriptData:
            // URL and top URL
            let req = message.data as? [String: Any?]
            guard let url = req?["url"] as? String else {
                return [Message.messageTypeKey: MessageType.error.rawValue]
            }
            let topUrl = req?["topUrl"] as? String
            let configuration = lookupContentScriptConfiguration(urlString: url, topUrlString: topUrl)

            // Checking logging level to avoid slow string interpolation.
            if ACLLogger.singleton()?.logLevel == ACLLDebugLevel {
                DDLogDebug("Responding with configuration: \(String(describing: configuration))")
            }

            let responseCreatedTimestamp = Int(Date().timeIntervalSince1970 * 1000)
            let nativeInitTimestamp = Int(Services.initTime.timeIntervalSince1970 * 1000)

            return [
                Message.configurationKey: configuration,
                Message.nativeInitTimestampKey: nativeInitTimestamp,
                Message.requestReceivedTimestampKey: requestReceivedTimestamp,
                Message.responseCreatedTimestampKey: responseCreatedTimestamp
            ]
        default:
            DDLogError("Received bad case")
            return [Message.messageTypeKey: MessageType.error.rawValue]
        }
    }

    // MARK: - Private methods


    private func lookupContentScriptConfiguration(urlString: String, topUrlString: String?) -> [String: Any]? {
        guard let pageUrl = URL(string: urlString) else {
            return nil
        }

        let topUrl = URL(string: topUrlString ?? "")

        let configuration = self.webExtension.lookup(pageUrl: pageUrl, topUrl: topUrl)
        if let configuration = configuration {
            return Self.convertToPayload(configuration)
        }

        return nil
    }

    /// Converts a WebExtension.Configuration object to a dictionary payload.
    ///
    /// - Parameters:
    ///   - configuration: The WebExtension.Configuration object to convert.
    /// - Returns: A dictionary containing CSS, extended CSS, JS, and scriptlets
    ///           that should be applied to the web page.
    private static func convertToPayload(
        _ configuration: WebExtension.Configuration
    ) -> [String: Any] {
        var payload: [String: Any] = [:]
        payload["css"] = configuration.css
        payload["extendedCss"] = configuration.extendedCss
        payload["js"] = configuration.js

        var scriptlets: [[String: Any]] = []
        for scriptlet in configuration.scriptlets {
            var scriptletData: [String: Any] = [:]
            scriptletData["name"] = scriptlet.name
            scriptletData["args"] = scriptlet.args
            scriptlets.append(scriptletData)
        }

        payload["scriptlets"] = scriptlets
        payload["engineTimestamp"] = configuration.engineTimestamp

        return payload
    }

    /// Gets data that is necessary to initialize extension's popup menu (i.e. the extension's UI).
    ///
    /// - Parameters:
    ///   - url: Web page URL.
    /// - Returns: A dictionary containing extension state information and information related
    ///           to website settings (i.e. whether protection is enabled or not).
    private func getInitData(_ url: String?) -> [String: Any] {
        let resources = AESharedResources()
        // We set it to be sure the user opened Extension
        resources.safariWebExtensionIsOn = true

        let cbService = ContentBlockerService(appBundleId: Bundle.main.hostAppBundleId)
        let domain = URL(string: url ?? "")?.domain

        // Selected theme
        let themeName = resources.themeMode.messageName

        // Safari Content Blockers states
        let someContentBlockersEnabled = cbService.allContentBlockersStates.values.reduce(false, { $0 || $1 })

        // User Pro status
        let isPro = Bundle.main.isPro ? true : resources.isProPurchased

        // Check if there are blocklist rules associated with passed domain
        let blocklistManager = SafariUserRulesManagersProvider(userDefaults: resources.sharedDefaults()).blocklistRulesManager
        let hasUserRules = domain == nil ? false : blocklistManager.hasUserRules(for: domain!)

        return [
            Message.appearanceTheme: themeName,
            Message.contentBlockersEnabled: someContentBlockersEnabled,
            Message.hasUserRules: hasUserRules,
            Message.premiumApp: isPro,
            Message.protectionEnabled: isSafariProtectionEnabled(for: domain, resources: resources),
            Message.advancedBlockingEnabled: resources.advancedProtection,
            Message.allowlistIsInverted: resources.invertedWhitelist,
            Message.platform: UIDevice.current.platformString,
            Message.safariProtectionEnabled: resources.safariProtectionEnabled && resources.complexProtectionEnabled,

            Message.enableSiteProtectionLink: UserRulesRedirectAction.enableSiteProtection(domain: "", absoluteDomainString: "").scheme,
            Message.disableSiteProtectionLink: UserRulesRedirectAction.disableSiteProtection(domain: "", absoluteDomainString: "").scheme,
            Message.addToBlocklistLink: UserRulesRedirectAction.addToBlocklist(domain: "", absoluteDomainString: "").scheme,
            Message.removeAllBlocklistRulesLink: UserRulesRedirectAction.removeAllBlocklistRules(domain: "", absoluteDomainString: "").scheme,
            Message.upgradeAppLink: "\(Bundle.main.inAppScheme)://upgradeApp",
            Message.enableAdvancedBlockingLink: "\(Bundle.main.inAppScheme)://enableAdvancedProtection",
            Message.reportProblemLink: constructReportLink(url ?? "unknown"),
            Message.enableSafariProtectionLink: UserRulesRedirectAction.enableSiteAndSafariProtection(domain: "").scheme
        ]
    }

    private func isSafariProtectionEnabled(for domain: String?, resources: AESharedResources) -> Bool {
        guard let domain = domain else { return false }

        let isAllowlistInverted = resources.invertedWhitelist
        let safariUserRulesStorage = SafariUserRulesStorage(
            userDefaults: resources.sharedDefaults(),
            rulesType: isAllowlistInverted ? .invertedAllowlist : .allowlist
        )
        let enabledRules = safariUserRulesStorage.rules.compactMap { $0.isEnabled ? $0.ruleText : nil }
        let isDomainInRules = enabledRules.contains(domain)
        return isAllowlistInverted ? isDomainInRules : !isDomainInRules
    }

    // TODO: pass more params (filters and so on)
    private func constructReportLink(_ problemUrl: String) -> String {
        let params: [String: String] = [
            "product_type": "iOS",
            "product_version": productInfo.version() ?? "0",
            "browser": "Safari",
            "url": problemUrl
        ]
        let paramString = ABECRequest.createString(fromParameters: params)
        return "\(adguardUrl(action: "report", from: "safari_web_extension", buildVersion: productInfo.buildVersion()))&\(paramString)"
    }

    private func adguardUrl(action: String, from: String, buildVersion: String)->String {
        var params: Dictionary<String, String> = [:]

        params["app"] = "ios"
        params["v"] = buildVersion
        params["action"] = action
        params["from"] = from

        let paramsString = ABECRequest.createString(fromParameters: params)

        return SafariWebExtensionMessageProcessor.adguardForwarderUrl + "?" + paramsString
    }
}

fileprivate extension UIDevice {
    var platformString: String {
        switch userInterfaceIdiom {
        case .pad: return "ipad"
        case .phone: return "iphone"
        default: return "unsupported"
        }
    }
}
