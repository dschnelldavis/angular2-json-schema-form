import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import {
  buildFormGroup, buildTitleMap, getControl, JsonPointer
} from '../utilities/index';

@Component({
  selector: 'checkboxes-widget',
  template: `
    <label *ngIf="options?.title"
      [class]="options?.labelHtmlClass"
      [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div [ngSwitch]="layoutOrientation">
      <div *ngSwitchCase="'horizontal'"
        [class]="options?.htmlClass"> <!-- checkboxes-inline or checkboxbuttons -->
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
            (click)="onClick($event)">
          <span [innerHTML]="checkboxItem.name"></span>
        </label>
      </div>
      <!-- default: *ngSwitchCase="'vertical'" -->
      <div *ngSwitchDefault
        [class]="options?.htmlClass"> <!-- regular checkboxes -->
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
              [id]="layoutNode?.dataPointer + '/' + checkboxItem.value"
              [name]="formControlName"
              [value]="checkboxItem.value"
              (click)="onClick($event)">
            <span [innerHTML]="checkboxItem?.name"></span>
          </label>
        </div>
      </div>
    </div>`,
})
export class CheckboxesComponent implements OnInit {
  private formControlGroup: any;
  private formControl: any;
  private formControlName: string;
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
    if (this.layoutNode.type === 'checkboxes-inline' ||
      this.layoutNode.type === 'checkboxbuttons'
    ) {
      this.layoutOrientation = 'horizontal';
    }
    this.options = this.layoutNode.options;
    this.formControlGroup = this.formSettings.getControlGroup(this);
    this.formControlName = this.formSettings.getControlName(this);
    this.boundControl = this.formSettings.isControlBound(this);
    this.checkboxList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, true
    );
    if (this.boundControl) {
      this.formControl = this.formSettings.getControl(this);
      this.formArray = this.formSettings.getControl(this);
      for (let checkboxItem of this.checkboxList) {
        checkboxItem.checked = this.formArray.value.length ?
          this.formArray.value.indexOf(checkboxItem.value) !== -1 : false;
      }
    } else {
      console.error(
        'CheckboxesComponent warning: control "' + this.formSettings.getDataPointer(this) +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
  }

  onClick(event) {
    const templateLibrary = this.formSettings.templateRefLibrary;
    const dataPointer = this.layoutNode.dataPointer;
    if (this.boundControl) {
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
