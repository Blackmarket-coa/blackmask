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

final class Services {
    static let initTime = Date()
    static let shared = Services()

    let resources: AESharedResourcesProtocol
    let processor: SafariWebExtensionMessageProcessorProtocol
    let productInfo: ADProductInfoProtocol

    init() {
        self.resources = AESharedResources()
        self.productInfo = ADProductInfo()

        // Init logger
        ACLLogger.singleton()?.initLogger(self.resources.sharedAppLogsURL())
        let isDebugLogs = resources.isDebugLogs
        DDLogDebug("Safari Web Extension was initialized with log level: \(isDebugLogs ? "DEBUG" : "NORMAL")")
        ACLLogger.singleton()?.logLevel = isDebugLogs ? ACLLDebugLevel : ACLLDefaultLevel

        let sharedStorageUrls: SharedStorageUrlsProtocol = SharedStorageUrls()

        // Init message processor singleton.
        self.processor = SafariWebExtensionMessageProcessor(
            resources: resources,
            productInfo: productInfo,
            sharedStorageUrls: sharedStorageUrls
        )

        let migration = WebExtMigrationService(resources: resources, sharedStorageUrls: sharedStorageUrls)
        migration.migrateIfNeeded()
    }
}
