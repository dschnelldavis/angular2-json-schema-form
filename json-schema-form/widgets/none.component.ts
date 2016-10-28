import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'none-widget',
  template: ``,
})
export class NoneComponent {
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;
  @Input() index: number[];
  @Input() debug: boolean;
}
