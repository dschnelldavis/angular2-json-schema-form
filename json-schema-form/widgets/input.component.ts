import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'input-widget',
  template: `
    <div *ngIf="boundControl"
      [class]="options?.htmlClass"
      [formGroup]="formControlGroup">
      <label *ngIf="options?.title"
        [attr.for]="layoutNode?.dataPointer"
        [class]="options?.labelHtmlClass"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></label>
      <input
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="pattern"
        [attr.placeholder]="options?.placeholder"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [class]="options?.fieldHtmlClass"
        [formControlName]="formControlName"
        [id]="layoutNode?.dataPointer"
        [name]="formControlName"
        [type]="layoutNode?.type">
    </div>
    <div *ngIf="!boundControl"
      [class]="options?.htmlClass">
      <label *ngIf="options?.title"
        [attr.for]="layoutNode?.dataPointer"
        [class]="options?.labelHtmlClass"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></label>
      <input
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="pattern"
        [attr.placeholder]="options?.placeholder"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [class]="options?.fieldHtmlClass"
        [id]="formControlName"
        [name]="formControlName"
        [type]="layoutNode?.type"
        [value]="options?.value">
    </div>`,
})
export class InputComponent implements OnInit {
  private formControlGroup: any;
  private formControlName: string;
  private boundControl: boolean = false;
  private options: any;
  private pattern: string = null;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.formControlGroup = this.formSettings.getControlGroup(this);
    this.formControlName = this.formSettings.getControlName(this);
    this.boundControl = this.formSettings.isControlBound(this);
    if (this.boundControl) {
      // if (this.layoutNode.hasOwnProperty('pattern') &&
      //   this.layoutNode.pattern[1] === '^' &&
      //   this.layoutNode.pattern.slice(-1) === '$'
      // ) {
      //   this.pattern = this.layoutNode.pattern.slice(1, -1);
      // }
      if (this.layoutNode.hasOwnProperty('pattern')) {
        this.pattern = this.layoutNode.pattern;
      }
    } else {
      console.error(
        'InputComponent warning: control "' + this.formSettings.getDataPointer(this) +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
  }
}
