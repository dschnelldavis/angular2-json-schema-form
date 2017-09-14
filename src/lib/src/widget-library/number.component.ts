import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { getControl, inArray, isDefined } from '../shared';

@Component({
  selector: 'number-widget',
  template: `
    <div
      [class]="options?.htmlClass">
      <label *ngIf="options?.title"
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.labelHtmlClass"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
      <input
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.max]="options?.maximum"
        [attr.min]="options?.minimum"
        [attr.placeholder]="options?.placeholder"
        [attr.required]="options?.required"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.step]="options?.multipleOf || options?.step || 'any'"
        [class]="options?.fieldHtmlClass"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [readonly]="options?.readonly ? 'readonly' : null"
        [title]="lastValidNumber"
        [type]="layoutNode?.type === 'range' ? 'range' : 'number'"
        [value]="controlValue"
        (input)="updateValue($event)">
        {{layoutNode?.type === 'range' ? controlValue : ''}}
    </div>`,
})
export class NumberComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled: boolean = false;
  boundControl: boolean = false;
  options: any;
  allowNegative: boolean = true;
  allowDecimal: boolean = true;
  allowExponents: boolean = false;
  lastValidNumber: string = '';
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
    if (this.layoutNode.dataType === 'integer') { this.allowDecimal = false; }
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
