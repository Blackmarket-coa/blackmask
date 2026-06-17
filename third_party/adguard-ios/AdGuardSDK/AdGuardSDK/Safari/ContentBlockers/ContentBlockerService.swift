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

public protocol ContentBlockerServiceProtocol {
    /* Returns every content blocker reloading state */
    var reloadingContentBlockers: [ContentBlockerType: Bool] { get }

    /// Contains errors that were returned when reloading the content blocker.
    /// If everything is fine all errors are nils.
    var allContentBlockersErrors: [ContentBlockerType: Error?] { get }

    /* Returns every content blocker state */
    var allContentBlockersStates: [ContentBlockerType: Bool] { get }

    /*
     Updates all content blockers
     Returns error if it occured during update
     Returns nil if everything is fine
     */
    func updateContentBlockers(onContentBlockersUpdated: @escaping (_ error: Error?) -> Void)

    /* Returns state of the specified content blocker */
    func getState(for cbType: ContentBlockerType) -> Bool
}

/* This class is responsible for updating Safari content blockers */
final public class ContentBlockerService: ContentBlockerServiceProtocol {

    // MARK: - Public  properties

    public private(set) var reloadingContentBlockers: [ContentBlockerType: Bool]

    public private(set) var allContentBlockersErrors: [ContentBlockerType: Error?]

    public var allContentBlockersStates: [ContentBlockerType: Bool] {
        var result: [ContentBlockerType : Bool] = [:]
        ContentBlockerType.allCases.forEach { result[$0] = getState(for: $0) }
        return result
    }

    // MARK: - Private properties

    // Queue for updating content blockers
    private let updateQueue = DispatchQueue(label: "AdGuardSDK.ContentBlockerService.updateQueue", qos: .userInitiated)

    /* Services */
    private let appBundleId: String
    private let contentBlockersManager: ContentBlockersManagerProtocol

    // MARK: - Initialization

    public init(appBundleId: String) {
        self.appBundleId = appBundleId
        self.contentBlockersManager = ContentBlockersManager()
        self.reloadingContentBlockers = Self.emptyReloadingStates()
        self.allContentBlockersErrors = Self.emptyReloadErrors()
    }

    init(
        appBundleId: String,
        contentBlockersManager: ContentBlockersManagerProtocol = ContentBlockersManager()
    ) {
        self.appBundleId = appBundleId
        self.contentBlockersManager = contentBlockersManager
        self.reloadingContentBlockers = Self.emptyReloadingStates()
        self.allContentBlockersErrors = Self.emptyReloadErrors()
    }

    // MARK: - Internal methods

    public func updateContentBlockers(onContentBlockersUpdated: @escaping (_ error: Error?) -> Void) {
        updateQueue.async { [weak self] in
            Logger.logInfo("(ContentBlockerService) - updateContentBlockers; CBs update started")

            NotificationCenter.default.contentBlockersUpdateStarted()
            let updateError = self?.updateContentBlockersSync()
            NotificationCenter.default.contentBlockersUpdateFinished()

            Logger.logInfo("(ContentBlockerService) - updateContentBlockers; CBs update finished")
            onContentBlockersUpdated(updateError)
        }
    }

    public func getState(for cbType: ContentBlockerType) -> Bool {
        let group = DispatchGroup()
        let cbBundleId = cbType.contentBlockerBundleId(appBundleId)
        var isEnabled = false
        group.enter()
        contentBlockersManager.getStateOfContentBlocker(withId: cbBundleId) { result in
            switch result {
            case .success(let enabled):
                isEnabled = enabled
            case .error(let error):
                Logger.logError("(ContentBlockerService) - getState; Failed to reveal CB state, suppose it is disabled; Error: \(error)")
            }
            group.leave()
        }
        group.wait()
        return isEnabled
    }

    // MARK: - Private methods

    /// Helper function to avoid duplicate code in init.
    private static func emptyReloadingStates() -> [ContentBlockerType: Bool] {
        var reloadingStates: [ContentBlockerType: Bool] = [:]
        ContentBlockerType.allCases.forEach {
            reloadingStates[$0] = false
        }
        return reloadingStates
    }

    /// Helper function to avoid duplicate code in init.
    private static func emptyReloadErrors() -> [ContentBlockerType: Error?] {
        var reloadErrors: [ContentBlockerType: Error?] = [:]
        ContentBlockerType.allCases.forEach {
            reloadErrors[$0] = nil
        }
        return reloadErrors
    }

    /*
     Updates all content blockers syncroniously.
     Returns error if some content blockers were failed to be updated.
     Returns nil if update successeded.
     */
    private func updateContentBlockersSync() -> Error? {
        var resultError: Error?
        let group = DispatchGroup()

        for cb in ContentBlockerType.allCases {
            group.enter()
            reloadContentBlocker(for: cb) { error in
                if let error = error {
                    resultError = error
                }
                self.allContentBlockersErrors[cb] = error

                group.leave()
            }
        }
        group.wait()

        return resultError
    }

    /// Reloads safari content blocker. If reload fails on first try, it attempts to do it again.
    private func reloadContentBlocker(for cbType: ContentBlockerType, firstTry: Bool = true, _ onContentBlockerReloaded: @escaping (_ error: Error?) -> Void) {

        if firstTry {
            // Mark the content blocker as "reloading".
            reloadingContentBlockers[cbType] = true
            NotificationCenter.default.standaloneContentBlockerUpdateStarted(cbType)
        }

        let cbBundleId = cbType.contentBlockerBundleId(appBundleId)

        contentBlockersManager.reloadContentBlocker(withId: cbBundleId) { error in
            if let error = error {
                Logger.logError("(ContentBlockerService) - reloadContentBlocker; Error reloading content blocker=\(cbType); firstTry=\(firstTry); Error: \(error)")

                if firstTry {
                    // Sometimes Safari fails to register a content blocker because of some internal
                    // race conditions so we try to reload it second time on error.
                    self.reloadContentBlocker(for: cbType, firstTry: false, onContentBlockerReloaded)
                } else {
                    // Make sure that the content blocker is not marked as reloading anymore.
                    self.reloadingContentBlockers[cbType] = false

                    onContentBlockerReloaded(error)
                    NotificationCenter.default.standaloneContentBlockerUpdateFinished(cbType)
                }
            } else {
                // Make sure that the content blocker is not marked as reloading anymore.
                self.reloadingContentBlockers[cbType] = false

                onContentBlockerReloaded(nil)
                NotificationCenter.default.standaloneContentBlockerUpdateFinished(cbType)
            }
        }
    }
}

// MARK: - ContentBlockerType + contentBlockerBundleId

extension ContentBlockerType {
    func contentBlockerBundleId(_ mainAppBundleId: String) -> String {
        switch self {
        case .general: return "\(mainAppBundleId).extension"
        case .privacy: return "\(mainAppBundleId).extensionPrivacy"
        case .socialWidgetsAndAnnoyances: return "\(mainAppBundleId).extensionAnnoyances"
        case .other: return "\(mainAppBundleId).extensionOther"
        case .custom: return "\(mainAppBundleId).extensionCustom"
        case .security: return "\(mainAppBundleId).extensionSecurity"
        }
    }
}

// MARK: - NotificationCenter + Content blockers reload events

fileprivate extension ContentBlockerType {
    // String constant for user info
    static let contentBlockerType = "contentBlockerType"
}

fileprivate extension NSNotification.Name {
    static var contentBlockersUpdateStarted: NSNotification.Name { .init(rawValue: "AdGuardSDK.contentBlockersUpdateStarted") }
    static var contentBlockersUpdateFinished: NSNotification.Name { .init(rawValue: "AdGuardSDK.contentBlockersUpdateFinished") }

    // Notifications for every Content Blocker
    static var standaloneContentBlockerUpdateStarted: NSNotification.Name { .init(rawValue: "AdGuardSDK.standaloneContentBlockerUpdateStarted") }
    static var standaloneContentBlockerUpdateFinished: NSNotification.Name { .init(rawValue: "AdGuardSDK.standaloneContentBlockerUpdateFinished") }
}

fileprivate extension NotificationCenter {
    /// DispatchQueue for notification messages. Notifications must be dispatched asynchronously
    /// or otherwise we risk having a deadlock.
    private static let notificationsQueue = DispatchQueue(label: "AdGuardSDK.ContentBlockerService.notificationsQueue", qos: .default)

    func contentBlockersUpdateStarted() {
        Self.notificationsQueue.async {
            self.post(name: .contentBlockersUpdateStarted, object: self, userInfo: nil)
        }
    }

    func contentBlockersUpdateFinished() {
        Self.notificationsQueue.async {
            self.post(name: .contentBlockersUpdateFinished, object: self, userInfo: nil)
        }
    }

    func standaloneContentBlockerUpdateStarted(_ cbType: ContentBlockerType) {
        Self.notificationsQueue.async {
            let userInfo = [ContentBlockerType.contentBlockerType: cbType]
            self.post(name: .standaloneContentBlockerUpdateStarted, object: nil, userInfo: userInfo)
        }
    }

    func standaloneContentBlockerUpdateFinished(_ cbType: ContentBlockerType) {
        Self.notificationsQueue.async {
            let userInfo = [ContentBlockerType.contentBlockerType: cbType]
            self.post(name: .standaloneContentBlockerUpdateFinished, object: nil, userInfo: userInfo)
        }
    }
}

public extension NotificationCenter {
    func contentBlockersUpdateStart(queue: OperationQueue? = .main, handler: @escaping () -> Void) -> NotificationToken {
        return self.observe(name: .contentBlockersUpdateStarted, object: nil, queue: queue) { _ in
            handler()
        }
    }

    func contentBlockersUpdateFinished(queue: OperationQueue? = .main, handler: @escaping () -> Void) -> NotificationToken {
        return self.observe(name: .contentBlockersUpdateFinished, object: nil, queue: queue) { _ in
            handler()
        }
    }

    func standaloneContentBlockerUpdateStarted(queue: OperationQueue? = .main, handler: @escaping (_ cbType: ContentBlockerType) -> Void) -> NotificationToken {
        return self.observe(name: .standaloneContentBlockerUpdateStarted, object: nil, queue: queue) { note in
            let userInfo = note.userInfo!
            let cbType = userInfo[ContentBlockerType.contentBlockerType] as! ContentBlockerType
            handler(cbType)
        }
    }

    func standaloneContentBlockerUpdateFinished(queue: OperationQueue? = .main, handler: @escaping (_ cbType: ContentBlockerType) -> Void) -> NotificationToken {
        return self.observe(name: .standaloneContentBlockerUpdateFinished, object: nil, queue: queue) { note in
            let userInfo = note.userInfo!
            let cbType = userInfo[ContentBlockerType.contentBlockerType] as! ContentBlockerType
            handler(cbType)
        }
    }
}
