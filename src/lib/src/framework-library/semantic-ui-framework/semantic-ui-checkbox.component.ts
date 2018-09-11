import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { hasOwn } from './../../shared/utility.functions';

@Component({
  selector: 'semantic-ui-checkbox-widget',
  template: `
    <sm-checkbox  *ngIf="boundControl && !showSlideToggle"
      [formControl]="formControl"
      align="left"
      [class]="options?.color || 'primary'"
      [id]="'control' + layoutNode?._id"
      labelPosition="after"
      [name]="controlName"
      (blur)="options.showErrors = true">
      <span *ngIf="options?.title"
        class="checkbox-name"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></span>
    </sm-checkbox>
    <sm-checkbox *ngIf="!boundControl && !showSlideToggle"
      align="left"
       [class]="options?.color || 'primary'"
      [class.disabled]="controlDisabled || options?.readonly"
      [id]="'control' + layoutNode?._id"
      labelPosition="after"
      [name]="controlName"
      [class.checked]="isChecked"
      (blur)="options.showErrors = true"
      (change)="updateValue($event)">
      <span *ngIf="options?.title"
        class="checkbox-name"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></span>
    </sm-checkbox>
    <sm-checkbox *ngIf="boundControl && showSlideToggle"
      [formControl]="formControl"
      align="left"
      [class.color]="options?.color || 'primary'"
      [id]="'control' + layoutNode?._id"
      labelPosition="after"
      [name]="controlName"
      [type]="toggle"
      (blur)="options.showErrors = true">
      <span *ngIf="options?.title"
        class="checkbox-name"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></span>
    </sm-checkbox>
    <sm-checkbox *ngIf="!boundControl && showSlideToggle"
      align="left"
      [class]="options?.color || 'primary'"
      [class.disabled]="controlDisabled || options?.readonly"
      [id]="'control' + layoutNode?._id"
      labelPosition="after"
      [name]="controlName"
      [class.checked]="isChecked"
      (blur)="options.showErrors = true"
      [type]="toggle"
      (change)="updateValue($event)">
      <span *ngIf="options?.title"
        class="checkbox-name"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></span>
    </sm-checkbox>
    <div class = "ui error message" *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></div>`,
  styles: [`
    .checkbox-name { white-space: nowrap; }
    mat-error { font-size: 75%; }
  `],
})
export class SemanticUICheckboxComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  trueValue: any = true;
  falseValue: any = false;
  showSlideToggle = false;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
    if (this.controlValue === null || this.controlValue === undefined) {
      this.controlValue = false;
      this.jsf.updateValue(this, this.falseValue);
    }
    if (this.layoutNode.type === 'slide-toggle' ||
      this.layoutNode.format === 'slide-toggle'
    ) {
      this.showSlideToggle = true;
    }
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event.checked ? this.trueValue : this.falseValue);
  }

  get isChecked() {
    return this.jsf.getFormControlValue(this) === this.trueValue;
  }
}
