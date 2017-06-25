import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'material-checkbox-widget',
  template: `
    <md-checkbox
      align="left"
      [color]="options?.color || 'primary'"
      [disabled]="controlDisabled || options?.readonly"
      [id]="'control' + layoutNode?._id"
      [name]="controlName"
      [checked]="isChecked"
      (change)="updateValue($event)">
      <span *ngIf="options?.title"
        class="checkbox-name"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></span>
    </md-checkbox>`,
  styles: [` .checkbox-name { white-space: nowrap; } `],
})
export class MaterialCheckboxComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled: boolean = false;
  boundControl: boolean = false;
  options: any;
  trueValue: any = true;
  falseValue: any = false;
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
    if (this.controlValue === null || this.controlValue === undefined) {
      this.controlValue = false;
    }
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.checked ? this.trueValue : this.falseValue);
  }

  get isChecked() {
    return this.jsf.getControlValue(this) === this.trueValue;
  }
}
