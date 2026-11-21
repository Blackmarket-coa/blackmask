# Phone-Based Hidden-Device Detection — Open-Source Research

**Reviewed:** November 21, 2026  
**Status:** Source/documentation discovery and license screening. No imported code, compiled apps, device tests, detection-accuracy validation, or release approval.  
**Scope:** Phone-only tools, special phone hardware, phone-controlled companion receivers, and useful sensor/research components. This is a broad search, not a guarantee of every project on the internet.

## 1. Findings and important limits

The clearest reusable starting points are AirGuard (native Android/iOS), BLE Radar/MetaRadar, Network Survey, WiFiAnalyzer, and protocol/service discovery. LAPD and Lumos are useful research with significant hardware constraints.

A phone cannot guarantee a room is clear. A silent recorder, non-advertising Bluetooth device, local-storage camera, cellular-only device, or sensor beyond the phone's supported bands can escape a scan. A network service, manufacturer prefix, lens-like reflection, magnetic fluctuation, or ultrasound peak is a clue, not proof of covert recording or an identifiable person.

A phone magnetometer is not a broadband RF receiver. Ordinary RF spectrum work needs an appropriate SDR/receiver. RSSI is not exact distance or reliable direction. An IR inspection requires actual camera sensitivity and an emitting device; do not assume every front camera lacks an IR filter.

Primary limitations/evidence:

- [Apple TN3111](https://developer.apple.com/documentation/technotes/tn3111-ios-wifi-api-overview): iOS does not offer a general-purpose nearby Wi-Fi scanning API. Connected-network discovery is a different capability from listing surrounding access points or capturing their clients.
- [USENIX Security2023 evaluation](https://www.usenix.org/conference/usenixsecurity23/presentation/ceccio) and [paper](https://www.usenix.org/system/files/usenixsecurity23-ceccio.pdf): many advertised camera/spy-device detectors performed poorly; magnetometer and RF/optical approaches have important limits. Do not generalize one study to every newer tool or dismiss all optical methods.
- [LAPD source](https://github.com/frizensami/lapd): specific tested ToF-capable Samsung phones and calibration are required.
- [Lumos source](https://github.com/rahul-anand/Lumos) and [USENIX2022 paper](https://www.usenix.org/conference/usenixsecurity22/presentation/sharma-rahul): early iOS app uses a Raspberry Pi and monitor-mode USB Wi-Fi adapter.
- [RF Sentinel limitations](https://github.com/CIS-C0/RFSentinel#limitations): signature matches do not identify a person; phone radios, OS throttling, hidden clients, signal estimates, and cellular-only devices impose limits.

## 2. Candidate inventory

License labels below are a screening summary from repository metadata/readmes/license files, not a component-level redistribution determination. Dependency, data, model, asset, and store-distribution terms still require review.

| Project/source | Phone and hardware | Detection area | License screening | What it can offer and what remains unverified |
| --- | --- | --- | --- | --- |
| [AirGuard (Android)](https://github.com/seemoo-lab/AirGuard) | Android; phone alone | Bluetooth anti-tracking | Apache-2.0 | Known unwanted item trackers and repeated co-travel observations; verify supported tracker families and background behavior. First evaluation priority. |
| [AirGuard (iOS)](https://github.com/seemoo-lab/AirGuard-iOS) | iPhone; phone alone | Bluetooth anti-tracking | GPL-3.0 | Tracker detection and locate flow; separate native code, permissions, and iOS background constraints. First evaluation priority. |
| [BLE Radar / MetaRadar](https://github.com/BLE-Research-Group/MetaRadar) | Android; phone alone | BLE discovery | GPL-3.0 | Nearby advertising devices, filters, manufacturer/service metadata, RSSI and optional GATT inspection. RSSI is not precise distance. Strong scanner reference. |
| [Nearby Glasses](https://github.com/yjeanrenaud/yj_nearbyglasses) | Android and iOS; phone alone | Camera-capable wearables | AGPL-3.0 | BLE manufacturer/signature alerts for possible smart glasses. False positives include headsets; cannot determine recording. iOS port has foreground/Canary-mode limits. Evaluate both platforms. |
| [NoPeek](https://github.com/getnopeek/nopeek-android) | Android; phone alone | Camera-capable wearables | MIT | BLE smart-glasses/headset signatures. Early project; do not reuse zero-false-positive or before-recording claims. Experimental reference. |
| [RF Sentinel](https://github.com/CIS-C0/RFSentinel) | Android; phone alone plus optional receivers | Device signatures | GPL-3.0 | BLE/Wi-Fi signatures for some cameras, trackers, wearables and drones. Vendor matches are clues; cellular anomaly checks are heuristic. Ordinary Wi-Fi scanning sees access points, not every client. Evaluate receive-only components. |
| [MILLIE](https://github.com/IDEAGREY/MILLIE) | Android; phone alone; optional CYD hardware | Device signatures | MIT | Nearby Wi-Fi/BLE and camera-maker/tracker signatures. Not proof a camera is hidden or someone is recording. Candidate; test signatures. |
| [Network Survey](https://github.com/christianrowlands/android-network-survey) | Android; phone alone | Wireless inventory | Apache-2.0 | Cellular, Wi-Fi, Bluetooth and GNSS collection. Useful sensor/recording foundation; optional uploads/streams need explicit controls. Strong collection reference. |
| [WiFiAnalyzer](https://github.com/VREMSoftwareDevelopment/WiFiAnalyzer) | Android; phone alone | Wi-Fi access points | GPL-3.0 | Nearby access-point identity, channel and signal measurements. Does not enumerate all devices on unrelated networks or prove a camera. Strong AP scanner reference. |
| [WiGLE WiFi Wardriving](https://github.com/wiglenet/wigle-wifi-wardriving) | Android; phone alone | Wireless observations | BSD-3-Clause | Wi-Fi/Bluetooth observations and history. Public upload/mapping is not appropriate as Blackmask's default. Useful observation/UI reference. |
| [Port Authority](https://github.com/aaronjwood/PortAuthority) | Android; phone alone on reachable LAN | Network discovery | GPL-3.0 | Discover reachable hosts and open ports. Active network probing; isolated clients, other networks and non-networked cameras can be missed. Older source. Evaluate LAN discovery. |
| [Spectre](https://github.com/thomasbuilds/Spectre) | Android; phone alone | Wireless and LAN inventory | GPL-3.0 | BLE, AP, cellular and local-network service discovery. Its calculated RF summary is not broadband spectrum sensing; keep interaction/write/broadcast tools outside a basic sweep. Evaluate observation components. |
| [All Radio Tools](https://github.com/ToftMalone/All-Radio-Tools) | Android; some modes phone alone, SDR modes require hardware | Combined radio toolkit | GPL-3.0 | Wi-Fi/BLE, tracker/wearable tools and local discovery; true SDR modes use external radios. Do not promise every listed mode on every phone. Broad candidate; not audited. |
| [ZeroDroid](https://github.com/theabhishekchandra/ZeroDroid) | Android; phone alone for supported sensors | Combined toolkit | MIT | Wireless, network and sensor utilities including camera-detection heuristics. Assess actual implementation; advertised count of tools is not validation. Experimental candidate. |
| [BLE-Doubt](https://github.com/jeb482/bledoubt) | Android research app | Bluetooth anti-tracking research | MIT | Research algorithm for malicious/persistent BLE tracking. Older artifact; useful algorithm reference rather than a verified current app. Research reference. |
| [Skimmer Scanner](https://github.com/sparkfunX/Skimmer_Scanner) | Android; legacy app | Specific Bluetooth skimmers | Mixed/custom; SparkFun beerware terms | Narrow older skimmer family; not all card skimmers. Includes active connection/probing, so not a passive-only design. Legacy; review component licenses. |
| [LAPD](https://github.com/frizensami/lapd) | Specific Android ToF phones | Camera lens reflections | MIT | Research system uses time-of-flight returns; tested Samsung S20+/S20 Ultra/Note10+ family. Requires calibration; not a generic iPhone camera app. Strong optical research; hardware-limited. |
| [Argus](https://github.com/Abdullajon1881/argus) | Phone optical PWA plus Python companion | Optical and network camera clues | MIT | Phone camera optical sweep; Python handles LAN/airwaves/capture analysis. No general nearby-Wi-Fi scan in an iPhone browser. Network probes are active despite passive marketing. Experimental architecture reference. |
| [CovertSweep](https://github.com/whoisasheesh/CovertSweep) | Android prototype | Multisensor camera clues | Apache-2.0 | Optical, LAN, magnetic and audio heuristics. Composite score has no independently verified accuracy here; magnet/audio are not generic camera/microphone detectors. Research-only until validated. |
| [Hidden Camera Detector: AI](https://github.com/taiayman/hidden-camera-detector-ai) | Android Flutter app | Optical/network/sensor heuristics | MIT file; conflicting README intent | MIT file but README discourages redistribution; clarify mismatch before adoption. Includes OpenRouter cloud vision and Google ads; not a clean local-only reuse target. Hold for clarification/privacy review. |
| [Lumos](https://github.com/rahul-anand/Lumos) | iOS research app + Raspberry Pi + monitor-mode USB Wi-Fi | Wi-Fi IoT classification/localization | MIT | Identifies/localizes transmitting Wi-Fi IoT using a companion capture system; early iOS15 code, not phone-only. Research/hardware candidate. |
| [Rayhunter](https://github.com/EFForg/rayhunter) | Supported mobile hotspot; phone browser for UI | Cell-site simulator indicators | GPL-3.0 | Analyzes modem signaling on supported hotspot hardware. Not software that turns any phone into a reliable IMSI-catcher detector. Strong specialized project. |
| [SnoopSnitch](https://github.com/srlabs/snoopsnitch) | Compatible rooted Android/Qualcomm access | Cellular security | GPL-3.0-or-later | Analyzes mobile-radio signaling for threats such as fake base stations. Hardware/root restrictions and older build stack; not a generic hidden-camera scanner. Specialist/legacy reference. |
| [AIMSICD](https://github.com/CellularPrivacy/Android-IMSI-Catcher-Detector) | Android research project | Cellular anomalies | GPL-3.0 family | Heuristics intended to detect cell-site simulators; verify present release/device support. Anomalies alone do not confirm a fake tower. Research; no reliability promise. |
| [RFAnalyzer](https://github.com/demantz/RFAnalyzer) | Android + supported USB SDR | RF spectrum observation | GPL-2.0 family | Real spectrum display using HackRF/RTL-SDR/Airspy-family hardware. Frequency coverage follows the receiver; energy does not identify a microphone. External hardware candidate. |
| [Spectrum](https://github.com/hypermagik/Spectrum) | Android + RTL-SDR or bladeRF2 | RF spectrum observation | GPL-3.0 | SDR spectrum viewer with external receiver. Not phone-only; not an automatic hidden-device classifier. External hardware candidate. |
| [WhereDaFlock](https://github.com/xanstomper/WhereDaFlock) | iOS app + ESP32 companion for RF capture | Surveillance-device signatures | MIT | Receive-only 2.4GHz companion design for possible ALPR/camera signatures. Not generic full-spectrum detection; actual hardware validation required. Experimental hardware candidate. |
| [Kismet](https://github.com/kismetwireless/kismet) | Receiver on Pi/Linux/compatible Android setup; phone web UI | Wireless discovery | GPL-2.0 default; component exceptions | Wi-Fi/BLE and other sources with appropriate capture hardware. Broad survey backend, not a normal iPhone standalone scanner. Companion receiver candidate. |
| [rtl_433](https://github.com/merbanan/rtl_433) | SDR host or compatible Android integration + receiver | Supported ISM-band devices | GPL-2.0 family | Decodes supported sensors, meters and other radio devices. Not generic microphone/camera identification and not native phone-radio coverage. Supporting receiver component. |
| [phyphox](https://github.com/phyphox/phyphox-android) | Android and iOS (separate source repos) | Sensor instrumentation | GPL-3.0 | Physics/sensor measurements, including magnetic/audio instruments. Useful calibration/education; not a validated hidden-device detector. iOS source: https://github.com/phyphox/phyphox-ios . Supporting instrument. |
| [SoniControl](https://github.com/fhstp/SoniControl) | Android; phone microphone | Ultrasonic beacon detection | GPL-3.0 app plus SDK terms | Recognizes ultrasonic communication/tracking activity. Does not detect an ordinary silent microphone. Build references Superpowered SDK, whose license must be assessed separately. Research/legacy; dependency review. |

## 3. Source-visible or research leads that are not cleared OSS

| Lead | Screening result |
| --- | --- |
| [Signal Scout](https://github.com/ridpath/SignalScout) | Business Source License 1.1 restricts commercial use; source-available, not current unrestricted OSS. LICENSE states change date 2027-05-18 to Apache2.0. Development build, not production-ready. |
| [Wavelens](https://github.com/pmcbrien/wavelens) | README forbids redistribution of app/signature pack without permission; public source does not make it reusable OSS. Companion hardware code is explicitly not yet run on hardware in the reviewed README. |
| [ultrasniff](https://github.com/Mavic-Pro/ultrasniff) | Interesting ultrasonic-beacon source, but no clear top-level license was established in the reviewed metadata. Do not count as a cleared OSS dependency. |
| [SweepLED](https://pr.kaist.ac.kr/newsen/html/news/?GotoPage=1&mng_no=66431&mode=V&skey=keyword&sval=ION) | Authoritative research announcement describes an attachable LED case; a publicly licensed reusable code release was not verified. Research lead, not a confirmed OSS dependency. |

Additional provenance notes:

- AirGuard Android is Apache2.0; AirGuard iOS is GPL3.0. They are separate codebases.
- Nearby Glasses includes Android and iOS source; the iOS README reports foreground/Canary-mode constraints and likely false positives.
- NoPeek's README has stronger accuracy and recording claims than a manufacturer-signature scan establishes. Treat it as a narrow experimental implementation, not proof of recording.
- Hidden Camera Detector: AI has an MIT LICENSE but a README saying it is not intended for rebuilding/redistribution. It also uses OpenRouter and Google ads. Resolve licensing intent and privacy/dependency issues before reuse; never silently upload room images.
- SparkFun's older skimmer project has mixed/custom terms and active probing; it should not be presented as passive universal skimmer detection.
- SoniControl's app source is GPL but its documented build requires a separately licensed audio SDK.
- Kismet's default license has component exceptions. Review files/components rather than declaring universal compatibility with Blackmask.

## 4. Proposed Blackmask product shape

Keep one optional **Nearby devices** tool under Profile → Protection & privacy; do not add another main tab.

1. Nearby Bluetooth devices: locally processed advertisement metadata, known signature matches, and an honest unknown state.
2. Unwanted tracker review: known tracker families, repeated observations, optional co-travel evidence, and a supported locate/sound action.
3. Camera-capable wearable alerts: distinguish possible glasses/headsets from proof of recording; do not identify a person from a vendor signature.
4. My-network inspection: reachable LAN device/services with separate permission and authorization scope. Active probes must be disclosed.
5. Guided room inspection: optical reflection/IR assistance only where hardware supports it; no cleared-room guarantee.
6. Optional receiver connection: ESP32/Pi/hotspot/SDR sources after their own compatibility and trust-boundary review.
7. Selected encrypted evidence: a user-directed export into the vault after authentication; redact identifiers/location where appropriate.

Default to no public map uploads, no persistent ambient device log, no continuous location collection, no automatic co-travel history, no cloud image analysis, and no remote entity enrichment. Explicit opt-in and bounded local retention are needed for any feature that changes those defaults.

Observation-first: no automatic pairing, GATT writes, credential guessing, device exploitation, jamming, or packet injection as part of a consumer sweep. Use only network inspection the user is authorized to perform.

## 5. Capability labels and validation gates

Each mode must show supported sensors, OS permissions, sampling/background limits, and actual coverage. Suggested result labels:

- Detected broadcast/service, with timestamp and observed evidence.
- Possible device-family match, with the matching signature and uncertainty.
- Unknown device; no conclusion about threat.
- Unsupported/unavailable mode.
- No matching signal observed during this scan; not a proof of absence.

Do not create an overall safety probability by averaging unvalidated magnetic/audio/network clues. Any confidence model needs calibration against a representative controlled dataset, false positives/negatives, and actual target phones.

Before adoption:

- [ ] Identify exact upstream versions/components and preserve licenses/notices.
- [ ] Verify builds, permissions, background behavior, battery use, and supported Android/iOS versions.
- [ ] Test known devices and benign lookalikes under changing distance, obstruction, address randomization, and sleep states.
- [ ] Separate network APs, reachable LAN hosts, BLE advertisements, physical lens evidence, and companion-radio observations.
- [ ] Verify every claimed mode on actual phone hardware; do not assume iPhone LiDAR implements Android LAPD.
- [ ] Verify offline behavior and all network calls, optional uploads, maps, telemetry, ads, and model downloads.
- [ ] Minimize location/device identifiers, define retention, and test user-directed vault export.
- [ ] Keep essential anti-stalking/safety functions in the free core; optional report/workflow convenience can follow the existing one-time enhancement rule. Hosted storage remains the only recurring Blackmask charge.
- [ ] Recheck licenses, dependency terms, and current upstream maintenance before importing code.

Related plans: [app](app-plan.md), [problem–solution map](problem-solution-map.md), [user earning](user-earning-plan.md), and [monetization](monetization-plan.md).
