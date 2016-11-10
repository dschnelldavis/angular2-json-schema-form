import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'hidden-widget',
  template: `
    <input
      [name]="controlName"
      [id]="layoutNode?.dataPointer"
      [type]="hidden"
      [value]="controlValue">`,
})
export class HiddenComponent implements OnInit {
  private formControl: AbstractControl;
  private controlName: string;
  private controlValue: any;
  private boundControl: boolean = false;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.formSettings.initializeControl(this);
  }
}
