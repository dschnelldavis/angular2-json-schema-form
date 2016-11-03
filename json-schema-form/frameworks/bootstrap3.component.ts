import {
  AfterContentChecked, Component, ComponentFactoryResolver, ComponentRef,
  Input, OnChanges, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import {
  addClasses, getControl, isNumber, JsonPointer, toIndexedPointer
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
  private isRemovable: boolean = false;
  private isInputWidget: boolean;
  private arrayIndex: number;
  private itemPointer: string;
  private formControl: any = null;
  private messageLocation: string = 'bottom';
  private htmlClass: string;
  private labelHtmlClass: string;
  private title: string;
  private errorMessage = '';
  private debugOutput: any = '';
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  ngOnInit() {
    this.arrayIndex = this.index[this.index.length - 1];
    if (this.layoutNode) {
      this.itemPointer = toIndexedPointer(this.layoutNode.layoutPointer, this.index);
      this.updateArrayItems();

      if (this.layoutNode.hasOwnProperty('pointer')) {
        let thisControl = getControl(this.options.formGroup, this.layoutNode.pointer);
        if (thisControl) this.formControl = thisControl;
      }

      this.isInputWidget = [
        'button', 'checkbox', 'checkboxes-inline', 'checkboxes', 'color',
        'date', 'datetime-local', 'datetime', 'email', 'file', 'hidden',
        'image', 'integer', 'month', 'number', 'password', 'radio',
        'radiobuttons', 'radios-inline', 'radios', 'range', 'reset', 'search',
        'select', 'submit', 'tel', 'text', 'textarea', 'time', 'url', 'week'
      ].indexOf(this.layoutNode.type) !== -1;

      this.title = this.setTitle(this.layoutNode.type);

      this.htmlClass = this.layoutNode.htmlClass || '';
      this.htmlClass = addClasses(this.htmlClass, 'schema-form-' + this.layoutNode.type);
      if (this.layoutNode.type === 'array') {
        this.htmlClass = addClasses(this.htmlClass, 'list-group');
      } else if (this.layoutNode.isArrayItem && this.layoutNode.type !== '$ref') {
        this.htmlClass = addClasses(this.htmlClass, 'list-group-item');
      } else {
        this.htmlClass = addClasses(this.htmlClass, 'form-group');
      }
      this.htmlClass = addClasses(this.htmlClass, this.options.globalOptions.formDefaults.htmlClass);
      this.layoutNode.htmlClass = '';

      this.labelHtmlClass = this.layoutNode.labelHtmlClass || '';
      this.labelHtmlClass = addClasses(this.labelHtmlClass, 'control-label');
      this.labelHtmlClass = addClasses(this.labelHtmlClass, this.options.globalOptions.formDefaults.labelHtmlClass);

      this.layoutNode.fieldHtmlClass = this.layoutNode.fieldHtmlClass || '';
      this.layoutNode.fieldHtmlClass = addClasses(
        this.layoutNode.fieldHtmlClass,
        this.options.globalOptions.formDefaults.fieldHtmlClass
      );

      this.layoutNode.fieldAddonLeft =
        this.layoutNode.fieldAddonLeft || this.layoutNode.prepend;

      this.layoutNode.fieldAddonRight =
        this.layoutNode.fieldAddonRight || this.layoutNode.append;

      // Set miscelaneous styles and settings for each control type
      switch (this.layoutNode.type) {
        case 'checkbox':
          this.htmlClass = addClasses(this.htmlClass, 'checkbox');
        break;
        case 'checkboxes':
          this.layoutNode.htmlClass =
            addClasses(this.layoutNode.htmlClass, 'checkbox');
        break;
        case 'checkboxes-inline':
          this.htmlClass = addClasses(this.htmlClass, 'checkbox-inline');
        break;
        case 'button': case 'submit':
          this.layoutNode.fieldHtmlClass =
            addClasses(this.layoutNode.fieldHtmlClass, 'btn');
          this.layoutNode.fieldHtmlClass = addClasses(
            this.layoutNode.fieldHtmlClass,
            this.layoutNode.style || 'btn-info'
          );
        break;
        case '$ref':
          this.layoutNode.fieldHtmlClass =
            addClasses(this.layoutNode.fieldHtmlClass, 'btn pull-right');
          this.layoutNode.fieldHtmlClass = addClasses(
            this.layoutNode.fieldHtmlClass,
            this.layoutNode.style || 'btn-default'
          );
          this.layoutNode.icon = 'glyphicon glyphicon-plus';
        break;
        case 'array': case 'fieldset': case 'section': case 'conditional':
          this.layoutNode.isRemovable = false;
          this.messageLocation = 'top';
          if (this.layoutNode.title && this.layoutNode.required &&
            this.layoutNode.title.indexOf('*') === -1
          ) {
            this.layoutNode.title += ' <strong class="text-danger">*</strong>';
          }
        break;
        case 'help': case 'msg': case 'message':
          this.displayWidget = false;
        break;
        case 'radiobuttons':
          this.htmlClass = addClasses(this.htmlClass, 'btn-group');
          this.layoutNode.labelHtmlClass =
            addClasses(this.layoutNode.labelHtmlClass, 'btn btn-default');
          this.layoutNode.fieldHtmlClass =
            addClasses(this.layoutNode.fieldHtmlClass, 'sr-only');
        break;
        case 'radio': case 'radios':
          this.layoutNode.htmlClass =
            addClasses(this.layoutNode.htmlClass, 'radio');
        break;
        case 'radios-inline':
          this.layoutNode.labelHtmlClass =
            addClasses(this.layoutNode.labelHtmlClass, 'radio-inline');
        break;
        default:
          this.layoutNode.fieldHtmlClass =
            addClasses(this.layoutNode.fieldHtmlClass, 'form-control');
      }

      if (
        !this.controlInitialized && this.displayWidget &&
        this.widgetContainer && !this.widgetContainer.length &&
        this.layoutNode && this.layoutNode.widget
      ) {
        let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
          this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
        );
        addedNode.instance.layoutNode = this.layoutNode;
        for (let input of ['formGroup', 'options', 'index', 'debug']) {
          addedNode.instance[input] = this[input];
        }
        this.controlInitialized = true;

        if (this.formControl) {
          this.formControl.statusChanges.subscribe(value => {
            if (value === 'INVALID' && this.formControl.errors) {
              this.errorMessage = Object.keys(this.formControl.errors).map(
                  error => [error, Object.keys(this.formControl.errors[error]).map(
                    errorParameter => errorParameter + ': ' +
                      this.formControl.errors[error][errorParameter]
                  ).join(', ')].filter(e => e).join(' - ')
                ).join('<br>');
            } else {
              this.errorMessage = null;
            }
          });
        }

        if (this.debug) {
          let vars: any[] = [];
          // vars.push(this.options.formGroup.value[this.layoutNode.name]);
          // vars.push(this.options.formGroup.controls[this.layoutNode.name]['errors']);
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
    if (this.layoutNode.isArrayItem) {
      const arrayPointer = JsonPointer.parse(this.itemPointer).slice(0, -2);
      const parentArray = JsonPointer.get(this.options.layout, arrayPointer);
      const minItems = parentArray.minItems || 0;
      const lastArrayItem = parentArray.items.length - 2;
      const tupleItems = parentArray.tupleItems;
      if (this.layoutNode.isRemovable && this.arrayIndex >= minItems &&
        (this.arrayIndex >= tupleItems || this.arrayIndex === lastArrayItem)
      ) {
        this.isRemovable = true;
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
        this.layoutNode.title = null;
        return 'Advanced options';
      case 'authfieldset':
        this.layoutNode.title = null;
        return 'Authentication settings';
      default:
        let thisTitle = this.layoutNode.title
          || (!isNumber(this.layoutNode.name) && this.layoutNode.name !== '-' ?
          this.layoutNode.name : null);
        this.layoutNode.title = null;
        return thisTitle;
    }
  }

  private removeItem() {
    let formArray = getControl(this.options.formGroup, this.layoutNode.pointer, true);
    formArray.removeAt(this.arrayIndex);
    let indexedPointer = toIndexedPointer(this.layoutNode.layoutPointer, this.index);
    JsonPointer.remove(this.options.layout, indexedPointer);
  }
}
