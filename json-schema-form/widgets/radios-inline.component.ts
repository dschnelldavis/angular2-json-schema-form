import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'radios-inline-widget',
  template: `
    <label *ngIf="options?.title"
      [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass"
      [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div *ngIf="boundControl"
      [class]="options?.htmlClass"
      [formGroup]="formControlGroup">
      <label *ngFor="let radioItem of radiosList"
        [attr.for]="layoutNode?.dataPointer + '/' + radioItem?.value"
        [class]="options?.itemLabelHtmlClass +
          (formControl?.value === radioItem?.value ?
          ' ' + options?.activeClass : '')"
        [class.active]="formControl?.value === radioItem?.value">
        <input type="radio"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required"
          [checked]="radioItem?.value === options?.value"
          [class]="options?.fieldHtmlClass"
          [formControlName]="formControlName"
          [id]="layoutNode?.dataPointer + '/' + radioItem?.value"
          [value]="radioItem?.value">
        <span [innerHTML]="radioItem?.name"></span>
      </label>
    </div>
    <div *ngIf="!boundControl"
      [class]="options?.htmlClass">
      <label *ngFor="let radioItem of radiosList"
        [attr.for]="radioItem?.value"
        [class]="options?.itemLabelHtmlClass +
          (formControl?.value === radioItem?.value ?
          ' ' + options?.activeClass : '')"
        [class.active]="formControl?.value === radioItem?.value">
        <input type="radio"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required"
          [checked]="radioItem?.value === options?.value"
          [class]="options?.fieldHtmlClass"
          [id]="radioItem?.value"
          [value]="radioItem?.value">
        <span [innerHTML]="radioItem?.name"></span>
      </label>
    </div>`,
})
export class RadiosInlineComponent implements OnInit {
  private formControlGroup: any;
  private formControl: any;
  private formControlName: string;
  private boundControl: boolean = false;
  private options: any;
  private radiosList: any[] = [];
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
      this.formControl = this.formSettings.getControl(this);
    } else {
      console.error(
        'RadiosInlineComponent warning: control "' + this.formSettings.getDataPointer(this) +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
    this.radiosList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, true
    );
  }
}
