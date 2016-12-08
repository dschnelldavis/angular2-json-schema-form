import { Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'material-fieldset-widget',
  template: `
    <fieldset
      [class]="options?.htmlClass"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded"
      [disabled]="options?.readonly">
      <legend *ngIf="options?.title"
        [class]="options?.labelHtmlClass"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"
        (click)="expand()"></legend>

        <root-widget *ngIf="expanded"
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
export class MaterialFieldsetComponent implements OnInit {
  private options: any;
  private expanded: boolean = true;
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
    if (this.options.expandable) this.expanded = !this.expanded;
  }
}
