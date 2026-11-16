import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router } from "@angular/router";

import { ButtonModule, TypographyModule } from "@bitwarden/components";
import { I18nPipe } from "@bitwarden/ui-common";

import { IntroCarouselService } from "../../vault/popup/services/intro-carousel.service";

/**
 * Black Mask welcome page, opened in a tab on first install in place of the inherited
 * bitwarden.com/browser-start/ page. It is bundled with the extension, needs no account and makes
 * no network requests. It says what Black Mask blocks, what it only measures and what it cannot
 * do, then hands off to account creation or login.
 */
@Component({
  selector: "app-welcome",
  templateUrl: "./welcome.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TypographyModule, I18nPipe],
})
export class WelcomeComponent {
  private readonly router = inject(Router);
  private readonly introCarouselService = inject(IntroCarouselService);

  // The welcome page covers what the intro carousel would, so leaving it dismisses the carousel
  // and /login does not redirect back to it.
  protected async navigateToSignup() {
    await this.introCarouselService.setIntroCarouselDismissed();
    await this.router.navigate(["/signup"]);
  }

  protected async navigateToLogin() {
    await this.introCarouselService.setIntroCarouselDismissed();
    await this.router.navigate(["/login"]);
  }
}
