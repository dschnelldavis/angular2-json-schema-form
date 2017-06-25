import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { getControl, inArray, isDefined } from '../../shared';

@Component({
  selector: 'material-slider-widget',
  template: `
      <md-slider #inputControl
        [(ngModel)]="controlValue"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [max]="options?.maximum"
        [min]="options?.minimum"
        [step]="options?.multipleOf || options?.step || 'any'"
        [style.width]="'100%'"
        [thumb-label]="true"
        [value]="controlValue"
        (change)="updateValue($event)"></md-slider>`,
    styles: [`md-input-container { margin-top: 6px; }`],
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

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.value);
  }
}
