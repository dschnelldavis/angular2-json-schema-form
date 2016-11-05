import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'submit-widget',
  template: `
    <div *ngIf="boundControl"
      [formGroup]="formControlGroup"
      [class]="options?.htmlClass">
      <input
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [class]="options?.fieldHtmlClass"
        [disabled]="options?.readonly"
        [formControlName]="formControlName"
        [type]="layoutNode?.type"
        [value]="options?.title">
    </div>
    <div *ngIf="!boundControl"
      [class]="options?.htmlClass">
      <input
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [class]="options?.fieldHtmlClass"
        [disabled]="options?.readonly"
        [type]="layoutNode?.type"
        [value]="options?.title">
    </div>
`,
})
export class SubmitComponent implements OnInit {
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
  }
}
