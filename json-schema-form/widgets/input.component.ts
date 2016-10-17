import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'input-widget',
  template: `
    <div [formGroup]="formGroup">
      <input
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.name"
        [class]="layoutNode?.fieldHtmlClass"
        [type]="layoutNode?.type === 'integer' ? 'number' : layoutNode?.type"
        [name]="layoutNode?.name"
        [attr.min]="layoutNode?.min"
        [attr.max]="layoutNode?.max"
        [attr.step]="step"
        [attr.minlength]="layoutNode?.minLength || layoutNode?.minlength"
        [attr.maxlength]="layoutNode?.maxLength || layoutNode?.maxlength"
        [attr.pattern]="layoutNode?.pattern"
        [attr.placeholder]="layoutNode?.placeholder"
        [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
        [attr.value]="layoutNode?.value">
    </div>`,
})
export class InputComponent {
  @Input() formGroup: FormGroup; // parent FormGroup
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options
  get step() {
    if (this.layoutNode.multipleof) return this.layoutNode.multipleof;
    if (this.layoutNode.type === 'integer') return 1;
    if (this.layoutNode.type === 'number') return 'any';
    return null;
  }
}
