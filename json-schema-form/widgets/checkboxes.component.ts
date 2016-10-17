import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'checkboxes-widget',
  template: ``,
})
export class CheckboxesComponent {
  @Input() formGroup: FormGroup; // Parent Angular 2 FormGroup object
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options
}
