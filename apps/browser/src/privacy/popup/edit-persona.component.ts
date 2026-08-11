import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import {
  ButtonModule,
  CalloutModule,
  CardComponent,
  FormFieldModule,
  InputModule,
  Option,
  SelectModule,
  ToastService,
} from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";

import { PersonaLayer, PersonaService } from "./services/persona.service";

/**
 * Black Mask "Edit persona" form. Personas used to open the generic `/view-cipher` screen, which
 * shows an Identity cipher rather than the persona concepts (layer, alias), and offers no way to
 * move a persona between identity-firewall layers. Gated behind the `black-mask-persona-vault`
 * feature flag at the route level.
 */
@Component({
  templateUrl: "./edit-persona.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JslibModule,
    ReactiveFormsModule,
    PopupPageComponent,
    PopupHeaderComponent,
    PopOutComponent,
    CalloutModule,
    CardComponent,
    FormFieldModule,
    InputModule,
    SelectModule,
    ButtonModule,
  ],
})
export class EditPersonaComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly personaService = inject(PersonaService);
  private readonly toastService = inject(ToastService);
  private readonly i18nService = inject(I18nService);
  private readonly logService = inject(LogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly personaId = signal<string | undefined>(undefined);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly generatingAlias = signal(false);
  protected readonly notFound = signal(false);
  /** True for a persona shared read-only from an organization; the form is disabled for those. */
  protected readonly readOnly = signal(false);

  protected readonly form = this.formBuilder.group({
    layer: this.formBuilder.control<PersonaLayer>(PersonaLayer.Anonymous, {
      nonNullable: true,
      validators: Validators.required,
    }),
    name: this.formBuilder.control("", { nonNullable: true, validators: Validators.required }),
    email: this.formBuilder.control("", { nonNullable: true }),
    notes: this.formBuilder.control("", { nonNullable: true }),
  });

  protected readonly layerOptions: Option<PersonaLayer>[] = [
    { value: PersonaLayer.Real, label: this.i18nService.t("blackMaskLayerReal") },
    { value: PersonaLayer.Business, label: this.i18nService.t("blackMaskLayerBusiness") },
    { value: PersonaLayer.Creator, label: this.i18nService.t("blackMaskLayerCreator") },
    { value: PersonaLayer.Anonymous, label: this.i18nService.t("blackMaskLayerAnonymous") },
  ];

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const cipherId = this.route.snapshot.queryParamMap.get("cipherId") ?? undefined;
    try {
      const persona = cipherId ? await this.personaService.getPersona(cipherId) : undefined;
      if (persona == null) {
        this.notFound.set(true);
        return;
      }

      this.personaId.set(persona.id);
      this.form.setValue({
        layer: persona.layer,
        name: persona.name,
        email: persona.email ?? "",
        notes: persona.notes ?? "",
      });

      if (!persona.editable) {
        this.readOnly.set(true);
        this.form.disable();
      }
    } catch (e) {
      this.logService.error(e);
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected async generateAlias(): Promise<void> {
    this.generatingAlias.set(true);
    try {
      const alias = await this.personaService.generateAlias();
      this.form.controls.email.setValue(alias);
      this.form.controls.email.markAsDirty();
      this.toastService.showToast({
        variant: "success",
        title: "",
        message: this.i18nService.t("blackMaskAliasGenerated"),
      });
    } catch (e) {
      this.logService.error(e);
      this.toastService.showToast({
        variant: "error",
        title: "",
        message: this.i18nService.t("blackMaskAliasError"),
      });
    } finally {
      this.generatingAlias.set(false);
    }
  }

  protected async submit(): Promise<void> {
    const id = this.personaId();
    if (id == null || this.readOnly()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      const value = this.form.getRawValue();
      await this.personaService.updatePersona({
        id,
        name: value.name,
        layer: value.layer,
        email: value.email || undefined,
        notes: value.notes || undefined,
      });
      this.toastService.showToast({
        variant: "success",
        title: "",
        message: this.i18nService.t("blackMaskPersonaUpdated"),
      });
      await this.router.navigate(["/personas"]);
    } catch (e) {
      this.logService.error(e);
      this.toastService.showToast({
        variant: "error",
        title: "",
        message: this.i18nService.t("errorOccurred"),
      });
    } finally {
      this.saving.set(false);
    }
  }
}
