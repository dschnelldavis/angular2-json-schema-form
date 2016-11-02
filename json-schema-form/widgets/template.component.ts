import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'template-widget',
  template: ``,
})
export class TemplateComponent {
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;
}
