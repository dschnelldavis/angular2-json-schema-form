import {
  Component, ComponentFactoryResolver, ComponentRef, DoCheck, EventEmitter,
  Input, Output, OnChanges, OnInit, AfterContentInit, AfterViewInit,
  ViewChild, ViewContainerRef
} from '@angular/core';
import {
  AbstractControl, FormArray, FormControl, FormGroup, FormBuilder, NgForm,
  ValidatorFn, Validators
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as Ajv from 'ajv';
import * as _ from 'lodash';

import { FrameworkLibraryService } from './frameworks/framework-library.service';
import { WidgetLibraryService } from './widgets/widget-library.service';
import {
  forOwnDeep, getControlType, getControlValidators, getFirstValue, getInputType,
  getInputOptionValue, hasOwn, isArray, isInputRequired, isObject, isSet, listInputOptions,
  mapLayout, resolveSchemaReference, setObjectInputOptions, toJavaScriptType, toSchemaType
} from './utilities/utility-functions';
import { SchemaPrimitiveType } from './validators/validator-functions';
import { JsonSchemaDraft04 } from './utilities/json-schema-draft-04';
import { convertJsonSchema3to4 } from './utilities/convert-json-schema';
import { JsonPointer } from './utilities/jsonpointer';
import { JsonValidators } from './validators/json-validators';

/**
 * @module 'JsonSchemaFormComponent' - Angular 2 JSON Schema Form
 *
 * Root module of the Angular 2 JSON Schema Form client-side library,
 * an Angular 2 library which generates an HTML form from a JSON schema
 * structured data model and/or a JSON Schema Form layout description.
 *
 * This library also validates inputs data by the user, both using individual
 * validators which provide real-time feedback while the user is filling out
 * the form, and then using the entire schema when the form is submitted,
 * to make sure the returned JSON data object is valid.
 *
 * This library is similar to, and mostly compatible with:
 * - Joshfire's JSON Form library for jQuery
 *   https://github.com/joshfire/jsonform
 * - JSON Schema Form's Angular Schema Form library for AngularJs
 *   http://schemaform.io
 *
 * It is also similar to, though less compatible with:
 * - Mozilla's react-jsonschema-form library for React
 *   https://github.com/mozilla-services/react-jsonschema-form
 * - FormlyJS's Formly library for AngularJs
 *   http://angular-formly.com
 * (adding api compatibility with these two libraries is on our to-do list)
 *
 * This library depends on:
 *  - lodash, JavaScript utility library   https://github.com/lodash/lodash
 *  - ajv, JSON schema validator           https://github.com/epoberezkin/ajv
 */
@Component({
  moduleId: module.id,
  selector: 'json-schema-form',
  template: `<form (ngSubmit)="submitForm()">
    <root-widget
      *ngIf="formActive"
      [layoutNode]="rootLayout"
      [formGroup]="rootFormGroup"
      [formOptions]="formOptions"
      [debug]="debug">
    </root-widget>
  </form>
  <div *ngIf="debug">
    Internal data:
    <pre>{{debugOutput}}</pre>
  </div>`,
 })
export class JsonSchemaFormComponent implements AfterContentInit, AfterViewInit, DoCheck, OnChanges, OnInit {

  private formActive: boolean = false;
  private rootSchema: any = {}; // The JSON Schema
  private rootLayout: any[] = []; // The Form layout
  private rootData: any = {}; // The Data model (e.g. previously submitted data)
  private schemaReferences: any = {}; // references for schema $refs
  private keyMap: any = {}; // Links schema, layout, formGroup template, and data
  private rootFormGroupTemplate: any = {}; // Template used to create formGroup
  private rootFormGroup: FormGroup; // Angular 2 formGroup, for powering reactive forms
  private dataLocation: string = 'data'; // Location of data to be returned from submitted form
  private fieldsRequired: boolean = false;
  private ajv: any = new Ajv();
  private validateJsonSchema: any;
  private debugOutput: any;
  private formOptions: any = {
    supressPropertyTitles: false,
    formDefaults: {},
    validationMessage: {},
    setSchemaDefaults: true,
    pristine: { errors: true, success: true },
    validateOnRender: false,
    framework: null,
    references: {}, // references for dynamic arrays and circular schema $refs
  }; // Global optiona for form

  @Input() form: any;
  @Input() layout: any[];
  @Input() schema: any;
  @Input() data: any;
  @Input() model: any;
  @Input() debug: boolean;
  @Output() onSubmit = new EventEmitter<any>();
  // @Input() formlyModel: any; // TODO: Add for Formly API compatibility
  // @Input() formlyFields: any[]; // TODO: Add for Formly API compatibility
  // @Input() formlyForm: any; // TODO: Add for Formly API compatibility
  // @Input() UISchema: any; // TODO: Add for react-jsonschema-form API compatibility
  @ViewChild('jsonform', { read: ViewContainerRef })
    private jsonformContainer: ViewContainerRef;

  constructor(
    private formBuilder: FormBuilder,
    private http: Http,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainer: ViewContainerRef,
    private widgetLibrary: WidgetLibraryService,
    private frameworkLibrary: FrameworkLibraryService,
    // private validatorLibrary: ValidatorLibraryService,
  ) {
    this.validateJsonSchema = this.ajv.compile(JsonSchemaDraft04);
    this.rootFormGroup = this.formBuilder.group({});
    this.formOptions.framework = this.frameworkLibrary.getFramework();
  }

  ngOnInit() {
    // this.buildFormInputs();
  }

  ngAfterContentInit() {
  }

  ngAfterViewInit() {
  }

  ngOnChanges() {
    this.buildFormInputs();
  }

  ngDoCheck() {
    if (this.debug) {
      let vars: any[] = [];
      // vars.push(this.rootFormGroup);
      vars.push(this.rootLayout);
      // vars.push(this.keyMap);
      // vars.push(this.rootSchema);
      // vars.push(this.rootFormGroupTemplate);
      // vars.push(this.formOptions.references);
      // vars.push(this.rootFormGroup.value);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  /**
   * 'buildFormInputs' function
   *
   * - Update 'rootSchema', 'rootLayout', and 'rootData',
   *   the inputs used to construct the form.
   *
   * - Set 'dataLocation' to specify where to save data from the posted form.
   *
   * - Create 'keyMap' to map the relationships between the schema and layout.
   *
   * - Create 'schemaReferences' to resolve schema $ref links.
   *
   * - Create 'formOptions.references' to add components to arrays and
   *   circular $ref points in the form.
   *
   * - Create 'rootFormGroupTemplate', then from it 'rootFormGroup',
   *   the Angular 2 formGroup used to control the reactive form.
   *
   * @return {void}
   */
  buildFormInputs() {
    if (this.form || this.layout || this.schema || this.data || this.model) {
      this.formActive = false;
      this.rootSchema = {};
      this.rootLayout = [];
      this.rootData = {};
      this.dataLocation = 'data';
      this.keyMap = {};
      this.schemaReferences = {};
      this.formOptions.references = {};
      this.rootFormGroupTemplate = {};
      this.rootFormGroup = this.formBuilder.group({});

      // Initialize 'rootSchema'
      // Use first available input:
      // 1. schema - recommended / Angular Schema Form style
      // 2. form.schema - Single input / JSON Form style
      // 3. form - For easier testing
      // 4. (none) no schema - construct form entirely from layout instead
      if (isObject(this.schema)) {
        this.rootSchema = this.schema;
      } else if (hasOwn(this.form, 'schema') &&
        isObject(this.form.schema)) {
        this.rootSchema = this.form.schema;
        this.dataLocation = 'form.data';
      } else if (hasOwn(this.form, 'properties') &&
        isObject(this.form.properties)) {
        this.rootSchema = this.form;
      }

      // Initialize 'rootLayout'
      // Use first available array input:
      // 1. layout - recommended
      // 2. form - Angular Schema Form style
      // 3. form.form - JSON Form style
      // 4. form.layout - Single input style
      // 5. (none) no input - set default layout instead
      if (isArray(this.layout)) {
        this.rootLayout = this.layout;
      } else if (isArray(this.form)) {
        this.rootLayout = this.form;
      } else if (isArray(this.form.form)) {
        this.rootLayout = this.form.form;
        this.dataLocation = 'form.data';
      } else if (isArray(this.form.layout)) {
        this.rootLayout = this.form.layout;
        this.dataLocation = 'form.data';
      } else {
        this.rootLayout = [ '*', { type: 'submit', title: 'Save' } ];
      }

      // Initialize 'rootData'
      // Use first available input:
      // 1. data - recommended
      // 2. model - Angular Schema Form style
      // 3. form.data - Single input / JSON Form style
      // 4. (none) no data - use schema and layout defaults to initialize form
      if (isObject(this.data)) {
        this.rootData = this.data;
        this.dataLocation = 'data';
      } else if (isObject(this.model)) {
        this.rootData = this.model;
      } else if (isObject(this.form) &&
        isObject(this.form.data)) {
        this.rootData = this.form.data;
        this.dataLocation = 'form.data';
      }

      if (!_.isEmpty(this.rootSchema)) {

        // Allow for JSON schema shorthand (JSON Form style)
        if (
          !hasOwn(this.rootSchema, 'type') ||
          this.rootSchema.type !== 'object' ||
          !hasOwn(this.rootSchema, 'properties')
        ) {
          this.rootSchema = {
            'type': 'object',
            'properties': this.rootSchema
          };
        }

        // If JSON schema is version 3 (JSON Form style),
        // convert it to version 4
        this.rootSchema =
          convertJsonSchema3to4(this.rootSchema);

        // Build Angular 2 FormGroup template from schema
        this.rootFormGroupTemplate = this.buildFormGroupTemplate(
          this.rootSchema, this.formOptions.references, this.keyMap
        );

      } else {

        // TODO: If the schema does not exist,
        // build the Angular 2 FormGroup template from the layout instead
        // this.rootFormGroupTemplate =
        //   this.buildFormGroupTemplateFromLayout(this.rootLayout, this.keyMap);
      }

      // Update all layout elements to set values and add validators,
      // replace any '*' with a layout built from all schema elements,
      // and update the FormGroup template with any new validators
      // TODO: Update layout and Angular 2 FormGroup template from data
      // (set values and extend arrays)
      this.rootLayout = this.buildLayout(
        this.rootLayout, this.rootSchema, this.rootData,
        this.schemaReferences, this.formOptions.references, this.keyMap
      );

      // Build the real Angular 2 FormGroup from the FormGroup template
      this.rootFormGroup = <FormGroup>(this.buildFormGroup(
        this.rootFormGroupTemplate
      ));

      this.formActive = true;
console.log(this.formOptions.references);
      // if (this.rootFormGroup) {
      //   this.rootFormGroup.valueChanges.subscribe(
      //     value => this.debugOutput = JSON.stringify(value, null, 2)
      //   );
      // }
    }
  }

  private submitForm() {
    let formattedData = {};
    forOwnDeep(this.rootFormGroup.value, (value, key, ignore, pointer) => {
      let type: SchemaPrimitiveType | SchemaPrimitiveType[] = this.keyMap[pointer].schemaType;
      if (isSet(value) && (
        type === 'integer' || type === 'number' || type === 'null' ||
        type === 'boolean' || type === 'string' || isArray(type)
      )) {
        JsonPointer.set(formattedData, pointer, toSchemaType(value, type));
      }
    });
    this.onSubmit.emit(formattedData);
  }

  /**
   * 'buildLayout' function
   *
   * @param {any[]} layout -
   * @param {any} schema -
   * @param {any} data -
   * @param {any} formReferences -
   * @param {any} keyMap -
   * @return {any[]} -
   */
  private buildLayout(
    layout: any[], schema: any, data: any, schemaReferences: any,
    formReferences: any, keyMap: any
  ): any[] {
    return mapLayout(layout, (layoutItem, index, ignore, pointer) => {
      let newItem: any;
      if (isObject(layoutItem)) {
        newItem = layoutItem;
      } else if (JsonPointer.isJsonPointer(layoutItem)) {
        newItem = { 'pointer': layoutItem };
      } else if (_.isString(layoutItem)) {
        newItem = { 'key': layoutItem };
      } else {
        console.error('Form layout element not recognized:');
        console.error(layoutItem);
        return null;
      }
      let schemaItem = null;
      if (hasOwn(newItem, 'key') || hasOwn(newItem, 'pointer')) {
        if (newItem.key === '*' || newItem.pointer === '*') {
          return this.buildLayoutFromSchema(schema, data, schemaReferences, formReferences, keyMap);
        }
        if (JsonPointer.isJsonPointer(newItem.key)) {
          newItem.pointer = JsonPointer.compile(newItem.key);
        } else {
          newItem.pointer =
            JsonPointer.compile(JsonPointer.parseObjectPath(newItem.key), '-');
        }
        newItem.name = JsonPointer.toKey(newItem.pointer);
        if (!hasOwn(keyMap, newItem.pointer)) keyMap[newItem.pointer] = {};
        if (hasOwn(keyMap[newItem.pointer], 'schemaPointer')) {
          schemaItem = JsonPointer.get(schema, keyMap[newItem.pointer].schemaPointer)
        } else {
          schemaItem = JsonPointer.getSchema(schema, newItem.pointer);
          keyMap[newItem.pointer] = schemaItem;
        }
        if (schemaItem) {
          // newItem.schema = schemaItem;
          if (!hasOwn(newItem, 'type')) {
            newItem.type = getInputType(schemaItem);
          }
          let optionsToUpdate: string[] = listInputOptions(newItem.type);
          _.forEach(optionsToUpdate, option => {
            let newValue = getInputOptionValue(option, newItem, schemaItem);
            if (newValue !== null) newItem[option] = newValue;
          });
          if (isInputRequired(schema, newItem.pointer)) {
            this.fieldsRequired = true;
            newItem.required = true;
          }
        } else {
          // TODO: create item in FormGroup model from layout key
        }
        newItem.widget = this.widgetLibrary.getWidget(newItem.type);
        keyMap[newItem.pointer].layoutPointer = pointer;
        keyMap[newItem.pointer].inputType = newItem.type;
        keyMap[newItem.pointer].widget = newItem.widget;
        if (newItem.type === 'array' && hasOwn(newItem, 'items')) {
          let arrayKey: string = newItem.pointer + '/';
          if (!hasOwn(keyMap, arrayKey)) keyMap[arrayKey] = {};
          keyMap[arrayKey].layoutPointer = pointer + '/items';
          keyMap[arrayKey].inputType = 'section';
        }
      } else if (hasOwn(newItem, 'type')) {
        newItem.widget = this.widgetLibrary.getWidget(newItem.type);
      }
      // TODO: set value from data, if available
      return newItem;
    });
  }

  /**
   * 'buildLayoutFromSchema' function
   *
   * @param {any} schema -
   * @param {any} data -
   * @param {any} formReferences -
   * @param {any} keyMap -
   * @param {number = 0} layoutIndex -
   * @param {any = schema} rootSchema -
   * @param {string = ''} schemaPointer -
   * @param {string = ''} layoutPointer -
   * @param {string = ''} dataPointer -
   * @return {any} -
   */
  private buildLayoutFromSchema(
    schema: any, data: any, schemaReferences: any, formReferences: any,keyMap: any,
    layoutIndex: number = 0, rootSchema: any = schema, schemaPointer: string = '',
    layoutPointer: string = '', dataPointer: string = ''
  ): any {
    schema = resolveSchemaReference(schema, rootSchema, schemaReferences);
    if (!hasOwn(schema, 'type') && !hasOwn(schema, 'x-schema-form')) return null;
    let newItem: any =
      (hasOwn(schema, 'x-schema-form')) ? schema['x-schema-form'] : {};
    newItem.key = dataPointer;
    newItem.name = JsonPointer.toKey(newItem.key);
    newItem.type = getInputType(schema);
    newItem.widget = this.widgetLibrary.getWidget(newItem.type);
    if (dataPointer !== '') {
      if (!hasOwn(keyMap, newItem.key)) keyMap[newItem.key] = {};
      keyMap[newItem.key].schemaPointer = schemaPointer;
      keyMap[newItem.key].layoutPointer = layoutPointer;
      keyMap[newItem.key].inputType = newItem.type;
      keyMap[newItem.key].widget = newItem.widget;
    }
    switch (schema.type) {
      case 'object':
        let newFieldset: any[] = [];
        if (hasOwn(schema, 'properties')) {
          let index: number = dataPointer === '' ? layoutIndex : 0;
          _.forOwn(schema.properties, (item, key) => {
            let innerItem = this.buildLayoutFromSchema(
              item, data, schemaReferences, formReferences, keyMap, index, rootSchema,
              schemaPointer + '/properties/' + key,
              layoutPointer + '/' + index,
              dataPointer + '/' + key
            );
            if (innerItem) {
              if (isInputRequired(schema, '/' + key)) {
                this.fieldsRequired = true;
                innerItem.required = true;
              }
              newFieldset.push(innerItem);
              index++;
            }
          });
          newItem.items = newFieldset;
        }
        if (dataPointer === '') return newFieldset;
        return newItem;
      case 'array':
        if (hasOwn(schema, 'items')) {
          let additionalItems: any = null;
          if (isArray(schema.items)) {
            newItem.items = _.filter(_.map(schema.items, (item, index) =>
              this.buildLayoutFromSchema(
                item, data, schemaReferences, formReferences,
                keyMap, index, rootSchema,
                schemaPointer + '/items/' + index,
                layoutPointer + '/items/' + index,
                dataPointer + '/' + index
              )
            ));
            if (hasOwn(schema, 'additionalItems') && schema.additionalItems !== false) {
              additionalItems = this.buildLayoutFromSchema(
                schema.additionalItems, data, schemaReferences, formReferences,
                keyMap, newItem.length, rootSchema,
                schemaPointer + '/items/' + newItem.length,
                layoutPointer + '/items/' + newItem.length,
                dataPointer + '/' + newItem.length
              );
              if (additionalItems) newItem.items.push(additionalItems);
            }
          } else {
            additionalItems = this.buildLayoutFromSchema(
              schema.items, data, schemaReferences, formReferences,
              keyMap, 0, rootSchema,
              schemaPointer + '/items/0',
              layoutPointer + '/items/0',
              dataPointer + '/0'
            );
            newItem.items = [additionalItems];
          }
          if (additionalItems) {
            // TODO: create $ref to newItem
            formReferences[dataPointer + '/-'] = {
              'layout': additionalItems,
              '$refType': 'array'
            };
            delete formReferences[dataPointer + '/-']['layout']['key'];
            delete formReferences[dataPointer + '/-']['layout']['name'];
            // TODO: push final item with $ref
            newItem.items.push({
              'type': '$ref',
              '$ref': dataPointer + '/-',
              '$refType': 'array'
            });
          }
        }
        return newItem;
      case 'boolean': case 'string': case 'integer': case 'number': case 'null':
        let optionsToUpdate: string[] = listInputOptions(newItem.type);
        _.forEach(optionsToUpdate, option => {
          let newValue = getInputOptionValue(option, {}, schema);
          if (newValue !== null) newItem[option] = newValue;
        });
        if (newItem.title === null) newItem.title = JsonPointer.parse(dataPointer).pop();
        return newItem;
      default:
        return null;
    }
  }

  // private buildFormGroupTemplateFromLayout(layout: any[], keyMap: any) {
  //   let newModel: any = {};
  //   _.forEach(layout, (value: any) => {
  //     let thisKey: any = null;
  //     if (value === '*') {
  //       _.assign(newModel, this.buildFormGroupTemplate(this.rootSchema, keyMap));
  //     } else if (_.isString(value)) {
  //       thisKey = value;
  //     } else if (hasOwn(value, 'key')) {
  //       thisKey = value.key;
  //     }
  //     if (thisKey) {
  //       if (thisKey.slice(-2) === '[]') {
  //         _.set(newModel, thisKey.slice(0, -2), null);
  //       } else {
  //         _.set(newModel, thisKey, null);
  //       }
  //     } else if (hasOwn(value, 'items') && isArray(value.items)) {
  //       newModel = Object.assign({}, newModel,
  //         this.buildFormGroupTemplateFromLayout(value.items, keyMap));
  //     } else if (hasOwn(value, 'tabs') && isArray(value.tabs)) {
  //       newModel = Object.assign({}, newModel,
  //           this.buildFormGroupTemplateFromLayout(value.tabs, keyMap));
  //     }
  //   });
  //   return newModel;
  // }

  /**
   * 'buildFormGroupTemplate' function
   *
   * Builds a template for an Angular 2 FormGroup from JSON Schema
   *
   * TODO: add support for pattern properties
   * https://spacetelescope.github.io/understanding-json-schema/reference/object.html
   *
   * TODO: add support for internal $ref references
   * TODO: add support for external $ref references (download external schemas)
   * TODO: add support for circular $ref references
   *   (circular items start with zero elements by default, rather than one)
   *
   * @param {any} schema
   * @param {string = null} controlType
   * @return {any}
   */
  private buildFormGroupTemplate(
    schema: any, formReferences: any, keyMap: any,
    rootSchema: any = schema, dataPointer: string = '',
    schemaPointer: string = '', templatePointer: string = ''
  ): any {
    schema = resolveSchemaReference(schema, rootSchema, formReferences);
    let controlType: 'FormGroup' | 'FormArray' | 'FormControl' =
      getControlType(schema);
    if (dataPointer !== '') {
      if (!hasOwn(keyMap, dataPointer)) keyMap[dataPointer] = {};
      keyMap[dataPointer]['schemaPointer'] = schemaPointer;
      keyMap[dataPointer]['schemaType'] = schema.type;
      if (controlType) {
        keyMap[dataPointer]['templatePointer'] = templatePointer;
        keyMap[dataPointer]['templateType'] = controlType;
      }
    }
    let validators: any = getControlValidators(schema);
    switch (controlType) {
      case 'FormGroup':
        let groupControls: any = {};
        _.forOwn(schema.properties, (item, key) =>
          groupControls[key] = this.buildFormGroupTemplate(
            item, formReferences, keyMap, rootSchema,
            dataPointer + '/' + key,
            schemaPointer + '/properties/' + key,
            templatePointer + '/controls/' + key
          )
        );
        setObjectInputOptions(schema, groupControls);
        return { controlType, 'controls': groupControls, validators };
      case 'FormArray':
        let arrayControls: any[];
        if (isArray(schema.items)) {
          arrayControls = _.map(schema.items,
            (item, index) => this.buildFormGroupTemplate(
              item, formReferences, keyMap, rootSchema,
              dataPointer + '/' + index,
              schemaPointer + '/items/' + index,
              templatePointer + '/controls/' + index
            )
          );
        } else {
          arrayControls = [this.buildFormGroupTemplate(
            schema.items, formReferences, keyMap, rootSchema,
            dataPointer + '/-',
            schemaPointer + '/items',
            templatePointer + '/controls/-'
          )];
        }
        return { controlType, 'controls': arrayControls, validators };
      case 'FormControl':
        let value: any = schema.default;
        return { controlType, value, validators };
      default:
        return null;
    }
  }

  /**
   * 'buildFormGroup' function
   *
   * @param {any} template
   * @return {AbstractControl}
   */
  private buildFormGroup(template: any): AbstractControl {
    let validatorFns: ValidatorFn[] = [];
    let validatorFn: ValidatorFn = null;
    if (hasOwn(template, 'validators')) {
      _.forOwn(template.validators, (parameters, validator) => {
        if (typeof JsonValidators[validator] === 'function') {
          validatorFns.push(JsonValidators[validator].apply(null, parameters));
        }
      });
      if (template.controlType === 'FormGroup' || template.controlType === 'FormArray') {
        if (validatorFns.length === 1) {
          validatorFn = validatorFns[0];
        } else if (validatorFns.length > 1) {
          validatorFn = JsonValidators.compose(validatorFns);
        }
      }
    }
    if (hasOwn(template, 'controlType')) {
      switch (template.controlType) {
        case 'FormGroup':
          let groupControls: {[key: string]: AbstractControl} = {};
          _.forOwn(template.controls, (controls, key) => {
            let newControl: AbstractControl = this.buildFormGroup(controls);
            if (newControl) groupControls[key] = newControl;
          });
          return new FormGroup(groupControls, validatorFn);
        case 'FormArray':
          return new FormArray(_.filter(_.map(template.controls,
            controls => this.buildFormGroup(controls)
          )), validatorFn);
        case 'FormControl':
          return new FormControl(template.controls || null, validatorFns);
      }
    }
    return null;
  }
}
