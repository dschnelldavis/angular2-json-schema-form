import { Component, Input, OnInit } from '@angular/core';
import { FormArray, AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { buildFormGroup, buildTitleMap, JsonPointer } from '../../utilities/index';

@Component({
  selector: 'material-checkboxes-widget',
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
export class MaterialCheckboxesComponent implements OnInit {
  private formControl: AbstractControl;
  private controlName: string;
  private controlValue: any;
  private boundControl: boolean = false;
  private options: any;
  private layoutOrientation: string = 'vertical';
  private formArray: AbstractControl;
  private checkboxList: any[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
    if (this.layoutNode.type === 'checkboxes-inline' ||
    this.layoutNode.type === 'checkboxbuttons'
  ) {
    this.layoutOrientation = 'horizontal';
  }
    this.jsf.initializeControl(this);
    this.checkboxList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, true
    );
    if (this.boundControl) {
      this.formArray = this.jsf.getControl(this);
      for (let checkboxItem of this.checkboxList) {
        checkboxItem.checked = this.formArray.value.length ?
          this.formArray.value.indexOf(checkboxItem.value) !== -1 : false;
      }
    }
  }

  updateValue(event) {
    if (this.boundControl) {
      // Remove all existing items
      while (this.formArray.value.length) (<FormArray>this.formArray).removeAt(0);
      // Re-add an item for each checked box
      for (let checkboxItem of this.checkboxList) {
        if (event.target.value === checkboxItem.value) {
          checkboxItem.checked = event.target.checked;
        }
        if (checkboxItem.checked) {
          let newFormControl =
            buildFormGroup(JsonPointer.get(
              this.jsf.templateRefLibrary, [this.layoutNode.dataPointer + '/-']
            ));
          newFormControl.setValue(checkboxItem.value);
          (<FormArray>this.formArray).push(newFormControl);
        }
      }
    }
    this.formArray.markAsDirty();
  }
}
