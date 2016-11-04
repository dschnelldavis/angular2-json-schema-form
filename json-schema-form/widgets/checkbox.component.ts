import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'checkbox-widget',
  template: `
    <label *ngIf="bindControl" [formGroup]="formControlGroup"
      [attr.for]="layoutNode?.dataPointer" [class]="options?.labelHtmlClass">
      <input [formControlName]="layoutNode?.name"
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [checked]="isChecked ? 'checked' : null"
        [class]="options?.fieldHtmlClass"
        [id]="layoutNode?.dataPointer"
        [name]="layoutNode?.name"
        [readonly]="options?.readonly ? 'readonly' : false"
        [value]="options?.value || true"
        type="checkbox">
      <span *ngIf="options?.title"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></span>
    </label>
    <label *ngIf="!bindControl" [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass">
      <input
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [checked]="!!options?.value ? 'checked' : null"
        [class]="options?.fieldHtmlClass"
        [name]="layoutNode?.name"
        [readonly]="options?.readonly ? 'readonly' : false"
        [value]="options?.value || true"
        (click)="onClick($event)"
        type="checkbox">
      <span *ngIf="options?.title" [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></span>
    </label>`,
})
export class CheckboxComponent implements OnInit {
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
          'CheckboxComponent warning: control "' + this.layoutNode.dataPointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }

  private get isChecked() {
    return this.formControlGroup.controls[this.layoutNode.name].value;
  }

  onClick(event) {
    event.preventDefault;
    this.layoutNode.value = !this.layoutNode.value;
  }
}
