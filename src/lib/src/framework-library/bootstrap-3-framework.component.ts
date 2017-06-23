import { ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';

import * as _ from 'lodash';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { addClasses, inArray, JsonPointer, toTitleCase } from '../shared';

/**
 * Bootstrap 3 framework for Angular JSON Schema Form.
 *
 */
@Component({
  selector: 'bootstrap-3-framework',
  template: `
    <div
      [class]="options?.htmlClass"
      [class.has-feedback]="options?.feedback && options?.isInputWidget &&
        (formControl?.dirty || options?.feedbackOnRender)"
      [class.has-error]="options?.enableErrorState && formControl?.errors &&
        (formControl?.dirty || options?.feedbackOnRender)"
      [class.has-success]="options?.enableSuccessState && !formControl?.errors &&
        (formControl?.dirty || options?.feedbackOnRender)">

      <button *ngIf="layoutNode?.arrayItem && options?.removable"
        class="close pull-right"
        style="position: relative; z-index: 20;"
        type="button"
        (click)="removeItem()">
        <span aria-hidden="true">&times;</span>
        <span class="sr-only">Close</span>
      </button>
      <div *ngIf="options?.messageLocation === 'top'">
          <p *ngIf="options?.helpBlock"
          class="help-block"
          [innerHTML]="options?.helpBlock"></p>
      </div>

      <label *ngIf="options?.title && layoutNode?.type !== 'tab'"
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.labelHtmlClass"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></label>
      <strong *ngIf="options?.title && !options?.notitle && options?.required"
        class="text-danger">*</strong>
      <p *ngIf="layoutNode?.type === 'submit' && jsf?.globalOptions?.fieldsRequired">
        <strong class="text-danger">*</strong> = required fields
      </p>
      <div [class.input-group]="options?.fieldAddonLeft || options?.fieldAddonRight">
        <span *ngIf="options?.fieldAddonLeft"
          class="input-group-addon"
          [innerHTML]="options?.fieldAddonLeft"></span>

        <select-widget-widget
          [formID]="formID"
          [layoutNode]="widgetLayoutNode"
          [dataIndex]="dataIndex"
          [layoutIndex]="layoutIndex"></select-widget-widget>

        <span *ngIf="options?.fieldAddonRight"
          class="input-group-addon"
          [innerHTML]="options?.fieldAddonRight"></span>
      </div>

      <span *ngIf="options?.feedback && options?.isInputWidget &&
          !options?.fieldAddonRight && !layoutNode.arrayItem &&
          (formControl?.dirty || options?.feedbackOnRender)"
        [class.glyphicon-ok]="options?.enableSuccessState && !formControl?.errors"
        [class.glyphicon-remove]="options?.enableErrorState && formControl?.errors"
        aria-hidden="true"
        class="form-control-feedback glyphicon"></span>
      <div *ngIf="options?.messageLocation !== 'top'">
        <p *ngIf="options?.helpBlock"
          class="help-block"
          [innerHTML]="options?.helpBlock"></p>
      </div>
    </div>

    <div *ngIf="debug && debugOutput">debug: <pre>{{debugOutput}}</pre></div>
  `,
  styles: [`
    :host /deep/ .list-group-item .form-control-feedback { top: 40; }
    :host /deep/ .checkbox,
    :host /deep/ .radio { margin-top: 0; margin-bottom: 0; }
    :host /deep/ .checkbox-inline,
    :host /deep/ .checkbox-inline + .checkbox-inline,
    :host /deep/ .checkbox-inline + .radio-inline,
    :host /deep/ .radio-inline,
    :host /deep/ .radio-inline + .radio-inline,
    :host /deep/ .radio-inline + .checkbox-inline { margin-left: 0; margin-right: 10px; }
    :host /deep/ .checkbox-inline:last-child,
    :host /deep/ .radio-inline:last-child { margin-right: 0; }
  `],
})
export class Bootstrap3FrameworkComponent implements OnInit, OnChanges {
  controlInitialized: boolean = false;
  widgetOptions: any; // Options passed to child widget
  layoutPointer: string;
  widgetLayoutNode: any; // layoutNode passed to child widget
  options: any; // Options used in this framework
  formControl: any = null;
  debugOutput: any = '';
  debug: any = '';
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    public changeDetector: ChangeDetectorRef,
    public jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.initializeControl();
  }

  ngOnChanges() {
    this.updateArrayItems();
    if (!this.controlInitialized) { this.initializeControl(); }
  }

  initializeControl() {
    if (this.layoutNode) {
      this.options = _.cloneDeep(this.layoutNode.options);
      this.widgetLayoutNode = Object.assign(
        {}, this.layoutNode, { options: _.cloneDeep(this.layoutNode.options) }
      );
      this.widgetOptions = this.widgetLayoutNode.options;
      this.layoutPointer = this.jsf.getLayoutPointer(this);
      this.formControl = this.jsf.getControl(this);
      this.updateArrayItems();

      this.options.isInputWidget = inArray(this.layoutNode.type, [
        'button', 'checkbox', 'checkboxes-inline', 'checkboxes', 'color',
        'date', 'datetime-local', 'datetime', 'email', 'file', 'hidden',
        'image', 'integer', 'month', 'number', 'password', 'radio',
        'radiobuttons', 'radios-inline', 'radios', 'range', 'reset', 'search',
        'select', 'submit', 'tel', 'text', 'textarea', 'time', 'url', 'week'
      ]);

      this.options.title = this.setTitle();

      this.options.htmlClass =
        addClasses(this.options.htmlClass, 'schema-form-' + this.layoutNode.type);
      if (this.layoutNode.type === 'array') {
        this.options.htmlClass =
          addClasses(this.options.htmlClass, 'list-group');
      } else if (this.layoutNode.arrayItem && this.layoutNode.type !== '$ref') {
        this.options.htmlClass =
          addClasses(this.options.htmlClass, 'list-group-item');
      } else {
        this.options.htmlClass =
          addClasses(this.options.htmlClass, 'form-group');
      }
      this.widgetOptions.htmlClass = '';
      this.options.labelHtmlClass =
        addClasses(this.options.labelHtmlClass, 'control-label');

      this.widgetOptions.activeClass =
        addClasses(this.widgetOptions.activeClass, 'active');

      this.options.fieldAddonLeft =
        this.options.fieldAddonLeft || this.options.prepend;

      this.options.fieldAddonRight =
        this.options.fieldAddonRight || this.options.append;

      // Set miscelaneous styles and settings for each control type
      switch (this.layoutNode.type) {
        // Checkbox controls
        case 'checkbox': case 'checkboxes':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'checkbox');
        break;
        case 'checkboxes-inline':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'checkbox');
          this.widgetOptions.itemLabelHtmlClass = addClasses(
            this.widgetOptions.itemLabelHtmlClass, 'checkbox-inline');
        break;
        // Radio controls
        case 'radio': case 'radios':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'radio');
        break;
        case 'radios-inline':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'radio');
          this.widgetOptions.itemLabelHtmlClass = addClasses(
            this.widgetOptions.itemLabelHtmlClass, 'radio-inline');
        break;
        // Button sets - checkboxbuttons and radiobuttons
        case 'checkboxbuttons': case 'radiobuttons':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'btn-group');
          this.widgetOptions.itemLabelHtmlClass = addClasses(
            this.widgetOptions.itemLabelHtmlClass, 'btn');
          this.widgetOptions.itemLabelHtmlClass = addClasses(
            this.widgetOptions.itemLabelHtmlClass, this.options.style || 'btn-default');
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, 'sr-only');
        break;
        // Single button controls
        case 'button': case 'submit':
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, 'btn');
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, this.options.style || 'btn-info');
        break;
        // Containers - arrays and fieldsets
        case 'array': case 'fieldset': case 'section': case 'conditional':
        case 'advancedfieldset': case 'authfieldset':
        case 'selectfieldset': case 'optionfieldset':
          this.options.messageLocation = 'top';
          if (this.options.title && this.options.required &&
            this.options.title.indexOf('*') === -1
          ) {
            this.options.title += ' <strong class="text-danger">*</strong>';
          }
        break;
        case 'tabarray': case 'tabs':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'tab-content');
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, 'tab-pane');
          this.widgetOptions.labelHtmlClass = addClasses(
            this.widgetOptions.labelHtmlClass, 'nav nav-tabs');
        break;
        // 'Add' buttons - references
        case '$ref':
          this.widgetOptions.fieldHtmlClass =
            addClasses(this.widgetOptions.fieldHtmlClass, 'btn pull-right');
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, this.options.style || 'btn-default');
          this.options.icon = 'glyphicon glyphicon-plus';
        break;
        // Default - including regular inputs
        default:
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, 'form-control');
      }

      if (this.formControl) {
        this.updateHelpBlock(this.formControl.status);
        this.formControl.statusChanges.subscribe(value => this.updateHelpBlock(value));

        if (this.options.debug) {
          let vars: any[] = [];
          // vars.push(this.jsf.formGroup.value[this.options.name]);
          // vars.push(this.jsf.formGroup.controls[this.options.name]['errors']);
          this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
        }
      }
      this.controlInitialized = true;
    }

  }

  updateHelpBlock(value){
    this.options.helpBlock = this.options.description|| this.options.help || false;
    if (this.options.enableErrorState && value === 'INVALID' && this.formControl.errors &&
      (this.formControl.dirty || this.options.feedbackOnRender)
    ) {
      this.options.helpBlock = Object.keys(this.formControl.errors).map(
        error => [error, Object.keys(this.formControl.errors[error]).map(
          errorParameter => errorParameter + ': ' +
          this.formControl.errors[error][errorParameter]
        ).join(', ')].filter(e => e).join(' - ')
      ).join('<br>');

    }
  }

  updateArrayItems() {
    if (this.layoutNode.arrayItem && this.options.removable &&
      this.dataIndex && this.dataIndex.length
    ) {
      const arrayIndex = this.dataIndex[this.dataIndex.length - 1];
      const parentArray =
        JsonPointer.get(this.jsf.layout, this.layoutPointer, 0, -2);
      if (parentArray && parentArray.items && parentArray.items.length >= 2) {
        const minItems = parentArray.minItems || 0;
        const lastArrayItem = parentArray.items.length - 2;
        const tupleItems = parentArray.tupleItems;
        if (arrayIndex >= minItems && this.options.type !== '$ref' &&
          (arrayIndex >= tupleItems || arrayIndex === lastArrayItem)
        ) {
          this.options.removable = true;
        }
      }
    }
  }

  setTitle(): string {
    switch (this.layoutNode.type) {
      case 'button':  case 'checkbox': case 'help':     case 'msg':
      case 'message': case 'submit':   case 'tabarray': case '$ref':
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
        if (!thisTitle) { return null; }
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

  removeItem() {
    this.jsf.removeItem(this);
  }
}
