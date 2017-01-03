import {
  ChangeDetectorRef, Component, Input, OnChanges, OnInit
} from '@angular/core';

import * as _ from 'lodash';

import { JsonSchemaFormService } from '../../library/json-schema-form.service';
import { toTitleCase } from '../../library/utilities/index';

@Component({
  selector: 'material-design-framework',
  template: `
    <select-widget-widget
      [formID]="formID"
      [layoutNode]="layoutNode"
      [dataIndex]="dataIndex"
      [layoutIndex]="layoutIndex"></select-widget-widget>
  `
})
export class MaterialDesignComponent implements OnInit, OnChanges {
  private controlInitialized: boolean = false;
  private controlType: string;
  private inputType: string;
  private options: any; // Options used in this framework
  private widgetLayoutNode: any; // layoutNode passed to child widget
  private widgetOptions: any; // Options passed to child widget
  private layoutPointer: string;
  private formControl: any = null;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private changeDetector: ChangeDetectorRef,
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.initializeControl();
  }

  ngOnChanges() {
    if (!this.controlInitialized) this.initializeControl();
  }

  private initializeControl() {
    if (this.layoutNode) {
      this.options = _.cloneDeep(this.layoutNode.options);
      this.widgetLayoutNode = Object.assign(
        { }, this.layoutNode, { options: _.cloneDeep(this.layoutNode.options) }
      );
      this.widgetOptions = this.widgetLayoutNode.options;
      this.layoutPointer = this.jsf.getLayoutPointer(this);
      this.formControl = this.jsf.getControl(this);

      this.options.title = this.setTitle();

      // Set control type and associated styles and settings
      const type = this.layoutNode.type;
      switch (type) {

        case 'email': case 'integer': case 'number': case 'password':
        case 'search': case 'tel': case 'text': case 'url': case 'color':
        case 'date': case 'datetime': case 'datetime-local': case 'month':
        case 'range': case 'time': case 'week': case 'hidden': case 'image':
        case 'updown': case 'date-time': case 'alt-datetime': case 'alt-date':
          this.controlType = 'input';
          if (type === 'integer' || type === 'updown') {
            this.inputType = 'number';
          } else if (type === 'date-time' || type === 'alt-datetime') {
            this.inputType = 'datetime-local';
          } else if (type === 'alt-date') {
            this.inputType = 'date';
          } else {
            this.inputType = type;
          }
        break;

        case 'textarea':
          this.controlType = 'textarea';
        break;

        case 'file':
          this.controlType = 'file';
        break;

        case 'select':
          this.controlType = 'select';
        break;

        case 'checkbox':
          this.controlType = 'checkbox';
        break;

        case 'checkboxes': case 'checkboxes-inline': case 'checkboxbuttons':
          this.controlType = 'checkboxes';
        break;

        case 'radio': case 'radios': case 'radios-inline': case 'radiobuttons':
          this.controlType = 'radios';
        break;

        case 'reset': case 'submit': case 'button':
          this.controlType = 'button';
        break;

        case 'fieldset': case 'array': case 'tab': case 'advancedfieldset':
        case 'authfieldset': case 'optionfieldset': case 'selectfieldset':
        case 'section': case 'conditional': case 'actions': case 'wizard':
          this.controlType = 'fieldset';
        break;

        case 'tabs': case 'tabarray':
          this.controlType = 'tabs';
        break;

        case 'help': case 'message': case 'msg': case 'html':
          this.controlType = 'message';
        break;

        case 'template':
          this.controlType = 'template';
        break;

        default:
          this.controlType = this.layoutNode.type;
      }
      this.controlInitialized = true;
    }
  }

  private setTitle(): string {
    switch (this.layoutNode.type) {
      case 'array': case 'button': case 'checkbox': case 'conditional':
      case 'fieldset': case 'help': case 'msg': case 'message':
      case 'section': case 'submit': case 'tabarray': case '$ref':
        return null;
      case 'advancedfieldset':
        this.widgetOptions.expandable = true;
        this.widgetOptions.title = 'Advanced options';
        return null;
      case 'authfieldset':
        this.widgetOptions.expandable = true;
        this.widgetOptions.title = 'Authentication settings';
        return null;
      default:
        let thisTitle = this.options.title || (
          isNaN(this.layoutNode.name) && this.layoutNode.name !== '-' ?
          toTitleCase(this.layoutNode.name) : null
        );
        this.widgetOptions.title = null;
        if (!thisTitle) return null;
        if (thisTitle.indexOf('{') === -1 || !this.formControl || !this.dataIndex) {
          return thisTitle;
        }
        return this.jsf.parseText(
          thisTitle,
          this.jsf.getControlValue(this),
          this.jsf.getControlGroup(this).value,
          this.dataIndex[this.dataIndex.length - 1]
        );
    }
  }
}
