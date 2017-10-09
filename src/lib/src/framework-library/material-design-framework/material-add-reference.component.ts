import {
  ChangeDetectionStrategy, Component, Input, OnInit, OnChanges
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'material-add-reference-widget',
  template: `
    <section [class]="options?.htmlClass" align="end">
      <button mat-raised-button *ngIf="showAddButton"
        [color]="options?.color || 'accent'"
        [disabled]="options?.readonly"
        (click)="addItem($event)">
        <span *ngIf="options?.icon" [class]="options?.icon"></span>
        <span *ngIf="options?.title" [innerHTML]="buttonText"></span>
      </button>
    </section>`,
    changeDetection: ChangeDetectionStrategy.Default,
})
export class MaterialAddReferenceComponent implements OnInit, OnChanges {
  options: any;
  itemCount: number;
  showAddButton: boolean = true;
  previousLayoutIndex: number[];
  previousDataIndex: number[];
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
  @Input() data: any;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.updateControl();
  }

  ngOnChanges() {
    if (
      this.layoutIndex.length !== this.previousLayoutIndex.length ||
      !this.layoutIndex.every(i => i === this.previousLayoutIndex[i]) ||
      this.dataIndex.length !== this.previousDataIndex.length ||
      !this.dataIndex.every(i => i === this.previousDataIndex[i])
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
    this.previousLayoutIndex = [ ...this.layoutIndex ];
    this.previousDataIndex = [ ...this.dataIndex ];
    this.showAddButton = this.layoutNode.arrayItem &&
      this.itemCount < (this.options.maxItems || 1000000);
  }

  get buttonText(): string {
    const parent: any = {
      dataIndex: this.dataIndex.slice(0, -1),
      layoutIndex: this.layoutIndex.slice(0, -1),
      layoutNode: this.jsf.getParentNode(this)
    };
    return parent.layoutNode.add ||
      this.jsf.setTitle(parent, this.layoutNode, this.itemCount);
  }
}
