import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'fieldset-widget',
  template: `
    <fieldset [class]="layoutNode?.htmlClass" [disabled]="layoutNode?.readonly">
      <legend *ngIf="layoutNode?.title" [class]="layoutNode?.labelHtmlClass"
        [class.sr-only]="layoutNode?.notitle" [innerHTML]="layoutNode?.title"></legend>

      <div *ngFor="let item of layoutNode?.items; let i = index; trackBy: item?.pointer">
        <root-widget
          [layoutNode]="item"
          [formGroup]="formGroup"
          [formOptions]="formOptions"
          [index]="index.concat(i)"
          [debug]="debug"></root-widget>
      </div>

    </fieldset>`,
})
export class FieldsetComponent {
  @Input() layoutNode: any;
  @Input() formGroup: FormGroup;
  @Input() formOptions: any;
  @Input() index: number[];
  @Input() debug: boolean;
}
