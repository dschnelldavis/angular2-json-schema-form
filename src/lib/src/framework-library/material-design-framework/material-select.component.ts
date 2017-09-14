import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { hasOwn } from './../../shared/utility.functions';


import { JsonSchemaFormService } from '../../json-schema-form.service';
import { buildTitleMap } from '../../shared';

@Component({
  selector: 'material-select-widget',
  template: `
    <section [style.width]="'100%'" [class]="options?.htmlClass || null">
      <md-select #inputControl *ngIf="isConditionallyShown()"
        [(ngModel)]="controlValue"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.name]="controlName"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [disabled]="controlDisabled"
        [floatPlaceholder]="options?.floatPlaceholder || (options?.notitle ? 'never' : 'auto')"
        [id]="'control' + layoutNode?._id"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [style.width]="'100%'"
        (onClose)="updateValue()">
        <md-option *ngFor="let selectItem of selectList"
          [value]="selectItem.value"
          [attr.selected]="selectItem.value === controlValue">{{selectItem.name}}</md-option>
      </md-select>
    </section>`,
})
export class MaterialSelectComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled: boolean = false;
  boundControl: boolean = false;
  options: any;
  selectList: any[] = [];
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
  @Input() data: any;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum,
      !!this.options.required
    );
    this.jsf.initializeControl(this);
  }

  updateValue() {
    this.jsf.updateValue(this, this.controlValue === '' ? null : this.controlValue);
  }

  isConditionallyShown(): boolean {
    this.data = this.jsf.data;
    let result: boolean = true;
    if (this.data && hasOwn(this.options, 'condition')) {
      const model = this.data;

      /* tslint:disable */
      eval('result = ' + this.options.condition);
      /* tslint:enable */
    }

    return result;
  }
}
