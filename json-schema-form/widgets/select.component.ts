import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'select-widget',
  template: `
    <label *ngIf="options?.title" [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass" [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <select
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.dataPointer"
        [class]="options?.fieldHtmlClass"
        [name]="layoutNode?.name"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">
        <option [value]="selectItem.value"
          *ngFor="let selectItem of selectList">{{selectItem.name}}</option>
      </select>
    </div>
    <select *ngIf="!bindControl"
      [class]="options?.fieldHtmlClass"
      [name]="layoutNode?.name"
      [attr.readonly]="options?.readonly ? 'readonly' : null"
      [attr.required]="options?.required"
      [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">
      <option [value]="selectItem.value"
        *ngFor="let selectItem of selectList">{{selectItem.name}}</option>
    </select>`,
})
export class SelectComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private options: any;
  private selectList: any[] = [];
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    if (this.layoutNode.hasOwnProperty('dataPointer')) {
      this.formControlGroup = getControl(this.formSettings.formGroup, this.layoutNode.dataPointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
      } else {
        console.error(
          'SelectComponent warning: control "' + this.layoutNode.dataPointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
    this.selectList = buildTitleMap(
      this.layoutNode.titleMap || this.layoutNode.enumNames,
      this.layoutNode.enum,
      !!this.layoutNode.required
    );
  }
}
