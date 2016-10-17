import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'submit-widget',
  template: `
    <div [formGroup]="formGroup"
      class="form-group schema-form-submit {{layoutNode?.htmlClass}}">
      <input *ngIf="!!layoutNode?.key"
        [formControlName]="layoutNode?.name"
        [type]="layoutNode?.type"
        class="btn {{ layoutNode?.style || 'btn-primary' }} {{layoutNode?.fieldHtmlClass}}"
        [value]="layoutNode?.title"
        [disabled]="layoutNode?.readonly">
      <input *ngIf="!layoutNode?.key"
        [type]="layoutNode?.type"
        class="btn {{ layoutNode?.style || 'btn-primary' }} {{layoutNode?.fieldHtmlClass}}"
        [value]="layoutNode?.title"
        [disabled]="layoutNode?.readonly">
    </div>
`,
})
export class SubmitComponent {
  @Input() formGroup: FormGroup; // parent FormGroup
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options
}
