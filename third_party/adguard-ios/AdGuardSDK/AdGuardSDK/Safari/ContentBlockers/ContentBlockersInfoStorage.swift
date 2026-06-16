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
import ContentBlockerConverter
import FilterEngine

// MARK: - ContentBlockerType

public enum ContentBlockerType: Int, CaseIterable, Codable {
    case general
    case privacy
    case custom
    case socialWidgetsAndAnnoyances
    case other
    case security

    var affinity: Affinity {
        switch self {
        case .general: return .general
        case .privacy: return .privacy
        case .socialWidgetsAndAnnoyances: return .socialWidgetsAndAnnoyances
        case .other: return .other
        case .custom: return .custom
        case .security: return .security
        }
    }
}

// MARK: - ConverterResult

/// Represents the result of converting filter rules for a specific content blocker.
/// This struct is similar to `FiltersConverterResult`, but stores only
/// the metadata required for storage and further processing, and references
/// the JSON file by URL rather than by string.
///
/// - Note: Used for storing conversion results in persistent storage.
public struct ConverterResult: Codable, Equatable {
    /// The type of content blocker this result is associated with.
    public let type: ContentBlockerType

    /// The total number of valid rules processed (invalid rules are ignored).
    public let totalRules: Int

    /// The number of rules included in the final result, limited by the content
    /// blocker rules limit.
    public let totalConverted: Int

    /// Indicates whether the total number of rules exceeded the allowed limit.
    public let overlimit: Bool

    /// The number of errors encountered during conversion.
    public let errorsCount: Int

    /// The number of advanced blocking rules included in the result.
    public let advancedBlockingConvertedCount: Int

    /// A message describing the outcome of the conversion.
    public let message: String

    /// Initializes a new `ConverterResult` from a `FiltersConverterResult`.
    /// - Parameter result: The source conversion result containing all relevant data.
    init(result: FiltersConverterResult) {
        self.type = result.type
        self.totalRules = result.totalRules
        self.totalConverted = result.totalConverted
        self.overlimit = result.overlimit
        self.errorsCount = result.errorsCount
        self.advancedBlockingConvertedCount = result.advancedBlockingConvertedCount
        self.message = result.message
    }
}

// MARK: - ContentBlockersInfoStorage

protocol ContentBlockersInfoStorageProtocol: ResetableSyncProtocol {
    /// Number of advanced rules that will be passed to Safari Web Extension.
    var advancedRulesCount: Int { get }

    /// Returns all content blocker conversion results and JSONs urls.
    var allConverterResults: [ConverterResult] { get }

    /// Saves filters convertion info and JSON files to storage.
    func save(converterResults: [FiltersConverterResult]) throws

    /// Loads filters convertion result and JSON file url for specified content blocker type.
    func getConverterResult(for cbType: ContentBlockerType) -> ConverterResult?

    /// Returns URL to the content blocker json for specified content blocker type.
    func getJsonUrl(for cbType: ContentBlockerType) -> URL
}

/// This class is responsible for managing JSON files for every content blocker
/// and also for storing advanced blocking data.
final class ContentBlockersInfoStorage: ContentBlockersInfoStorageProtocol {

    // MARK: - Public properties

    var advancedRulesCount: Int { userDefaultsStorage.advancedRulesCount }

    var allConverterResults: [ConverterResult] { userDefaultsStorage.allCbInfo }

    // MARK: - Private properties

    private let fileManager = FileManager.default

    /// URL of directory where jsons for each content blocker will be stored.
    private let jsonStorageUrl: URL

    /// URL to the directory where WebExtension's files are stored.
    private let webExtFolderUrl: URL

    /// URL of the file where plain text advanced rules were stored before v4.5.11.
    /// In the current version we only make sure that this file is removed when advanced rules are saved.
    @available(*, deprecated, message: "Remove in v5.0")
    private let advancedRulesFileUrl: URL

    private let userDefaultsStorage: UserDefaultsStorageProtocol

    // MARK: - Initialization

    /// Initializes a new instance of a ContentBlockersInfoStorage.
    ///
    /// - Parameters:
    ///   - jsonStorageUrl: URL to the directory where content blockers' JSON files are stored.
    ///   - webExtFolderUrl: URL to the directory where WebExtension's files are stored.
    ///   - advancedRulesFileUrl: (deprecated) URL to the file with plain text advanced rules.
    ///   - userDefaultsStorage: User defaults
    init(
        jsonStorageUrl: URL,
        webExtFolderUrl: URL,
        advancedRulesFileUrl: URL,
        userDefaultsStorage: UserDefaultsStorageProtocol
    ) throws {
        // We are trying to create directory if passed URL is not a valid directory
        if !jsonStorageUrl.isDirectory {
            try fileManager.createDirectory(at: jsonStorageUrl, withIntermediateDirectories: true, attributes: nil)
        }
        self.jsonStorageUrl = jsonStorageUrl
        self.webExtFolderUrl = webExtFolderUrl
        self.advancedRulesFileUrl = advancedRulesFileUrl
        self.userDefaultsStorage = userDefaultsStorage
    }

    // MARK: - Internal methods

    func save(converterResults: [FiltersConverterResult]) throws {
        guard converterResults.count == ContentBlockerType.allCases.count else {
            throw CommonError.error(message: "Received \(converterResults.count) results, but expecting \(ContentBlockerType.allCases.count)")
        }

        Logger.logInfo("(ContentBlockersInfoStorage) - save cbJsons; Trying to save \(converterResults.count) jsons")

        let result: [ConverterResult] = try converterResults.map {
            let urlToSave = getJsonUrl(for: $0.type)
            try $0.jsonString.write(to: urlToSave, atomically: true, encoding: .utf8)
            return ConverterResult(result: $0)
        }
        userDefaultsStorage.allCbInfo = result
        try saveAdvancedRules(from: converterResults)
    }

    func getConverterResult(for cbType: ContentBlockerType) -> ConverterResult? {
        Logger.logInfo("(ContentBlockersInfoStorage) - getConverterResult; Result request for \(cbType)")
        let allResults = userDefaultsStorage.allCbInfo
        return allResults.first(where: { $0.type == cbType })
    }

    func reset() throws {
        Logger.logInfo("(ContentBlockersInfoStorage) - reset start")

        // Remove all converted JSON fils
        try fileManager.removeItem(at: jsonStorageUrl)

        // Remove all web extension files
        try fileManager.removeItem(at: webExtFolderUrl)

        // Create new directory for content blocker files
        try fileManager.createDirectory(at: jsonStorageUrl, withIntermediateDirectories: true, attributes: nil)

        // Clear user defaults
        userDefaultsStorage.allCbInfo = []

        Logger.logInfo("(ContentBlockersInfoStorage) - reset; Successfully deleted directory with CBs JSONs")
    }

    func getJsonUrl(for cbType: ContentBlockerType) -> URL {
        return jsonStorageUrl.appendingPathComponent(cbType.fileName)
    }

    // MARK: - Private methods

    private func saveAdvancedRules(from results: [FiltersConverterResult]) throws {
        Logger.logInfo("(ContentBlockersInfoStorage) - saveAdvancedRules; start")

        // Remove duplicates from the rules.
        // Note that we persist the rules order (it is very important for interpreting them in the Web Extension).
        var uniqueRules: Set<String> = []
        var rules: [String] = []
        for result in results {
            let content = (result.advancedBlockingText ?? "") as NSString
            content.enumerateLines { line, _ in
                if !uniqueRules.contains(line) {
                    rules.append(line)
                    uniqueRules.insert(line)
                }
            }
        }

        // String from unique rules
        let uniqueRulesText = rules.joined(separator: "\n")

        userDefaultsStorage.advancedRulesCount = rules.count

        // Compile the filter engine from the rules and store the compilation result
        // in webExtFolder.
        let webExtension = try WebExtension(containerURL: self.webExtFolderUrl)
        _ = try webExtension.buildFilterEngine(rules: uniqueRulesText)

        // Make sure the old plain text rules file is removed when the filter engine is compiled.
        // This cleans up files from the old version.
        if fileManager.fileExists(atPath: advancedRulesFileUrl.path) {
            try fileManager.removeItem(at: advancedRulesFileUrl)
        }

        Logger.logInfo("(ContentBlockersInfoStorage) - saveAdvancedRules; finished saving \(rules.count) rules")
    }
}

// MARK: - ContentBlockerType + fileName

fileprivate extension ContentBlockerType {
    var fileName: String {
        switch self {
        case .general: return "cb_general.json"
        case .privacy: return "cb_privacy.json"
        case .socialWidgetsAndAnnoyances: return "cb_annoyances.json"
        case .other: return "cb_other.json"
        case .custom: return "cb_custom.json"
        case .security: return "cb_security.json"
        }
    }
}

// MARK: - UserDefaultsStorageProtocol + allCbInfo

fileprivate extension UserDefaultsStorageProtocol {

    private var allCbInfoKey: String { "AdGuardSDK.allCbInfoKey" }
    private var advancedRulesCountKey: String { "AdGuardSDK.advancedRulesCountKey" }

    var allCbInfo: [ConverterResult] {
        get {
            if let savedCbData = storage.data(forKey: allCbInfoKey) {
                let decoder = JSONDecoder()
                let cbInfo = try? decoder.decode([ConverterResult].self, from: savedCbData)
                return cbInfo ?? []
            }
            return []
        }
        set {
            let encoder = JSONEncoder()
            if let cbInfoData = try? encoder.encode(newValue) {
                storage.set(cbInfoData, forKey: allCbInfoKey)
            } else {
                storage.set(Data(), forKey: allCbInfoKey)
            }
        }
    }

    var advancedRulesCount: Int {
        get {
            return storage.integer(forKey: advancedRulesCountKey)
        }
        set {
            storage.set(newValue, forKey: advancedRulesCountKey)
        }
    }
}
