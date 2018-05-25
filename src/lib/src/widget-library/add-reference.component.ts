import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { AbstractWidget } from '.';

@Component({
  selector: 'add-reference-widget',
  template: `
    <button *ngIf="showAddButton"
      [class]="options?.fieldHtmlClass || ''"
      [disabled]="options?.readonly"
      (click)="addItem($event)">
      <span *ngIf="options?.icon" [class]="options?.icon"></span>
      <span *ngIf="options?.title" [innerHTML]="buttonText"></span>
    </button>`,
    changeDetection: ChangeDetectionStrategy.Default,
})
export class AddReferenceComponent extends AbstractWidget {
  itemCount: number;
  previousLayoutIndex: number[];
  previousDataIndex: number[];

  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

  get showAddButton(): boolean {
    return !this.layoutNode.arrayItem ||
      this.layoutIndex[this.layoutIndex.length - 1] < this.options.maxItems;
  }

  addItem(event) {
    event.preventDefault();
    this.jsf.addItem(this);
  }

  get buttonText(): string {
    const parent: any = {
      dataIndex: this.dataIndex.slice(0, -1),
      layoutIndex: this.layoutIndex.slice(0, -1),
      layoutNode: this.jsf.getParentNode(this)
    };
    return parent.layoutNode.add ||
      this.jsf.setArrayItemTitle(parent, this.layoutNode, this.itemCount);
  }
}
