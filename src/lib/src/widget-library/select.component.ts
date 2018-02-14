import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { buildTitleMap, isArray } from '../shared';

@Component({
  selector: 'select-widget',
  template: `
    <div
      [class]="options?.htmlClass || ''">
      <label *ngIf="options?.title"
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.labelHtmlClass || ''"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
      <select *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [class]="options?.fieldHtmlClass || ''"
        [id]="'control' + layoutNode?._id"
        [name]="controlName">
        <ng-template ngFor let-selectItem [ngForOf]="selectList">
          <option *ngIf="!isArray(selectItem?.items) && showOption(selectItem, layoutNode)"
            [value]="selectItem?.value">
            <span [innerHTML]="selectItem?.name"></span>
          </option>
          <optgroup *ngIf="isArray(selectItem?.items)"
            [label]="selectItem?.group">
            <ng-container *ngFor="let subItem of selectItem.items">
              <option *ngIf="showOption(subItem, layoutNode)"
                [value]="subItem?.value">
                <span [innerHTML]="subItem?.name"></span>
              </option>
            </ng-container>
          </optgroup>
        </ng-template>
      </select>
      <select *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [class]="options?.fieldHtmlClass || ''"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        (change)="updateValue($event)">
        <ng-template ngFor let-selectItem [ngForOf]="selectList">
          <option *ngIf="!isArray(selectItem?.items) && showOption(selectItem, layoutNode)"
            [selected]="selectItem?.value === controlValue"
            [value]="selectItem?.value">
            <span [innerHTML]="selectItem?.name"></span>
          </option>
          <optgroup *ngIf="isArray(selectItem?.items)"
            [label]="selectItem?.group">
            <ng-container *ngFor="let subItem of selectItem.items">
              <option *ngIf="showOption(subItem, layoutNode) && showOption(selectItem, layoutNode)"
                [attr.selected]="subItem?.value === controlValue"
                [value]="subItem?.value">
                <span [innerHTML]="subItem?.name"></span>
              </option>
            </ng-container>
          </optgroup>
        </ng-template>
      </select>
    </div>`,
})
export class SelectComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  selectList: any[] = [];
  isArray = isArray;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, !!this.options.required, !!this.options.flatList
    );
    this.jsf.initializeControl(this);
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }

  showOption(item: any, layoutNode: any): boolean {
    if (item.conditionKey !== undefined && layoutNode.options.conditionMap !== undefined) {
      item.options = new Object();

      for (const condition of layoutNode.options.conditionMap) {
        if (condition.key === item.conditionKey) {
          item.options.condition = condition.condition;
          return this.jsf.evaluateCondition(item, this.dataIndex);
        }
      }
    } else if (item !== undefined && item.condition !== undefined) {
      item.options = new Object();
      item.options.condition = item.condition;
      return this.jsf.evaluateCondition(item, this.dataIndex);
    }
    return true;
  }
}
