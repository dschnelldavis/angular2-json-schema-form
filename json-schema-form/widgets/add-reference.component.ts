import { Component, Input, OnChanges, OnInit } from '@angular/core';
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
export class AddReferenceComponent implements OnInit, OnChanges {
  private options: any;
  private showAddButton: boolean = true;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.updateControl();
  }

  ngOnChanges() {
    this.updateControl();
  }

  private updateControl() {
    if (this.layoutNode.arrayItem) {
      // TODO: Add 'maxItems' to $ref and remove complex lookup
      const arrayIndex = this.layoutIndex[this.layoutIndex.length - 1];
      const layoutPointer = this.formSettings.getLayoutPointer(this);
      const parentArrayPointer = JsonPointer.parse(layoutPointer).slice(0, -2);
      const parentArray = JsonPointer.get(this.formSettings.layout, parentArrayPointer);
      const maxItems = parentArray.maxItems || 1000000;
      if (arrayIndex >= maxItems) this.showAddButton = false;
    }
  }

  private addItem(event) {
    event.preventDefault();
    this.formSettings.addItem(this);
  }
}
