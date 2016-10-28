import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'select-widget',
  template: `
    <label *ngIf="layoutNode?.title" [attr.for]="layoutNode?.pointer"
      [class]="layoutNode?.labelHtmlClass" [class.sr-only]="layoutNode?.notitle"
      [innerHTML]="layoutNode?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <select
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.pointer"
        [class]="layoutNode?.fieldHtmlClass"
        [name]="layoutNode?.name"
        [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
        [attr.required]="layoutNode?.required"
        [attr.aria-describedby]="layoutNode?.pointer + 'Status'">
        <option [value]="item.value" *ngFor="let item of titleMap">{{item.name}}</option>
      </select>
    </div>
    <select *ngIf="!bindControl"
      [class]="layoutNode?.fieldHtmlClass"
      [name]="layoutNode?.name"
      [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
      [attr.required]="layoutNode?.required"
      [attr.aria-describedby]="layoutNode?.pointer + 'Status'">
      <option [value]="item.value" *ngFor="let item of titleMap">{{item.name}}</option>
    </select>`,
})
export class SelectComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private titleMap: any[] = [];
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;
  @Input() index: number[];
  @Input() debug: boolean;

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
    this.titleMap = buildTitleMap(this.layoutNode.titleMap || this.layoutNode.enumNames,
      this.layoutNode.enum, !!this.layoutNode.required);
  }
}
