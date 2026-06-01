import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { debounceTime, first, firstValueFrom, ReplaySubject, skip, Subject, takeUntil } from "rxjs";

import { Account, AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import {
  ButtonModule,
  CheckboxModule,
  ColorPasswordModule,
  CopyClickDirective,
  FormFieldModule,
} from "@bitwarden/components";
import {
  Algorithm,
  BuiltIn,
  CredentialGeneratorService,
  GenerateRequest,
  PasswordGenerationOptions,
  Profile,
} from "@bitwarden/generator-core";
import { I18nPipe } from "@bitwarden/ui-common";

/** Debounce applied to settings writes; also matches the PM settings component's waitMs default. */
const SETTINGS_WAIT_MS = 100;

@Component({
  selector: "sm-secret-generator",
  templateUrl: "./secret-generator.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    FormFieldModule,
    CheckboxModule,
    ColorPasswordModule,
    CopyClickDirective,
    I18nPipe,
  ],
})
export class SecretGeneratorComponent implements OnInit, OnDestroy {
  readonly valueGenerated = output<string>();

  protected readonly settingsForm = this.formBuilder.group({
    length: [14],
    uppercase: [true],
    lowercase: [true],
    number: [true],
    special: [false],
    avoidAmbiguous: [false],
  });

  protected readonly lengthMin = signal(5);
  protected readonly lengthMax = signal(128);
  protected readonly isOpen = signal(false);
  protected readonly preview = signal("");
  /** False until an active account is bound and the settings store is wired; gates the toggle so
   *  generation can't be triggered against an unseeded account$ (which would hang indefinitely). */
  protected readonly ready = signal(false);

  private readonly account$ = new ReplaySubject<Account>(1);
  private readonly destroyed$ = new Subject<void>();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly generatorService: CredentialGeneratorService,
    private readonly accountService: AccountService,
    private readonly logService: LogService,
  ) {}

  protected get canGenerate(): boolean {
    const { uppercase, lowercase, number, special } = this.settingsForm.value;
    return !!(uppercase || lowercase || number || special);
  }

  async ngOnInit() {
    const account = await firstValueFrom(this.accountService.activeAccount$);
    // No active account (e.g. lock/account-switch transition); leave the generator inert.
    if (account == null) {
      this.logService.error("Secret generator: no active account; generator disabled.");
      return;
    }
    this.account$.next(account);

    const settings = this.generatorService.settings(
      BuiltIn.password,
      { account$: this.account$ },
      Profile.secretsManager,
    );

    let latestSettings: PasswordGenerationOptions = {};

    // Policy can re-emit after the initial seed, so take(1) would miss updates; emitEvent:false avoids re-triggering valueChanges.
    settings.withConstraints$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ state, constraints }) => {
        latestSettings = { ...state };
        this.lengthMin.set(constraints.length?.min ?? 5);
        this.lengthMax.set(constraints.length?.max ?? 128);
        this.settingsForm.patchValue(
          {
            length: state.length ?? 14,
            uppercase: !!state.uppercase,
            lowercase: !!state.lowercase,
            number: !!state.number,
            special: !!state.special,
            avoidAmbiguous: !state.ambiguous, // ambiguous = "allow ambiguous chars", so avoidAmbiguous is its inverse
          },
          { emitEvent: false },
        );
      });

    // range input yields a string; coerce to number. Zeroing minX when unchecked prevents constraint calibration from forcing the type back on.
    this.settingsForm.valueChanges
      .pipe(debounceTime(SETTINGS_WAIT_MS), takeUntil(this.destroyed$))
      .subscribe((value) => {
        const upper = value.uppercase ?? false;
        const lower = value.lowercase ?? false;
        const number = value.number ?? false;
        const special = value.special ?? false;
        latestSettings = {
          ...latestSettings,
          length: value.length != null ? Number(value.length) : latestSettings.length,
          ambiguous: !value.avoidAmbiguous,
          uppercase: upper,
          minUppercase: upper ? latestSettings.minUppercase || 1 : 0,
          lowercase: lower,
          minLowercase: lower ? latestSettings.minLowercase || 1 : 0,
          number: number,
          minNumber: number ? latestSettings.minNumber || 1 : 0,
          special: special,
          minSpecial: special ? latestSettings.minSpecial || 1 : 0,
        };
        settings.next(latestSettings);
      });

    // skip(1) bypasses the initial seed; regenerate only when settings change after open.
    settings.withConstraints$
      .pipe(skip(1), debounceTime(SETTINGS_WAIT_MS), takeUntil(this.destroyed$))
      .subscribe(() => {
        if (this.isOpen() && this.canGenerate) {
          this.generate().catch((e: unknown) => this.logService.error(e));
        }
      });

    this.ready.set(true);
  }

  protected toggle() {
    if (!this.ready()) {
      return;
    }
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.generate().catch((e: unknown) => this.logService.error(e));
    }
  }

  // Fresh Subject per call avoids the memoized cache; must complete() after generate$ emits or settings$ races and throws EmptyError.
  protected async generate() {
    const request$ = new Subject<GenerateRequest>();
    const promise = firstValueFrom(
      this.generatorService
        .generate$({ on$: request$, account$: this.account$ })
        .pipe(first(), takeUntil(this.destroyed$)),
    );
    request$.next({
      algorithm: Algorithm.password,
      profile: Profile.secretsManager,
      source: "sm secret generator",
    });
    try {
      const generated = await promise;
      this.preview.set(generated.credential);
    } finally {
      request$.complete();
    }
  }

  protected useValue() {
    this.valueGenerated.emit(this.preview());
    this.isOpen.set(false);
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
