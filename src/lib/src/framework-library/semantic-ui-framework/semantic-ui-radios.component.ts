import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { buildTitleMap } from '../../shared';

@Component({
  selector: 'semantic-ui-radios-widget',
  template: `
      <div class="fields" *ngIf="boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [style.flex-direction]="flexDirection"
        (blur)="options.showErrors = true">
        <label *ngIf="options?.title"
               [attr.for]="'control' + layoutNode?._id"
               [class]="options?.labelHtmlClass || ''"
               [style.display]="options?.notitle ? 'none' : ''"
               [innerHTML]="options?.title"></label>
        <sm-checkbox *ngFor="let radioItem of radiosList"
          [id]="'control' + layoutNode?._id + '/' + radioItem?.name"
          [value]="radioItem?.value"
          [label]="radioItem?.name">
        </sm-checkbox>
        <div class = "ui error message"  *ngIf="options?.showErrors && options?.errorMessage"
             [innerHTML]="options?.errorMessage"></div>
      </div>
      <div class="fields" *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [style.flex-direction]="flexDirection"
        [class.disabled]="controlDisabled || options?.readonly">
        <label *ngIf="options?.title"
               [attr.for]="'control' + layoutNode?._id"
               [class]="options?.labelHtmlClass || ''"
               [style.display]="options?.notitle ? 'none' : ''"
               [innerHTML]="options?.title"></label>
        <sm-checkbox *ngFor="let radioItem of radiosList"
          [id]="'control' + layoutNode?._id + '/' + radioItem?.name"
          [value]="radioItem?.value"
          (click)="updateValue(radioItem?.value)" [label]="radioItem?.name">
        </sm-checkbox>
        <div class = "ui error message"  *ngIf="options?.showErrors && options?.errorMessage"
             [innerHTML]="options?.errorMessage"></div>
      </div>`,
  styles: [`
    mat-radio-group { display: inline-flex; }
    mat-radio-button { margin: 2px; }
    mat-error { font-size: 75%; }
  `]
})
export class SemanticUIRadiosComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  flexDirection = 'column';
  radiosList: any[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    if (this.layoutNode.type === 'radios-inline') {
      this.flexDirection = 'row';
    }
    this.radiosList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, true
    );
    this.jsf.initializeControl(this, !this.options.readonly);
  }

  updateValue(value) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, value);
  }
}
