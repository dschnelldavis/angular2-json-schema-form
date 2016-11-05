import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'textarea-widget',
  template: `
    <label *ngIf="options?.title" [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass" [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div *ngIf="boundControl" [formGroup]="formControlGroup">
      <textarea
        [formControlName]="formControlName"
        [class]="options?.fieldHtmlClass"
        [id]="formControlName"
        [name]="formControlName"
        [attr.minlength]="options?.minLength || options?.minlength"
        [attr.maxlength]="options?.maxLength || options?.maxlength"
        [attr.pattern]="options?.pattern"
        [attr.placeholder]="options?.placeholder"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"></textarea>
    </div>
    <textarea *ngIf="!boundControl"
      [class]="options?.fieldHtmlClass"
      [name]="formControlName"
      [value]="options?.value"
      [attr.minlength]="options?.minLength || options?.minlength"
      [attr.maxlength]="options?.maxLength || options?.maxlength"
      [attr.pattern]="options?.pattern"
      [attr.placeholder]="options?.placeholder"
      [attr.readonly]="options?.readonly ? 'readonly' : null"
      [attr.required]="options?.required"></textarea>`,
})
export class TextareaComponent implements OnInit {
  private formControlGroup: any;
  private formControlName: string;
  private boundControl: boolean = false;
  private options: any;
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
    } else {
      console.error(
        'TextareaComponent warning: control "' + this.formSettings.getDataPointer(this) +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
  }
}
