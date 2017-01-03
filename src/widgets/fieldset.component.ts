import { Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../library/json-schema-form.service';

@Component({
  selector: 'fieldset-widget',
  template: `
    <fieldset
      [class]="options?.htmlClass"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded"
      [disabled]="options?.readonly">
      <legend *ngIf="options?.title && layoutNode?.type !== 'tab'"
        [class]="options?.labelHtmlClass"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"
        (click)="expand()"></legend>

        <root-widget *ngIf="expanded"
          [formID]="formID"
          [layout]="layoutNode.items"
          [dataIndex]="dataIndex"
          [layoutIndex]="layoutIndex"
          [isOrderable]="options?.orderable"></root-widget>

    </fieldset>`,
  styles: [`
    .expandable > legend:before { content: '\\25B8'; padding-right: .3em; }
    .expanded > legend:before { content: '\\25BE'; padding-right: .2em; }
  `],
})
export class FieldsetComponent implements OnInit {
  private options: any;
  private expanded: boolean = true;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.expanded = !this.options.expandable;
  }

  private expand() {
    if (this.options.expandable) { this.expanded = !this.expanded; }
  }
}
