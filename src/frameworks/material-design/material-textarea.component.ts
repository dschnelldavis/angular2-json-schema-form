import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../library/json-schema-form.service';

@Component({
  selector: 'material-textarea-widget',
  template: `
    <md-textarea #inputControl
      [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
      [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
      [attr.maxlength]="options?.maxLength"
      [attr.minlength]="options?.minLength"
      [attr.pattern]="options?.pattern"
      [attr.required]="options?.required"
      [class]="options?.fieldHtmlClass"
      [disabled]="controlDisabled"
      [id]="'control' + layoutNode?._id"
      [name]="controlName"
      [placeholder]="options?.title"
      [readonly]="options?.readonly ? 'readonly' : null"
      [style.width]="'100%'"
      [value]="controlValue"
      (input)="updateValue($event)">
      <span *ngIf="options?.fieldAddonLeft"
        md-prefix>{{options?.fieldAddonLeft}}</span>
      <span *ngIf="options?.fieldAddonRight"
        md-suffix>{{options?.fieldAddonRight}}</span>
      <md-hint *ngIf="options?.description"
        align="end">{{options?.description}}</md-hint>
      <md-hint *ngIf="options?.placeholder && !formControl?.dirty"
        align="end">{{options?.placeholder}}</md-hint>
    </md-textarea>`,
})
export class MaterialTextareaComponent implements OnInit {
  private formControl: AbstractControl;
  private controlName: string;
  private controlValue: any;
  private controlDisabled: boolean = false;
  private boundControl: boolean = false;
  private options: any;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService,
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.jsf.initializeControl(this);
  }

  private updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
