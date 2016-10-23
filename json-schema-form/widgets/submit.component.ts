import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

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
        [disabled]="layoutNode?.readonly">
    </div>
    <input *ngIf="!layoutNode?.pointer"
      [type]="layoutNode?.type"
      class="btn {{ layoutNode?.style || 'btn-primary' }} {{layoutNode?.fieldHtmlClass}}"
      [value]="layoutNode?.title"
      [disabled]="layoutNode?.readonly">
`,
})
export class SubmitComponent implements OnInit {
  private formControlGroup: any;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    if ('pointer' in this.layoutNode) {
      this.formControlGroup = JsonPointer.getFromFormGroup(this.formGroup, this.layoutNode.pointer, true);
    }
  }
}
