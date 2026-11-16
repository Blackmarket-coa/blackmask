import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { mock } from "jest-mock-extended";

import { IntroCarouselService } from "@bitwarden/browser/vault/popup/services/intro-carousel.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { WelcomeComponent } from "./welcome.component";

describe("WelcomeComponent", () => {
  let fixture: ComponentFixture<WelcomeComponent>;
  let component: WelcomeComponent;
  let navigateSpy: jest.SpyInstance;
  let carouselDismissedSpy: jest.SpyInstance;

  beforeEach(async () => {
    const router = mock<Router>();
    const introCarouselService = mock<IntroCarouselService>();
    const i18nService = mock<I18nService>();
    i18nService.t.mockImplementation((key: string) => key);

    await TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: IntroCarouselService, useValue: introCarouselService },
        { provide: I18nService, useValue: i18nService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
    navigateSpy = jest.spyOn(router, "navigate").mockResolvedValue(true);
    carouselDismissedSpy = jest
      .spyOn(introCarouselService, "setIntroCarouselDismissed")
      .mockResolvedValue();
    fixture.detectChanges();
  });

  it("states what Black Mask does, what it only measures and what it cannot do", () => {
    const headings = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("h2"),
      (h) => h.textContent?.trim(),
    );

    expect(headings).toEqual([
      "blackMaskWelcomeDoesHeading",
      "blackMaskWelcomeMeasuresHeading",
      "blackMaskWelcomeCannotHeading",
    ]);
  });

  it("dismisses the intro carousel and navigates to signup", async () => {
    await component["navigateToSignup"]();

    expect(carouselDismissedSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(["/signup"]);
  });

  it("dismisses the intro carousel and navigates to login", async () => {
    await component["navigateToLogin"]();

    expect(carouselDismissedSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(["/login"]);
  });
});
