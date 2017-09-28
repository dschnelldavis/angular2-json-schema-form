import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { buildTitleMap, isArray } from '../../shared';

@Component({
  selector: 'material-select-widget',
  template: `
    <section [style.width]="'100%'" [class]="options?.htmlClass || null">
      <mat-select #inputControl *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.name]="controlName"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [floatPlaceholder]="options?.floatPlaceholder || (options?.notitle ? 'never' : 'auto')"
        [id]="'control' + layoutNode?._id"
        [multiple]="options?.multiple"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [style.width]="'100%'">
        <ng-template ngFor let-selectItem [ngForOf]="selectList">
          <mat-option *ngIf="!isArray(selectItem?.items)"
            [value]="selectItem?.value">
            <span [innerHTML]="selectItem?.name"></span>
          </mat-option>
          <mat-optgroup *ngIf="isArray(selectItem?.items)"
            [label]="selectItem?.group">
            <mat-option *ngFor="let subItem of selectItem.items"
              [value]="subItem?.value">
              <span [innerHTML]="subItem?.name"></span>
            </mat-option>
          </mat-optgroup>
        </ng-template>
      </mat-select>
      <mat-select #inputControl *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.name]="controlName"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [disabled]="controlDisabled"
        [floatPlaceholder]="options?.floatPlaceholder || (options?.notitle ? 'never' : 'auto')"
        [id]="'control' + layoutNode?._id"
        [multiple]="options?.multiple"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [style.width]="'100%'"
        [value]="controlValue"
        (change)="updateValue($event)">
        <ng-template ngFor let-selectItem [ngForOf]="selectList">
          <mat-option *ngIf="!isArray(selectItem?.items)"
            [attr.selected]="selectItem?.value === controlValue"
            [value]="selectItem?.value">
            <span [innerHTML]="selectItem?.name"></span>
          </mat-option>
          <mat-optgroup *ngIf="isArray(selectItem?.items)"
            [label]="selectItem?.group">
            <mat-option *ngFor="let subItem of selectItem.items"
              [attr.selected]="subItem?.value === controlValue"
              [value]="subItem?.value">
              <span [innerHTML]="subItem?.name"></span>
            </mat-option>
          </mat-optgroup>
        </ng-template>
      </mat-select>
      <div class="mat-input-hint-wrapper mat-form-field-hint-wrapper">
        <mat-hint class="mat-hint mat-left"></mat-hint>
        <div class="mat-input-hint-spacer mat-form-field-hint-spacer"></div>
        <mat-hint *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"
          class="mat-hint mat-right"
          [innerHTML]="options?.description"></mat-hint>
        <mat-hint *ngIf="options?.showErrors && options?.errorMessage"
          class="mat-hint mat-right mat-error"
          [innerHTML]="options?.errorMessage"></mat-hint>
      </div>
    </section>`,
    styles: [`
      mat-hint { font-size: 75%; }
      mat-hint.mat-error { color: red; }
    `],
})
export class MaterialSelectComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled: boolean = false;
  boundControl: boolean = false;
  options: any;
  selectList: any[] = [];
  isArray = isArray;
  @Input() formID: number;
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
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.value);
    this.options.showErrors = true
  }
}
