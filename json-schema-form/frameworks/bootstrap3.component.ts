import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import {
  addClasses, getControl, inArray, isNumber, JsonPointer, parseText,
  toIndexedPointer
} from '../utilities/index';

@Component({
  moduleId: module.id,
  selector: 'bootstrap3-framework',
  templateUrl: 'bootstrap3.component.html',
  styleUrls: ['bootstrap3.component.css'],
})
export class Bootstrap3Component implements OnInit, OnChanges {
  private controlInitialized: boolean = false;
  private options: any; // Options used by framework
  private widgetOptions: any; // Options passed to child widget
  private layoutPointer: string;
  private formControl: any = null;
  private formControlName: string;
  private debugOutput: any = '';
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    if (this.layoutNode) {
      this.options = Object.assign({}, this.layoutNode.options);
      this.widgetOptions = this.layoutNode.options;
      this.layoutPointer = this.formSettings.getLayoutPointer(this);
      this.formControl = this.formSettings.getControl(this);
      this.updateArrayItems();

      this.options.isInputWidget = inArray(this.layoutNode.type, [
        'button', 'checkbox', 'checkboxes-inline', 'checkboxes', 'color',
        'date', 'datetime-local', 'datetime', 'email', 'file', 'hidden',
        'image', 'integer', 'month', 'number', 'password', 'radio',
        'radiobuttons', 'radios-inline', 'radios', 'range', 'reset', 'search',
        'select', 'submit', 'tel', 'text', 'textarea', 'time', 'url', 'week'
      ]);

      this.options.title = this.setTitle(this.layoutNode.type);

      this.options.htmlClass =
        addClasses(this.options.htmlClass, 'schema-form-' + this.layoutNode.type);
      if (this.layoutNode.type === 'array') {
        this.options.htmlClass =
          addClasses(this.options.htmlClass, 'list-group');
      } else if (this.options.isArrayItem && this.layoutNode.type !== '$ref') {
        this.options.htmlClass =
          addClasses(this.options.htmlClass, 'list-group-item');
      } else {
        this.options.htmlClass =
          addClasses(this.options.htmlClass, 'form-group');
      }
      this.widgetOptions.htmlClass = '';

      this.options.labelHtmlClass =
        addClasses(this.options.labelHtmlClass, 'control-label');

      this.widgetOptions.activeClass = 'active';

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

      if (this.formControl && this.controlInitialized) {
        this.controlInitialized = true;
        this.formControl.statusChanges.subscribe(value => {
          if (!this.options.disableErrorState &&
            this.options.feedback && value === 'INVALID' &&
            this.formControl.dirty && this.formControl.errors
          ) {
            this.options.errorMessage = Object.keys(this.formControl.errors).map(
                error => [error, Object.keys(this.formControl.errors[error]).map(
                  errorParameter => errorParameter + ': ' +
                    this.formControl.errors[error][errorParameter]
                ).join(', ')].filter(e => e).join(' - ')
              ).join('<br>');
          } else {
            this.options.errorMessage = null;
          }
        });

        if (this.options.debug) {
          let vars: any[] = [];
          // vars.push(this.formSettings.formGroup.value[this.options.name]);
          // vars.push(this.formSettings.formGroup.controls[this.options.name]['errors']);
          this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
        }
      }
    }
  }

  ngOnChanges() {
    this.updateArrayItems();
  }

  private updateArrayItems() {
    if (this.options.isArrayItem) {
      const arrayIndex = this.dataIndex[this.dataIndex.length - 1];
      const arrayPointer = JsonPointer.parse(this.layoutPointer).slice(0, -2);
      const parentArray = JsonPointer.get(this.formSettings.layout, arrayPointer);
      const minItems = parentArray.minItems || 0;
      const lastArrayItem = parentArray.items.length - 2;
      const tupleItems = parentArray.tupleItems;
      if (this.options.type !== '$ref' && this.options.removable &&
        arrayIndex >= minItems &&
        (arrayIndex >= tupleItems || arrayIndex === lastArrayItem)
      ) {
        this.options.removable = true;
      }
    }
  }

  private setTitle(type: string): string {
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
          !isNumber(this.layoutNode.name) && this.layoutNode.name !== '-' ?
          this.layoutNode.name : null
        );
        this.widgetOptions.title = null;
        return parseText(thisTitle, this.formControl.value,
          this.formSettings.formGroup.value,
          this.dataIndex[this.dataIndex.length - 1]);
    }
  }

  private removeItem() {
    this.formSettings.removeItem(this);
  }
}
