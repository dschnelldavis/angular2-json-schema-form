import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'none-widget',
  template: ``,
})
export class NoneComponent {
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];
  @Input() debug: boolean;
}
