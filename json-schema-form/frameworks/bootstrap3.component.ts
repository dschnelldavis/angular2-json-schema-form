import {
  AfterContentChecked, Component, ComponentFactoryResolver, ComponentRef,
  Input, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import {
  getControl, isNumber, JsonPointer, toIndexedPointer
} from '../utilities/index';

@Component({
  moduleId: module.id,
  selector: 'bootstrap3-framework',
  templateUrl: 'bootstrap3.component.html',
  styles: ['.list-group-item .form-control-feedback { top: 40; }'],
})
export class Bootstrap3Component implements OnInit, AfterContentChecked {
  private controlInitialized: boolean = false;
  private displayWidget: boolean = true;
  private isInputWidget: boolean;
  private formControl: any = null;
  private messageLocation: string = 'bottom';
  private htmlClass: string;
  private labelHtmlClass: string;
  private title: string;
  private errorMessage = '';
  private debugOutput: any = '';
  private innerNode: any;
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
    if (this.layoutNode) {
      this.innerNode = Object.assign({}, this.layoutNode);

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
      this.htmlClass += ' schema-form-' + this.layoutNode.type;
      if (this.layoutNode.type === 'array') {
        this.htmlClass += ' list-group';
      } else if (this.layoutNode.isArrayItem && this.layoutNode.type !== '$ref') {
        this.htmlClass += ' list-group-item';
      } else {
        this.htmlClass += ' form-group';
      }
      if (this.options.globalOptions.formDefaults.htmlClass) {
        this.htmlClass += ' ' + this.options.globalOptions.formDefaults.htmlClass;
      }
      this.innerNode.htmlClass = '';

      this.labelHtmlClass = this.layoutNode.labelHtmlClass || '';
      this.labelHtmlClass += ' control-label';
      if (this.options.globalOptions.formDefaults.labelHtmlClass) {
        this.labelHtmlClass += ' ' + this.options.globalOptions.formDefaults.labelHtmlClass;
      }

      this.innerNode.fieldHtmlClass = this.layoutNode.fieldHtmlClass || '';
      if (this.options.globalOptions.formDefaults.fieldHtmlClass) {
        this.innerNode.fieldHtmlClass += ' ' + this.options.globalOptions.formDefaults.fieldHtmlClass;
      }

      this.layoutNode.fieldAddonLeft =
        this.layoutNode.fieldAddonLeft || this.layoutNode.prepend;

      this.layoutNode.fieldAddonRight =
        this.layoutNode.fieldAddonRight || this.layoutNode.append;

      // Set miscelaneous styles and settings for each control type
      switch (this.layoutNode.type) {
        case 'checkbox':
          this.htmlClass += ' checkbox';
        break;
        case 'checkboxes':
          this.innerNode.htmlClass += ' checkbox';
        break;
        case 'checkboxes-inline':
          this.innerNode.labelHtmlClass += ' checkbox-inline';
        break;
        case '':
        break;
        case 'button': case 'submit':
          this.innerNode.fieldHtmlClass += ' btn ' +
            (this.layoutNode.style || 'btn-info');
        break;
        case '$ref':
          this.innerNode.fieldHtmlClass += ' btn pull-right ' +
            (this.layoutNode.style || 'btn-default');
          this.innerNode.icon = 'glyphicon glyphicon-plus';
        break;
        case 'array': case 'fieldset': case 'section': case 'conditional':
          this.innerNode.isRemovable = false;
          this.messageLocation = 'top';
          if (this.layoutNode.title && this.layoutNode.required) {
            this.innerNode.title += ' <strong class="text-danger">*</strong>';
          }
        break;
        case 'help': case 'msg': case 'message':
          this.displayWidget = false;
        break;
        case 'radiobuttons':
          this.htmlClass += ' btn-group';
          this.innerNode.labelHtmlClass += ' btn btn-default';
          this.innerNode.fieldHtmlClass += ' sr-only';
        break;
        case 'radio': case 'radios':
          this.innerNode.htmlClass += ' radio';
        break;
        case 'radios-inline':
          this.innerNode.labelHtmlClass += ' radio-inline';
        break;
        default:
          this.innerNode.fieldHtmlClass += ' form-control';
      }
    }

    if (
      !this.controlInitialized && this.displayWidget &&
      this.widgetContainer && !this.widgetContainer.length &&
      this.innerNode && this.innerNode.widget
    ) {
      let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
      );
      addedNode.instance.layoutNode = this.innerNode;
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
    }

    if (
      this.debug && this.options.formGroup && this.options.formGroup.controls &&
      this.innerNode && this.options.formGroup.controls[this.innerNode.name]
    ) {
      let vars: any[] = [];
      // vars.push(this.options.formGroup.value[this.innerNode.name]);
      // vars.push(this.options.formGroup.controls[this.innerNode.name]['errors']);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  ngAfterContentChecked() {
  }

  private setTitle(type: string): string {
    switch (this.layoutNode.type) {
      case 'array': case 'button': case 'checkbox': case 'conditional':
      case 'fieldset': case 'help': case 'msg': case 'message':
      case 'section': case 'submit': case '$ref':
        return null;
      case 'advancedfieldset':
        this.innerNode.title = null;
        return 'Advanced options';
      case 'authfieldset':
        this.innerNode.title = null;
        return 'Authentication settings';
      default:
        this.innerNode.title = null;
        return this.layoutNode.title ||
          (!isNumber(this.layoutNode.name) && this.layoutNode.name !== '-' ?
            this.layoutNode.name : null);
    }
  }

  private removeItem() {
console.log(this.index);
    let formArray = getControl(this.options.formGroup, this.layoutNode.pointer, true);
    formArray.removeAt(this.index[this.index.length - 1]);
    let indexedPointer = toIndexedPointer(this.layoutNode.layoutPointer, this.index);
console.log(this.options.masterLayout);
console.log(indexedPointer);
    JsonPointer.remove(this.options.masterLayout, indexedPointer);
  }
}
