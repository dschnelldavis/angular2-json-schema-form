import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'textarea-widget',
  template: `
    <label *ngIf="options?.title" [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass" [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <textarea
        [formControlName]="layoutNode?.name"
        [class]="options?.fieldHtmlClass"
        [id]="layoutNode?.name"
        [name]="layoutNode?.name"
        [attr.minlength]="options?.minLength || options?.minlength"
        [attr.maxlength]="options?.maxLength || options?.maxlength"
        [attr.pattern]="options?.pattern"
        [attr.placeholder]="options?.placeholder"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"></textarea>
    </div>
    <textarea *ngIf="!bindControl"
      [class]="options?.fieldHtmlClass"
      [name]="layoutNode?.name"
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
  private bindControl: boolean = false;
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    this.options = this.layoutNode.options;
    if (this.layoutNode.hasOwnProperty('dataPointer')) {
      this.formControlGroup = getControl(this.formSettings.formGroup, this.layoutNode.dataPointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
      } else {
        console.error(
          'TextareaComponent warning: control "' + this.layoutNode.dataPointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }
}
