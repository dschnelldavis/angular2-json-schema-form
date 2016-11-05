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
  styles: [`
    .list-group-item .form-control-feedback { top: 40; }
    .checkbox { margin-top: 0 }
  `],
})
export class Bootstrap3Component implements OnInit, OnChanges, AfterContentChecked {
  private controlInitialized: boolean = false;
  private displayWidget: boolean = true;
  private options: any;
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
      const widgetOptions = this.layoutNode.options; // Options passed to widget
      this.options = Object.assign({}, widgetOptions); // Options used by framework
      this.layoutPointer =
        toIndexedPointer(this.layoutNode.layoutPointer, this.layoutIndex);
      this.updateArrayItems();

      if (this.layoutNode.hasOwnProperty('dataPointer')) {
        let thisControl = getControl(this.formSettings.formGroup,
          this.layoutNode.dataPointer);
        if (thisControl) this.formControl = thisControl;
      }

      this.options.isInputWidget = inArray(this.layoutNode.type, [
        'button', 'checkbox', 'checkboxes-inline', 'checkboxes', 'color',
        'date', 'datetime-local', 'datetime', 'email', 'file', 'hidden',
        'image', 'integer', 'month', 'number', 'password', 'radio',
        'radiobuttons', 'radios-inline', 'radios', 'range', 'reset', 'search',
        'select', 'submit', 'tel', 'text', 'textarea', 'time', 'url', 'week'
      ]);

      this.options.title = this.setTitle(this.layoutNode.type);

      this.options.htmlClass = addClasses(this.options.htmlClass,
        'schema-form-' + this.layoutNode.type);
      if (this.layoutNode.type === 'array') {
        this.options.htmlClass = addClasses(this.options.htmlClass,
          'list-group');
      } else if (this.options.isArrayItem && this.layoutNode.type !== '$ref') {
        this.options.htmlClass = addClasses(this.options.htmlClass, 'list-group-item');
      } else {
        this.options.htmlClass = addClasses(this.options.htmlClass, 'form-group');
      }
      widgetOptions.htmlClass = '';

      this.options.labelHtmlClass = addClasses(this.options.labelHtmlClass,
        'control-label');

      this.options.fieldAddonLeft =
        this.options.fieldAddonLeft || this.options.prepend;

      this.options.fieldAddonRight =
        this.options.fieldAddonRight || this.options.append;

      // Set miscelaneous styles and settings for each control type
      switch (this.layoutNode.type) {
        case 'checkbox':
          this.options.htmlClass = addClasses(this.options.htmlClass, 'checkbox');
        break;
        case 'checkboxes':
          this.options.htmlClass =
            addClasses(this.options.htmlClass, 'checkbox');
        break;
        case 'checkboxes-inline':
          this.options.htmlClass = addClasses(this.options.htmlClass,
            'checkbox-inline');
        break;
        case 'button': case 'submit':
          widgetOptions.fieldHtmlClass = addClasses(widgetOptions.fieldHtmlClass, 'btn');
          widgetOptions.fieldHtmlClass =
            addClasses(widgetOptions.fieldHtmlClass, this.options.style || 'btn-info');
        break;
        case '$ref':
          widgetOptions.fieldHtmlClass =
            addClasses(widgetOptions.fieldHtmlClass, 'btn pull-right');
          widgetOptions.fieldHtmlClass =
            addClasses(widgetOptions.fieldHtmlClass, this.options.style || 'btn-default');
          this.options.icon = 'glyphicon glyphicon-plus';
        break;
        case 'array': case 'fieldset': case 'section': case 'conditional':
          this.options.isRemovable = false;
          this.options.messageLocation = 'top';
          if (this.options.title && this.options.required &&
            this.options.title.indexOf('*') === -1
          ) {
            this.options.title += ' <strong class="text-danger">*</strong>';
          }
        break;
        case 'help': case 'msg': case 'message':
          this.displayWidget = false;
        break;
        case 'radiobuttons':
          this.options.htmlClass = addClasses(this.options.htmlClass, 'btn-group');
          this.options.labelHtmlClass =
            addClasses(this.options.labelHtmlClass, 'btn btn-default');
          widgetOptions.fieldHtmlClass =
            addClasses(widgetOptions.fieldHtmlClass, 'sr-only');
        break;
        case 'radio': case 'radios':
          this.options.htmlClass = addClasses(this.options.htmlClass, 'radio');
        break;
        case 'radios-inline':
          this.options.labelHtmlClass =
            addClasses(this.options.labelHtmlClass, 'radio-inline');
        break;
        default:
          widgetOptions.fieldHtmlClass =
            addClasses(widgetOptions.fieldHtmlClass, 'form-control');
      }

      if (
        !this.controlInitialized && this.displayWidget &&
        this.widgetContainer && !this.widgetContainer.length &&
        this.layoutNode && this.layoutNode.widget
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
              widgetOptions.errorMessage = null;
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
    if (this.layoutNode.options.isArrayItem) {
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
        this.layoutNode.options.title = null;
        return 'Advanced options';
      case 'authfieldset':
        this.layoutNode.options.title = null;
        return 'Authentication settings';
      default:
        let thisTitle = this.options.title
          || (!isNumber(this.layoutNode.name) && this.layoutNode.name !== '-' ?
          this.layoutNode.name : null);
        this.layoutNode.options.title = null;
        return thisTitle;
    }
  }

  private removeItem() {
    this.formSettings.removeItem(this);
  }
}
