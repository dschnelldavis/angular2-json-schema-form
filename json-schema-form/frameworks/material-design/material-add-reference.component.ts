import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'material-add-reference-widget',
  template: `
    <md-card-actions [class]="options?.htmlClass" align="end">
      <button *ngIf="showAddButton" md-raised-button
        [class]="options?.fieldHtmlClass"
        [color]="options?.color || 'accent'"
        [disabled]="options?.readonly"
        (click)="addItem($event)">
        <span *ngIf="options?.icon" [class]="options?.icon"></span>
        <span *ngIf="options?.title" [innerHTML]="options?.title"></span>
      </button>
    </md-card-actions>`,
})
export class MaterialAddReferenceComponent implements OnInit, OnChanges {
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
    this.showAddButton = this.layoutNode.arrayItem &&
      this.itemCount <= (this.options.maxItems || 1000000);
  }
}
