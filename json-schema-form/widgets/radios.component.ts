import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { buildTitleMap, getControl } from '../utilities/index';

@Component({
  selector: 'radios-widget',
  template: `
    <div *ngIf="bindControl" [formGroup]="formControlGroup">
      <div *ngFor="let item of titleMap" [class]="layoutNode?.htmlClass">
        <label [attr.for]="layoutNode?.pointer + '/' + item?.value"
          [class.active]="formControlGroup.value[layoutNode?.name] === item?.value">
          <input type="radio"
            [formControlName]="layoutNode?.name"
            [id]="layoutNode?.pointer + '/' + item?.value"
            [class]="layoutNode?.fieldHtmlClass"
            [value]="item?.value"
            [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
            [attr.required]="layoutNode?.required">
          <span [innerHTML]="item?.name"></span>
        </label>
      </div>
    </div>
    <div *ngIf="!bindControl">
      <div *ngFor="let item of titleMap">
        <label [attr.for]="item?.value" [class]="layoutNode?.labelHtmlClass"
          [class.active]="formControlGroup.value[layoutNode?.name] === item?.value">
          <input type="radio"
            [id]="item?.value"
            [class]="layoutNode?.fieldHtmlClass"
            [value]="item?.value"
            [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
            [attr.required]="layoutNode?.required">
          <span [innerHTML]="item?.name"></span>
        </label>
      </div>
    </div>`,
})
export class RadiosComponent implements OnInit {
  private formControlGroup: any;
  private bindControl: boolean = false;
  private titleMap: any[] = [];
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
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
    this.titleMap = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
  }
}
