import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';
import { buildTitleMap } from '../utilities/utility-functions';

@Component({
  selector: 'radios-widget',
  template: `
    <div *ngIf="layoutNode?.pointer" [formGroup]="formControlGroup">
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
    <div *ngIf="!layoutNode?.pointer">
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
  private titleMap: any[] = [];
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    this.formControlGroup =
      JsonPointer.getFromFormGroup(this.formGroup, this.layoutNode.pointer, true);
    this.titleMap = buildTitleMap(this.layoutNode.titleMap, this.layoutNode.enum);
  }
}
