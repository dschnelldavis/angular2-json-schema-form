import { ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';

import * as _ from 'lodash';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { toTitleCase } from '../../shared';

@Component({
  selector: 'material-design-framework',
  template: `
    <div
      [class.array-item]="layoutNode?.arrayItem && layoutNode?.type !== '$ref'"
      [orderable]="isOrderable"
      [formID]="formID"
      [dataIndex]="dataIndex"
      [layoutIndex]="layoutIndex"
      [layoutNode]="layoutNode">
      <svg *ngIf="showRemoveButton"
        xmlns="http://www.w3.org/2000/svg"
        height="18" width="18" viewBox="0 0 24 24"
        class="close-button"
        (click)="removeItem()">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
      <select-widget-widget
        [formID]="formID"
        [data]="data"
        [dataIndex]="dataIndex"
        [layoutIndex]="layoutIndex"
        [layoutNode]="layoutNode"></select-widget-widget>
    </div>
    <div class="spacer" *ngIf="layoutNode?.arrayItem && layoutNode?.type !== '$ref'"></div>`,
  styles: [`
    .array-item {
      border-radius: 2px;
      box-shadow: 0 3px 1px -2px rgba(0,0,0,.2),
                  0 2px 2px 0 rgba(0,0,0,.14),
                  0 1px 5px 0 rgba(0,0,0,.12);
      padding: 6px;
      position: relative;
      transition: all 280ms cubic-bezier(.4, 0, .2, 1);
    }
    .close-button {
      cursor: pointer;
      position: absolute;
      top: 6px;
      right: 6px;
      fill: rgba(0,0,0,.4);
      visibility: hidden;
      z-index: 500;
    }
    .close-button:hover { fill: rgba(0,0,0,.8); }
    .array-item:hover > .close-button { visibility: visible; }
    .spacer { margin: 6px 0; }
    [draggable=true]:hover {
      box-shadow: 0 5px 5px -3px rgba(0,0,0,.2),
                  0 8px 10px 1px rgba(0,0,0,.14),
                  0 3px 14px 2px rgba(0,0,0,.12);
      cursor: move;
      z-index: 10;
    }
    [draggable=true].drag-target-top {
      box-shadow: 0 -2px 0 #000;
      position: relative; z-index: 20;
    }
    [draggable=true].drag-target-bottom {
      box-shadow: 0 2px 0 #000;
      position: relative; z-index: 20;
    }
  `],
})
export class MaterialDesignFrameworkComponent implements OnInit, OnChanges {
  controlInitialized: boolean = false;
  controlType: string;
  inputType: string;
  options: any; // Options used in this framework
  widgetLayoutNode: any; // layoutNode passed to child widget
  widgetOptions: any; // Options passed to child widget
  layoutPointer: string;
  formControl: any = null;
  parentArray: any = null;
  isOrderable: boolean = false;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
  @Input() data: any;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private jsf: JsonSchemaFormService
  ) { }

  get showRemoveButton(): boolean {
    if (!this.layoutNode || !this.options.removable || this.options.readonly ||
      this.layoutNode.type === '$ref'
    ) { return false; }
    if (this.layoutNode.recursiveReference) { return true; }
    if (!this.layoutNode.arrayItem || !this.parentArray) { return false; }
    // If array length <= minItems, don't allow removing any items
    return this.parentArray.items.length - 1 <= this.parentArray.options.minItems ? false :
      // For removable list items, allow removing any item
      this.layoutNode.arrayItemType === 'list' ? true :
      // For removable tuple items, only allow removing last item in list
      this.layoutIndex[this.layoutIndex.length - 1] === this.parentArray.items.length - 2;
  }

  ngOnInit() {
    this.initializeControl();
  }

  ngOnChanges() {
    if (!this.controlInitialized) { this.initializeControl(); }
  }

  initializeControl() {
    if (this.layoutNode) {
      this.options = _.cloneDeep(this.layoutNode.options || {});
      this.widgetLayoutNode = {
        ...this.layoutNode,
        options: _.cloneDeep(this.layoutNode.options || {})
      };
      this.widgetOptions = this.widgetLayoutNode.options;
      this.layoutPointer = this.jsf.getLayoutPointer(this);
      this.formControl = this.jsf.getFormControl(this);

      if (this.options) {
        this.options.title = this.setTitle();
        if (this.options.minimum && this.options.maximum) {
          this.layoutNode.type = 'range';
        }
      }

      // Set control type and associated settings
      switch (this.layoutNode.type) {

        case 'text':     case 'email':
        case 'integer':  case 'url':    case 'datetime':       case 'time':
        case 'number':   case 'search': case 'date-time':      case 'week':
        case 'updown':   case 'tel':    case 'alt-datetime':   case 'month':
        case 'password':                case 'datetime-local':
          this.controlType = 'input';
          if (this.layoutNode.type === 'integer') {
            this.inputType = 'number'
          } else {
            this.layoutNode.type = {
              'updown'       : 'number',
              'alt-date'     : 'date',
              'datetime'     : 'datetime-local',
              'date-time'    : 'datetime-local',
              'alt-datetime' : 'datetime-local',
            }[this.layoutNode.type] || this.layoutNode.type;
            this.inputType = this.layoutNode.type;
          }
        break;

        case 'date': case 'alt-date':
          this.controlType = 'date';
          if (this.layoutNode.type === 'alt-date') {
            this.layoutNode.type = 'date';
          }
        break;

        case 'hidden': case 'color': case 'image':
          this.controlType = 'none';
          // TODO: add apropriate widgets for hidden, color, and image
        break

        case 'range':
          this.controlType = 'slider';
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

        case 'radio': case 'radios': case 'radios-inline':
          this.controlType = 'radios';
        break;

        case 'radiobuttons':
          this.controlType = 'buttonGroup';
          // TODO: update buttonGroup to also handle checkboxbuttons
        break;

        case 'reset': case 'submit': case 'button':
          this.controlType = 'button';
        break;

        case 'fieldset': case 'conditional':    case 'actions':
        case 'array':    case 'authfieldset':   case 'optionfieldset':
        case 'tab':      case 'selectfieldset': case 'advancedfieldset':
        case 'section':  case 'wizard':
          this.controlType = 'section';
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

      if (this.layoutNode.arrayItem && this.layoutNode.type !== '$ref') {
        this.parentArray = this.jsf.getParentNode(this);
        if (this.parentArray) {
          this.isOrderable = this.layoutNode.arrayItemType === 'list' &&
            !this.options.readonly && this.parentArray.options.orderable;
        }
      }

      this.controlInitialized = true;
    } else {
      this.options = {};
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
      case 'tabs':
      case 'section':
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
          this.jsf.getFormControlValue(this),
          this.jsf.getFormControlGroup(this).value,
          this.dataIndex[this.dataIndex.length - 1]
        );
    }
  }

  removeItem() {
    this.jsf.removeItem(this);
  }
}
