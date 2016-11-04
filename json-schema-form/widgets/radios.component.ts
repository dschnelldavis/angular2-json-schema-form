import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'radios-widget',
  template: `
    <label *ngIf="options?.title" [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass" [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <div *ngFor="let radioItem of radiosList" [class]="options?.htmlClass">
        <label [attr.for]="layoutNode?.dataPointer + '/' + radioItem?.value"
          [class.active]="formControlGroup.value[layoutNode?.name] === radioItem?.value">
          <input type="radio"
            [formControlName]="layoutNode?.name"
            [id]="layoutNode?.dataPointer + '/' + radioItem?.value"
            [class]="options?.fieldHtmlClass"
            [value]="radioItem?.value"
            [attr.readonly]="options?.readonly ? 'readonly' : null"
            [attr.required]="options?.required">
          <span [innerHTML]="radioItem?.name"></span>
        </label>
      </div>
    </div>
    <div *ngIf="!bindControl">
      <div *ngFor="let radioItem of radiosList">
        <label [attr.for]="radioItem?.value" [class]="options?.labelHtmlClass"
          [class.active]="formControlGroup.value[layoutNode?.name] === radioItem?.value">
          <input type="radio"
            [id]="radioItem?.value"
            [class]="options?.fieldHtmlClass"
            [value]="radioItem?.value"
            [attr.readonly]="options?.readonly ? 'readonly' : null"
            [attr.required]="options?.required">
          <span [innerHTML]="radioItem?.name"></span>
        </label>
      </div>
    </div>`,
})
export class RadiosComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private options: any;
  private radiosList: any[] = [];
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.formControlGroup = getControl(this.formSettings.formGroup, this.layoutNode.dataPointer, true);
    if (this.formControlGroup &&
      this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
    ) {
      this.bindControl = true;
    } else {
      console.error(
        'RadiosComponent warning: control "' + this.layoutNode.dataPointer +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
    this.radiosList = buildTitleMap(this.options.titleMap, this.options.enum);
  }
}
