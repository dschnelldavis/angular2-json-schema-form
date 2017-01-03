import { Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../../library/json-schema-form.service';

@Component({
  selector: 'material-card-widget',
  template: `
    <md-card
      [attr.disabled]="options?.readonly"
      [class]="options?.htmlClass"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded">
      <md-card-title-group *ngIf="options?.title || options?.description"
        [class]="options?.labelHtmlClass"
        (click)="expand()">
        <md-card-title *ngIf="options?.title"
          [class.sr-only]="options?.notitle"
          [innerHTML]="options?.title">{{options?.title}}</md-card-title>
        <md-card-subtitle *ngIf="options?.description">{{options?.description}}</md-card-subtitle>
      </md-card-title-group>
      <md-card-content>
        <root-widget *ngIf="expanded"
          [formID]="formID"
          [layout]="layoutNode.items"
          [dataIndex]="dataIndex"
          [layoutIndex]="layoutIndex"
          [isOrderable]="options?.orderable"></root-widget>
      </md-card-content>
    </md-card>`,
  styles: [`
    .expandable > legend:before { content: '\\25B8'; padding-right: .3em; }
    .expanded > legend:before { content: '\\25BE'; padding-right: .2em; }
  `],
})
export class MaterialCardComponent implements OnInit {
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
    if (this.options.expandable) this.expanded = !this.expanded;
  }
}
