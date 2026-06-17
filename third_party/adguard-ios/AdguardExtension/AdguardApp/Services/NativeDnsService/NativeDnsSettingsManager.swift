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

import UIKit.UIApplication
import NetworkExtension
import DnsAdGuardSDK

enum NativeDnsSettingsManagerError: Error {
    case unsupportedDnsProtocol
    case failedToLoadManager
    case unsupportedProtocolsConfiguration
    case invalidUpstreamsNumber
    case failedToChangeDnsServerToDefault
}

// TODO: - It is a copy of old delegate; It should be removed in the future
protocol NativeDnsSettingsManagerDelegate: AnyObject {
    func dnsManagerStatusChanged()
}

protocol NativeDnsSettingsManagerProtocol: AnyObject {

    // TODO: - Remove later
    var delegate: NativeDnsSettingsManagerDelegate? { get set }

    /// State of saved dns config
    var dnsConfigIsEnabled: Bool { get }

    /// Save dns config with active provider into system preferences
    @available(iOS 14.0, *)
    func saveDnsConfig(_ onErrorReceived: @escaping (_ error: Error?) -> Void)

    /// Remove dns config from system preferences
    @available(iOS 14.0, *)
    func removeDnsConfig(_ onErrorReceived: @escaping (_ error: Error?) -> Void)

    /// Reset dns config
    @available(iOS 14.0, *)
    func reset()
}

/// Config Manager is responsible for controlling and providing actual state of DNS mobile config that can be found here
final class NativeDnsSettingsManager: NativeDnsSettingsManagerProtocol {

    private struct ManagerStatus {
        let isInstalled: Bool
        let isEnabled: Bool

        init() {
            self.isInstalled = false
            self.isEnabled = false
        }

        @available(iOS 14.0, *)
        init(manager: NEDNSSettingsManager) {
            self.isInstalled = manager.dnsSettings != nil
            self.isEnabled = manager.isEnabled
        }
    }

    // MARK: - Internal properties

    // TODO: - Remove later
    weak var delegate: NativeDnsSettingsManagerDelegate?

    var dnsConfigIsEnabled: Bool = false {
        didSet {
            if oldValue != dnsConfigIsEnabled {
                delegate?.dnsManagerStatusChanged()
            }
        }
    }

    // MARK: - Private properties

    private var dnsImplementationObserver: NotificationToken?
    private var dnsManagerStatusObserver: NotificationToken?
    private var appWillEnterForegroundObserver: NotificationToken?
    private var proStatusObserver: NotificationToken?

    private let networkSettingsService: NetworkSettingsServiceProtocol
    private let dnsProvidersManager: DnsProvidersManagerProtocol
    private let configuration: ConfigurationServiceProtocol
    private let resources: AESharedResourcesProtocol

    // MARK: - Init

    init(networkSettingsService: NetworkSettingsServiceProtocol,
         dnsProvidersManager: DnsProvidersManagerProtocol,
         configuration: ConfigurationServiceProtocol,
         resources: AESharedResourcesProtocol) {

        self.networkSettingsService = networkSettingsService
        self.dnsProvidersManager = dnsProvidersManager
        self.configuration = configuration
        self.resources = resources
        if #available(iOS 14.0, *) {
            addObservers()

            getDnsManagerStatus { [weak self] status in
                self?.dnsConfigIsEnabled = status.isInstalled && status.isEnabled
            }
        }
    }

    // MARK: - Internal methods

    @available(iOS 14.0, *)
    func saveDnsConfig(_ onErrorReceived: @escaping (_ error: Error?) -> Void) {
        guard let server = validateServerAndChangeActiveDnsProviderIfNeeded(dnsProvidersManager.activeDnsServer)
        else {
            onErrorReceived(NativeDnsSettingsManagerError.failedToChangeDnsServerToDefault)
            return
        }

        loadDnsManager { [weak self] dnsManager in
            guard let manager = dnsManager else {
                DDLogError("(NativeDnsSettingsManager) - saveDnsManager; Received nil DNS manager")
                onErrorReceived(NativeDnsSettingsManagerError.failedToLoadManager)
                return
            }

            self?.saveDnsConfigInternal(dnsManager: manager, server: server, onErrorReceived)
        }
    }

    @available(iOS 14.0, *)
    func removeDnsConfig(_ onErrorReceived: @escaping (_ error: Error?) -> Void) {
        loadDnsManager { [weak self] dnsManager in
            guard let dnsManager = dnsManager else {
                DDLogError("(NativeDnsSettingsManager) - removeDnsManager; Received nil DNS manager")
                onErrorReceived(NativeDnsSettingsManagerError.failedToLoadManager)
                return
            }

            dnsManager.removeFromPreferences(completionHandler: onErrorReceived)
            // Check manager status after delete
            self?.getDnsManagerStatus { [weak self] status in
                self?.dnsConfigIsEnabled = status.isInstalled && status.isEnabled
            }
        }
    }

    @available(iOS 14.0, *)
    func reset() {
        removeDnsConfig { error in
            if let error = error {
                DDLogError("(NativeDnsSettingsManager) - reset; Error when resetting settings; Error: \(error)")
            }
        }
    }

    // MARK: - Private methods

    @available(iOS 14.0, *)
    private func loadDnsManager(_ onManagerLoaded: @escaping (_ dnsManager: NEDNSSettingsManager?) -> Void) {
        let dnsManager = NEDNSSettingsManager.shared()
        dnsManager.loadFromPreferences { error in
            if let error = error {
                DDLogError("(NativeDnsSettingsManager) - loadDnsManager; Loading error: \(error)")
                onManagerLoaded(nil)
                return
            }
            onManagerLoaded(dnsManager)
        }
    }

    @available(iOS 14.0, *)
    private func getDnsManagerStatus(_ onStatusReceived: @escaping (_ status: ManagerStatus) -> Void) {
        loadDnsManager { dnsManager in
            guard let manager = dnsManager else {
                DDLogError("(NativeDnsSettingsManager) - getDnsManagerStatus; Received nil DNS manager")
                onStatusReceived(ManagerStatus())
                return
            }
            onStatusReceived(ManagerStatus(manager: manager))
        }
    }

    @available(iOS 14.0, *)
    private func setupDnsManager(dnsManager: NEDNSSettingsManager) {
        let onDemandRules = networkSettingsService.onDemandRules
        dnsManager.onDemandRules = onDemandRules
    }

    @available(iOS 14.0, *)
    private func saveDnsConfigInternal(dnsManager: NEDNSSettingsManager, server: DnsServerMetaProtocol, _ onErrorReceived: @escaping (_ error: Error?) -> Void) {
        setupDnsManager(dnsManager: dnsManager)
        let upstreams = server.upstreams.map { $0.upstream }
        let settings: NEDNSSettings
        switch server.type {
        case .dns: settings = NEDNSSettings(servers: upstreams)
        case .doh:
            guard upstreams.count == 1, let serverUrl = upstreams.first else {
                onErrorReceived(NativeDnsSettingsManagerError.invalidUpstreamsNumber)
                return
            }
            settings = getDOHSettings(serverUrl: serverUrl)
        case .dot:
            guard upstreams.count == 1, let serverUrl = upstreams.first else {
                onErrorReceived(NativeDnsSettingsManagerError.invalidUpstreamsNumber)
                return
            }
            settings = getDOTSettings(serverUrl: serverUrl)
        default:
            onErrorReceived(NativeDnsSettingsManagerError.unsupportedDnsProtocol)
            return
        }

        dnsManager.dnsSettings = settings
        dnsManager.localizedDescription = Bundle.main.applicationName
        dnsManager.saveToPreferences(completionHandler: onErrorReceived)
    }

    @available(iOS 14.0, *)
    private func getDOHSettings(serverUrl: String) -> NEDNSSettings {
        let dohSettings = NEDNSOverHTTPSSettings(servers: [])
        dohSettings.serverURL = URL(string: serverUrl)
        return dohSettings
    }

    @available(iOS 14.0, *)
    private func getDOTSettings(serverUrl: String) -> NEDNSSettings {
        var url = serverUrl
        let dotSettings = NEDNSOverTLSSettings(servers: [])
        if let range = url.range(of: "tls://") { url.removeSubrange(range) }
        dotSettings.serverName = url
        return dotSettings
    }

    // MARK: - Observers

    @available(iOS 14.0, *)
    private func addObservers() {
        dnsImplementationObserver = NotificationCenter.default.observe(name: .dnsImplementationChanged, object: nil, queue: .main) { [weak self] _ in
            if self?.resources.dnsImplementation == .native {
                self?.saveDnsConfig({ error in
                    if let error = error {
                        DDLogError("(NativeDnsSettingsManager) - dnsImplementationObserver; Saving dns manager error: \(error)")
                    }
                })
            } else {
                self?.removeDnsConfig({ error in
                    if let error = error {
                        DDLogError("(NativeDnsSettingsManager) - dnsImplementationObserver; Removing dns manager error: \(error)")
                    }
                })
            }
        }

        dnsManagerStatusObserver = NotificationCenter.default.observe(name: .NEDNSSettingsConfigurationDidChange, object: nil, queue: .main) { [weak self] notification in
            if let dnsManager = notification.object as? NEDNSSettingsManager {
                self?.dnsConfigIsEnabled = dnsManager.isEnabled
            }
        }

        appWillEnterForegroundObserver = NotificationCenter.default.observe(name: UIApplication.willEnterForegroundNotification, object: nil, queue: .main) { [weak self] notification in
            self?.getDnsManagerStatus( { [weak self] status in
                self?.dnsConfigIsEnabled = status.isInstalled && status.isEnabled
            })
        }

        proStatusObserver = NotificationCenter.default.observe(name: .proStatusChanged, object: nil, queue: .main) { [weak self] _ in
            guard let self = self else { return }
            if !self.configuration.proStatus {
                self.removeDnsConfig{ error in
                    if let error = error {
                        DDLogError("(NativeDnsSettingsManager) - proObservation; Removing dns manager error: \(error)")
                    }
                }
            } else if self.resources.dnsImplementation == .native && self.configuration.proStatus {
                self.saveDnsConfig { error in
                    if let error = error {
                        DDLogError("(NativeDnsSettingsManager) - proObservation; Saving dns manager error: \(error)")
                    }
                }
            }
        }
    }

    private func validateServerAndChangeActiveDnsProviderIfNeeded(_ activeServer: DnsServerMetaProtocol) -> DnsServerMetaProtocol? {
        DDLogDebug("(NativeDnsSettingsManager) - Let's validate active DNS server \(activeServer.upstreams)")

        // Native implementation not support upstream that contains `tcp://, udp://, h3://` protocols,
        // so let's validate upstream and if upstream contains this protocolos sets default DNS server for native implementation
        guard activeServer
            .upstreams
            .contains(where: { upstream in
                upstream.upstream.hasPrefix("tcp://") ||
                upstream.upstream.hasPrefix("udp://") ||
                upstream.upstream.hasPrefix("h3://")
            } )
        else {
            DDLogDebug("(NativeDnsSettingsManager) - Active DNS server is valid, let's use it")
            return activeServer
        }

        DDLogDebug("(NativeDnsSettingsManager) - Active DNS server is not valid, let's change server to default native DNS server")

        guard let adGuardDnsDOHServer = dnsProvidersManager
            .predefinedProviders
            .first(where: { $0.providerId == 10001 })? // 10001 - id of AdGuardDNS provider
            .servers
            .first(where: { $0.type == .doh })
        else {
            DDLogError("(NativeDnsSettingsManager) - Failed to find default native DNS server")
            return nil
        }

        do {
            try dnsProvidersManager.selectProvider(withId: adGuardDnsDOHServer.providerId, serverId: adGuardDnsDOHServer.id)
            DDLogDebug("(NativeDnsSettingsManager) - Successfully select default native DNS server as active server")
            return adGuardDnsDOHServer
        } catch {
            DDLogError("(NativeDnsSettingsManagerb) - Failed to select dns server=\(adGuardDnsDOHServer.id) as active dns server; error=\(error)")
            return nil
        }
    }
}
