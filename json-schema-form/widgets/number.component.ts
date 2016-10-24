import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

@Component({
  selector: 'number-widget',
  template: `
    <div *ngIf="layoutNode?.pointer" [formGroup]="formControlGroup">
      <input
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.pointer"
        [class]="layoutNode?.fieldHtmlClass"
        [type]="layoutNode?.type === 'range' ? 'range' : 'number'"
        [name]="layoutNode?.name"
        [attr.min]="layoutNode?.minimum"
        [attr.max]="layoutNode?.maximum"
        [attr.step]="step"
        [attr.placeholder]="layoutNode?.placeholder"
        [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
        [attr.required]="layoutNode?.required">
    </div>
    <input *ngIf="!layoutNode?.pointer"
      [class]="layoutNode?.fieldHtmlClass"
      [type]="layoutNode?.type === 'range' ? 'range' : 'number'"
      [name]="layoutNode?.name"
      [attr.value]="layoutNode?.value"
      [attr.min]="layoutNode?.minimum"
      [attr.max]="layoutNode?.maximum"
      [attr.step]="step"
      [attr.placeholder]="layoutNode?.placeholder"
      [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
      [attr.required]="layoutNode?.required">`,
})
export class NumberComponent implements OnInit {
  private formControlGroup: any;
  private step: string;
  @Input() formGroup: FormGroup; // parent FormGroup
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options

  ngOnInit() {
    if ('pointer' in this.layoutNode) {
      this.formControlGroup =
        JsonPointer.getFromFormGroup(this.formGroup, this.layoutNode.pointer, true);
    }
    this.step = this.layoutNode.multipleOf ||
      (this.layoutNode.type === 'integer' ? '1' : 'any');
  }
}
