import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'number-widget',
  template: `
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
      [attr.value]="layoutNode?.value"
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
  private step: string;
  private allowNegative: boolean = true;
  private allowDecimal: boolean = true;
  private lastValidNumber: string = '';
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
        this.lastValidNumber = this.formControlGroup.controls[this.layoutNode.name].value;
      } else {
        console.error(
          'Warning: control "' + this.layoutNode.pointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
    this.step = this.layoutNode.multipleOf ||
      (this.layoutNode.dataType === 'integer' ? '1' : 'any');
    if (this.layoutNode.dataType === 'integer') this.allowDecimal = false;
    if (this.layoutNode.minimum) this.allowNegative = this.layoutNode.minimum < 0;
  }

  private validateInput(event) {
    if (/^Digit\d$/.test(event.code)) return true;
    if (/^Numpad\d$/.test(event.code)) return true;
    if (/^Arrow/.test(event.code)) return true;
    if (event.code === 'Backspace' || event.code === 'Delete') return true;
    if (this.allowDecimal && event.key === '.' && event.target.value.indexOf('.') === -1) return true;
    if (this.allowNegative && event.key === '-' && event.target.value.indexOf('-') === -1) return true;
    if (/^e$/i.test(event.key) && !(/e/i.test(event.target.value))) return true;
    return false;
  }

  private validateNumber(event) {
    if (event.target.value !== '' && isNaN(event.target.value)) {
      if (event.target.value !== '-' && event.target.value !== '.' &&
        event.target.value !== '-.' && event.target.value.slice(-1).toLowerCase() !== 'e'
      ) {
        this.formControlGroup.controls[this.layoutNode.name].setValue(this.lastValidNumber);
      }
    } else {
      this.lastValidNumber = event.target.value;
    }
  }
}
