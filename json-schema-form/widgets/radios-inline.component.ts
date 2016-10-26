import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'radios-inline-widget',
  template: `
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <label *ngFor="let item of titleMap"
        [attr.for]="layoutNode?.pointer + '/' + item?.value"
        [class]="layoutNode?.labelHtmlClass"
        [class.active]="formControlGroup.value[layoutNode?.name] === item?.value">
        <input type="radio"
          [formControlName]="layoutNode?.name"
          [id]="layoutNode?.pointer + '/' + item?.value"
          [class]="layoutNode?.fieldHtmlClass"
          [value]="item?.value"
          [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
          [attr.required]="layoutNode?.required"
          [checked]="item?.value === layoutNode?.value">
        <span [innerHTML]="item?.name"></span>
      </label>
    </div>
    <div *ngIf="!bindControl">
      <label *ngFor="let item of titleMap"
        [attr.for]="item?.value"
        [class]="layoutNode?.labelHtmlClass"
        [class.active]="formControlGroup.value[layoutNode?.name] === item?.value">
        <input type="radio"
          [id]="item?.value"
          [class]="layoutNode?.fieldHtmlClass"
          [value]="item?.value"
          [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
          [attr.required]="layoutNode?.required">
        <span [innerHTML]="item?.name"></span>
      </label>
    </div>`,
})
export class RadiosInlineComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private titleMap: any[] = [];
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
    this.titleMap = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
  }
}
