import { Component, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { hasOwn } from '../shared/utility.functions';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'submit-widget',
  template: `
    <div
      [class]="options?.htmlClass || ''">
      <input
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [class]="options?.fieldHtmlClass || ''"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [type]="layoutNode?.type"
        [value]="controlValue"
        (click)="updateValue($event)">
    </div>`,
})
export class SubmitComponent extends ButtonComponent implements OnInit {

  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

  ngOnInit() {
    super.ngOnInit();
    if (hasOwn(this.options, 'disabled')) {
      this.controlDisabled = this.options.disabled;
    } else if (this.jsf.formOptions.disableInvalidSubmit) {
      this.controlDisabled = !this.jsf.isValid;
      this.jsf.isValidChanges.subscribe(isValid => this.controlDisabled = !isValid);
    }
    if (this.controlValue === null || this.controlValue === undefined) {
      this.controlValue = this.options.title;
    }
  }
}
