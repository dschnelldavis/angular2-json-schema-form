import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

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
        [disabled]="layoutNode?.readonly"
        [attr.aria-describedby]="layoutNode?.pointer + 'Status'">
        <span *ngIf="layoutNode?.icon" class="{{layoutNode?.icon}}"></span>
        {{layoutNode?.title || layoutNode?.name}}
      </button>
    </div>
    <button *ngIf="!layoutNode?.pointer"
      class="btn {{ layoutNode?.style || 'btn-default' }}"
      [type]="layoutNode?.type"
      [disabled]="layoutNode?.readonly"
      [attr.aria-describedby]="layoutNode?.pointer + 'Status'">
      <span *ngIf="layoutNode?.icon" class="{{layoutNode?.icon}}"></span>
      {{layoutNode?.title || layoutNode?.name}}
    </button>`,
})
export class ButtonComponent implements OnInit {
  private formControlGroup: any;
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      this.formControlGroup = getControl(this.options.formGroup, this.layoutNode.pointer, true);
    }
  }
}
