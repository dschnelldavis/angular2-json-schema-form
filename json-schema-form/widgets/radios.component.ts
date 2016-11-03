import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'radios-widget',
  template: `
    <label *ngIf="layoutNode?.title" [attr.for]="layoutNode?.pointer"
      [class]="layoutNode?.labelHtmlClass" [class.sr-only]="layoutNode?.notitle"
      [innerHTML]="layoutNode?.title"></label>
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <div *ngFor="let radioItem of radiosList" [class]="layoutNode?.htmlClass">
        <label [attr.for]="layoutNode?.pointer + '/' + radioItem?.value"
          [class.active]="formControlGroup.value[layoutNode?.name] === radioItem?.value">
          <input type="radio"
            [formControlName]="layoutNode?.name"
            [id]="layoutNode?.pointer + '/' + radioItem?.value"
            [class]="layoutNode?.fieldHtmlClass"
            [value]="radioItem?.value"
            [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
            [attr.required]="layoutNode?.required">
          <span [innerHTML]="radioItem?.name"></span>
        </label>
      </div>
    </div>
    <div *ngIf="!bindControl">
      <div *ngFor="let radioItem of radiosList">
        <label [attr.for]="radioItem?.value" [class]="layoutNode?.labelHtmlClass"
          [class.active]="formControlGroup.value[layoutNode?.name] === radioItem?.value">
          <input type="radio"
            [id]="radioItem?.value"
            [class]="layoutNode?.fieldHtmlClass"
            [value]="radioItem?.value"
            [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
            [attr.required]="layoutNode?.required">
          <span [innerHTML]="radioItem?.name"></span>
        </label>
      </div>
    </div>`,
})
export class RadiosComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private radiosList: any[] = [];
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    this.formControlGroup = getControl(this.options.formGroup, this.layoutNode.pointer, true);
    if (this.formControlGroup &&
      this.formControlGroup.controls.hasOwnProperty(this.layoutNode.name)
    ) {
      this.bindControl = true;
    } else {
      console.error(
        'RadiosComponent warning: control "' + this.layoutNode.pointer +
        '" is not bound to the Angular 2 FormGroup.'
      );
    }
    this.radiosList = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
  }
}
