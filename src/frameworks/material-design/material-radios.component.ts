import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../library/json-schema-form.service';
import { buildTitleMap } from '../../library/utilities/index';

@Component({
  selector: 'material-radios-widget',
  template: `
    <label *ngIf="options?.title"
      [attr.for]="'control' + layoutNode?._id"
      [class]="options?.labelHtmlClass"
      [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <md-radio-group
      [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
      [attr.readonly]="options?.readonly ? 'readonly' : null"
      [attr.required]="options?.required"
      [class]="options?.fieldHtmlClass"
      [disabled]="controlDisabled"
      [name]="controlName"
      [value]="controlValue">
      <div *ngFor="let radioItem of radiosList">
        <md-radio-button
          [id]="'control' + layoutNode?._id + '/' + radioItem?.value"
          [value]="radioItem?.value"
          (click)="updateValue(radioItem?.value)">
          <span [innerHTML]="radioItem?.name"></span>
        </md-radio-button>
        <span *ngIf="layoutOrientation === 'horizontal'">&nbsp;</span>
        <br *ngIf="layoutOrientation === 'vertical'" />
      </div>
    </md-radio-group>`,
})
export class MaterialRadiosComponent implements OnInit {
  private formControl: AbstractControl;
  private controlName: string;
  private controlValue: any;
  private controlDisabled: boolean = false;
  private boundControl: boolean = false;
  private options: any;
  private layoutOrientation: string = 'vertical';
  private radiosList: any[] = [];
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
    if (this.layoutNode.type === 'radios-inline' ||
      this.layoutNode.type === 'radiobuttons'
    ) {
      this.layoutOrientation = 'horizontal';
    }
    this.radiosList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, true
    );
    this.jsf.initializeControl(this);
  }

  private updateValue(value) {
    this.jsf.updateValue(this, value);
  }
}
