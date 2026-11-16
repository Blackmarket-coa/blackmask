import { mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject, defer, firstValueFrom } from "rxjs";

import { Account, AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { LogService } from "@bitwarden/logging";

import { FakeAccountService, FakeStateProvider, mockAccountServiceWith } from "../../../../spec";
import { UserId } from "../../../types/guid";

import { PhishingDetectionSettingsService } from "./phishing-detection-settings.service";

describe("PhishingDetectionSettingsService", () => {
  // Mock services
  let mockAccountService: MockProxy<AccountService>;
  let mockConfigService: MockProxy<ConfigService>;
  let mockPlatformService: MockProxy<PlatformUtilsService>;

  // RxJS Subjects we control in the tests
  let activeAccountSubject: BehaviorSubject<Account | null>;
  let featureFlagSubject: BehaviorSubject<boolean>;

  let service: PhishingDetectionSettingsService;
  let stateProvider: FakeStateProvider;

  const mockLogService = mock<LogService>();

  const mockUserId = "mock-user-id" as UserId;
  const account = mock<Account>({ id: mockUserId });
  const accountService: FakeAccountService = mockAccountServiceWith(mockUserId);

  const createService = () =>
    new PhishingDetectionSettingsService(
      mockAccountService,
      mockConfigService,
      mockLogService,
      mockPlatformService,
      stateProvider,
    );

  beforeEach(() => {
    // Initialize subjects
    activeAccountSubject = new BehaviorSubject<Account | null>(null);
    featureFlagSubject = new BehaviorSubject<boolean>(false);

    // Default implementations for required functions
    mockAccountService = mock<AccountService>();
    mockAccountService.activeAccount$ = activeAccountSubject.asObservable();

    mockConfigService = mock<ConfigService>();
    mockConfigService.getFeatureFlag$.mockReturnValue(featureFlagSubject.asObservable());

    mockPlatformService = mock<PlatformUtilsService>();
    mockPlatformService.isSafari.mockReturnValue(false);

    stateProvider = new FakeStateProvider(accountService);
    service = createService();
  });

  // Helper to easily get the result of the observable we are testing
  const getAccess = () => firstValueFrom(service.available$);

  describe("enabled$", () => {
    it("should default to true if an account is logged in", async () => {
      activeAccountSubject.next(account);
      const result = await firstValueFrom(service.enabled$);
      expect(result).toBe(true);
    });

    it("should return the stored value", async () => {
      activeAccountSubject.next(account);

      await service.setEnabled(mockUserId, false);
      const resultDisabled = await firstValueFrom(service.enabled$);
      expect(resultDisabled).toBe(false);

      await service.setEnabled(mockUserId, true);
      const resultEnabled = await firstValueFrom(service.enabled$);
      expect(resultEnabled).toBe(true);
    });
  });

  describe("setEnabled", () => {
    it("should update the stored value", async () => {
      activeAccountSubject.next(account);
      await service.setEnabled(mockUserId, false);
      let result = await firstValueFrom(service.enabled$);
      expect(result).toBe(false);

      await service.setEnabled(mockUserId, true);
      result = await firstValueFrom(service.enabled$);
      expect(result).toBe(true);
    });
  });

  describe("available$", () => {
    it("returns true for any active account when the feature flag is enabled, with no premium or organization required", async () => {
      activeAccountSubject.next(account);
      featureFlagSubject.next(true);

      await expect(getAccess()).resolves.toBe(true);
    });

    it("returns false when the feature flag is disabled", async () => {
      activeAccountSubject.next(account);
      featureFlagSubject.next(false);

      await expect(getAccess()).resolves.toBe(false);
    });

    it("returns false if there is no active account present yet", async () => {
      activeAccountSubject.next(null);
      featureFlagSubject.next(true);

      await expect(getAccess()).resolves.toBe(false);
    });

    it("returns false on Safari without reading the account or the feature flag", async () => {
      mockPlatformService.isSafari.mockReturnValue(true);
      mockConfigService.getFeatureFlag$.mockClear();
      service = createService();
      activeAccountSubject.next(account);
      featureFlagSubject.next(true);

      await expect(getAccess()).resolves.toBe(false);
      expect(mockConfigService.getFeatureFlag$).not.toHaveBeenCalled();
    });

    it("follows the active account as it changes", async () => {
      featureFlagSubject.next(true);
      const values: boolean[] = [];
      const subscription = service.available$.subscribe((value) => values.push(value));

      activeAccountSubject.next(account);
      activeAccountSubject.next(null);
      subscription.unsubscribe();

      expect(values).toEqual([false, true, false]);
    });

    it("shares one upstream subscription between concurrent subscribers", () => {
      let flagSubscriptions = 0;
      mockConfigService.getFeatureFlag$.mockReturnValue(
        defer(() => {
          flagSubscriptions++;
          return featureFlagSubject.asObservable();
        }),
      );
      service = createService();
      activeAccountSubject.next(account);
      featureFlagSubject.next(true);

      const first = service.available$.subscribe();
      const second = service.available$.subscribe();

      expect(flagSubscriptions).toBe(1);
      first.unsubscribe();
      second.unsubscribe();
    });
  });
});
