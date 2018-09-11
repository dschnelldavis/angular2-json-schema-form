import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { dateToString, hasOwn, stringToDate } from '../../shared';


@Component({
  selector: 'semantic-ui-datepicker-widget',
  template: `
    <div class="field">
      <label
        [innerHTML]="options?.notitle ? '' : options?.title"></label>
      <input
        class="flatpickr"
        type="text"
        mwlFlatpickr
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [id]="'control' + layoutNode?._id"
        [max]="options?.maximum"
        [min]="options?.minimum"
        [name]="controlName"
        [placeholder]="options?.title"
        [class.required]="options?.required"
        [style.width]="'100%'"
        (blur)="options.showErrors = true"
        [convertModelValue]="true"
        [inline]="false">
    </div>
  `,
})
export class SemanticUIDatepickerComponent implements OnInit, OnChanges {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  dateValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  autoCompleteList: string[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];


  basicDemoValue = '2017-01-01';
  modelValueAsDate: Date = new Date();
  dateTimeValue: Date = new Date();
  multiDates: Date[] = [new Date(), (new Date() as any)['fp_incr'](10)];
  rangeValue: { from: Date; to: Date } = {
    from: new Date(),
    to: (new Date() as any)['fp_incr'](10)
  };
  inlineDatePicker: Date = new Date();
  timePicker: Date = null;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
    this.setControlDate(this.controlValue);
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  ngOnChanges() {
    this.setControlDate(this.controlValue);
  }

  setControlDate(dateString: string) {
    this.dateValue = stringToDate(dateString);
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, dateToString(event, this.options));
  }
}
