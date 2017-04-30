import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../library/json-schema-form.service';

@Component({
  selector: 'hidden-widget',
  template: `
    <input
      type="hidden"
      [disabled]="controlDisabled"
      [name]="controlName"
      [id]="'control' + layoutNode?._id"
      [value]="controlValue">`,
})
export class HiddenComponent implements OnInit {
  private formControl: AbstractControl;
  private boundControl: boolean = false;
  public controlValue: any;
  public controlName: string;
  public controlDisabled: boolean = false;
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
