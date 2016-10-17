import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'fieldset-widget',
  template: `
    <fieldset [disabled]="layoutNode.readonly" class="schema-form-fieldset {{layoutNode.htmlClass}}">
      <legend [class.sr-only]="!layoutNode.notitle">{{ layoutNode.title }}</legend>
      <div class="help-block" *ngIf="!!layoutNode.description">{{layoutNode.description}}</div>
    </fieldset>
  `,
})
export class FieldsetComponent {
  @Input() formGroup: FormGroup; // Parent Angular 2 FormGroup object
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options
}
