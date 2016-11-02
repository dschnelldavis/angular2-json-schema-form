import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'input-widget',
  template: `
    <label *ngIf="layoutNode?.title" [attr.for]="layoutNode?.pointer"
      [class]="layoutNode?.labelHtmlClass" [class.sr-only]="layoutNode?.notitle"
      [innerHTML]="layoutNode?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <input
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.pointer"
        [class]="layoutNode?.fieldHtmlClass"
        [type]="layoutNode?.type"
        [name]="layoutNode?.name"
        [attr.minlength]="layoutNode?.minLength || layoutNode?.minlength"
        [attr.maxlength]="layoutNode?.maxLength || layoutNode?.maxlength"
        [attr.pattern]="pattern"
        [attr.placeholder]="layoutNode?.placeholder"
        [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
        [attr.required]="layoutNode?.required"
        [attr.aria-describedby]="layoutNode?.pointer + 'Status'">
    </div>
    <input *ngIf="!bindControl"
      [class]="layoutNode?.fieldHtmlClass"
      [type]="layoutNode?.type"
      [name]="layoutNode?.name"
      [value]="layoutNode?.value"
      [attr.minlength]="layoutNode?.minLength || layoutNode?.minlength"
      [attr.maxlength]="layoutNode?.maxLength || layoutNode?.maxlength"
      [attr.pattern]="pattern"
      [attr.placeholder]="layoutNode?.placeholder"
      [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
      [attr.required]="layoutNode?.required"
      [attr.aria-describedby]="layoutNode?.pointer + 'Status'">`,
})
export class InputComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private pattern: string = null;
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      this.formControlGroup = getControl(this.options.formGroup, this.layoutNode.pointer, true);
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
          'InputComponent warning: control "' + this.layoutNode.pointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }
}
