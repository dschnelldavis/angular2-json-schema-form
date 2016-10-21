import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

@Component({
  selector: 'button-widget',
  template: `
    <div *ngIf="layoutNode?.pointer"
      [formGroup]="formControlGroup"
      class="form-group schema-form-submit {{layoutNode?.htmlClass}}">
      <button
        [formControlName]="layoutNode?.name"
        class="btn {{ layoutNode?.style || 'btn-default' }}"
        [type]="layoutNode?.type"
        [disabled]="layoutNode?.readonly">
        <span *ngIf="layoutNode?.icon" class="{{layoutNode?.icon}}"></span>
        {{layoutNode?.title || layoutNode?.name}}
      </button>
    </div>
    <button *ngIf="!layoutNode?.pointer"
      class="btn {{ layoutNode?.style || 'btn-default' }}"
      [type]="layoutNode?.type"
      [disabled]="layoutNode?.readonly">
      <span *ngIf="layoutNode?.icon" class="{{layoutNode?.icon}}"></span>
      {{layoutNode?.title || layoutNode?.name}}
    </button>`,
})
export class ButtonComponent implements OnInit {
  private formControlGroup: any;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    if ('pointer' in this.layoutNode) {
      this.formControlGroup = JsonPointer.getFormControl(this.formGroup, this.layoutNode.pointer, true);
    }
  }
}
