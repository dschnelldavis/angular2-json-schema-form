import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl, inArray, isDefined } from '../utilities/index';

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
        [title]="lastValidNumber"
        [type]="layoutNode?.type === 'range' ? 'range' : 'number'"
        (input)="updateInput($event)"
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
        [title]="lastValidNumber"
        [type]="layoutNode?.type === 'range' ? 'range' : 'number'"
        [value]="layoutNode?.value"
        (input)="updateInput($event)"
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
  private allowExponents: boolean = false;
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
      this.lastValidNumber = this.formSettings.getControl(this).value;
    } else {
      console.error(
        'NumberComponent warning: control "' + this.formSettings.getDataPointer(this) +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
    this.step = this.options.multipleOf || this.options.step ||
      (this.layoutNode.dataType === 'integer' ? '1' : 'any');
    if (this.layoutNode.dataType === 'integer') {
      this.allowDecimal = false;
      this.allowExponents = false;
    } else {
      this.allowExponents = !!this.options.allowExponents;
    }
    if (isDefined(this.options.minimum)) {
      this.allowNegative = this.options.minimum < 0;
    }
  }

  private updateInput(event) {
    if (this.layoutNode.type !== 'range') return;
    if (!isNaN(event.target.value)) this.lastValidNumber = event.target.value;
  }

  private validateInput(event) {
    const val = event.target.value;
    if (/^Digit\d$/.test(event.code)) return true;
    if (/^Numpad\d$/.test(event.code)) return true;
    if (/^Arrow/.test(event.code)) return true;
    if (inArray(event.code, ['Backspace', 'Delete', 'Enter', 'Escape',
      'NumpadEnter', 'PrintScreen', 'Tab'])) return true;
    if (event.ctrlKey || event.altKey || event.metaKey) return true;
    if (this.allowDecimal && event.key === '.' &&
      val.indexOf('.') === -1) return true;
    if (this.allowExponents) {
      const hasExponent = /e/i.test(val);
      if (/^e$/i.test(event.key) && !hasExponent && val) return true;
      if (event.key === '-') {
        const minusCount = (val.match(/\-/g) || []).length;
        if ((this.allowNegative || hasExponent) && !minusCount) return true;
        if (this.allowNegative && hasExponent && minusCount === 1) return true;
      }
    } else if (this.allowNegative && event.key === '-' && val.indexOf('-') === -1) {
      return true;
    }
    // TODO: Display feedback for rejected key
    return false;
  }

  private validateNumber(event) {
    // TODO: This only works for input type=text - make it work for type=number
    const val = event.target.value;
    if (!isNaN(val) || val === '' || val === '.' || val === '-' || val === '-.' ||
      (val.length > 1 && val.slice(-1).toLowerCase() === 'e') ||
      (val.length > 2 && val.slice(-2).toLowerCase() === 'e-')
    ) {
      this.lastValidNumber = val;
    } else {
      // TODO: Display feedback for rejected key
      this.formSettings.getControl(this).setValue(this.lastValidNumber);
    }
  }
}
