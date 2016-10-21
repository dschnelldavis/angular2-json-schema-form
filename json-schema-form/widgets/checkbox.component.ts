import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

@Component({
  selector: 'checkbox-widget',
  template: `
    <div [formGroup]="formControlGroup">
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
export class CheckboxComponent implements OnInit {
  private formControlGroup: any;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    this.formControlGroup = JsonPointer.getFormControl(this.formGroup, this.layoutNode.pointer, true);
  }
}
