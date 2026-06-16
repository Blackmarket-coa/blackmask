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
import FilterEngine
import SafariAdGuardSDK

/// WebExtMigrationService is responsible for migrating Safari Web Extension files.
/// It **should only** be called from within Safari Web Extension process.
class WebExtMigrationService {
    private let resources: AESharedResourcesProtocol
    private let sharedStorageUrls: SharedStorageUrlsProtocol
    private let versionProvider: MigrationServiceVersionProviderProtocol

    init(resources: AESharedResourcesProtocol, sharedStorageUrls: SharedStorageUrlsProtocol) {
        self.resources = resources
        self.sharedStorageUrls = sharedStorageUrls
        self.versionProvider = MigrationServiceVersionProvider(resources: resources)
    }

    func migrateIfNeeded() {
        if versionProvider.isMigrationTo4_5_11Needed {
            let version = ProcessInfo.processInfo.operatingSystemVersion

            // Migration may consume a lot of memory so it's only allowed
            // on newer iOS versions where Web Extension's memory limit is high.
            //
            // iOS 18.3: the limit is 140MB
            // iOS 16.6: the limit is 80MB
            // iOS 15.7: the limit is 80MB
            //
            // We can't use #available here since it only checks API availability,
            // but memory limits may be changed without API changes
            if (version.majorVersion == 15 && version.minorVersion >= 7) ||
                (version.majorVersion == 16 && version.minorVersion >= 6) ||
                version.majorVersion >= 17 {
                migrateTo4_5_11()
            } else {
                migrateOldIOSTo4_5_11()
            }
        }
    }

    /// Migrates Safari Web Extension to v4.5.11. The idea is that if there's the old advancedRulesFileUrl
    /// it should be used to compile the new FilterEngine and then can be removed.
    private func migrateTo4_5_11() {
        if !FileManager.default.fileExists(atPath: sharedStorageUrls.advancedRulesFileUrl.path) {
            // The old rules file does not exist anymore, no need to migrate.
            return
        }

        DDLogInfo("Migrating web extension to SafariConverterLib v3")

        do {
            // It can throw if it fails to create the work directory which is
            // a very unlikely fatal error.
            let webExtension = try WebExtension(
                containerURL: sharedStorageUrls.webExtFolderUrl,
            )

            let rules = try String(contentsOfFile: sharedStorageUrls.advancedRulesFileUrl.path)
            _ = try webExtension.buildFilterEngine(rules: rules)

            // Make sure that the old plain rules file is removed.
            try FileManager.default.removeItem(at: sharedStorageUrls.advancedRulesFileUrl)

            DDLogInfo("Finished migrating web extension to SafariConverterLib v3")
        } catch {
            DDLogError("Failed to migrate web extension: \(error.localizedDescription)")
        }
    }

    /// In the case of the old iOS versions the Web Extension's memory limit may not be enough
    /// to handle the migration. In this case the only thing we do is deleting the old "advancedRulesFileUrl" file.
    private func migrateOldIOSTo4_5_11() {
        if !FileManager.default.fileExists(atPath: sharedStorageUrls.advancedRulesFileUrl.path) {
            // The old rules file does not exist anymore, no need to migrate.
            return
        }

        DDLogInfo("Migrating web extension to SafariConverterLib v3 (for old iOS)")

        try? FileManager.default.removeItem(atPath: sharedStorageUrls.advancedRulesFileUrl.path)

        DDLogInfo("Finished migrating web extension to SafariConverterLib v3 (for old iOS)")
    }
}
