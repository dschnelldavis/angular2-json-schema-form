import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'radios-inline-widget',
  template: `
    <label *ngIf="options?.title" [attr.for]="layoutNode?.dataPointer"
      [class]="options?.labelHtmlClass" [class.sr-only]="options?.notitle"
      [innerHTML]="options?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <label *ngFor="let radioItem of radiosList"
        [attr.for]="layoutNode?.dataPointer + '/' + radioItem?.value"
        [class]="options?.labelHtmlClass"
        [class.active]="formControlGroup.value[layoutNode?.name] === radioItem?.value">
        <input type="radio"
          [formControlName]="layoutNode?.name"
          [id]="layoutNode?.dataPointer + '/' + radioItem?.value"
          [class]="options?.fieldHtmlClass"
          [value]="radioItem?.value"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required"
          [checked]="radioItem?.value === options?.value">
        <span [innerHTML]="radioItem?.name"></span>
      </label>
    </div>
    <div *ngIf="!bindControl">
      <label *ngFor="let radioItem of radiosList"
        [attr.for]="radioItem?.value"
        [class]="options?.labelHtmlClass"
        [class.active]="formControlGroup.value[layoutNode?.name] === radioItem?.value">
        <input type="radio"
          [id]="radioItem?.value"
          [class]="options?.fieldHtmlClass"
          [value]="radioItem?.value"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required">
        <span [innerHTML]="radioItem?.name"></span>
      </label>
    </div>`,
})
export class RadiosInlineComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private options: any;
  private radiosList: any[] = [];
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];
  @Input() debug: boolean;

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
          'RadiosInlineComponent warning: control "' + this.layoutNode.dataPointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
    this.radiosList = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
  }
}
