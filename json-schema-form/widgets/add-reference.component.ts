import { Component, Input, OnChanges, OnInit } from '@angular/core';
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
      <span *ngIf="options?.title" [innerHTML]="options?.title"></span>
    </button>`,
})
export class AddReferenceComponent implements OnInit, OnChanges {
  private options: any;
  private itemCount: number;
  private showAddButton: boolean = true;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.itemCount = this.layoutIndex[this.layoutIndex.length - 1];
    this.updateControl();
  }

  ngOnChanges() {
    this.updateControl();
  }

  private addItem(event) {
    event.preventDefault();
    this.itemCount = this.layoutIndex[this.layoutIndex.length - 1] + 1;
    this.jsf.addItem(this);
    this.updateControl();
  }

  private updateControl() {
    const maxItems = this.options.maxItems || 1000000;
    if (this.layoutNode.arrayItem && this.itemCount >= maxItems) {
      this.showAddButton = false;
    }
  }
}
