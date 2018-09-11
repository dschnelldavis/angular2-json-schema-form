import { Component, Input, OnInit } from '@angular/core';
import { FormArray, AbstractControl } from '@angular/forms';

import { JsonSchemaFormService, TitleMapItem } from '../../json-schema-form.service';
import { buildFormGroup, buildTitleMap, hasOwn, JsonPointer } from '../../shared';

// TODO: Change this to use a Selection List instead?
// https://material.angular.io/components/list/overview

@Component({
  selector: 'semantic-ui-checkboxes-widget',
  template: `
    <div class="field">
      <label *ngIf="options?.title"
             class="title"
             [class]="options?.labelHtmlClass || ''"
             [style.display]="options?.notitle ? 'none' : ''"
             [innerHTML]="options?.title"></label>
      <sm-checkbox type="checkbox"
        [class.checked]="allChecked"
        [class]="options?.color || 'primary'"
        [class.disabled]="controlDisabled || options?.readonly"
        [name]="options?.name"
        (blur)="options.showErrors = true"
        (change)="updateAllValues($event)">
        <span class="checkbox-name" [innerHTML]="options?.name"></span>
      </sm-checkbox>
      <ul class="checkbox-list" [class.horizontal-list]="horizontalList">
        <li *ngFor="let checkboxItem of checkboxList"
          [class]="options?.htmlClass || ''">
          <sm-checkbox type="checkbox"
            [(ngModel)]="checkboxItem.checked"
            [class.color]="options?.color || 'primary'"
            [class.disabled]="controlDisabled || options?.readonly"
            [name]="checkboxItem?.name"
            (blur)="options.showErrors = true"
            (change)="updateValue()">
            <span class="checkbox-name" [innerHTML]="checkboxItem?.name"></span>
          </sm-checkbox>
        </li>
      </ul>
      <div class = "ui error message"  *ngIf="options?.showErrors && options?.errorMessage"
        [innerHTML]="options?.errorMessage"></div>
    </div>`,
  styles: [`
    .title { font-weight: bold; }
    .checkbox-list { list-style-type: none; }
    .horizontal-list > li { display: inline-block; margin-right: 10px; zoom: 1; }
    .checkbox-name { white-space: nowrap; }
    mat-error { font-size: 75%; }
  `],
})
export class SemanticUICheckboxesComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  horizontalList = false;
  formArray: AbstractControl;
  checkboxList: TitleMapItem[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.horizontalList = this.layoutNode.type === 'checkboxes-inline' ||
      this.layoutNode.type === 'checkboxbuttons';
    this.jsf.initializeControl(this);
    this.checkboxList = buildTitleMap(
      this.options.titleMap || this.options.enumNames, this.options.enum, true
    );
    if (this.boundControl) {
      const formArray = this.jsf.getFormControl(this);
      for (let checkboxItem of this.checkboxList) {
        checkboxItem.checked = formArray.value.includes(checkboxItem.value);
      }
    }
  }

  get allChecked(): boolean {
    return this.checkboxList.filter(t => t.checked).length === this.checkboxList.length;
  }

  get someChecked(): boolean {
    const checkedItems = this.checkboxList.filter(t => t.checked).length;
    return checkedItems > 0 && checkedItems < this.checkboxList.length;
  }

  updateValue() {
    this.options.showErrors = true;
    if (this.boundControl) {
      this.jsf.updateArrayCheckboxList(this, this.checkboxList);
    }
  }

  updateAllValues(event: any) {
    this.options.showErrors = true;
    this.checkboxList.forEach(t => t.checked = event.checked);
    this.updateValue();
  }
}
