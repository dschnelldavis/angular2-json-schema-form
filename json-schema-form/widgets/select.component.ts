import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { buildTitleMap } from '../utilities/index';

@Component({
  selector: 'select-widget',
  template: `
    <div
      [class]="options?.htmlClass">
      <label *ngIf="options?.title"
        [attr.for]="layoutNode?.dataPointer"
        [class]="options?.labelHtmlClass"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></label>
      <select
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [class]="options?.fieldHtmlClass"
        [id]="layoutNode?.dataPointer"
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
  private boundControl: boolean = false;
  private options: any;
  private selectList: any[] = [];
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum,
      !!this.options.required
    );
    this.formSettings.initializeControl(this);
  }

  private updateValue(event) {
    this.formSettings.updateValue(this, event);
  }
}
