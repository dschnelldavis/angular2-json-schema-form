import {
  AfterContentChecked, Component, ComponentFactoryResolver, ComponentRef,
  Input, OnChanges, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import {
  addClasses, getControl, inArray, isNumber, JsonPointer, toIndexedPointer
} from '../utilities/index';

@Component({
  moduleId: module.id,
  selector: 'bootstrap3-framework',
  templateUrl: 'bootstrap3.component.html',
  styleUrls: ['bootstrap3.component.css'],
})
export class Bootstrap3Component implements OnInit, OnChanges, AfterContentChecked {
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
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  ngOnInit() {
    if (this.layoutNode) {
      this.options = Object.assign({}, this.layoutNode.options);
      this.widgetOptions = this.layoutNode.options;
      this.layoutPointer =
        toIndexedPointer(this.layoutNode.layoutPointer, this.layoutIndex);

      this.updateArrayItems();

      if (this.layoutNode.hasOwnProperty('dataPointer')) {
        this.formControl =
          getControl(this.formSettings.formGroup, this.layoutNode.dataPointer);
      }

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
      if (
        !this.controlInitialized && this.layoutNode && this.layoutNode.widget &&
        this.widgetContainer && !this.widgetContainer.length
      ) {
        let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
          this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
        );
        for (let input of ['layoutNode', 'formSettings', 'layoutIndex', 'dataIndex']) {
          addedNode.instance[input] = this[input];
        }
        this.controlInitialized = true;

        if (this.formControl) {
          this.formControl.statusChanges.subscribe(value => {
            if (value === 'INVALID' && this.formControl.errors) {
              this.options.errorMessage = Object.keys(this.formControl.errors).map(
                  error => [error, Object.keys(this.formControl.errors[error]).map(
                    errorParameter => errorParameter + ': ' +
                      this.formControl.errors[error][errorParameter]
                  ).join(', ')].filter(e => e).join(' - ')
                ).join('<br>');
            } else {
              this.widgetOptions.errorMessage = null;
            }
          });
        }

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

  ngAfterContentChecked() {
  }

  private updateArrayItems() {
    if (this.options.isArrayItem) {
      const arrayIndex = this.dataIndex[this.dataIndex.length - 1];
      const arrayPointer = JsonPointer.parse(this.layoutPointer).slice(0, -2);
      const parentArray = JsonPointer.get(this.formSettings.layout, arrayPointer);
      const minItems = parentArray.minItems || 0;
      const lastArrayItem = parentArray.items.length - 2;
      const tupleItems = parentArray.tupleItems;
      if (this.options.isRemovable && arrayIndex >= minItems &&
        (arrayIndex >= tupleItems || arrayIndex === lastArrayItem)
      ) {
        this.options.isRemovable = true;
      }
    }
  }

  private setTitle(type: string): string {
    switch (this.layoutNode.type) {
      case 'array': case 'button': case 'checkbox': case 'conditional':
      case 'fieldset': case 'help': case 'msg': case 'message':
      case 'section': case 'submit': case '$ref':
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
        return thisTitle;
    }
  }

  private removeItem() {
    this.formSettings.removeItem(this);
  }
}
