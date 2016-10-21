import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

@Component({
  selector: 'number-widget',
  template: `
    <div [formGroup]="formGroup">
      <input
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.name"
        [class]="layoutNode?.fieldHtmlClass"
        [type]="layoutNode?.type === 'range' ? 'range' : 'number'"
        [name]="layoutNode?.name"
        [attr.min]="layoutNode?.minimum"
        [attr.max]="layoutNode?.maximum"
        [attr.step]="step"
        [attr.placeholder]="layoutNode?.placeholder"
        [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
        [attr.required]="layoutNode?.required">
    </div>`,
})
export class NumberComponent implements OnInit {
  private formControlGroup: any;
  private step: number | string = 'any';
  @Input() formGroup: FormGroup; // parent FormGroup
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options

  ngOnInit() {
    this.formControlGroup = JsonPointer.getFormControl(this.formGroup, this.layoutNode.pointer, true);
    if (this.layoutNode.multipleOf) {
      this.step = this.layoutNode.multipleOf;
    } else if (this.layoutNode.type === 'integer') {
      this.step = 1;
    }
  }
}
