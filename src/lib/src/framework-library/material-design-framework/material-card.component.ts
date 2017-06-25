import { Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'material-card-widget',
  template: `
    <md-card
      [attr.disabled]="options?.readonly"
      [class]="options?.htmlClass"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded">
      <md-card-header *ngIf="options?.title || options?.description"
        [class]="options?.labelHtmlClass"
        (click)="expand()">
        <md-card-title *ngIf="options?.title"
          [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="options?.title"></md-card-title>
        <md-card-subtitle *ngIf="options?.description">{{options?.description}}</md-card-subtitle>
      </md-card-header>
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
    .expandable > legend:before { content: '▶'; padding-right: .3em; }
    .expanded > legend:before { content: '▼'; padding-right: .2em; }
  `],
})
export class MaterialCardComponent implements OnInit {
  options: any;
  expanded: boolean = true;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.expanded = !this.options.expandable;
  }

  expand() {
    if (this.options.expandable) this.expanded = !this.expanded;
  }
}
