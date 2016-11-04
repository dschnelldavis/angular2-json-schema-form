import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'input-widget',
  template: `
    <label *ngIf="options?.title" [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass" [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <input
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.dataPointer"
        [class]="options?.fieldHtmlClass"
        [type]="layoutNode?.type"
        [name]="layoutNode?.name"
        [attr.minlength]="options?.minLength || options?.minlength"
        [attr.maxlength]="options?.maxLength || options?.maxlength"
        [attr.pattern]="pattern"
        [attr.placeholder]="options?.placeholder"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">
    </div>
    <input *ngIf="!bindControl"
      [class]="options?.fieldHtmlClass"
      [type]="layoutNode?.type"
      [name]="layoutNode?.name"
      [value]="options?.value"
      [attr.minlength]="options?.minLength || options?.minlength"
      [attr.maxlength]="options?.maxLength || options?.maxlength"
      [attr.pattern]="pattern"
      [attr.placeholder]="options?.placeholder"
      [attr.readonly]="options?.readonly ? 'readonly' : null"
      [attr.required]="options?.required"
      [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">`,
})
export class InputComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private options: any;
  private pattern: string = null;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    if (this.layoutNode.hasOwnProperty('dataPointer')) {
      this.formControlGroup = getControl(this.formSettings.formGroup, this.layoutNode.dataPointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
        if (this.layoutNode.hasOwnProperty('pattern') &&
          this.layoutNode.pattern[1] === '^' &&
          this.layoutNode.pattern.slice(-1) === '$'
        ) {
          this.pattern = this.layoutNode.pattern.slice(1, -1);
        }
      } else {
        console.error(
          'InputComponent warning: control "' + this.layoutNode.dataPointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }
}
