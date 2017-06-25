import { Component, Input, OnInit } from '@angular/core';
import { FormArray, AbstractControl } from '@angular/forms';

import { JsonSchemaFormService, CheckboxItem } from '../../json-schema-form.service';
import { buildFormGroup, buildTitleMap, JsonPointer } from '../../shared';

@Component({
  selector: 'material-checkboxes-widget',
  template: `
    <md-checkbox type="checkbox"
      [color]="options?.color || 'primary'"
      [disabled]="controlDisabled || options?.readonly"
      [name]="options?.name"
      [checked]="allChecked"
      [indeterminate]="someChecked"
      (change)="updateAllValues($event)">
      <span class="checkbox-name" [innerHTML]="options?.name"></span>
    </md-checkbox>
    <label *ngIf="options?.title"
      [class]="options?.labelHtmlClass"
      [style.display]="options?.notitle ? 'none' : ''"
      [innerHTML]="options?.title"></label>
    <ul class="checkbox-list" [class.horizontal-list]="horizontalList">
      <li *ngFor="let checkboxItem of checkboxList"
        [class]="options?.htmlClass">
        <md-checkbox type="checkbox"
          [(ngModel)]="checkboxItem.checked"
          [color]="options?.color || 'primary'"
          [disabled]="controlDisabled || options?.readonly"
          [name]="checkboxItem?.name"
          (change)="updateValue($event)">
          <span class="checkbox-name" [innerHTML]="checkboxItem?.name"></span>
        </md-checkbox>
      </li>
    </ul>`,
  styles: [`
    .checkbox-list { list-style-type: none; }
    .horizontal-list > li {
      display: inline-block;
      margin-right: 10px;
      zoom: 1;
    }
    .checkbox-name { white-space: nowrap; }
  `],
})
export class MaterialCheckboxesComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled: boolean = false;
  boundControl: boolean = false;
  options: any;
  horizontalList: boolean = false;
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
    this.horizontalList = this.layoutNode.type === 'checkboxes-inline' ||
      this.layoutNode.type === 'checkboxbuttons';
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

  get allChecked(): boolean {
    return this.checkboxList.filter(t => t.checked).length === this.checkboxList.length;
  }

  get someChecked(): boolean {
    const checkedItems = this.checkboxList.filter(t => t.checked).length;
    return checkedItems > 0 && checkedItems < this.checkboxList.length;
  }

  updateValue(event: any) {
    if (this.boundControl) {
      this.jsf.updateArrayCheckboxList(this, this.checkboxList);
    }
  }

  updateAllValues(event: any) {
    this.checkboxList.forEach(t => t.checked = event.checked);
  }
}
