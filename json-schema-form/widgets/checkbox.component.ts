import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

@Component({
  selector: 'checkbox-widget',
  template: `
    <div *ngIf="layoutNode?.pointer" [formGroup]="formControlGroup">
      <input
        [formControlName]="layoutNode?.name"
        type="checkbox"
        [id]="layoutNode?.pointer"
        [class]="layoutNode?.fieldHtmlClass"
        [name]="layoutNode?.name"
        [readonly]="layoutNode?.readonly ? 'readonly' : false"
        [value]="layoutNode?.value || true"
        [checked]="!!layoutNode?.value">
    </div>
    <input *ngIf="!layoutNode?.pointer"
      type="checkbox"
      [id]="layoutNode?.pointer"
      [class]="layoutNode?.fieldHtmlClass"
      [name]="layoutNode?.name"
      [readonly]="layoutNode?.readonly ? 'readonly' : false"
      [value]="layoutNode?.value || true"
      [checked]="!!layoutNode?.value">`,
})
export class CheckboxComponent implements OnInit {
  private formControlGroup: any;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    if ('pointer' in this.layoutNode) {
      this.formControlGroup =
        JsonPointer.getFromFormGroup(this.formGroup, this.layoutNode.pointer, true);
    }
  }
}
