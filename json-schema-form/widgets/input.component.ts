import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'input-widget',
  template: `
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <input
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.pointer"
        [class]="layoutNode?.fieldHtmlClass"
        [type]="layoutNode?.type"
        [name]="layoutNode?.name"
        [attr.minlength]="layoutNode?.minLength || layoutNode?.minlength"
        [attr.maxlength]="layoutNode?.maxLength || layoutNode?.maxlength"
        [attr.pattern]="layoutNode?.pattern"
        [attr.placeholder]="layoutNode?.placeholder"
        [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
        [attr.required]="layoutNode?.required"
        [attr.aria-describedby]="layoutNode?.pointer + 'Status'">
    </div>
    <input *ngIf="!bindControl"
      [class]="layoutNode?.fieldHtmlClass"
      [type]="layoutNode?.type"
      [name]="layoutNode?.name"
      [attr.value]="layoutNode?.value"
      [attr.minlength]="layoutNode?.minLength || layoutNode?.minlength"
      [attr.maxlength]="layoutNode?.maxLength || layoutNode?.maxlength"
      [attr.pattern]="layoutNode?.pattern"
      [attr.placeholder]="layoutNode?.placeholder"
      [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
      [attr.required]="layoutNode?.required"
      [attr.aria-describedby]="layoutNode?.pointer + 'Status'">`,
})
export class InputComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      this.formControlGroup = getControl(this.formGroup, this.layoutNode.pointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
      } else {
        console.error(
          'Warning: control "' + this.layoutNode.pointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }
}
