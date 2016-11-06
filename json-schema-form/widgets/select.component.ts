import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'select-widget',
  template: `
    <label *ngIf="options?.title" [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass" [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div *ngIf="boundControl" [formGroup]="formControlGroup">
      <select
        [formControlName]="formControlName"
        [id]="layoutNode?.dataPointer"
        [class]="options?.fieldHtmlClass"
        [name]="formControlName"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">
        <option [value]="selectItem.value"
          *ngFor="let selectItem of selectList">{{selectItem.name}}</option>
      </select>
    </div>
    <select *ngIf="!boundControl"
      [class]="options?.fieldHtmlClass"
      [name]="formControlName"
      [attr.readonly]="options?.readonly ? 'readonly' : null"
      [attr.required]="options?.required"
      [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">
      <option [value]="selectItem.value"
        *ngFor="let selectItem of selectList">{{selectItem.name}}</option>
    </select>`,
})
export class SelectComponent implements OnInit {
  private formControlGroup: any;
  private formControlName: string;
  private boundControl: boolean = false;
  private options: any;
  private selectList: any[] = [];
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.formControlGroup = this.formSettings.getControlGroup(this);
    this.formControlName = this.formSettings.getControlName(this);
    this.boundControl = this.formSettings.isControlBound(this);
    if (this.boundControl) {
    } else {
      console.error(
        'SelectComponent warning: control "' + this.formSettings.getDataPointer(this) +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum,
      !!this.options.required
    );
  }
}
