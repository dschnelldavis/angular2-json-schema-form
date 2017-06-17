import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../json-schema-form.service';

@Component({
  selector: 'hidden-widget',
  template: `
    <input
      [disabled]="controlDisabled"
      [name]="controlName"
      [id]="'control' + layoutNode?._id"
      type="hidden"
      [value]="controlValue">`,
})
export class HiddenComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled: boolean = false;
  boundControl: boolean = false;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.jsf.initializeControl(this);
  }
}
