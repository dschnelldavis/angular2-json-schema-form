import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'radios-inline-widget',
  template: `
    <label *ngIf="layoutNode?.title" [attr.for]="layoutNode?.pointer"
      [class]="layoutNode?.labelHtmlClass" [class.sr-only]="layoutNode?.notitle"
      [innerHTML]="layoutNode?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <label *ngFor="let radioItem of radiosList"
        [attr.for]="layoutNode?.pointer + '/' + radioItem?.value"
        [class]="layoutNode?.labelHtmlClass"
        [class.active]="formControlGroup.value[layoutNode?.name] === radioItem?.value">
        <input type="radio"
          [formControlName]="layoutNode?.name"
          [id]="layoutNode?.pointer + '/' + radioItem?.value"
          [class]="layoutNode?.fieldHtmlClass"
          [value]="radioItem?.value"
          [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
          [attr.required]="layoutNode?.required"
          [checked]="radioItem?.value === layoutNode?.value">
        <span [innerHTML]="radioItem?.name"></span>
      </label>
    </div>
    <div *ngIf="!bindControl">
      <label *ngFor="let radioItem of radiosList"
        [attr.for]="radioItem?.value"
        [class]="layoutNode?.labelHtmlClass"
        [class.active]="formControlGroup.value[layoutNode?.name] === radioItem?.value">
        <input type="radio"
          [id]="radioItem?.value"
          [class]="layoutNode?.fieldHtmlClass"
          [value]="radioItem?.value"
          [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
          [attr.required]="layoutNode?.required">
        <span [innerHTML]="radioItem?.name"></span>
      </label>
    </div>`,
})
export class RadiosInlineComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private radiosList: any[] = [];
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      this.formControlGroup = getControl(this.options.formGroup, this.layoutNode.pointer, true);
      if (this.formControlGroup &&
        this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
      ) {
        this.bindControl = true;
      } else {
        console.error(
          'RadiosInlineComponent warning: control "' + this.layoutNode.pointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
    this.radiosList = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
  }
}
