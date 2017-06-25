import { Component, Input, OnInit } from '@angular/core';
import { FormArray, AbstractControl } from '@angular/forms';

import { JsonSchemaFormService, CheckboxItem } from '../json-schema-form.service';
import { buildFormGroup, buildTitleMap, JsonPointer } from '../shared';

@Component({
  selector: 'checkboxes-widget',
  template: `
    <label *ngIf="options?.title"
      [class]="options?.labelHtmlClass"
      [style.display]="options?.notitle ? 'none' : ''"
      [innerHTML]="options?.title"></label>

    <!-- 'horizontal' = checkboxes-inline or checkboxbuttons -->
    <div *ngIf="layoutOrientation === 'horizontal'" [class]="options?.htmlClass">
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
    <div *ngIf="layoutOrientation === 'vertical'">
      <div *ngFor="let checkboxItem of checkboxList" [class]="options?.htmlClass">
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
    </div>`,
})
export class CheckboxesComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  boundControl: boolean = false;
  options: any;
  layoutOrientation: string;
  formArray: AbstractControl;
  checkboxList: CheckboxItem[] = [];
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
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
