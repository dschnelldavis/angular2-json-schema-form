import {
  Component, ComponentFactoryResolver, ComponentRef, Input, OnInit,
  AfterContentChecked, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { getControl, isNumber } from '../utilities/index';

@Component({
  moduleId: module.id,
  selector: 'bootstrap3-framework',
  templateUrl: 'bootstrap3.component.html',
})
export class Bootstrap3Component implements OnInit, AfterContentChecked {
  private controlInitialized: boolean = false;
  private displayWidget: boolean = true;
  private formControl: any = null;
  private controlView: string;
  private messageLocation: string = 'bottom';
  private htmlClass: string;
  private labelHtmlClass: string;
  private title: string;
  private errorMessage = '';
  private debugOutput: any = '';
  @Input() layoutNode: any;
  @Input() formGroup: FormGroup;
  @Input() formOptions: any;
  @Input() debug: boolean;
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  ngOnInit() {
    if (this.layoutNode.hasOwnProperty('pointer')) {
      let thisControl = getControl(this.formGroup, this.layoutNode.pointer);
      if (thisControl) this.formControl = thisControl;
    }

    this.title = this.setTitle(this.layoutNode.type);

    this.htmlClass = this.layoutNode.htmlClass || '';
    this.htmlClass += ' form-group  schema-form-' + this.layoutNode.type;
    if (this.formOptions.formDefaults.htmlClass) {
      this.htmlClass += ' ' + this.formOptions.formDefaults.htmlClass;
    }

    this.labelHtmlClass = this.layoutNode.labelHtmlClass || '';
    this.labelHtmlClass += ' control-label';
    if (this.formOptions.formDefaults.labelHtmlClass) {
      this.labelHtmlClass += ' ' + this.formOptions.formDefaults.labelHtmlClass;
    }

    this.layoutNode.fieldHtmlClass = this.layoutNode.fieldHtmlClass || '';
    if (this.formOptions.formDefaults.fieldHtmlClass) {
      this.layoutNode.fieldHtmlClass += ' ' + this.formOptions.formDefaults.fieldHtmlClass;
    }

    // Set miscelaneous styles and settings for each control type
    switch (this.layoutNode.type) {
      case 'checkbox':
        this.controlView = 'checkbox';
        this.htmlClass += ' checkbox';
      break;
      case 'button': case 'submit':
        this.layoutNode.fieldHtmlClass += ' btn ' +
          (this.layoutNode.style || 'btn-info');
      break;
      case '$ref':
        this.layoutNode.fieldHtmlClass += ' btn pull-right ' +
          (this.layoutNode.style || 'btn-default');
        this.layoutNode.icon = 'glyphicon glyphicon-plus';
      break;
      case 'array': case 'fieldset': case 'section': case 'conditional':
        this.messageLocation = 'top';
      break;
      case 'help': case 'msg': case 'message':
        this.displayWidget = false;
      break;
      case 'checkboxes':
        this.layoutNode.htmlClass += ' checkbox';
      break;
      case 'checkboxes-inline':
        this.layoutNode.labelHtmlClass += ' checkbox-inline';
      break;
      case 'radiobuttons':
        this.htmlClass += ' btn-group';
        this.layoutNode.labelHtmlClass += ' btn btn-default';
        this.layoutNode.fieldHtmlClass += ' sr-only';
      break;
      case 'radio': case 'radios':
        this.layoutNode.htmlClass += ' radio';
      break;
      case 'radios-inline':
        this.layoutNode.labelHtmlClass += ' radio-inline';
      break;
      default:
        this.layoutNode.fieldHtmlClass += ' form-control';
    }
  }

  ngAfterContentChecked() {
    if (
      !this.controlInitialized && this.displayWidget &&
      this.widgetContainer && !this.widgetContainer.length &&
      this.layoutNode && this.layoutNode.widget
    ) {
      let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
      );
      addedNode.instance.formGroup = this.formGroup;
      addedNode.instance.layoutNode = this.layoutNode;
      addedNode.instance.formOptions = this.formOptions;
      addedNode.instance.debug = this.debug;

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
      this.debug && this.formGroup && this.formGroup.controls &&
      this.formGroup.controls[this.layoutNode.name]
    ) {
      let vars: any[] = [];
      // vars.push(this.formGroup.value[this.layoutNode.name]);
      // vars.push(this.formGroup.controls[this.layoutNode.name]['errors']);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  private setTitle(type: string): string {
    switch (this.layoutNode.type) {
      case 'array': case 'fieldset': case 'help': case 'msg': case 'message':
      case 'section': case 'conditional': case 'button': case 'submit': case '$ref':
        return null;
      case 'advancedfieldset':
        return 'Advanced options';
      case 'authfieldset':
        return 'Authentication settings';
      default:
        return this.layoutNode.title ||
          (!isNumber(this.layoutNode.name) ? this.layoutNode.name : null);
    }
  }
}
