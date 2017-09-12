import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { dateToString, stringToDate } from '../../shared';

@Component({
  selector: 'material-datepicker-widget',
  template: `
    <md-form-field [style.width]="'100%'">
      <input mdInput #inputControl
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [max]="options?.maximum"
        [mdDatepicker]="picker"
        [min]="options?.minimum"
        [name]="controlName"
        [placeholder]="options?.title"
        [required]="options?.required"
        [style.width]="'100%'"
        [value]="dateValue"
        (change)="updateValue(inputControl.value)">
      <span *ngIf="options?.fieldAddonLeft"
        md-prefix>{{options?.fieldAddonLeft}}</span>
      <span *ngIf="options?.fieldAddonRight"
        md-suffix>{{options?.fieldAddonRight}}</span>
      <md-hint *ngIf="options?.description && !options?.placeholder && formControl?.dirty"
        align="end">{{options?.description}}</md-hint>
      <md-hint *ngIf="!options?.description && options?.placeholder && !formControl?.dirty"
        align="end">{{options?.placeholder}}</md-hint>
      <md-datepicker-toggle mdSuffix [for]="picker"></md-datepicker-toggle>
    </md-form-field>
    <md-datepicker #picker
      (selectedChanged)="updateValue($event)"></md-datepicker>`,
})
export class MaterialDatepickerComponent implements OnInit, OnChanges {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  dateValue: any;
  controlDisabled: boolean = false;
  boundControl: boolean = false;
  options: any;
  autoCompleteList: string[] = [];
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
    this.setControlDate(this.controlValue);
  }

  ngOnChanges() {
    this.setControlDate(this.controlValue);
  }

  setControlDate(dateString: string) {
    this.dateValue = stringToDate(dateString);
  }

  updateValue(event) {
    let options: { format?: string, locale?: string } = {};
    if (this.layoutNode.dateFormat || this.layoutNode['date-format']) {
      options.format = this.layoutNode.dateFormat || this.layoutNode['date-format'];
    }
    this.jsf.updateValue(this, dateToString(event, options));
  }
}
