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
import ContentBlockerConverter

/// Represents the result of converting filter rules using the Converter library.
/// Contains only the relevant information needed for further processing or display.
public struct FiltersConverterResult: Codable, Equatable {
    /// The content blocker type this result is associated with.
    public let type: ContentBlockerType
    /// String representation of the converted JSON received from the Converter library.
    public let jsonString: String
    /// The total number of valid rules processed (some input rules may be invalid).
    public let totalRules: Int
    /// The number of rules included in the result, limited by 'contentBlockerRulesLimit'.
    public let totalConverted: Int
    /// Indicates if the total number of rules exceeded the 'contentBlockerRulesLimit'.
    public let overlimit: Bool
    /// The number of errors encountered during conversion.
    public let errorsCount: Int
    /// The number of entries in the advanced blocking section.
    public let advancedBlockingConvertedCount: Int
    /// The text of advanced content blocker rules, if any.
    public let advancedBlockingText: String?
    /// A message describing the result of the conversion.
    public let message: String

    /// Initializes a new `FiltersConverterResult` with explicit values for all properties.
    /// - Parameters:
    ///   - type: The content blocker type associated with the result.
    ///   - jsonString: String representation of the converted JSON.
    ///   - totalRules: The total number of valid rules processed.
    ///   - totalConverted: The number of rules included in the result.
    ///   - overlimit: Indicates if the total number of rules exceeded the limit.
    ///   - errorsCount: The number of errors encountered during conversion.
    ///   - advancedBlockingConvertedCount: The number of entries in the advanced blocking section.
    ///   - advancedBlockingText: The text of advanced content blocker rules, if any.
    ///   - message: A message describing the result of the conversion.
    init(type: ContentBlockerType, jsonString: String, totalRules: Int, totalConverted: Int, overlimit: Bool, errorsCount: Int, advancedBlockingConvertedCount: Int, advancedBlockingText: String?, message: String) {
        self.type = type
        self.jsonString = jsonString
        self.totalRules = totalRules
        self.totalConverted = totalConverted
        self.overlimit = overlimit
        self.errorsCount = errorsCount
        self.advancedBlockingConvertedCount = advancedBlockingConvertedCount
        self.advancedBlockingText = advancedBlockingText
        self.message = message
    }

    /// Initializes a new `FiltersConverterResult` using a `ConversionResult` object.
    /// - Parameters:
    ///   - type: The content blocker type associated with the result.
    ///   - conversionResult: The conversion result object containing all relevant data.
    init(type: ContentBlockerType, conversionResult: ConversionResult) {
        self.type = type
        self.jsonString = conversionResult.safariRulesJSON
        self.totalRules = conversionResult.safariRulesCount + conversionResult.discardedSafariRules
        self.totalConverted = conversionResult.safariRulesCount
        self.overlimit = conversionResult.discardedSafariRules > 0
        self.errorsCount = conversionResult.errorsCount
        self.advancedBlockingConvertedCount = conversionResult.advancedRulesCount
        self.advancedBlockingText = conversionResult.advancedRulesText
        self.message = conversionResult.description
    }
}
