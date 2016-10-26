import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'array-widget',
  template: `
    <fieldset [disabled]="layoutNode?.readonly" [class]="layoutNode?.htmlClass">
      <legend *ngIf="layoutNode?.title" [class.sr-only]="layoutNode?.notitle"
        [innerHTML]="layoutNode?.title"></legend>
      <div *ngFor="let item of layoutNode?.items; let i = index; trackBy: item.path">
        <root-widget
          [layoutNode]="item"
          [formGroup]="formGroup"
          [formOptions]="formOptions"
          [debug]="debug"></root-widget>
      </div>
    </fieldset>`,
})
export class ArrayComponent {
  @Input() layoutNode: any;
  @Input() formGroup: FormGroup;
  @Input() formOptions: any;
  @Input() debug: boolean;
}
