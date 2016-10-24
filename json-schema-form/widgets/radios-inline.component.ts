import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';
import { buildTitleMap } from '../utilities/utility-functions';

@Component({
  selector: 'radios-inline-widget',
  template: `
    <div *ngIf="layoutNode?.pointer" [formGroup]="formControlGroup">
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
    <div *ngIf="!layoutNode?.pointer">
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
  private titleMap: any[] = [];
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    if ('pointer' in this.layoutNode) {
      this.formControlGroup =
        JsonPointer.getFromFormGroup(this.formGroup, this.layoutNode.pointer, true);
    }
    this.titleMap = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
  }
}
