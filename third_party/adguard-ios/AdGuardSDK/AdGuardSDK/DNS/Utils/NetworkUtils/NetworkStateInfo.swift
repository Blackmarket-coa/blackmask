import Network

public class NetworkStateInfo : CustomStringConvertible {

    public let internetState: InternetState
    public let interface: NWInterface?


    public init(_ internetState: InternetState, _ interface: NWInterface?) {
        self.internetState = internetState
        self.interface = interface
    }

    public init() {
        self.internetState = .unavailable
        self.interface = nil
    }



    public var description: String {
        "Internet state: \(internetState); interface: \(interface?.name ?? "null")"
    }
}
