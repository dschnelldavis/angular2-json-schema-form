import { Component, DoCheck, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonSchemaFormService } from '../json-schema-form.service';

@Component({
  selector: 'add-reference-widget',
  template: `
    <button *ngIf="showAddButton"
      [class]="options?.fieldHtmlClass"
      [disabled]="options?.readonly"
      (click)="addItem($event)">
      <span *ngIf="options?.icon" [class]="options?.icon"></span>
      <span *ngIf="options?.title" [innerHTML]="setTitle()"></span>
    </button>`,
})
export class AddReferenceComponent implements OnInit, DoCheck {
  options: any;
  itemCount: number;
  showAddButton: boolean = true;
  previousLayoutIndex: number[];
  previousDataIndex: number[];
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.updateControl();
  }

  ngDoCheck() {
    if (this.previousLayoutIndex !== this.layoutIndex ||
      this.previousDataIndex !== this.dataIndex
    ) {
      this.updateControl();
    }
  }

  addItem(event) {
    event.preventDefault();
    this.itemCount = this.layoutIndex[this.layoutIndex.length - 1] + 1;
    this.jsf.addItem(this);
    this.updateControl();
  }

  updateControl() {
    this.itemCount = this.layoutIndex[this.layoutIndex.length - 1];
    this.previousLayoutIndex = this.layoutIndex;
    this.previousDataIndex = this.dataIndex;
    this.showAddButton = this.layoutNode.arrayItem &&
      this.itemCount < (this.options.maxItems || 1000000);
  }

  setTitle(): string {
    const parent: any = {
      dataIndex: this.dataIndex.slice(0, -1),
      layoutNode: this.jsf.getParentNode(this)
    };
    return this.jsf.setTitle(parent, this.layoutNode, this.itemCount);
  }
}
