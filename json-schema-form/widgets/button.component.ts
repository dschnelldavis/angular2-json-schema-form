import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'button-widget',
  template: `
    <div *ngIf="layoutNode?.dataPointer"
      [formGroup]="formControlGroup"
      class="form-group schema-form-submit {{options?.htmlClass}}">
      <button
        [formControlName]="layoutNode?.name"
        class="btn {{ options?.style || 'btn-default' }}"
        [type]="layoutNode?.type"
        [disabled]="options?.readonly"
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">
        <span *ngIf="options?.icon" class="{{options?.icon}}"></span>
        {{options?.title || layoutNode?.name}}
      </button>
    </div>
    <button *ngIf="!layoutNode?.dataPointer"
      class="btn {{ options?.style || 'btn-default' }}"
      [type]="layoutNode?.type"
      [disabled]="options?.readonly"
      [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'">
      <span *ngIf="options?.icon" class="{{options?.icon}}"></span>
      {{options?.title || layoutNode?.name}}
    </button>`,
})
export class ButtonComponent implements OnInit {
  private formControlGroup: any;
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    if (this.layoutNode.hasOwnProperty('dataPointer')) {
      this.formControlGroup = getControl(this.formSettings.formGroup, this.layoutNode.dataPointer, true);
    }
  }
}
