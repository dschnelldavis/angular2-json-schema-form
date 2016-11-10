import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'button-widget',
  template: `
    <div
      [class]="options?.htmlClass">
      <button
        [attr.aria-describedby]="layoutNode?.dataPointer + 'Status'"
        [class]="options?.fieldHtmlClass"
        [disabled]="options?.readonly"
        [name]="controlName"
        [type]="layoutNode?.type"
        [value]="controlValue"
        (click)="updateValue($event)">
        <span *ngIf="options?.icon || options?.title"
          [class]="options?.icon"
          [innerHTML]="options?.title"></span>
      </button>
    </div>`,
})
export class ButtonComponent implements OnInit {
  private formControl: AbstractControl;
  private controlName: string;
  private controlValue: any;
  private boundControl: boolean = false;
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.formSettings.initializeControl(this);
  }

  private updateValue(event) {
    this.formSettings.updateValue(this, event);
  }
}
