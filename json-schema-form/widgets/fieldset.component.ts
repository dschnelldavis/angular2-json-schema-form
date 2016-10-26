import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'fieldset-widget',
  template: `
    <fieldset
      [disabled]="layoutNode?.readonly"
      [class]="layoutNode?.htmlClass">
      <legend *ngIf="layoutNode?.title"
        [class.sr-only]="layoutNode?.notitle"
        [class]="layoutNode?.labelHtmlClass"
        [innerHTML]="layoutNode?.title"></legend>
      <div *ngFor="let item of layoutNode?.items; let i = index; trackBy: item?.pointer">
        <root-widget
          [layoutNode]="item"
          [formGroup]="formGroup"
          [formOptions]="formOptions"
          [debug]="debug"></root-widget>
      </div>
    </fieldset>`,
})
export class FieldsetComponent {
  @Input() layoutNode: any;
  @Input() formGroup: FormGroup;
  @Input() formOptions: any;
  @Input() debug: boolean;
}
