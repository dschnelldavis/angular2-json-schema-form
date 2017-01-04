import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../library/json-schema-form.service';
import { buildTitleMap } from '../../library/utilities/index';

@Component({
  selector: 'material-select-widget',
  template: `
    <section [class]="options?.htmlClass">
      <md-select #inputControl
        [(ngModel)]="controlValue"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.name]="controlName"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [class]="options?.fieldHtmlClass"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [placeholder]="options?.title"
        [required]="options?.required"
        (onClose)="updateValue($event)">
        <md-option *ngFor="let selectItem of selectList"
          [value]="selectItem.value"
          [attr.selected]="selectItem.value === controlValue">{{selectItem.name}}</md-option>
      </md-select>
    </section>`,
    styles: [`md-select { margin-top: 18px; }`]
})
export class MaterialSelectComponent implements OnInit {
  private formControl: AbstractControl;
  private controlName: string;
  private controlValue: any;
  private controlDisabled: boolean = false;
  private boundControl: boolean = false;
  private options: any;
  private selectList: any[] = [];
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum,
      !!this.options.required
    );
    this.jsf.initializeControl(this);
  }

  private updateValue(event) {
    this.jsf.updateValue(this, this.controlValue);
  }
}
