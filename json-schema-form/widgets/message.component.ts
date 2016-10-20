import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'message-widget',
  template: `<span class="help-block"
    [innerHTML]="layoutNode?.helpvalue || layoutNode?.msg || layoutNode?.message">
    </span>`,
})
export class MessageComponent {
  @Input() formGroup: FormGroup; // Parent Angular 2 FormGroup object
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options
}
