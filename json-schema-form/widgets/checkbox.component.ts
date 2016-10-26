import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'checkbox-widget',
  template: `
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <input
        [formControlName]="layoutNode?.name"
        type="checkbox"
        [id]="layoutNode?.pointer"
        [class]="layoutNode?.fieldHtmlClass"
        [name]="layoutNode?.name"
        [readonly]="layoutNode?.readonly ? 'readonly' : false"
        [value]="layoutNode?.value || true"
        [checked]="isChecked ? 'checked' : null"
        [attr.aria-describedby]="layoutNode?.pointer + 'Status'">
    </div>
    <input *ngIf="!bindControl"
      type="checkbox"
      (click)="onClick($event)"
      [id]="layoutNode?.pointer"
      [class]="layoutNode?.fieldHtmlClass"
      [name]="layoutNode?.name"
      [readonly]="layoutNode?.readonly ? 'readonly' : false"
      [value]="layoutNode?.value || true"
      [checked]="!!layoutNode?.value ? 'checked' : null"
      [attr.aria-describedby]="layoutNode?.pointer + 'Status'">`,
})
export class CheckboxComponent implements OnInit {
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

  private get isChecked() {
    return this.formControlGroup.controls[this.layoutNode.name].value;
  }

  onClick(event) {
    event.preventDefault;
    this.layoutNode.value = !this.layoutNode.value;
  }
}
