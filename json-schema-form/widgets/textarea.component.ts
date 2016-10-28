import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'textarea-widget',
  template: `
    <label *ngIf="layoutNode?.title" [attr.for]="layoutNode?.pointer"
      [class]="layoutNode?.labelHtmlClass" [class.sr-only]="layoutNode?.notitle"
      [innerHTML]="layoutNode?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <textarea
        [formControlName]="layoutNode?.name"
        [class]="layoutNode?.fieldHtmlClass"
        [id]="layoutNode?.name"
        [name]="layoutNode?.name"
        [attr.minlength]="layoutNode?.minLength || layoutNode?.minlength"
        [attr.maxlength]="layoutNode?.maxLength || layoutNode?.maxlength"
        [attr.pattern]="layoutNode?.pattern"
        [attr.placeholder]="layoutNode?.placeholder"
        [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
        [attr.required]="layoutNode?.required"></textarea>
    </div>
    <textarea *ngIf="!bindControl"
      [class]="layoutNode?.fieldHtmlClass"
      [name]="layoutNode?.name"
      [value]="layoutNode?.value"
      [attr.minlength]="layoutNode?.minLength || layoutNode?.minlength"
      [attr.maxlength]="layoutNode?.maxLength || layoutNode?.maxlength"
      [attr.pattern]="layoutNode?.pattern"
      [attr.placeholder]="layoutNode?.placeholder"
      [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
      [attr.required]="layoutNode?.required"></textarea>`,
})
export class TextareaComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;
  @Input() index: number[];
  @Input() debug: boolean;

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
