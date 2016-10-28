import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'tabarray-widget',
  template: ``,
})
export class TabarrayComponent {
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;
  @Input() index: number[];
  @Input() debug: boolean;
}
