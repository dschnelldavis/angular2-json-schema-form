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
  private itemPointer: string;
  private arrayIndex: number;
  private options: any;
  private showAddButton: boolean = true;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    this.itemPointer = toIndexedPointer(this.layoutNode.layoutPointer, this.index);
    this.arrayIndex = this.index[this.index.length - 1];
    this.options = this.layoutNode.options;
    if (this.layoutNode.isArrayItem) {
      const arrayPointer = JsonPointer.parse(this.itemPointer).slice(0, -2);
      const parentArray = JsonPointer.get(this.formSettings.layout, arrayPointer);
      const maxItems = parentArray.maxItems || 1000000;
      if (this.arrayIndex >= maxItems) this.showAddButton = false;
    }
  }

  private addItem(event) {
    event.preventDefault();
    let formArray =
      getControl(this.formSettings.formGroup, this.layoutNode.$ref, true);
    let newFormGroup = buildFormGroup(
      JsonPointer.get(this.formSettings.templateRefLibrary, [this.layoutNode.$ref])
    );
    let newLayoutNode =
      JsonPointer.get(this.formSettings.layoutRefLibrary, [this.layoutNode.$ref]);
    newLayoutNode.dataPointer =
      newLayoutNode.dataPointer.slice(0, -1) + formArray.controls.length;
    newLayoutNode.name = formArray.controls.length;
    formArray.push(newFormGroup);
    JsonPointer.insert(this.formSettings.layout, this.itemPointer, newLayoutNode);
  }
}
