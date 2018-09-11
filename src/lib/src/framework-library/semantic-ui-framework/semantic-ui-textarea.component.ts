import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'semantic-ui-textarea-widget',
  template: `
    <div
      [class]="'ui field ' + options?.htmlClass || ''">
      <!--<span matPrefix *ngIf="options?.prefix || options?.fieldAddonLeft"-->
        <!--[innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>-->
      <label
        [innerHTML]="options?.notitle ? '' : options?.title"></label>
      <textarea *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="options?.pattern"
        [attr.required]="options?.required"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [readonly]="options?.readonly ? 'readonly' : null"
        [style.width]="'100%'"
        (blur)="options.showErrors = true"></textarea>
      <textarea *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="options?.pattern"
        [attr.required]="options?.required"
        [class.disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [readonly]="options?.readonly ? 'readonly' : null"
        [style.width]="'100%'"
        [value]="controlValue"
        (input)="updateValue($event)"
        (blur)="options.showErrors = true"></textarea>
      <!--<span matSuffix *ngIf="options?.suffix || options?.fieldAddonRight"-->
        <!--[innerHTML]="options?.suffix || options?.fieldAddonRight"></span>-->
      <!--<mat-hint *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"-->
        <!--align="end" [innerHTML]="options?.description"></mat-hint>-->
    </div>
    <div class = "ui error message"  *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></div>`,
  styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
    ::ng-deep mat-form-field .mat-form-field-wrapper .mat-form-field-flex
      .mat-form-field-infix { width: initial; }
  `],
})
export class SemanticUITextareaComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
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
