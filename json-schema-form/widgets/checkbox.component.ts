import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'checkbox-widget',
  template: `
    <div [formGroup]="formGroup">
      <input
        [formControlName]="layoutNode?.name"
        type="checkbox"
        [class]="layoutNode?.fieldHtmlClass"
        [name]="layoutNode?.name"
        [readonly]="layoutNode?.readonly ? 'readonly' : false"
        [value]="layoutNode?.value || true"
        [checked]="!!layoutNode?.value">
    </div>`,
})
export class CheckboxComponent {
  @Input() formGroup: FormGroup; // parent FormGroup
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options
}
