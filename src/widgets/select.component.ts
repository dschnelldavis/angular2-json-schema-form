import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../library/json-schema-form.service';
import { buildTitleMap } from '../library/utilities/index';

@Component({
  selector: 'select-widget',
  template: `
    <div
      [class]="options?.htmlClass">
      <label *ngIf="options?.title"
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.labelHtmlClass"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></label>
      <select
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [class]="options?.fieldHtmlClass"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        (input)="updateValue($event)">
        <option *ngFor="let selectItem of selectList"
           [value]="selectItem.value"
           [selected]="selectItem.value === controlValue">{{selectItem.name}}</option>
      </select>
    </div>`,
})
export class SelectComponent implements OnInit {
  private formControl: AbstractControl;
  private controlName: string;
  private controlValue: any;
  private controlDisabled: boolean = false;
  private boundControl: boolean = false;
  private options: any;
  private selectList: any[] = [];
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum,
      !!this.options.required
    );
    this.jsf.initializeControl(this);
  }

  private updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
