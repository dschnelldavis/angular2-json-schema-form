import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'number-widget',
  template: `
    <label *ngIf="layoutNode?.title" [attr.for]="layoutNode?.pointer"
      [class]="layoutNode?.labelHtmlClass" [class.sr-only]="layoutNode?.notitle"
      [innerHTML]="layoutNode?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <input
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.pointer"
        [class]="layoutNode?.fieldHtmlClass"
        [type]="layoutNode?.type === 'range' ? 'range' : 'text'"
        [name]="layoutNode?.name"
        [attr.min]="layoutNode?.minimum"
        [attr.max]="layoutNode?.maximum"
        [attr.step]="step"
        [attr.placeholder]="layoutNode?.placeholder"
        [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
        [attr.required]="layoutNode?.required"
        [attr.aria-describedby]="layoutNode?.pointer + 'Status'"
        (keydown)="validateInput($event)"
        (keyup)="validateNumber($event)">
    </div>
    <input *ngIf="!bindControl"
      [class]="layoutNode?.fieldHtmlClass"
      [type]="layoutNode?.type === 'range' ? 'range' : 'text'"
      [name]="layoutNode?.name"
      [value]="layoutNode?.value"
      [attr.min]="layoutNode?.minimum"
      [attr.max]="layoutNode?.maximum"
      [attr.step]="step"
      [attr.placeholder]="layoutNode?.placeholder"
      [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
      [attr.required]="layoutNode?.required"
      [attr.aria-describedby]="layoutNode?.pointer + 'Status'"
      (keydown)="validateInput($event)"
      (keyup)="validateNumber($event)">`,
})
export class NumberComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private allowNegative: boolean = true;
  private allowDecimal: boolean = true;
  private allowExponents: boolean = true;
  private lastValidNumber: string = '';
  private step: string;
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      this.formControlGroup =
        getControl(this.options.formGroup, this.layoutNode.pointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
        this.lastValidNumber = this.formControlGroup.controls[this.layoutNode.name].value;
      } else {
        console.error(
          'NumberComponent warning: control "' + this.layoutNode.pointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
    this.step = this.layoutNode.multipleOf ||
      (this.layoutNode.dataType === 'integer' ? '1' : 'any');
    if (this.layoutNode.dataType === 'integer') this.allowDecimal = false;
    if (this.layoutNode.minimum) this.allowNegative = this.layoutNode.minimum < 0;
    if (this.layoutNode.allowExponents) this.allowExponents = this.layoutNode.allowExponents;
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
        // const minusCount = (val.match(/\-/g) || []).length;
        const minusCount = val.split('-').length - 1;
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
      this.formControlGroup.controls[this.layoutNode.name]
        .setValue(this.lastValidNumber);
    }
  }
}
