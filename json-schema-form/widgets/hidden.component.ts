import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'hidden-widget',
  template: `
    <div *ngIf="boundControl" [formGroup]="formControlGroup">
      <input [formControlName]="formControlName" [name]="formControlName"
        [id]="layoutNode?.dataPointer" [type]="hidden">
    </div>
    <input *ngIf="!boundControl" [name]="formControlName"
      [attr.value]="options?.value" [type]="hidden">`,
})
export class HiddenComponent implements OnInit {
  private formControlGroup: any;
  private formControlName: string;
  private boundControl: boolean = false;
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.formControlGroup = this.formSettings.getControlGroup(this);
    this.formControlName = this.formSettings.getControlName(this);
    this.boundControl = this.formSettings.isControlBound(this);
    if (this.boundControl) {
    } else {
      console.error(
        'HiddenComponent warning: control "' + this.formSettings.getDataPointer(this) +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
  }
}
