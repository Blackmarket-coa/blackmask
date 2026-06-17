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

protocol ServicesStorageProtocol {
    var configuration: SafariConfigurationProtocol { get }
    var userDefaults: UserDefaultsStorageProtocol { get }
    var safariManagers: SafariUserRulesManagersProviderProtocol { get }
    var cbStorage: ContentBlockersInfoStorage { get }
    var cbService: ContentBlockerServiceProtocol { get }
    var filters: FiltersServiceProtocol { get }
    var converter: FiltersConverterServiceProtocol { get }
}

final class ServicesStorage: ServicesStorageProtocol {

    let configuration: SafariConfigurationProtocol
    let userDefaults: UserDefaultsStorageProtocol
    let safariManagers: SafariUserRulesManagersProviderProtocol
    let cbStorage: ContentBlockersInfoStorage
    let cbService: ContentBlockerServiceProtocol
    let filters: FiltersServiceProtocol
    let converter: FiltersConverterServiceProtocol

    /// Creates an instance of ServicesStorage.
    ///
    /// - Parameters:
    ///   - configuration: Safari protection configuration
    ///   - filterFilesDirectoryUrl: URL to the directory where filter files are stored
    ///   - dbContainerUrl: URL to the directory where the app database is stored
    ///   - jsonStorageUrl: URL to the directory where content blockers' JSON files are stored
    ///   - webExtFolderUrl: URL to the directory where web extension files are stored
    ///   - advancedRulesFileUrl: (deprecated) URL to the file where plain text advanced rules are stored
    ///   - userDefaults: Shared user defaults
    ///
    /// - Throws: Throws an error if it fails to initialize filters directory.
    init(
        configuration: SafariConfigurationProtocol,
        filterFilesDirectoryUrl: URL,
        dbContainerUrl: URL,
        jsonStorageUrl: URL,
        webExtFolderUrl: URL,
        advancedRulesFileUrl: URL,
        userDefaults: UserDefaults
    ) throws {
        Logger.logInfo("(ServicesStorage) - init start")

        let filterFilesStorage = try FilterFilesStorage(filterFilesDirectoryUrl: filterFilesDirectoryUrl)
        try filterFilesStorage.unzipPredefinedFiltersIfNeeded()

        let productionDbManager = try ProductionDatabaseManager(dbContainerUrl: dbContainerUrl)
        let metaStorage = MetaStorage(productionDbManager: productionDbManager)
        let apiMethods = SafariProtectionApiMethods()

        self.userDefaults = UserDefaultsStorage(storage: userDefaults)

        self.configuration = configuration

        self.safariManagers = SafariUserRulesManagersProvider(userDefaultsStorage: self.userDefaults)

        self.cbStorage = try ContentBlockersInfoStorage(
            jsonStorageUrl: jsonStorageUrl,
            webExtFolderUrl: webExtFolderUrl,
            advancedRulesFileUrl: advancedRulesFileUrl,
            userDefaultsStorage: self.userDefaults
        )

        self.cbService = ContentBlockerService(appBundleId: configuration.appBundleId)

        self.filters = try FiltersService(
            configuration: self.configuration,
            filterFilesStorage: filterFilesStorage,
            metaStorage: metaStorage,
            userDefaultsStorage: self.userDefaults,
            apiMethods: apiMethods)

        let filtersConverter = FiltersConverter(configuration: configuration)
        self.converter = FiltersConverterService(
            configuration: configuration,
            filtersService: filters,
            filterFilesStorage: filterFilesStorage,
            safariManagers: safariManagers,
            filtersConverter: filtersConverter
        )

        Logger.logInfo("(ServicesStorage) - init end")
    }
}
