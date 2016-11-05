import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl, isDefined } from '../utilities/index';

@Component({
  selector: 'number-widget',
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
        [attr.max]="options?.maximum"
        [attr.min]="options?.minimum"
        [attr.placeholder]="options?.placeholder"
        [attr.required]="options?.required"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.step]="step"
        [class]="options?.fieldHtmlClass"
        [formControlName]="formControlName"
        [id]="layoutNode?.dataPointer"
        [name]="formControlName"
        [type]="layoutNode?.type === 'range' ? 'range' : 'text'"
        (keydown)="validateInput($event)"
        (keyup)="validateNumber($event)">
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
        [attr.max]="options?.maximum"
        [attr.min]="options?.minimum"
        [attr.placeholder]="options?.placeholder"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [attr.step]="step"
        [class]="options?.fieldHtmlClass"
        [id]="formControlName"
        [name]="formControlName"
        [type]="layoutNode?.type === 'range' ? 'range' : 'text'"
        [value]="layoutNode?.value"
        (keydown)="validateInput($event)"
        (keyup)="validateNumber($event)">
    </div>`,
})
export class NumberComponent implements OnChanges, OnInit {
  private formControlGroup: any;
  private formControlName: string;
  private boundControl: boolean = false;
  private options: any;
  private allowNegative: boolean = true;
  private allowDecimal: boolean = true;
  private allowExponents: boolean = true;
  private lastValidNumber: string = '';
  private step: string;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.initializeControl();
  }

  ngOnChanges() {
    this.initializeControl();
  }

  private initializeControl() {
    this.formControlGroup = this.formSettings.getControlGroup(this);
    this.formControlName = this.formSettings.getControlName(this);
    this.boundControl = this.formSettings.isControlBound(this);
    if (this.boundControl) {
      this.lastValidNumber = this.formControlGroup.controls[this.formControlName].value;
    } else {
      console.error(
        'NumberComponent warning: control "' + this.formSettings.getDataPointer(this) +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
    this.step = this.layoutNode.multipleOf || this.layoutNode.step ||
      (this.layoutNode.dataType === 'integer' ? '1' : 'any');
    if (this.layoutNode.dataType === 'integer') {
      this.allowDecimal = false;
      this.allowExponents = false;
    } else if (isDefined(this.layoutNode.allowExponents)) {
      this.allowExponents = this.layoutNode.allowExponents;
    }
    if (isDefined(this.layoutNode.minimum)) {
      this.allowNegative = this.layoutNode.minimum < 0;
    }
  }

  private validateInput(event) {
    const val = event.target.value;
    if (/^Digit\d$/.test(event.code)) return true;
    if (/^Numpad\d$/.test(event.code)) return true;
    if (/^Arrow/.test(event.code)) return true;
    if (event.code === 'Backspace' || event.code === 'Delete') return true;
    if (event.key === '.' && this.allowDecimal && val.indexOf('.') === -1) return true;
    if (this.allowExponents) {
      const hasExp = /e/i.test(val);
      if (/^e$/i.test(event.key) && val && !hasExp) return true;
      if (event.key === '-') {
        const minusCount = (val.match(/\-/g) || []).length;
        // const minusCount = val.split('-').length - 1;
        if (!minusCount && (this.allowNegative || hasExp)) return true;
        if (minusCount === 1 && this.allowNegative && hasExp) return true;
      }
    } else if (event.key === '-' && this.allowNegative && val.indexOf('-') === -1) {
      return true;
    }
    return false;
  }

  private validateNumber(event) {
    const val = event.target.value;
    if (!isNaN(val) || val === '' || val === '.' || val === '-' || val === '-.' ||
      (val.length > 1 && val.slice(-1).toLowerCase() === 'e') ||
      (val.length > 2 && val.slice(-2).toLowerCase() === 'e-')
    ) {
      this.lastValidNumber = val;
    } else {
      this.formSettings.getControl(this).setValue(this.lastValidNumber);
    }
  }
}
