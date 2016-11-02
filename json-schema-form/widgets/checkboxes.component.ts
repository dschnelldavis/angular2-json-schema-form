import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import { buildFormGroup, buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'checkboxes-widget',
  template: `
    <label *ngIf="layoutNode?.title" [class]="layoutNode?.labelHtmlClass"
      [class.sr-only]="layoutNode?.notitle" [innerHTML]="layoutNode?.title"></label>
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
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      this.formControlGroup = getControl(this.options.formGroup, this.layoutNode.pointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
        this.formArray = this.formControlGroup.controls[this.layoutNode.name];
        this.dataMap = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
        for (let mapItem of this.dataMap) {
          mapItem.checked = this.formArray.value.length ?
            this.formArray.value.indexOf(mapItem.value) !== -1 : false;
        }
      } else {
        console.error(
          'CheckboxesComponent warning: control "' + this.layoutNode.pointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }

  onClick(event) {
    if (this.bindControl) {
      while (this.formArray.value.length) this.formArray.removeAt(0);
      for (let mapItem of this.dataMap) {
        if (event.target.value === mapItem.value) {
          mapItem.checked = event.target.checked;
        }
        if (mapItem.checked) {
          this.layoutNode.controlTemplate.value = mapItem.value;
          this.formArray.push(buildFormGroup(this.layoutNode.controlTemplate));
        }
      }
    }
    (<any>this.formArray)._pristine = false;
  }
}
