import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'semantic-ui-input-widget',
  template: `
      <div
        [class]="'ui field ' + options?.htmlClass || ''">
        <label
          [innerHTML]="options?.notitle ? '' : options?.title"></label>
        <!--[floatPlaceholder]="options?.floatPlaceholder || (options?.notitle ? 'never' : 'auto')"-->
        <!--[style.width]="'100%'">-->
        <!--<span matPrefix *ngIf="options?.prefix || options?.fieldAddonLeft"-->
          <!--[innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>-->
        <input *ngIf="boundControl"
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [readonly]="options?.readonly ? 'readonly' : null"
          [id]="'control' + layoutNode?._id"
          [name]="controlName"
          [placeholder]="(options?.notitle ? options?.placeholder : options?.title) || ''"
          [required]="options?.required"
          [type]="layoutNode?.type"
          (blur)="options.showErrors = true">
        <input *ngIf="!boundControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [disabled]="controlDisabled"
          [id]="'control' + layoutNode?._id"
          [name]="controlName" [placeholder]="(options?.notitle ? options?.placeholder : options?.title) || ''"
          [readonly]="options?.readonly ? 'readonly' : null"
          [required]="options?.required"
          [type]="layoutNode?.type"
          [value]="controlValue"
          (input)="updateValue($event)"
          (blur)="options.showErrors = true">
        <!--<span matSuffix *ngIf="options?.suffix || options?.fieldAddonRight"-->
          <!--[innerHTML]="options?.suffix || options?.fieldAddonRight"></span>-->
        <!--<mat-hint *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"-->
          <!--align="end" [innerHTML]="options?.description"></mat-hint>-->
        <!--<mat-autocomplete *ngIf="options?.typeahead?.source">-->
          <!--<mat-option *ngFor="let word of options?.typeahead?.source"-->
            <!--[value]="word">{{word}}</mat-option>-->
        <!--</mat-autocomplete>-->
      <div class = "ui error message" *ngIf="options?.showErrors && options?.errorMessage"
        [innerHTML]="options?.errorMessage"></div>
    </div>`,
  styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
    ::ng-deep mat-form-field .mat-form-field-wrapper .mat-form-field-flex
      .mat-form-field-infix { width: initial; }
  `],
})
export class SemanticUIInputComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: string;
  controlDisabled = false;
  boundControl = false;
  options: any;
  autoCompleteList: string[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
