import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

@Component({
  selector: 'select-widget',
  template: `
    <div *ngIf="layoutNode?.pointer" [formGroup]="formControlGroup">
      <select
        [formControlName]="layoutNode?.name"
        [id]="layoutNode?.pointer"
        [class]="layoutNode?.fieldHtmlClass"
        [name]="layoutNode?.name"
        [attr.readonly]="layoutNode?.readonly ? 'readonly' : null"
        [attr.required]="layoutNode?.required">
        <option [value]="item[0]" *ngFor="let item of selectList">{{item[1]}}</option>
      </select>
    </div>`,
})
export class SelectComponent implements OnInit {
  private formControlGroup: any;
  private selectList: string[][] = [];
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;

  ngOnInit() {
    if ('enum' in this.layoutNode) {
      for (let i = 0, l = this.layoutNode.enum.length; i < l; i++) {
        this.selectList.push([this.layoutNode.enum[i], this.layoutNode.enum[i]]);
      }
    }
    this.formControlGroup = JsonPointer.getFormControl(this.formGroup, this.layoutNode.pointer, true);
  }
}
