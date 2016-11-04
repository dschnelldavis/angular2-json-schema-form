import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import {
  buildFormGroup, buildTitleMap, getControl, JsonPointer
} from '../utilities/index';

@Component({
  selector: 'checkboxes-widget',
  template: `
    <label *ngIf="options?.title" [class]="options?.labelHtmlClass"
      [class.sr-only]="options?.notitle" [innerHTML]="options?.title"></label>
    <div [ngSwitch]="layoutNode?.type">
      <div *ngSwitchCase="'checkboxes-inline'"> <!-- checkboxes-inline template -->
        <label *ngFor="let checkboxItem of checkboxList"
          [attr.for]="layoutNode?.dataPointer + '/' + checkboxItem?.value"
          [class]="options?.labelHtmlClass"
          [class.active]="formControlGroup.value[layoutNode?.name].indexOf(checkboxItem?.value) !== -1">
          <input type="checkbox"
            (click)="onClick($event)"
            [id]="layoutNode?.dataPointer + '/' + checkboxItem?.value"
            [name]="layoutNode?.name"
            [class]="options?.fieldHtmlClass"
            [value]="checkboxItem?.value"
            [attr.readonly]="options?.readonly ? 'readonly' : null"
            [attr.required]="options?.required"
            [checked]="checkboxItem?.checked">
          <span [innerHTML]="checkboxItem?.name"></span>
        </label>
      </div>
      <div *ngSwitchDefault> <!-- regular checkboxes template -->
        <div *ngFor="let checkboxItem of checkboxList" [class]="options?.htmlClass">
          <label [attr.for]="layoutNode?.dataPointer + '/' + checkboxItem?.value"
            [class.active]="formControlGroup.value[layoutNode?.name].indexOf(checkboxItem?.value) !== -1">
            <input type="checkbox"
              (click)="onClick($event)"
              [id]="layoutNode?.dataPointer + '/' + checkboxItem?.value"
              [name]="layoutNode?.name"
              [class]="options?.fieldHtmlClass"
              [value]="checkboxItem?.value"
              [attr.readonly]="options?.readonly ? 'readonly' : null"
              [attr.required]="options?.required"
              [checked]="checkboxItem?.checked">
            <span [innerHTML]="checkboxItem?.name"></span>
          </label>
        </div>
      </div>
    </div>`,
})
export class CheckboxesComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private options: any;
  private formArray: FormArray;
  private checkboxList: any[] = [];
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
        this.formArray = this.formControlGroup.controls[this.layoutNode.name];
        this.checkboxList = buildTitleMap(this.options.titleMap, this.options.enum);
        for (let checkboxItem of this.checkboxList) {
          checkboxItem.checked = this.formArray.value.length ?
            this.formArray.value.indexOf(checkboxItem.value) !== -1 : false;
        }
      } else {
        console.error(
          'CheckboxesComponent warning: control "' + this.layoutNode.dataPointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }

  onClick(event) {
    const templateLibrary = this.formSettings.templateRefLibrary;
    const dataPointer = this.layoutNode.dataPointer;
    if (this.bindControl) {
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
