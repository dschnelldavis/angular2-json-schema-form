import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'flex-layout-section-widget',
  template: `
    <div *ngIf="containerType === 'div'"
      [class]="options?.htmlClass"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded">
      <label *ngIf="options?.title"
        [class]="options?.labelHtmlClass"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"
        (click)="expand()"></label>

        <flex-layout-root-widget
          *ngIf="expanded"
          [formID]="formID"
          [layout]="layoutNode.items"
          [dataIndex]="dataIndex"
          [layoutIndex]="layoutIndex"
          [isOrderable]="options?.orderable"
          [isFlexItem]="getFlexAttribute('is-flex')"
          [class.form-flex-column]="getFlexAttribute('flex-direction') === 'column'"
          [class.form-flex-row]="getFlexAttribute('flex-direction') === 'row'"
          [style.display]="getFlexAttribute('display')"
          [style.flex-direction]="getFlexAttribute('flex-direction')"
          [style.flex-wrap]="getFlexAttribute('flex-wrap')"
          [style.justify-content]="getFlexAttribute('justify-content')"
          [style.align-items]="getFlexAttribute('align-items')"
          [style.align-content]="getFlexAttribute('align-content')"
          [fxLayout]="options.fxLayout"
          [fxLayoutWrap]="options.fxLayoutWrap"
          [fxLayoutGap]="options.fxLayoutGap"
          [fxLayoutAlign]="options.fxLayoutAlign"
          [attr.fxFlexFill]="options.fxLayoutAlign"></flex-layout-root-widget>

    </div>

    <fieldset *ngIf="containerType === 'fieldset'"
      [class]="options?.htmlClass"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded"
      [disabled]="options?.readonly">
      <legend
        [class]="options?.labelHtmlClass"
        [style.display]="legendDisplay()"
        [innerHTML]="options?.title"
        (click)="expand()"></legend>

        <flex-layout-root-widget
          *ngIf="expanded"
          [formID]="formID"
          [layout]="layoutNode.items"
          [dataIndex]="dataIndex"
          [layoutIndex]="layoutIndex"
          [isOrderable]="options?.orderable"
          [isFlexItem]="getFlexAttribute('is-flex')"
          [class.form-flex-column]="getFlexAttribute('flex-direction') === 'column'"
          [class.form-flex-row]="getFlexAttribute('flex-direction') === 'row'"
          [style.display]="getFlexAttribute('display')"
          [style.flex-direction]="getFlexAttribute('flex-direction')"
          [style.flex-wrap]="getFlexAttribute('flex-wrap')"
          [style.justify-content]="getFlexAttribute('justify-content')"
          [style.align-items]="getFlexAttribute('align-items')"
          [style.align-content]="getFlexAttribute('align-content')"
          [fxLayout]="options.fxLayout"
          [fxLayoutWrap]="options.fxLayoutWrap"
          [fxLayoutGap]="options.fxLayoutGap"
          [fxLayoutAlign]="options.fxLayoutAlign"
          [attr.fxFlexFill]="options.fxLayoutAlign"></flex-layout-root-widget>

    </fieldset>`,
  styles: [`
    .expandable > legend:before { content: '▶'; padding-right: .3em; }
    .expanded > legend:before { content: '▼'; padding-right: .2em; }
  `],
})
export class FlexLayoutSectionComponent implements OnInit {
  options: any;
  expanded: boolean = true;
  containerType: string;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
console.log(this.layoutNode.type);
    switch (this.layoutNode.type) {
      case 'fieldset': case 'advancedfieldset': case 'authfieldset':
      case 'optionfieldset': case 'selectfieldset':
        this.containerType = 'fieldset';
      break;
      default: // 'div', 'section', 'flex', 'array', 'tab', 'conditional', 'actions', 'tagsinput'
        this.containerType = 'div';
      break;
    }
    this.options = this.layoutNode.options || {};
    this.expanded = !this.options.expandable;
  }

  legendDisplay(): string {
    return this.options.notitle || !this.options.title ? 'none' : '';
  }

  expand() {
    if (this.options.expandable) { this.expanded = !this.expanded; }
  }

  // Set attributes for flexbox container
  // (child attributes are set in flex-layout-root.component)
  getFlexAttribute(attribute: string) {
    const flexActive: boolean =
      this.layoutNode.type === 'flex' ||
      !!this.options.displayFlex ||
      this.options.display === 'flex';
    if (attribute !== 'flex' && !flexActive) { return null; }
    switch (attribute) {
      case 'is-flex':
        return flexActive;
      case 'display':
        return flexActive ? 'flex' : 'initial';
      case 'flex-direction': case 'flex-wrap':
        const index = ['flex-direction', 'flex-wrap'].indexOf(attribute);
        return (this.options['flex-flow'] || '').split(/\s+/)[index] ||
          this.options[attribute] || ['row', 'nowrap'][index];
      case 'justify-content': case 'align-items': case 'align-content':
        return this.options[attribute];
    }
  }
}
