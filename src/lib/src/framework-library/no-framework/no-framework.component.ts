import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'no-framework',
  template: `
  <button style='float:right;clear: right;' *ngIf="showRemoveButton"
  type="button"
  (click)="removeItem()">
  <span aria-hidden="true">&times;</span>
</button>
    <select-widget-widget
      [dataIndex]="dataIndex"
      [layoutIndex]="layoutIndex"
      [layoutNode]="layoutNode"></select-widget-widget>
      `,
})
export class NoFrameworkComponent implements OnInit {

  options: any; // Options used in this framework
  parentArray: any = null;
  isOrderable = false;

  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    public jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = _.cloneDeep(this.layoutNode.options);
    if (this.layoutNode.arrayItem && this.layoutNode.type !== '$ref') {
      this.parentArray = this.jsf.getParentNode(this);
      if (this.parentArray) {
        this.isOrderable = this.layoutNode.arrayItemType === 'list' &&
          !this.options.readonly && this.parentArray.options.orderable;
      }
    }
  }


  get showRemoveButton(): boolean {
    if (!this.options.removable || this.options.readonly ||
      this.layoutNode.type === '$ref'
    ) { return false; }
    if (this.layoutNode.recursiveReference) { return true; }
    if (!this.layoutNode.arrayItem || !this.parentArray) { return false; }
    // If array length <= minItems, don't allow removing any items
    return this.parentArray.items.length - 1 <= this.parentArray.options.minItems ? false :
      // For removable list items, allow removing any item
      this.layoutNode.arrayItemType === 'list' ? true :
        // For removable tuple items, only allow removing last item in list
        this.layoutIndex[this.layoutIndex.length - 1] === this.parentArray.items.length - 2;
  }

  removeItem() {
    this.jsf.removeItem(this);
  }
}
