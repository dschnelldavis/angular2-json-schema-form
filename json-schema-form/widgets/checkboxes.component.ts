import { Component, Input, OnInit } from '@angular/core';
import { FormArray, AbstractControl } from '@angular/forms';

import { buildFormGroup, buildTitleMap, JsonPointer } from '../utilities/index';

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
          [attr.for]="layoutNode?.dataPointer + '/' + checkboxItem.value"
          [class]="options?.itemLabelHtmlClass +
            (checkboxItem.checked ? ' ' + options?.activeClass : '')">
          <input type="checkbox"
            [attr.readonly]="options?.readonly ? 'readonly' : null"
            [attr.required]="options?.required"
            [checked]="checkboxItem.checked"
            [class]="options?.fieldHtmlClass"
            [id]="layoutNode?.dataPointer + '/' + checkboxItem.value"
            [name]="formControlName"
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
            [attr.for]="layoutNode?.dataPointer + '/' + checkboxItem.value"
            [class]="options?.itemLabelHtmlClass +
              (checkboxItem.checked ? ' ' + options?.activeClass : '')">
            <input type="checkbox"
              [attr.readonly]="options?.readonly ? 'readonly' : null"
              [attr.required]="options?.required"
              [checked]="checkboxItem.checked"
              [class]="options?.fieldHtmlClass"
              [id]="options?.name + '/' + checkboxItem.value"
              [name]="options?.name"
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
  private layoutOrientation: string = 'vertical';
  private formArray: FormArray;
  private checkboxList: any[] = [];
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    if (this.layoutNode.type === 'checkboxes-inline' ||
    this.layoutNode.type === 'checkboxbuttons'
  ) {
    this.layoutOrientation = 'horizontal';
  }
    this.formSettings.initializeControl(this);
    this.checkboxList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, true
    );
    if (this.boundControl) {
      this.formArray = this.formSettings.getControl(this);
      for (let checkboxItem of this.checkboxList) {
        checkboxItem.checked = this.formArray.value.length ?
          this.formArray.value.indexOf(checkboxItem.value) !== -1 : false;
      }
    }
  }

  updateValue(event) {
    if (this.boundControl) {
      const templateLibrary = this.formSettings.templateRefLibrary;
      const dataPointer = this.layoutNode.dataPointer;
      while (this.formArray.value.length) this.formArray.removeAt(0);
      for (let checkboxItem of this.checkboxList) {
        if (event.target.value === checkboxItem.value) {
          checkboxItem.checked = event.target.checked;
        }
        if (checkboxItem.checked) {
          let newFormControl =
            buildFormGroup(JsonPointer.get(templateLibrary, [dataPointer + '/-']));
          newFormControl.setValue(checkboxItem.value);
          this.formArray.push(newFormControl);
        }
      }
    }
    this.formArray.markAsDirty();
  }
}
