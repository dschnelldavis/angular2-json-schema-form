import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { hasOwn } from '../../shared/utility.functions';

@Component({
  selector: 'semantic-ui-button-widget',
  template: `
    <div [class]="options?.htmlClass || ''">
      <button [class.icon]="options?.icon"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [class]="'ui button ' + options?.color || 'primary'"
        [class.disabled]="controlDisabled || options?.readonly"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [type]="layoutNode?.type"
        [value]="controlValue"
        (click)="updateValue($event)">
        <i *ngIf="options?.icon">{{options?.icon}}</i>
        <span *ngIf="options?.title" [innerHTML]="options?.title"></span>
      </button>
    </div>`,
})
export class SemanticUIButtonComponent implements OnInit {
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
    if (hasOwn(this.options, 'disabled')) {
      this.controlDisabled = this.options.disabled;
    } else if (this.jsf.formOptions.disableInvalidSubmit) {
      this.controlDisabled = !this.jsf.isValid;
      this.jsf.isValidChanges.subscribe(isValid => this.controlDisabled = !isValid);
    }
  }

  updateValue(event) {
    if (typeof this.options.onClick === 'function') {
      this.options.onClick(event);
    } else {
      this.jsf.updateValue(this, event.target.value);
    }
  }
}
