import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'checkbox-widget',
  template: `
    <label *ngIf="bindControl" [formGroup]="formControlGroup"
      [attr.for]="layoutNode?.pointer" [class]="layoutNode?.labelHtmlClass">
      <input [formControlName]="layoutNode?.name"
        [attr.aria-describedby]="layoutNode?.pointer + 'Status'"
        [checked]="isChecked ? 'checked' : null"
        [class]="layoutNode?.fieldHtmlClass"
        [id]="layoutNode?.pointer"
        [name]="layoutNode?.name"
        [readonly]="layoutNode?.readonly ? 'readonly' : false"
        [value]="layoutNode?.value || true"
        type="checkbox">
      <span *ngIf="layoutNode?.title"
        [class.sr-only]="layoutNode?.notitle"
        [innerHTML]="layoutNode?.title"></span>
    </label>
    <label *ngIf="!bindControl" [attr.for]="layoutNode?.pointer"
      [class]="layoutNode?.labelHtmlClass">
      <input
        [attr.aria-describedby]="layoutNode?.pointer + 'Status'"
        [checked]="!!layoutNode?.value ? 'checked' : null"
        [class]="layoutNode?.fieldHtmlClass"
        [name]="layoutNode?.name"
        [readonly]="layoutNode?.readonly ? 'readonly' : false"
        [value]="layoutNode?.value || true"
        (click)="onClick($event)"
        type="checkbox">
      <span *ngIf="layoutNode?.title" [class.sr-only]="layoutNode?.notitle"
        [innerHTML]="layoutNode?.title"></span>
    </label>`,
})
export class CheckboxComponent implements OnInit {
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
          'CheckboxComponent warning: control "' + this.layoutNode.pointer +
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
