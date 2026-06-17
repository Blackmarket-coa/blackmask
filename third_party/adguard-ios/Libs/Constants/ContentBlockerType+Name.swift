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

import enum SafariAdGuardSDK.ContentBlockerType

extension ContentBlockerType {

    // It's called so, not to change code that uses this variable after it't beeing localized

    var localizedName: String {
        let appName = Bundle.main.applicationName
        let cbName: String
        switch self {
        case .general: cbName = String.localizedString("cb_screen_content_blockers_general_name")
        case .privacy: cbName = String.localizedString("cb_screen_content_blockers_privacy_name")
        case .socialWidgetsAndAnnoyances: cbName = String.localizedString("cb_screen_content_blockers_social_name")
        case .other: cbName = String.localizedString("cb_screen_content_blockers_other_name")
        case .custom: cbName = String.localizedString("cb_screen_content_blockers_custom_name")
        case .security: cbName = String.localizedString("cb_screen_content_blockers_security_name")
        }

        return appName + " - " + cbName
    }
}
