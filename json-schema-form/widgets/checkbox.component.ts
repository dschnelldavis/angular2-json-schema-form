import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'checkbox-widget',
  template: `
    <label *ngIf="boundControl" [formGroup]="formControlGroup"
      [attr.for]="layoutNode?.dataPointer" [class]="options?.labelHtmlClass">
      <input [formControlName]="formControlName"
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [checked]="isChecked ? 'checked' : null"
        [class]="options?.fieldHtmlClass"
        [id]="layoutNode?.dataPointer"
        [name]="formControlName"
        [readonly]="options?.readonly ? 'readonly' : false"
        [value]="options?.value || true"
        type="checkbox">
      <span *ngIf="options?.title"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></span>
    </label>
    <label *ngIf="!boundControl" [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass">
      <input
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [checked]="!!options?.value ? 'checked' : null"
        [class]="options?.fieldHtmlClass"
        [name]="formControlName"
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
        'CheckboxComponent warning: control "' + this.formSettings.getDataPointer(this) +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
  }

  private get isChecked() {
    return this.formControlGroup.controls[this.formControlName].value;
  }

  onClick(event) {
    event.preventDefault;
    this.layoutNode.value = !this.layoutNode.value;
  }
}
