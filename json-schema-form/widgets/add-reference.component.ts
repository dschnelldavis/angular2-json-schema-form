import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import {
  buildFormGroup, buildFormGroupTemplate, getControl, JsonPointer,
  toGenericPointer, toIndexedPointer
} from '../utilities/index';

@Component({
  selector: 'add-reference-widget',
  template: `
    <button *ngIf="showAddButton"
      [class]="options?.fieldHtmlClass"
      [disabled]="options?.readonly"
      (click)="addItem($event)">
      <span *ngIf="options?.icon" [class]="options?.icon"></span>
      <span *ngIf="options?.title" [innerHTML]="options?.title"></span>
    </button>`,
})
export class AddReferenceComponent {
  private formControlGroup: any;
  private formControlName: string;
  private arrayIndex: number;
  private options: any;
  private showAddButton: boolean = true;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.arrayIndex = this.layoutIndex[this.layoutIndex.length - 1];
    if (this.layoutNode.isArrayItem) {
      const layoutPointer = this.formSettings.getLayoutPointer(this);
      const parentArrayPointer = JsonPointer.parse(layoutPointer).slice(0, -2);
      const parentArray = JsonPointer.get(this.formSettings.layout, parentArrayPointer);
      const maxItems = parentArray.maxItems || 1000000;
      if (this.arrayIndex >= maxItems) this.showAddButton = false;
    }
  }

  private addItem(event) {
    event.preventDefault();
    this.formSettings.addItem(this);
  }
}
