import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { buildTitleMap, isArray } from '../../shared';

@Component({
  selector: 'semantic-ui-select-widget',
  template: `
    <div
      [class]="'field ' + options?.htmlClass || ''">
      <!--<span matPrefix *ngIf="options?.prefix || options?.fieldAddonLeft"-->
        <!--[innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>-->
      <label
        [innerHTML]="options?.notitle ? '' : options?.title"></label>
      <sm-select *ngIf="boundControl" ngDefaultControl
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.name]="controlName"
        [id]="'control' + layoutNode?._id"
        [class.multiple]="options?.multiple"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [style.width]="'100%'"
        (blur)="options.showErrors = true">
        <ng-template ngFor let-selectItem [ngForOf]="selectList">
          <option *ngIf="!isArray(selectItem?.items)"
            [value]="selectItem?.value">
            <span [innerHTML]="selectItem?.name"></span>
          </option>
          <option *ngIf="isArray(selectItem?.items)">
            <span> TODO</span>
          </option>
        </ng-template>
      </sm-select>
      <sm-select *ngIf="!boundControl" ngDefaultControl
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.name]="controlName"
        [class.disabled]="controlDisabled || options?.readonly"
        [id]="'control' + layoutNode?._id"
        [class.multiple]="options?.multiple"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [attr.required]="options?.required"
        [style.width]="'100%'"
        (blur)="options.showErrors = true"
        (change)="updateValue($event)">
        <ng-template ngFor let-selectItem [ngForOf]="selectList">
          <option *ngIf="!isArray(selectItem?.items)"
            [attr.selected]="selectItem?.value === controlValue"
            [value]="selectItem?.value">
            <span [innerHTML]="selectItem?.name"></span>
          </option>
          <option *ngIf="isArray(selectItem?.items)"
            [label]="selectItem?.group">
            Not Defined
          </option>
        </ng-template>
      </sm-select>
      <!--<span matSuffix *ngIf="options?.suffix || options?.fieldAddonRight"-->
        <!--[innerHTML]="options?.suffix || options?.fieldAddonRight"></span>-->
      <!--<mat-hint *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"-->
        <!--align="end" [innerHTML]="options?.description"></mat-hint>-->
    </div>
    <div class = "ui error message" *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></div>`,
  styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
    ::ng-deep mat-form-field .mat-form-field-wrapper .mat-form-field-flex
      .mat-form-field-infix { width: initial; }
  `],
})
export class SemanticUISelectComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  selectList: any[] = [];
  isArray = isArray;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, !!this.options.required, !!this.options.flatList
    );
    this.jsf.initializeControl(this, !this.options.readonly);
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event.value);
  }
}
