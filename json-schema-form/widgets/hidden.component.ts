import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'hidden-widget',
  template: `
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <input [formControlName]="layoutNode?.name" [name]="layoutNode?.name"
        [id]="layoutNode?.dataPointer" [type]="hidden">
    </div>
    <input *ngIf="!bindControl" [name]="layoutNode?.name"
      [attr.value]="options?.value" [type]="hidden">`,
})
export class HiddenComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    if (this.layoutNode.hasOwnProperty('dataPointer')) {
      this.formControlGroup = getControl(this.formSettings.formGroup, this.layoutNode.dataPointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
      } else {
        console.error(
          'HiddenComponent warning: control "' + this.layoutNode.dataPointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }
}
