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

import SharedAdGuardSDK

public protocol ContentBlockerJsonProviderProtocol {
    /**
     Returns URL of JSON file
     - Parameter safariProtectionIsEnabled: Current state of Safari protection
     - throws: Can throw an error if error occured while getting JSON file
     */
    var jsonUrl: URL { get }
}


/// This class should be used in Content Blocker's extensions to get appropriate JSON for this particular CB.
public final class ContentBlockerJsonProvider: ContentBlockerJsonProviderProtocol {

    public var jsonUrl: URL { jsonStorage.getJsonUrl(for: type) }

    private let jsonStorage: ContentBlockersInfoStorageProtocol
    private let type: ContentBlockerType

    /// Initializes a new instance of a ContentBlockerJsonProvider.
    ///
    /// - Parameters:
    ///   - cbBundleId: Bundle ID of this content blocker extension.
    ///   - mainAppBundleId: Bundle ID of the main app.
    ///   - jsonStorageUrl: URL to the directory where content blockers' JSON files are stored.
    ///   - webExtFolderUrl: URL to the directory where WebExtension's files are stored.
    ///   - advancedRulesFileUrl: (deprecated) URL to the file with plain text advanced rules.
    ///   - userDefaultsStorage: User defaults
    public init(
        cbBundleId: String,
        mainAppBundleId: String,
        jsonStorageUrl: URL,
        webExtFolderUrl: URL,
        advancedRulesFileUrl: URL,
        userDefaults: UserDefaults
    ) throws {
        let userDefaultsStorage = UserDefaultsStorage(storage: userDefaults)
        self.jsonStorage = try ContentBlockersInfoStorage(
            jsonStorageUrl: jsonStorageUrl,
            webExtFolderUrl: webExtFolderUrl,
            advancedRulesFileUrl: advancedRulesFileUrl,
            userDefaultsStorage: userDefaultsStorage
        )
        self.type = Self.typeForBundleId(cbBundleId, mainAppBundleId: mainAppBundleId)
    }

    /// Initializer for tests
    init(jsonStorage: ContentBlockersInfoStorageProtocol, type: ContentBlockerType) {
        self.jsonStorage = jsonStorage
        self.type = type
    }

    private static func typeForBundleId(_ cbBundleId: String, mainAppBundleId: String)->ContentBlockerType {
        for type in ContentBlockerType.allCases {
            if type.contentBlockerBundleId(mainAppBundleId) == cbBundleId {
                return type
            }
        }
        return .general
    }
}
