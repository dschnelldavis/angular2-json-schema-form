import { Component, Input, OnInit } from '@angular/core';
import { FormArray, AbstractControl } from '@angular/forms';

import { JsonSchemaFormService, CheckboxItem } from '../library/json-schema-form.service';
import { buildFormGroup, buildTitleMap, JsonPointer } from '../library/utilities/index';

@Component({
  selector: 'checkboxes-widget',
  template: `
    <label *ngIf="options?.title"
      [class]="options?.labelHtmlClass"
      [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div [ngSwitch]="layoutOrientation">

      <!-- 'horizontal' = checkboxes-inline or checkboxbuttons -->
      <div *ngSwitchCase="'horizontal'"
        [class]="options?.htmlClass">
        <label *ngFor="let checkboxItem of checkboxList"
          [attr.for]="'control' + layoutNode?._id + '/' + checkboxItem.value"
          [class]="options?.itemLabelHtmlClass + (checkboxItem.checked ?
            (' ' + options?.activeClass + ' ' + options?.style?.selected) :
            (' ' + options?.style?.unselected))">
          <input type="checkbox"
            [attr.required]="options?.required"
            [checked]="checkboxItem.checked"
            [class]="options?.fieldHtmlClass"
            [disabled]="controlDisabled"
            [id]="'control' + layoutNode?._id + '/' + checkboxItem.value"
            [name]="formControlName"
            [readonly]="options?.readonly ? 'readonly' : null"
            [value]="checkboxItem.value"
            (change)="updateValue($event)">
          <span [innerHTML]="checkboxItem.name"></span>
        </label>
      </div>

      <!-- 'vertical' = regular checkboxes -->
      <div *ngSwitchDefault>
        <div *ngFor="let checkboxItem of checkboxList"
          [class]="options?.htmlClass">
          <label
            [attr.for]="'control' + layoutNode?._id + '/' + checkboxItem.value"
            [class]="options?.itemLabelHtmlClass + (checkboxItem.checked ?
              (' ' + options?.activeClass + ' ' + options?.style?.selected) :
              (' ' + options?.style?.unselected))">
            <input type="checkbox"
              [attr.required]="options?.required"
              [checked]="checkboxItem.checked"
              [class]="options?.fieldHtmlClass"
              [disabled]="controlDisabled"
              [id]="options?.name + '/' + checkboxItem.value"
              [name]="options?.name"
              [readonly]="options?.readonly ? 'readonly' : null"
              [value]="checkboxItem.value"
              (change)="updateValue($event)">
            <span [innerHTML]="checkboxItem?.name"></span>
          </label>
        </div>
      </div>

    </div>`,
})
export class CheckboxesComponent implements OnInit {
  private formControl: AbstractControl;
  private controlName: string;
  private controlValue: any;
  private boundControl: boolean = false;
  private options: any;
  private layoutOrientation: string;
  private formArray: AbstractControl;
  private checkboxList: CheckboxItem[] = [];
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.layoutOrientation = (this.layoutNode.type === 'checkboxes-inline' ||
      this.layoutNode.type === 'checkboxbuttons') ? 'horizontal' : 'vertical';
    this.jsf.initializeControl(this);
    this.checkboxList = buildTitleMap(
      this.options.titleMap || this.options.enumNames, this.options.enum, true
    );
    if (this.boundControl) {
      const formArray = this.jsf.getControl(this);
      for (let checkboxItem of this.checkboxList) {
        checkboxItem.checked = formArray.value.indexOf(checkboxItem.value) !== -1;
      }
    }
  }

  updateValue(event) {
    for (let checkboxItem of this.checkboxList) {
      if (event.target.value === checkboxItem.value) {
        checkboxItem.checked = event.target.checked;
      }
    }
    if (this.boundControl) {
      this.jsf.updateArrayCheckboxList(this, this.checkboxList);
    }
  }
}
