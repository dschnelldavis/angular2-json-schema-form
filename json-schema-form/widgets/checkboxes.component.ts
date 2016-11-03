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
        <label *ngFor="let checkboxItem of checkboxList"
          [attr.for]="layoutNode?.pointer + '/' + checkboxItem?.value"
          [class]="layoutNode?.labelHtmlClass"
          [class.active]="formControlGroup.value[layoutNode?.name].indexOf(checkboxItem?.value) !== -1">
          <input type="checkbox"
            (click)="onClick($event)"
            [id]="layoutNode?.pointer + '/' + checkboxItem?.value"
            [name]="layoutNode?.name"
            [class]="layoutNode?.fieldHtmlClass"
            [value]="checkboxItem?.value"
            [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
            [attr.required]="layoutNode?.required"
            [checked]="checkboxItem?.checked">
          <span [innerHTML]="checkboxItem?.name"></span>
        </label>
      </div>
      <div *ngSwitchDefault> <!-- regular checkboxes template -->
        <div *ngFor="let checkboxItem of checkboxList" [class]="layoutNode?.htmlClass">
          <label [attr.for]="layoutNode?.pointer + '/' + checkboxItem?.value"
            [class.active]="formControlGroup.value[layoutNode?.name].indexOf(checkboxItem?.value) !== -1">
            <input type="checkbox"
              (click)="onClick($event)"
              [id]="layoutNode?.pointer + '/' + checkboxItem?.value"
              [name]="layoutNode?.name"
              [class]="layoutNode?.fieldHtmlClass"
              [value]="checkboxItem?.value"
              [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
              [attr.required]="layoutNode?.required"
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
  private formArray: FormArray;
  private checkboxList: any[] = [];
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
        this.checkboxList = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
        for (let checkboxItem of this.checkboxList) {
          checkboxItem.checked = this.formArray.value.length ?
            this.formArray.value.indexOf(checkboxItem.value) !== -1 : false;
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
      for (let checkboxItem of this.checkboxList) {
        if (event.target.value === checkboxItem.value) {
          checkboxItem.checked = event.target.checked;
        }
        if (checkboxItem.checked) {
          this.layoutNode.controlTemplate.value = checkboxItem.value;
          this.formArray.push(buildFormGroup(this.layoutNode.controlTemplate));
        }
      }
    }
    (<any>this.formArray)._pristine = false;
  }
}
