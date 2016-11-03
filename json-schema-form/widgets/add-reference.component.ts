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
      [class]="layoutNode?.fieldHtmlClass"
      [disabled]="layoutNode?.readonly"
      (click)="addItem($event)">
      <span *ngIf="layoutNode?.icon" [class]="layoutNode?.icon"></span>
      <span *ngIf="layoutNode?.title" [innerHTML]="layoutNode?.title"></span>
    </button>`,
})
export class AddReferenceComponent {
  private formControlGroup: any;
  private itemPointer: string;
  private arrayIndex: number;
  private showAddButton: boolean = true;
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    this.itemPointer = toIndexedPointer(this.layoutNode.layoutPointer, this.index);
    this.arrayIndex = this.index[this.index.length - 1];
    if (this.layoutNode.isArrayItem) {
      const arrayPointer = JsonPointer.parse(this.itemPointer).slice(0, -2);
      const parentArray = JsonPointer.get(this.options.layout, arrayPointer);
      const maxItems = parentArray.maxItems || 1000000;
      if (this.arrayIndex >= maxItems) this.showAddButton = false;
    }
  }

  private addItem(event) {
    event.preventDefault();
    let formArray =
      getControl(this.options.formGroup, this.layoutNode.$ref, true);
    let newFormGroup = buildFormGroup(
      JsonPointer.get(this.options.templateRefLibrary, [this.layoutNode.$ref])
    );
    let newLayoutNode =
      JsonPointer.get(this.options.layoutRefLibrary, [this.layoutNode.$ref]);
    newLayoutNode.pointer =
      newLayoutNode.pointer.slice(0, -1) + formArray.controls.length;
    newLayoutNode.name = formArray.controls.length;
    formArray.push(newFormGroup);
    JsonPointer.insert(this.options.layout, this.itemPointer, newLayoutNode);
  }
}
