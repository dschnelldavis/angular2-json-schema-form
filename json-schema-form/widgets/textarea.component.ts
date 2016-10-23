import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

@Component({
  selector: 'textarea-widget',
  template: `
    <div [formGroup]="formControlGroup">
    <textarea
      [formControlName]="layoutNode?.name"
      [id]="layoutNode?.name"
      [class]="layoutNode?.fieldHtmlClass"
      [name]="layoutNode?.name"
      [attr.minlength]="layoutNode?.minLength || layoutNode?.minlength"
      [attr.maxlength]="layoutNode?.maxLength || layoutNode?.maxlength"
      [attr.pattern]="layoutNode?.pattern"
      [attr.placeholder]="layoutNode?.placeholder"
      [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
      [attr.value]="layoutNode?.value"
      [attr.required]="layoutNode?.required"></textarea>
    </div>`,
})
export class TextareaComponent implements OnInit {
  private formControlGroup: any;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    this.formControlGroup = JsonPointer.getFromFormGroup(this.formGroup, this.layoutNode.pointer, true);
  }
}
