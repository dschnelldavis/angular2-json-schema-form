import { Component, Input, OnInit } from '@angular/core';
import { FormArray, AbstractControl } from '@angular/forms';

import { JsonSchemaFormService, CheckboxItem } from '../../library/json-schema-form.service';
import { buildFormGroup, buildTitleMap, JsonPointer } from '../../library/utilities/index';

@Component({
  selector: 'material-checkboxes-widget',
  template: `
    <md-checkbox type="checkbox"
      [color]="options?.color || 'accent'"
      [disabled]="controlDisabled || options?.readonly"
      [name]="options?.name"
      [checked]="allChecked"
      [indeterminate]="someChecked"
      (change)="updateValue($event, true)">
      <span [innerHTML]="checkboxItem?.name"></span>
    </md-checkbox>
    <label *ngIf="options?.title"
      [class]="options?.labelHtmlClass"
      [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <ul class="checkbox-list" [class.horizontal-list]="horizontalList">
      <li *ngFor="let checkboxItem of checkboxList"
        [class]="options?.htmlClass">
        <md-checkbox type="checkbox"
          [(ngModel)]="checkboxItem.checked"
          [color]="options?.color || 'accent'"
          [disabled]="controlDisabled || options?.readonly"
          [name]="checkboxItem?.name"
          (change)="updateValue($event)">
          <span [innerHTML]="checkboxItem?.name"></span>
        </md-checkbox>
      </li>
    </ul>`,
  styles: [`
    .checkbox-list {
      list-style-type: none;
    }
    .horizontal-list > li {
      display: inline-block;
      margin-right: 10px;
      zoom: 1;
      *display: inline;
    }
  `]
})
export class MaterialCheckboxesComponent implements OnInit {
  private formControl: AbstractControl;
  private controlName: string;
  private controlValue: any;
  private boundControl: boolean = false;
  private options: any;
  private horizontalList: boolean = false;
  private formArray: AbstractControl;
  private checkboxList: CheckboxItem[] = [];
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
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

  updateValue(event: any, checkAll: boolean = false) {
    if (checkAll) {
      this.checkboxList.forEach(t => t.checked = event.checked);
    }
    if (this.boundControl) {
      this.jsf.updateArrayCheckboxList(this, this.checkboxList);
    }
  }
}
