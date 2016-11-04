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
    const formGroup = this.formSettings.formGroup;
    const templateLibrary = this.formSettings.templateRefLibrary;
    const layoutLibrary = this.formSettings.layoutRefLibrary;
    const dataPointer = this.layoutNode.dataPointer;
    const newFormGroup =
      buildFormGroup(JsonPointer.get(templateLibrary, [dataPointer]));
    let formArray = getControl(formGroup, dataPointer, true);

    let newLayoutNode = JsonPointer.get(layoutLibrary, [dataPointer]);
    // newLayoutNode.dataPointer =
    //   newLayoutNode.dataPointer.slice(0, -1) + formArray.controls.length;
    // newLayoutNode.name = formArray.controls.length;

    formArray.push(newFormGroup);
    JsonPointer.insert(this.formSettings.layout, this.itemPointer, newLayoutNode);
  }
}
