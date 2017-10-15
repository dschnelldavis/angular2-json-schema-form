import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { getControl, hasOwn, inArray, isDefined } from '../../shared';

@Component({
  selector: 'material-slider-widget',
  template: `
    <mat-slider thumbLabel #inputControl *ngIf="boundControl && isConditionallyShown()"
      [formControl]="formControl"
      [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
      [id]="'control' + layoutNode?._id"
      [max]="options?.maximum"
      [min]="options?.minimum"
      [step]="options?.multipleOf || options?.step || 'any'"
      [style.width]="'100%'"></mat-slider>
    <mat-slider thumbLabel #inputControl *ngIf="!boundControl && isConditionallyShown()"
      [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
      [disabled]="controlDisabled || options?.readonly"
      [id]="'control' + layoutNode?._id"
      [max]="options?.maximum"
      [min]="options?.minimum"
      [step]="options?.multipleOf || options?.step || 'any'"
      [style.width]="'100%'"
      [value]="controlValue"
      (change)="updateValue($event)"></mat-slider>`,
})
export class MaterialSliderComponent implements OnInit {
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
  @Input() data: any;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.value);
  }

  isConditionallyShown(): boolean {
    this.data = this.jsf.data;
    let result: boolean = true;
    if (this.data && hasOwn(this.options, 'condition')) {
      const model = this.data;
      /* tslint:disable */
      eval('result = ' + this.options.condition);
      /* tslint:enable */
    }
    return result;
  }
}
