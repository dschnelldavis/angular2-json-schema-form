import { Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'material-card-widget',
  template: `
    <mat-card
      [attr.disabled]="options?.readonly"
      [class]="options?.htmlClass"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded">
      <mat-card-header *ngIf="options?.title || options?.description"
        [class]="options?.labelHtmlClass"
        (click)="expand()">
        <mat-card-title *ngIf="options?.title"
          [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="options?.title"></mat-card-title>
        <mat-card-subtitle *ngIf="options?.description">{{options?.description}}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <root-widget *ngIf="expanded"
          [formID]="formID"
          [layout]="layoutNode.items"
          [dataIndex]="dataIndex"
          [layoutIndex]="layoutIndex"
          [isOrderable]="options?.orderable"></root-widget>
      </mat-card-content>
    </mat-card>`,
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
