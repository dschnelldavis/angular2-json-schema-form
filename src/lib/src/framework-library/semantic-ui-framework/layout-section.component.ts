import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { toTitleCase } from '../../shared';
import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'layout-section-widget',
  template: `
    <div></div>
    <h4 *ngIf="sectionTitle"
        [class]="'ui dividing header ' + (options?.labelHtmlClass || '')"
        [innerHTML]="sectionTitle"
        (click)="toggleExpanded()"></h4>
    <div *ngIf="containerType === 'div'"
         [class.expandable]="options?.expandable && !expanded"
         [class.expanded]="options?.expandable && expanded">
      <layout-root-widget *ngIf="expanded"
                          [layout]="layoutNode.items"
                          [dataIndex]="dataIndex"
                          [layoutIndex]="layoutIndex"></layout-root-widget>
      <div class = "ui error message" *ngIf="options?.showErrors && options?.errorMessage"
           [innerHTML]="options?.errorMessage"></div>
    </div>

    <fieldset *ngIf="containerType === 'fieldset'"
              [class]="options?.htmlClass || ''"
              [class.expandable]="options?.expandable && !expanded"
              [class.expanded]="options?.expandable && expanded"
              [disabled]="options?.readonly">
      <layout-root-widget *ngIf="expanded"
                          [layout]="layoutNode.items"
                          [dataIndex]="dataIndex"
                          [layoutIndex]="layoutIndex"></layout-root-widget>
      <div class = "ui error message"  *ngIf="options?.showErrors && options?.errorMessage"
           [innerHTML]="options?.errorMessage"></div>
    </fieldset>

    <div *ngIf="containerType === 'card'"
         [class]="options?.htmlClass || ''"
         [class.expandable]="options?.expandable && !expanded"
         [class.expanded]="options?.expandable && expanded">
      <div class="ui content" *ngIf="sectionTitle">
        <div class="header"
             [innerHTML]="sectionTitle">
        </div>
      </div>
      <div class="ui content">
        <fieldset [disabled]="options?.readonly">
          <layout-root-widget *ngIf="expanded"
                              [layout]="layoutNode.items"
                              [dataIndex]="dataIndex"
                              [layoutIndex]="layoutIndex"></layout-root-widget>
        </fieldset>
      </div>
      <div class="ui content">
        <div class="footer">
          <div class = "ui error message"  *ngIf="options?.showErrors && options?.errorMessage"
               [innerHTML]="options?.errorMessage"></div>
        </div>
      </div>
    </div>`,
  styles: [`
    fieldset { border: 0; margin: 0; padding: 0; }
    .legend { font-weight: bold; }
    .expandable > .legend:before { content: '▶'; padding-right: .3em; }
    .expanded > .legend:before { content: '▼'; padding-right: .2em; }
  `],
})
export class LayoutSectionComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  expanded = true;
  containerType = 'div';
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  get sectionTitle() {
    return this.options.notitle ? null : this.jsf.setItemTitle(this);
  }

  ngOnInit() {
    this.jsf.initializeControl(this);
    this.options = this.layoutNode.options || {};
    this.expanded = typeof this.options.expanded === 'boolean' ?
      this.options.expanded : !this.options.expandable;
    switch (this.layoutNode.type) {
      case 'section': case 'array': case 'fieldset': case 'advancedfieldset':
      case 'authfieldset': case 'optionfieldset': case 'selectfieldset':
      this.containerType = 'fieldset';
      break;
      case 'card':
        this.containerType = 'card';
        break;
      case 'expansion-panel':
        this.containerType = 'expansion-panel';
        break;
      default: // 'div', 'flex', 'tab', 'conditional', 'actions'
        this.containerType = 'div';
    }
  }

  toggleExpanded() {
    if (this.options.expandable) { this.expanded = !this.expanded; }
  }
}
