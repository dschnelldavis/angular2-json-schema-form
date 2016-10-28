import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'submit-widget',
  template: `
    <div *ngIf="layoutNode?.pointer" [formGroup]="formControlGroup"
      class="form-group schema-form-submit {{layoutNode?.htmlClass}}">
      <input
        [formControlName]="layoutNode?.name"
        [type]="layoutNode?.type"
        class="btn {{ layoutNode?.style || 'btn-primary' }} {{layoutNode?.fieldHtmlClass}}"
        [value]="layoutNode?.title"
        [disabled]="layoutNode?.readonly"
        [attr.aria-describedby]="layoutNode?.pointer + 'Status'">
    </div>
    <input *ngIf="!layoutNode?.pointer"
      [type]="layoutNode?.type"
      class="btn {{ layoutNode?.style || 'btn-primary' }} {{layoutNode?.fieldHtmlClass}}"
      [value]="layoutNode?.title"
      [disabled]="layoutNode?.readonly"
      [attr.aria-describedby]="layoutNode?.pointer + 'Status'">
`,
})
export class SubmitComponent implements OnInit {
  private formControlGroup: any;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      this.formControlGroup = getControl(this.formGroup, this.layoutNode.pointer, true);
    }
  }
}
