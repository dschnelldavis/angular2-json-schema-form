import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'textarea-widget',
  template: `
    <div [formGroup]="formGroup">
    <textarea
      [formControlName]="layoutNode?.name"
      [id]="layoutNode?.name"
      [class]="layoutNode?.fieldHtmlClass"
      [name]="layoutNode?.name"
      [attr.minlength]="layoutNode?.minLength || layoutNode?.minlength"
      [attr.maxlength]="layoutNode?.maxLength || layoutNode?.maxlength"
      [attr.pattern]="layoutNode?.pattern"
      [attr.placeholder]="layoutNode?.placeholder"
      [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
      [attr.value]="layoutNode?.value"></textarea>
    </div>`,
})
export class TextareaComponent {
  @Input() formGroup: FormGroup; // Parent Angular 2 FormGroup object
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options
}
