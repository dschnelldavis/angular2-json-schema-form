import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl } from '../utilities/index';

@Component({
  selector: 'hidden-widget',
  template: `
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <input [formControlName]="layoutNode?.name" [name]="layoutNode?.name"
        [id]="layoutNode?.pointer" [type]="hidden">
    </div>
    <input *ngIf="!bindControl" [name]="layoutNode?.name"
      [attr.value]="layoutNode?.value" [type]="hidden">`,
})
export class HiddenComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      this.formControlGroup = getControl(this.formGroup, this.layoutNode.pointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
      } else {
        console.error(
          'Warning: control "' + this.layoutNode.pointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
  }
}
