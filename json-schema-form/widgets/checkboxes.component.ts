import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import { buildFormGroup, buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'checkboxes-widget',
  template: `
    <div [ngSwitch]="layoutNode?.type">
      <div *ngSwitchCase="'checkboxes-inline'"> <!-- checkboxes-inline template -->
        <label *ngFor="let item of dataMap"
          [attr.for]="layoutNode?.pointer + '/' + item?.value"
          [class]="layoutNode?.labelHtmlClass"
          [class.active]="formControlGroup.value[layoutNode?.name].indexOf(item?.value) !== -1">
          <input type="checkbox"
            (click)="onClick($event)"
            [id]="layoutNode?.pointer + '/' + item?.value"
            [name]="layoutNode?.name"
            [class]="layoutNode?.fieldHtmlClass"
            [value]="item?.value"
            [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
            [attr.required]="layoutNode?.required"
            [checked]="item?.checked">
          <span [innerHTML]="item?.name"></span>
        </label>
      </div>
      <div *ngSwitchDefault> <!-- regular checkboxes template -->
        <div *ngFor="let item of dataMap" [class]="layoutNode?.htmlClass">
          <label [attr.for]="layoutNode?.pointer + '/' + item?.value"
            [class.active]="formControlGroup.value[layoutNode?.name].indexOf(item?.value) !== -1">
            <input type="checkbox"
              (click)="onClick($event)"
              [id]="layoutNode?.pointer + '/' + item?.value"
              [name]="layoutNode?.name"
              [class]="layoutNode?.fieldHtmlClass"
              [value]="item?.value"
              [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
              [attr.required]="layoutNode?.required"
              [checked]="item?.checked">
            <span [innerHTML]="item?.name"></span>
          </label>
        </div>
      </div>
    </div>`,
})
export class CheckboxesComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private formArray: FormArray;
  private dataMap: any[] = [];
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      this.formControlGroup = getControl(this.formGroup, this.layoutNode.pointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
        this.formArray = this.formControlGroup.controls[this.layoutNode.name];
        this.dataMap = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
        for (let i = 0, l = this.dataMap.length; i < l; i++) {
          if (this.formArray.value.length) {
            this.dataMap[i].checked = this.formArray.value.indexOf(this.dataMap[i].value) !== -1;
          } else {
            this.dataMap[i].checked = false;
          }
        }
      } else {
        console.error(
          'Warning: control "' + this.layoutNode.pointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }

  onClick(event) {
    if (this.bindControl) {
      while (this.formArray.value.length) this.formArray.removeAt(0);
      for (let i = 0, l = this.dataMap.length; i < l; i++) {
        if (event.target.value === this.dataMap[i].value) {
          this.dataMap[i].checked = event.target.checked;
        }
        if (this.dataMap[i].checked) {
          this.layoutNode.controlTemplate.value = this.dataMap[i].value;
          this.formArray.push(buildFormGroup(this.layoutNode.controlTemplate));
        }
      }
    }
    (<any>this.formArray)._pristine = false;
  }
}
