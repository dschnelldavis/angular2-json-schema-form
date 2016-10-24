import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

@Component({
  selector: 'hidden-widget',
  template: `
    <div *ngIf="layoutNode?.pointer" [formGroup]="formControlGroup">
      <input [formControlName]="layoutNode?.name" [name]="layoutNode?.name"
        [id]="layoutNode?.pointer" [type]="hidden">
    </div>
    <input *ngIf="!layoutNode?.pointer" [name]="layoutNode?.name"
      [attr.value]="layoutNode?.value" [type]="hidden">`,
})
export class HiddenComponent implements OnInit {
  private formControlGroup: any;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    if ('pointer' in this.layoutNode) {
      this.formControlGroup =
        JsonPointer.getFromFormGroup(this.formGroup, this.layoutNode.pointer, true);
    }
  }
}
