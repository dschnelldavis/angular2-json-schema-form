import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'submit-widget',
  template: `
    <div *ngIf="layoutNode?.dataPointer" [formGroup]="formControlGroup"
      class="form-group schema-form-submit {{options?.htmlClass}}">
      <input
        [formControlName]="layoutNode?.name"
        [type]="layoutNode?.type"
        class="btn {{ options?.style || 'btn-primary' }} {{options?.fieldHtmlClass}}"
        [value]="options?.title"
        [disabled]="options?.readonly"
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">
    </div>
    <input *ngIf="!layoutNode?.dataPointer"
      [type]="layoutNode?.type"
      class="btn {{ options?.style || 'btn-primary' }} {{options?.fieldHtmlClass}}"
      [value]="options?.title"
      [disabled]="options?.readonly"
      [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">
`,
})
export class SubmitComponent implements OnInit {
  private formControlGroup: any;
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    this.options = this.layoutNode.options;
    if (this.layoutNode.hasOwnProperty('dataPointer')) {
      this.formControlGroup = getControl(this.formSettings.formGroup, this.layoutNode.dataPointer, true);
    }
  }
}
