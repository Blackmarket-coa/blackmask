import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Data, NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter, of, switchMap } from "rxjs";

import { BitSvg } from "@bitwarden/assets/svg";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { Translation } from "../dialog";
import {
  ContentTopPaddingType,
  HeroTextAlignmentType,
  LandingContentMaxWidthType,
} from "../landing-layout";

import { AnonLayoutWrapperDataService } from "./anon-layout-wrapper-data.service";
import { AnonLayoutComponent } from "./anon-layout.component";
export interface AnonLayoutWrapperData {
  /**
   * The optional title of the page.
   * If a string is provided, it will be presented as is (ex: Organization name)
   * If a Translation object (supports placeholders) is provided, it will be translated
   */
  pageTitle?: string | Translation | null;
  /**
   * The optional subtitle of the page.
   * If a string is provided, it will be presented as is (ex: user's email)
   * If a Translation object (supports placeholders) is provided, it will be translated
   */
  pageSubtitle?: string | Translation | null;
  /**
   * The icon to display on the page. Pass null to hide the icon.
   *
   * Optional. The layout itself decides whether to render the icon based on `hidePageIcon`;
   * this field just supplies which icon to render when it is shown.
   */
  pageIcon?: BitSvg | null;
  /**
   * Whether to hide the page icon. Defaults to false (icon is shown).
   *
   * When true, the layout suppresses the icon even if `pageIcon` is set.
   */
  hidePageIcon?: boolean;
  /**
   * Top-padding of the content area. Defaults to "default".
   *
   * "compact" reduces the top padding so more content fits. Use in scenarios where vertical space is at a premium.
   */
  contentTopPadding?: ContentTopPaddingType;
  /**
   * Horizontal alignment of the hero's title and subtitle. Defaults to "center".
   * (The icon is always centered. Pair with `hidePageIcon: true` for a fully
   * left-aligned hero block.)
   */
  heroTextAlignment?: HeroTextAlignmentType;
  /**
   * Optional flag to either show the optional environment selector (false) or just a readonly hostname (true).
   */
  showReadonlyHostname?: boolean;
  /**
   * Optional flag to set the max-width of the page. Defaults to 'md' if not provided.
   */
  maxWidth?: LandingContentMaxWidthType;
  /**
   * Hide the card that wraps the default content. Defaults to false.
   */
  hideCardWrapper?: boolean;
  /**
   * Hides the background illustration. Defaults to false.
   */
  hideBackgroundIllustration?: boolean;
}

// FIXME(https://bitwarden.atlassian.net/browse/CL-764): Migrate to OnPush
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  templateUrl: "anon-layout-wrapper.component.html",
  imports: [AnonLayoutComponent, RouterModule],
})
export class AnonLayoutWrapperComponent implements OnInit {
  protected pageTitle?: string | null;
  protected pageSubtitle?: string | null;
  protected pageIcon: BitSvg | null = null;

  protected showReadonlyHostname?: boolean;
  protected maxWidth?: LandingContentMaxWidthType;
  protected hideCardWrapper?: boolean;
  protected hideBackgroundIllustration?: boolean;
  protected hidePageIcon?: boolean;
  protected contentTopPadding?: ContentTopPaddingType;
  protected heroTextAlignment?: HeroTextAlignmentType;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private i18nService: I18nService,
    private anonLayoutWrapperDataService: AnonLayoutWrapperDataService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Set the initial page data on load
    this.setAnonLayoutWrapperDataFromRouteData(this.route.snapshot.firstChild?.data);
    // Listen for page changes and update the page data appropriately
    this.listenForPageDataChanges();
    this.listenForServiceDataChanges();
  }

  private listenForPageDataChanges() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        switchMap(() => this.route.firstChild?.data || of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((firstChildRouteData: Data | null) => {
        this.setAnonLayoutWrapperDataFromRouteData(firstChildRouteData);
      });
  }

  private setAnonLayoutWrapperDataFromRouteData(firstChildRouteData?: Data | null) {
    if (!firstChildRouteData) {
      return;
    }

    const routeData = firstChildRouteData as Partial<AnonLayoutWrapperData>;

    // When undefined on `routeData`, default to `null`
    this.pageTitle = this.handleStringOrTranslation(routeData.pageTitle);
    this.pageSubtitle = this.handleStringOrTranslation(routeData.pageSubtitle);
    this.pageIcon = routeData.pageIcon ?? null;

    // When undefined on `routeData`, default to `false` via Boolean conversion
    this.hidePageIcon = Boolean(routeData.hidePageIcon);
    this.hideCardWrapper = Boolean(routeData.hideCardWrapper);
    this.hideBackgroundIllustration = Boolean(routeData.hideBackgroundIllustration);
    this.showReadonlyHostname = Boolean(routeData.showReadonlyHostname);

    // When undefined on `routeData`, default to a specified value
    this.maxWidth = routeData.maxWidth; // default is defined in AnonLayoutComponent
    this.contentTopPadding = routeData.contentTopPadding ?? "default";
    this.heroTextAlignment = routeData.heroTextAlignment ?? "center";

    // Cache the routeData payload so resetToCachedRouteData() can later restore it.
    this.anonLayoutWrapperDataService.cacheRouteData(routeData);
  }

  private listenForServiceDataChanges() {
    this.anonLayoutWrapperDataService
      .anonLayoutWrapperData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: Partial<AnonLayoutWrapperData>) => {
        this.setAnonLayoutWrapperDataFromService(data);
      });
  }

  /**
   * Applies a service-driven partial update to the wrapper. Components push updates
   * through `AnonLayoutWrapperDataService.setAnonLayoutWrapperData()` to temporarily
   * override route-level layout.
   *
   * `Partial<>` semantics allows the AnonLayoutWrapperService to pass in ONLY the properties it
   * wishes to change, while leaving the rest unchanged.
   * - omitted (undefined) keys on incoming `data` leave the existing component state unchanged
   * - present keys on incoming `data` update the component state.
   */
  private setAnonLayoutWrapperDataFromService(data: Partial<AnonLayoutWrapperData>) {
    if (!data) {
      return;
    }

    // For `pageTitle`, `pageSubtitle`, and `pageIcon`, an explicit `null` on the incoming `data`
    // clears the field (as opposed to `undefined` which leaves the component state unchanged).
    if (data.pageTitle !== undefined) {
      this.pageTitle = this.handleStringOrTranslation(data.pageTitle);
    }
    if (data.pageSubtitle !== undefined) {
      this.pageSubtitle = this.handleStringOrTranslation(data.pageSubtitle);
    }
    if (data.pageIcon !== undefined) {
      this.pageIcon = data.pageIcon;
    }

    if (data.showReadonlyHostname !== undefined) {
      this.showReadonlyHostname = data.showReadonlyHostname;
    }
    if (data.hideCardWrapper !== undefined) {
      this.hideCardWrapper = data.hideCardWrapper;
    }
    if (data.hideBackgroundIllustration !== undefined) {
      this.hideBackgroundIllustration = data.hideBackgroundIllustration;
    }
    if (data.maxWidth !== undefined) {
      this.maxWidth = data.maxWidth;
    }
    if (data.hidePageIcon !== undefined) {
      this.hidePageIcon = data.hidePageIcon;
    }
    if (data.contentTopPadding !== undefined) {
      this.contentTopPadding = data.contentTopPadding;
    }
    if (data.heroTextAlignment !== undefined) {
      this.heroTextAlignment = data.heroTextAlignment;
    }

    // Manually fire change detection to avoid ExpressionChangedAfterItHasBeenCheckedError
    // when setting the page data from a service
    this.changeDetectorRef.detectChanges();
  }

  private handleStringOrTranslation(value: string | Translation | null | undefined): string | null {
    if (value == null) {
      return null;
    }

    if (typeof value === "string") {
      // If it's a string, return it as is
      return value;
    }

    // If it's a Translation object, translate it
    return this.i18nService.t(value.key, ...(value.placeholders ?? []));
  }
}
