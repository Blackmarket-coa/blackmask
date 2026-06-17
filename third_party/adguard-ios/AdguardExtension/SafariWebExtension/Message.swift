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

import Foundation

/// `MessageType` is a type of message that we receive from JS
/// Knowing the `Message.type` tells us what to do with `Message.data`
enum MessageType: String {
    case getInitData = "get_init_data"
    case getContentScriptData = "get_content_script_data"

    // Response cases
    case success = "success"
    case error = "error"
}

// MARK: - Message
// Object representation of message that we receive from JS

struct Message {
    static let messageTypeKey = "type"
    static let messageDataKey = "data"

    // getInitData
    static let protectionEnabled = "protection_enabled"
    static let hasUserRules = "has_user_rules"
    static let premiumApp = "premium_app"
    static let appearanceTheme = "appearance_theme"
    static let contentBlockersEnabled = "content_blockers_enabled"
    static let advancedBlockingEnabled = "advanced_blocking_enabled"
    static let allowlistIsInverted = "allowlist_inverted"
    static let platform = "platform"
    static let safariProtectionEnabled = "safari_protection_enabled"

    // Links
    static let enableSiteProtectionLink = "enable_site_protection_link"
    static let disableSiteProtectionLink = "disable_site_protection_link"
    static let addToBlocklistLink = "add_to_blocklist_link"
    static let removeAllBlocklistRulesLink = "remove_all_blocklist_rules_link"
    static let upgradeAppLink = "upgrade_app_link"
    static let enableAdvancedBlockingLink = "enable_advanced_blocking_link"
    static let reportProblemLink = "report_problem_link"
    static let enableSafariProtectionLink = "enable_safari_protection_link"

    // getContentScriptData
    static let configurationKey = "configuration"

    /// Timestamp of when the native host process was initialized
    static let nativeInitTimestampKey = "init_ts"

    /// Additional field that is added to content script data response
    /// so that we could trace how much time was spent on messaging.
    static let requestReceivedTimestampKey = "request_received_ts"

    /// Additional field that is added to content script data response
    /// so that we could trace how much time was spent on looking up
    /// the page URL.
    static let responseCreatedTimestampKey = "response_created_ts"

    let type: MessageType
    let data: Any?
}

/// Initializer from Dictionary. We receive message as dictionary from JS
extension Message {
    init?(message: [String: Any]) {
        guard let typeString = message[Self.messageTypeKey] as? String,
              let type = MessageType(rawValue: typeString)
        else {
            return nil
        }
        self.type = type
        self.data = message[Self.messageDataKey]
    }
}

// MARK: - ThemeMode + messageName

extension ThemeMode {
    var messageName: String {
        switch self {
        case .light: return "light"
        case .dark: return "dark"
        case .systemDefault: return "system"
        }
    }
}
