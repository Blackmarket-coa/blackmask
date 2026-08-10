// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Router } from "@angular/router";
import { mock, MockProxy } from "jest-mock-extended";
import { firstValueFrom } from "rxjs";

import { Region, Urls } from "@bitwarden/common/platform/abstractions/environment.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { PRODUCTION_REGIONS } from "@bitwarden/common/platform/services/default-environment.service";
import {
  FakeAccountService,
  FakeStateProvider,
  mockAccountServiceWith,
} from "@bitwarden/common/spec";
import { UserId } from "@bitwarden/common/types/guid";

import {
  WebCloudEnvironment,
  WebEnvironmentService,
  WebRegionConfig,
} from "./web-environment.service";

describe("WebEnvironmentService", () => {
  let service: WebEnvironmentService;

  let window: MockProxy<Window>;

  let stateProvider: FakeStateProvider;
  let accountService: FakeAccountService;
  let router: MockProxy<Router>;

  const mockUserId = Utils.newGuid() as UserId;

  describe("Production Environment", () => {
    describe("Black Mask Region", () => {
      // Black Mask runs on Vaultwarden, which serves every service from a single origin under
      // path prefixes rather than per-service subdomains. The region config therefore carries
      // only `base` and `webVault`, and the remaining URLs are derived from `base`.
      const PROD_US_REGION = PRODUCTION_REGIONS.find((r) => r.key === Region.US);

      const mockProdUSBaseUrl = PROD_US_REGION.urls.webVault;

      // The production web build ships no `urls` overrides, so the service fills `base` in from
      // window.location.origin.
      const mockInitialProdUSUrls = {} as Urls;

      const expectedProdUSUrls: Urls = {
        base: mockProdUSBaseUrl,
        send: undefined,
      };

      const expectedModifiedScimUrl = mockProdUSBaseUrl + "/scim/v2";
      const expectedSendUrl = mockProdUSBaseUrl + "/#/send/";

      const prodUSEnv = new WebCloudEnvironment(PROD_US_REGION, expectedProdUSUrls);

      beforeEach(() => {
        window = mock<Window>();

        window.location = {
          origin: mockProdUSBaseUrl,
          href: mockProdUSBaseUrl + "/#/example",
        } as Location;

        accountService = mockAccountServiceWith(mockUserId);
        stateProvider = new FakeStateProvider(accountService);
        router = mock<Router>();

        (router as any).url = "";

        service = new WebEnvironmentService(
          window,
          stateProvider,
          accountService,
          [], // no additional region configs required for prod envs
          router,
          // the service mutates the urls it is handed, so give each test its own copy
          { ...mockInitialProdUSUrls },
        );
      });

      it("initializes the environment with the Black Mask production urls", async () => {
        const env = await firstValueFrom(service.environment$);

        expect(env).toEqual(prodUSEnv);

        expect(env.getRegion()).toEqual(Region.US);
        expect(env.getUrls()).toEqual(expectedProdUSUrls);
        expect(env.isCloud()).toBeTruthy();

        // Vaultwarden serves each service from a path on the single base origin.
        expect(env.getApiUrl()).toEqual(mockProdUSBaseUrl + "/api");
        expect(env.getIdentityUrl()).toEqual(mockProdUSBaseUrl + "/identity");
        expect(env.getIconsUrl()).toEqual(mockProdUSBaseUrl + "/icons");
        expect(env.getWebVaultUrl()).toEqual(mockProdUSBaseUrl);
        expect(env.getNotificationsUrl()).toEqual(mockProdUSBaseUrl + "/notifications");
        expect(env.getEventsUrl()).toEqual(mockProdUSBaseUrl + "/events");

        expect(env.getScimUrl()).toEqual(expectedModifiedScimUrl);
        expect(env.getSendUrl()).toEqual(expectedSendUrl);

        expect(env.getHostname()).toEqual(PROD_US_REGION.domain);
      });

      describe("setEnvironment", () => {
        it("throws an error when trying to set the environment to self-hosted", async () => {
          await expect(service.setEnvironment(Region.SelfHosted)).rejects.toThrow(
            "setEnvironment does not work in web for self-hosted.",
          );
        });

        it("only returns the current env's urls when trying to set the environment to the current region", async () => {
          const urls = await service.setEnvironment(Region.US);
          expect(urls).toEqual(expectedProdUSUrls);
        });

        it("errors if the selected region is unknown", async () => {
          await expect(service.setEnvironment("unknown" as Region)).rejects.toThrow(
            "The selected region is not known as an available region.",
          );
        });

        // Cross-region navigation is covered by the QA Environment suite below: Black Mask ships
        // a single production region, so there is no second production region to navigate to.
      });

      it("envUrls.send takes precedence over config.urls.send when both are set", async () => {
        const customSendUrl = "https://custom-send.example.com";
        const env = new WebCloudEnvironment(PROD_US_REGION, {
          ...expectedProdUSUrls,
          send: customSendUrl,
        });
        expect(env.getSendUrl()).toEqual(customSendUrl + "/#/");
      });
    });
  });

  describe("QA Environment", () => {
    const QA_US_REGION_KEY = "USQA";
    const QA_US_WEB_REGION_CONFIG = {
      key: QA_US_REGION_KEY,
      domain: "qa.bitwarden.pw",
      urls: {
        webVault: "https://vault.qa.bitwarden.pw",
      },
    } as WebRegionConfig;

    const QA_EU_REGION_KEY = "EUQA";
    const QA_EU_WEB_REGION_CONFIG = {
      key: QA_EU_REGION_KEY,
      domain: "euqa.bitwarden.pw",
      urls: {
        webVault: "https://vault.euqa.bitwarden.pw",
      },
    } as WebRegionConfig;

    const additionalRegionConfigs: WebRegionConfig[] = [
      QA_US_WEB_REGION_CONFIG,
      QA_EU_WEB_REGION_CONFIG,
    ];

    describe("US Region", () => {
      const initial_QA_US_Urls = {
        icons: "https://icons.qa.bitwarden.pw",
        notifications: "https://notifications.qa.bitwarden.pw",
        scim: "https://scim.qa.bitwarden.pw",
      } as Urls;

      const mock_QA_US_BaseUrl = "https://vault.qa.bitwarden.pw";

      const expected_QA_US_Urls: Urls = {
        ...initial_QA_US_Urls,
        base: mock_QA_US_BaseUrl,
      };

      const expectedModifiedScimUrl = expected_QA_US_Urls.scim + "/v2";

      const expectedSendUrl = QA_US_WEB_REGION_CONFIG.urls.webVault + "/#/send/";

      const QA_US_Env = new WebCloudEnvironment(QA_US_WEB_REGION_CONFIG, expected_QA_US_Urls);

      beforeEach(() => {
        window = mock<Window>();
        window.location = {
          origin: mock_QA_US_BaseUrl,
          href: mock_QA_US_BaseUrl + "/#/example",
        } as Location;
        accountService = mockAccountServiceWith(mockUserId);
        stateProvider = new FakeStateProvider(accountService);
        router = mock<Router>();
        (router as any).url = "";
        service = new WebEnvironmentService(
          window,
          stateProvider,
          accountService,
          additionalRegionConfigs,
          router,
          initial_QA_US_Urls,
        );
      });

      it("initializes the environment to be the QA US environment", async () => {
        const env = await firstValueFrom(service.environment$);

        expect(env).toEqual(QA_US_Env);
        expect(env.getRegion()).toEqual(QA_US_REGION_KEY);
        expect(env.getUrls()).toEqual(expected_QA_US_Urls);
        expect(env.isCloud()).toBeTruthy();

        expect(env.getApiUrl()).toEqual(expected_QA_US_Urls.base + "/api");
        expect(env.getIdentityUrl()).toEqual(expected_QA_US_Urls.base + "/identity");
        expect(env.getIconsUrl()).toEqual(expected_QA_US_Urls.icons);

        expect(env.getWebVaultUrl()).toEqual(QA_US_WEB_REGION_CONFIG.urls.webVault);

        expect(env.getNotificationsUrl()).toEqual(expected_QA_US_Urls.notifications);
        expect(env.getEventsUrl()).toEqual(expected_QA_US_Urls.base + "/events");

        expect(env.getScimUrl()).toEqual(expectedModifiedScimUrl);

        expect(env.getSendUrl()).toEqual(expectedSendUrl);

        expect(env.getHostname()).toEqual(QA_US_WEB_REGION_CONFIG.domain);
      });

      describe("setEnvironment", () => {
        it("throws an error when trying to set the environment to self-hosted", async () => {
          await expect(service.setEnvironment(Region.SelfHosted)).rejects.toThrow(
            "setEnvironment does not work in web for self-hosted.",
          );
        });

        it("only returns the current env's urls when trying to set the environment to the current region", async () => {
          const urls = await service.setEnvironment(QA_US_REGION_KEY);
          expect(urls).toEqual(expected_QA_US_Urls);
        });

        it("errors if the selected region is unknown", async () => {
          await expect(service.setEnvironment("unknown" as Region)).rejects.toThrow(
            "The selected region is not known as an available region.",
          );
        });

        it("sets the window location to a new region's web vault url and preserves any query params", async () => {
          const routeAndQueryParams = "/signup?example=1&another=2";
          (router as any).url = routeAndQueryParams;

          await service.setEnvironment(QA_EU_REGION_KEY);

          expect(window.location.href).toEqual(
            QA_EU_WEB_REGION_CONFIG.urls.webVault + "/#" + routeAndQueryParams,
          );
        });
      });
    });

    describe("EU Region", () => {
      const initial_QA_EU_Urls = {
        icons: "https://icons.euqa.bitwarden.pw",
        notifications: "https://notifications.euqa.bitwarden.pw",
        scim: "https://scim.euqa.bitwarden.pw",
      } as Urls;

      const mock_QA_EU_BaseUrl = "https://vault.euqa.bitwarden.pw";

      const expected_QA_EU_Urls: Urls = {
        ...initial_QA_EU_Urls,
        base: mock_QA_EU_BaseUrl,
      };

      const expectedModifiedScimUrl = expected_QA_EU_Urls.scim + "/v2";

      const expectedSendUrl = QA_EU_WEB_REGION_CONFIG.urls.webVault + "/#/send/";

      const QA_EU_Env = new WebCloudEnvironment(QA_EU_WEB_REGION_CONFIG, expected_QA_EU_Urls);

      beforeEach(() => {
        window = mock<Window>();
        window.location = {
          origin: mock_QA_EU_BaseUrl,
          href: mock_QA_EU_BaseUrl + "/#/example",
        } as Location;
        accountService = mockAccountServiceWith(mockUserId);
        stateProvider = new FakeStateProvider(accountService);
        router = mock<Router>();
        (router as any).url = "";
        service = new WebEnvironmentService(
          window,
          stateProvider,
          accountService,
          additionalRegionConfigs,
          router,
          initial_QA_EU_Urls,
        );
      });

      it("initializes the environment to be the QA US environment", async () => {
        const env = await firstValueFrom(service.environment$);

        expect(env).toEqual(QA_EU_Env);
        expect(env.getRegion()).toEqual(QA_EU_REGION_KEY);
        expect(env.getUrls()).toEqual(expected_QA_EU_Urls);
        expect(env.isCloud()).toBeTruthy();

        expect(env.getApiUrl()).toEqual(expected_QA_EU_Urls.base + "/api");
        expect(env.getIdentityUrl()).toEqual(expected_QA_EU_Urls.base + "/identity");
        expect(env.getIconsUrl()).toEqual(expected_QA_EU_Urls.icons);

        expect(env.getWebVaultUrl()).toEqual(QA_EU_WEB_REGION_CONFIG.urls.webVault);

        expect(env.getNotificationsUrl()).toEqual(expected_QA_EU_Urls.notifications);
        expect(env.getEventsUrl()).toEqual(expected_QA_EU_Urls.base + "/events");

        expect(env.getScimUrl()).toEqual(expectedModifiedScimUrl);

        expect(env.getSendUrl()).toEqual(expectedSendUrl);

        expect(env.getHostname()).toEqual(QA_EU_WEB_REGION_CONFIG.domain);
      });

      describe("setEnvironment", () => {
        it("throws an error when trying to set the environment to self-hosted", async () => {
          await expect(service.setEnvironment(Region.SelfHosted)).rejects.toThrow(
            "setEnvironment does not work in web for self-hosted.",
          );
        });

        it("only returns the current env's urls when trying to set the environment to the current region", async () => {
          const urls = await service.setEnvironment(QA_EU_REGION_KEY);
          expect(urls).toEqual(expected_QA_EU_Urls);
        });

        it("errors if the selected region is unknown", async () => {
          await expect(service.setEnvironment("unknown" as Region)).rejects.toThrow(
            "The selected region is not known as an available region.",
          );
        });

        it("sets the window location to a new region's web vault url and preserves any query params", async () => {
          const routeAndQueryParams = "/signup?example=1&another=2";
          (router as any).url = routeAndQueryParams;

          await service.setEnvironment(QA_US_REGION_KEY);

          expect(window.location.href).toEqual(
            QA_US_WEB_REGION_CONFIG.urls.webVault + "/#" + routeAndQueryParams,
          );
        });
      });
    });
  });
});
