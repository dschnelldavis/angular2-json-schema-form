import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'button-widget',
  template: `
    <div *ngIf="boundControl"
      [class]="options?.htmlClass"
      [formGroup]="formControlGroup">
      <button
        [attr.aria-describedby]="formControlName + 'Status'"
        [class]="options?.fieldHtmlClass"
        [disabled]="options?.readonly"
        [formControlName]="formControlName"
        [type]="layoutNode?.type">
        <span *ngIf="options?.icon"
          [class]="options?.icon"
          [innerHTML]="options?.title"></span>
      </button>
    </div>
    <div *ngIf="!boundControl"
      [class]="options?.htmlClass">
      <button
        [attr.aria-describedby]="formControlName + 'Status'"
        [class]="options?.fieldHtmlClass"
        [disabled]="options?.readonly"
        [type]="layoutNode?.type">
        <span *ngIf="options?.icon"
          [class]="options?.icon"
          [innerHTML]="options?.title"></span>
      </button>
    </div>`,
})
export class ButtonComponent implements OnInit {
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
