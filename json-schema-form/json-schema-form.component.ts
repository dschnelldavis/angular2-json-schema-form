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
  forOwnDeep, getControlValidators, getFirstValue, getInputType, hasOwn,
  inArray, isArray, isBlank, isEmpty, isFunction, isInputRequired, isNumber,
  isObject, isPresent, isSet, isString, mapLayout, resolveSchemaReference,
  setObjectInputOptions, toJavaScriptType, toSchemaType
} from './utilities/utility-functions';
import { SchemaPrimitiveType } from './validators/validator-functions';
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
 * - Mozilla's react-jsonschema-form library for React
 *   https://github.com/mozilla-services/react-jsonschema-form
 *
 * It is also similar to, though less compatible with:
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
    Debug output:
    <pre>{{debugOutput}}</pre>
  </div>`,
})
export class JsonSchemaFormComponent implements AfterContentInit, AfterViewInit, DoCheck, OnChanges, OnInit {
  private formActive: boolean = false;
  private rootSchema: any = {}; // The JSON Schema
  private rootLayout: any[] = []; // The Form layout
  private rootData: any = {}; // The Data model (e.g. previously submitted data)
  private schemaReferences: any = {}; // references for schema $refs
  private fieldMap: any = {}; // Links schema, layout, formGroup template, and data
  private rootFormGroupTemplate: any = {}; // Template used to create formGroup
  private rootFormGroup: FormGroup; // Angular 2 formGroup, for powering reactive forms
  private fieldsRequired: boolean = false;
  private ajv: any = new Ajv({ allErrors: true });
  private validateFormData: any = null;
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

  @Input() schema: any;
  @Input() data: any;
  @Input() layout: any[];
  @Input() form: any; // For testing and JSON Schema Form API compatibility
  @Input() model: any; // For Angular Schema Form API compatibility
  @Input() JSONSchema: any; // For React JSON Schema Form API compatibility
  @Input() UISchema: any; // For React JSON Schema Form API compatibility
  @Input() formData: any; // For React JSON Schema Form API compatibility
  @Input() debug: boolean;
  @Output() onChanges = new EventEmitter<any>();
  @Output() onSubmit = new EventEmitter<any>();
  @Output() isValid = new EventEmitter<any>();
  @Output() validationErrors = new EventEmitter<any>();
  // @Input() formlyModel: any; // TODO: Add for Formly API compatibility?
  // @Input() formlyFields: any[]; // TODO: Add for Formly API compatibility?
  // @Input() formlyForm: any; // TODO: Add for Formly API compatibility?
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
    this.rootFormGroup = this.formBuilder.group({});
  }

  ngOnInit() {
    this.formOptions.framework = this.frameworkLibrary.getFramework();
  }

  ngAfterContentInit() {
  }

  ngAfterViewInit() {
  }

  ngOnChanges() {
    this.buildFormInputs();
  }

  /**
   * 'buildFormInputs' function
   *
   * - Update 'rootSchema', 'rootLayout', and 'rootData',
   *   the inputs used to construct the form.
   *
   * - Create 'fieldMap' to map the relationships between the schema and layout.
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
    if (
      this.form || this.layout || this.schema || this.data ||
      this.model || this.JSONSchema || this.UISchema || this.formData
    ) {
      this.formActive = false;
      this.rootSchema = {};
      this.rootLayout = [];
      this.rootData = {};
      this.fieldMap = {};
      this.schemaReferences = {};
      this.formOptions.references = {};
      this.rootFormGroupTemplate = {};
      this.rootFormGroup = this.formBuilder.group({});

      // Initialize 'rootSchema'
      // Use first available input:
      // 1. schema - recommended / Angular Schema Form style
      // 2. form.schema - Single input / JSON Form style
      // 3. JSONSchema - React JSON Schema Form style
      // 4. form.JSONSchema - For testing single input React JSON Schema Forms
      // 5. form - For easier testing
      // 6. (none) no schema - construct form entirely from layout instead
      if (isObject(this.schema)) {
        this.rootSchema = this.schema;
      } else if (hasOwn(this.form, 'schema') &&
        isObject(this.form.schema)) {
        this.rootSchema = this.form.schema;
      } else if (isObject(this.JSONSchema)) {
        this.rootSchema = this.JSONSchema;
      } else if (hasOwn(this.form, 'JSONSchema') &&
      isObject(this.form.JSONSchema)) {
        this.rootSchema = this.form.JSONSchema;
      } else if (hasOwn(this.form, 'properties') &&
        isObject(this.form.properties)) {
        this.rootSchema = this.form;
      }

      if (!isEmpty(this.rootSchema)) {

        // Allow for JSON schema shorthand (JSON Form style)
        if (!hasOwn(this.rootSchema, 'type') ||
          this.rootSchema.type !== 'object' ||
          !hasOwn(this.rootSchema, 'properties')
        ) {
          this.rootSchema = { 'type': 'object', 'properties': this.rootSchema };
        }

        // If JSON Schema is version 3 (JSON Form style),
        // convert it to JSON Schema version 4
        this.rootSchema = convertJsonSchema3to4(this.rootSchema);

        // Initialize ajv (Another JSON Schema Validator)
        this.validateFormData = this.ajv.compile(this.rootSchema);

        // Resolve $ref links in Schema
        forOwnDeep(this.rootSchema, (value, key, ignore, pointer) => {
          if (hasOwn(value, '$ref') && isString(value['$ref'])) {
            let newReference: string = value['$ref'];
            let isCircular = JsonPointer.isSubPointer(newReference, pointer);
            if (!isCircular || !hasOwn(this.schemaReferences, newReference) ||
              this.schemaReferences[newReference]['isCircular'] !== true
            ) {
              let newSchema: any = resolveSchemaReference(
                newReference, this.rootSchema, this.schemaReferences
              );
              if (newSchema && !hasOwn(newSchema, '$ref')) {
                if (isCircular) {
                  this.schemaReferences[newReference]['isCircular'] = true;
                } else {
                  delete value['$ref'];
                  JsonPointer.set(
                    this.rootSchema, pointer, Object.assign({}, newSchema, value)
                  );
                }
              }
            }
          }
        }, this.rootSchema, '', true);
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
      } else if (isArray(this.form.layout)) {
        this.rootLayout = this.form.layout;
      } else {
        this.rootLayout = [ '*', { type: 'submit', title: 'Submit' } ];
      }

      // If using React JSON Schema Form API compatibility,
      // initialize alternate layout format 'rootUISchema'
      // Use first available input:
      // 1. UISchema - React JSON Schema Form style
      // 2. form.UISchema - For testing single input React JSON Schema Forms
      // 3. (none) no input - don't use UISchema
      if (isObject(this.UISchema) || hasOwn(this.form, 'UISchema')) {
        let UISchema = this.UISchema || this.form.UISchema;
        forOwnDeep(UISchema, (value, key, ignore, pointer) => {
          let schemaPointer = '/properties' + pointer;
          if (!JsonPointer.has(this.rootSchema, schemaPointer)) {
            JsonPointer.set(this.rootSchema, schemaPointer, value);
          }
        });
      }

      // Initialize 'rootData'
      // Use first available input:
      // 1. data - recommended
      // 2. model - Angular Schema Form style
      // 3. form.data - Single input / JSON Form style
      // 4. formData - React JSON Schema Form style
      // 5. form.formData - For easier testing of React JSON Schema Forms
      // 6. (none) no data - use schema and layout defaults to initialize form
      if (isObject(this.data)) {
        this.rootData = this.data;
      } else if (isObject(this.model)) {
        this.rootData = this.model;
      } else if (isObject(this.form) &&
        isObject(this.form.data)) {
        this.rootData = this.form.data;
      } else if (isObject(this.formData)) {
        this.rootData = this.formData;
      } else if (hasOwn(this.form, 'formData') &&
        isObject(this.form.formData)) {
        this.rootData = this.form.formData;
      }

      if (isEmpty(this.rootSchema)) {

        // TODO: If the schema does not exist,
        // build the Angular 2 FormGroup template from the layout instead
        // this.rootFormGroupTemplate =
        //   this.buildFormGroupTemplateFromLayout(this.rootLayout, this.fieldMap);
      }

      // Update all layout elements, set values, and add validators,
      // replace any '*' with a layout built from all schema elements,
      // and update the FormGroup template with any new validators
      // TODO: Update layout and Angular 2 FormGroup template from data
      // (set values and extend arrays)
      this.rootLayout = this.buildLayout(
        this.rootLayout, this.rootSchema, this.rootData,
        this.schemaReferences, this.formOptions.references, this.fieldMap
      );

      // Build Angular 2 FormGroup template from schema
      this.rootFormGroupTemplate = this.buildFormGroupTemplate(
        this.rootSchema, this.formOptions.references, this.fieldMap
      );

      // Build the real Angular 2 FormGroup from the FormGroup template
      this.rootFormGroup = <FormGroup>(this.buildFormGroup(
        this.rootFormGroupTemplate
      ));

      this.formActive = true;

      if (this.rootFormGroup) {
        this.rootFormGroup.valueChanges.subscribe(
          value => {
            let formattedData = this.formatFormData(value);
            this.onChanges.emit(formattedData);
            let isValid = this.validateFormData(formattedData);
            this.isValid.emit(isValid);
            this.validationErrors.emit(this.validateFormData.errors);
          }
        );
        this.onChanges.emit(this.formatFormData(this.rootFormGroup.value));
      }

      // TODO: detect vaidate on initialize and emit validation if set
      // this.isValid.emit(null);
      // this.validationErrors.emit(null);
    }
  }

  // Output debugging information
  ngDoCheck() {
    // this.onChanges.emit(this.formattedData);
    if (this.debug) {
      let vars: any[] = [];
      // vars.push(this.fieldMap);
      // vars.push(this.rootFormGroupTemplate);
      // vars.push(this.rootLayout);
      vars.push(this.rootSchema);
      // vars.push(this.rootData);
      // vars.push(this.rootFormGroup);
      // vars.push(this.rootFormGroup.value);
      // vars.push(this.formOptions.references);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  /**
   * 'buildLayout' function
   *
   * @param {any[]} layout -
   * @param {any} schema -
   * @param {any} data -
   * @param {any} formReferences -
   * @param {any} fieldMap -
   * @return {any[]} -
   */
  private buildLayout(
    layout: any[], schema: any, data: any, schemaReferences: any,
    formReferences: any, fieldMap: any
  ): any[] {
    return mapLayout(layout, (layoutItem, index, ignore, layoutPointer) => {
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
      let itemSchema: any = null;
      let schemaDefaultValue: any = null;
      if (hasOwn(newItem, 'key') || hasOwn(newItem, 'pointer')) {
        if (newItem.key === '*' || newItem.pointer === '*') {
          return this.buildLayoutFromSchema(
            schema, data, schemaReferences, formReferences, fieldMap
          );
        }
        if (JsonPointer.isJsonPointer(newItem.key)) {
          newItem.pointer = JsonPointer.compile(newItem.key);
        } else {
          newItem.pointer =
            JsonPointer.compile(JsonPointer.parseObjectPath(newItem.key), '-');
        }
        newItem.name = JsonPointer.toKey(newItem.pointer);
        if (!hasOwn(fieldMap, newItem.pointer)) fieldMap[newItem.pointer] = {};
        if (hasOwn(fieldMap[newItem.pointer], 'schemaPointer')) {
          itemSchema = JsonPointer.get(schema, fieldMap[newItem.pointer]['schemaPointer']);
        } else {
          itemSchema = JsonPointer.getSchema(schema, newItem.pointer);
          // TODO: add schemaPointer to fieldMap
          // fieldMap[newItem.pointer]['schemaPointer'] = ;
        }
        if (itemSchema) {
          // newItem.schema = itemSchema;
          if (!hasOwn(newItem, 'type')) {
            newItem.type = getInputType(itemSchema);
          }
          if (!hasOwn(newItem, 'dataType')) {
            newItem.dataType = itemSchema.type;
          }
          this.updateInputOptions(newItem, itemSchema);
          if (!newItem.title && !isNumber(newItem.name)) {
            newItem.title = newItem.name.charAt(0).toUpperCase() + newItem.name.slice(1);
          }
          if (isInputRequired(schema, newItem.pointer)) {
            this.fieldsRequired = true;
            newItem.required = true;
          }
        } else {
          // TODO: create item in FormGroup model from layout key
        }
        newItem.widget = this.widgetLibrary.getWidget(newItem.type);
        fieldMap[newItem.pointer]['inputType'] = newItem.type;
        fieldMap[newItem.pointer]['widget'] = newItem.widget;
        if (newItem.type === 'array' && hasOwn(newItem, 'items')) {
          let arrayPointer: string = newItem.pointer + '/-';
          if (!hasOwn(fieldMap, arrayPointer)) fieldMap[arrayPointer] = {};
          // fieldMap[arrayPointer]['layoutPointer'] = layoutPointer + '/items';
          fieldMap[arrayPointer]['inputType'] = 'section';
          let arrayItemGroup = [];
          let length: number = arrayPointer.length;
          let itemPointer: string = newItem.pointer + '/0';
          for (let i = newItem.items.length - 1, l = 0; i >= l; i--) {
            let subItem = newItem.items[i];
            if (subItem.pointer.slice(0, length) === arrayPointer) {
              subItem.pointer = itemPointer + subItem.pointer.slice(length);
              arrayItemGroup.unshift(newItem.items.pop());
            }
          }
          if (arrayItemGroup.length) {
            let newItemFieldset: any = {
              'type': 'fieldset',
              'pointer': itemPointer,
              'items': arrayItemGroup,
              'widget': this.widgetLibrary.getWidget('fieldset')
            };
            newItem.items.push(newItemFieldset);
            let newItemRef: any = {
              'type': '$ref', '$ref': arrayPointer, '$refType': 'array'
            };
            if (hasOwn(newItem, 'add') && isString(newItem.add)) {
              newItemRef.title = newItem.add;
              delete newItem.add;
            };
            if (hasOwn(newItem, 'style') && hasOwn(newItem.style, 'add')) {
              newItemRef.style = newItem.style.add;
              delete newItem.style.add;
              if (isEmpty(newItem.style)) delete newItem.style;
            };
            newItem.items.push(newItemRef);
            formReferences[arrayPointer] = {
              'layout': newItemFieldset, '$refType': 'array'
            };
          }
        }
        schemaDefaultValue = schema.default;
      } else if (hasOwn(newItem, 'type')) {
        newItem.widget = this.widgetLibrary.getWidget(newItem.type);
      }
      if (newItem.pointer) {
        let newItemValue: any;
        if (JsonPointer.has(data, newItem.pointer)) {
          newItemValue = JsonPointer.get(data, newItem.pointer);
        } else {
          newItemValue = newItem.value || schemaDefaultValue;
        }
        if (isPresent(newItemValue)) {
          fieldMap[newItem.pointer]['value'] = newItemValue;
          newItem.value = newItemValue;
        }
      }
      return newItem;
    });
  }

  /**
   * 'buildLayoutFromSchema' function
   *
   * @param {any} schema -
   * @param {any} data -
   * @param {any} formReferences -
   * @param {any} fieldMap -
   * @param {number = 0} layoutIndex -
   * @param {any = schema} rootSchema -
   * @param {string = ''} schemaPointer -
   * @param {string = ''} layoutPointer -
   * @param {string = ''} dataPointer -
   * @return {any} -
   */
  private buildLayoutFromSchema(
    schema: any, data: any, schemaReferences: any, formReferences: any, fieldMap: any,
    layoutIndex: number = 0, rootSchema: any = schema, schemaPointer: string = '',
    layoutPointer: string = '', dataPointer: string = ''
  ): any {
    // schema = resolveSchemaReference(schema, rootSchema, schemaReferences);
    if (!hasOwn(schema, 'type') && !hasOwn(schema, 'x-schema-form')) return null;
    let newItem: any =
      (hasOwn(schema, 'x-schema-form')) ? schema['x-schema-form'] : {};
    newItem.pointer = dataPointer;
    newItem.name = JsonPointer.toKey(newItem.pointer);
    newItem.type = getInputType(schema);
    newItem.dataType = schema.type;
    newItem.widget = this.widgetLibrary.getWidget(newItem.type);
    if (dataPointer !== '') {
      if (!hasOwn(fieldMap, newItem.pointer)) fieldMap[newItem.pointer] = {};
      fieldMap[newItem.pointer]['schemaPointer'] = schemaPointer;
      fieldMap[newItem.pointer]['inputType'] = newItem.type;
      fieldMap[newItem.pointer]['widget'] = newItem.widget;
    }
    this.updateInputOptions(newItem, schema);
    if (!newItem.title && !isNumber(newItem.name)) {
      newItem.title = newItem.name.charAt(0).toUpperCase() + newItem.name.slice(1);
    }
    switch (newItem.type) {
      case 'fieldset':
        let newFieldset: any[] = [];
        let index: number = dataPointer === '' ? layoutIndex : 0;
        let newKeys: string[];
        let subObject: string = 'properties';
        if (hasOwn(schema, 'properties')) {
          if (hasOwn(schema.properties, 'ui:order')) {
            newKeys = schema['properties']['ui:order'];
          } else {
            newKeys = Object.keys(schema['properties']);
          }
        } else if (hasOwn(schema, 'additionalProperties')) {
          subObject = 'additionalProperties';
          newKeys = Object.keys(schema['additionalProperties']);
        }
        for (let i = 0, l = newKeys.length; i < l; i++) {
          let key = newKeys[i];
          if (hasOwn(schema[subObject], key)) {
            let item = schema[subObject][key];
            let innerItem = this.buildLayoutFromSchema(
              item, data, schemaReferences, formReferences, fieldMap, index, rootSchema,
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
          }
        }
        newItem.items = newFieldset;
        return (dataPointer === '') ? newFieldset : newItem;
      case 'array':
        let additionalItems: any = null;
        if (isArray(schema.items)) {
          newItem.items = _.filter(_.map(schema.items, (item, index) =>
            this.buildLayoutFromSchema(
              item, data, schemaReferences, formReferences,
              fieldMap, index, rootSchema,
              schemaPointer + '/items/' + index,
              layoutPointer + '/items/' + index,
              dataPointer + '/' + index
            )
          ));
          if (hasOwn(schema, 'additionalItems') && schema.additionalItems !== false) {
            additionalItems = this.buildLayoutFromSchema(
              schema.additionalItems, data, schemaReferences, formReferences,
              fieldMap, newItem.length, rootSchema,
              schemaPointer + '/items/' + newItem.length,
              layoutPointer + '/items/' + newItem.length,
              dataPointer + '/' + newItem.length
            );
            if (additionalItems) newItem.items.push(additionalItems);
          }
        } else {
          additionalItems = this.buildLayoutFromSchema(
            schema.items, data, schemaReferences, formReferences,
            fieldMap, 0, rootSchema,
            schemaPointer + '/items/0',
            layoutPointer + '/items/0',
            dataPointer + '/0'
          );
          newItem.items = [additionalItems];
        }
        if (additionalItems) {
          formReferences[dataPointer + '/-'] = { // Create $ref for additinal items
            'layout': additionalItems, '$refType': 'array'
          };
          delete formReferences[dataPointer + '/-']['layout']['key'];
          delete formReferences[dataPointer + '/-']['layout']['name'];
          newItem.items.push({ // add $ref item to array to create 'add new' button
            'type': '$ref', '$ref': dataPointer + '/-', '$refType': 'array'
          });
        }
        return newItem;
      default:
        let newItemValue: any;
        if (JsonPointer.has(data, newItem.pointer)) {
          newItemValue = JsonPointer.get(data, newItem.pointer);
        } else {
          newItemValue = newItem.value || schema.default;
        }
        if (isPresent(newItemValue)) {
          fieldMap[newItem.pointer]['value'] = newItemValue;
          newItem.value = newItemValue;
        }
        return newItem;
    }
  }

  // private buildFormGroupTemplateFromLayout(layout: any[], fieldMap: any) {
  //   let newModel: any = {};
  //   _.forEach(layout, (value: any) => {
  //     let thisKey: any = null;
  //     if (value === '*') {
  //       _.assign(newModel, this.buildFormGroupTemplate(this.rootSchema, fieldMap));
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
  //         this.buildFormGroupTemplateFromLayout(value.items, fieldMap));
  //     } else if (hasOwn(value, 'tabs') && isArray(value.tabs)) {
  //       newModel = Object.assign({}, newModel,
  //           this.buildFormGroupTemplateFromLayout(value.tabs, fieldMap));
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
    schema: any, formReferences: any, fieldMap: any,
    rootSchema: any = schema, dataPointer: string = '',
    schemaPointer: string = '', templatePointer: string = ''
  ): any {
    // schema = resolveSchemaReference(schema, rootSchema, formReferences);
    let controlType: 'FormGroup' | 'FormArray' | 'FormControl';
    if (schema.type === 'object' && hasOwn(schema, 'properties')) {
      controlType = 'FormGroup';
    } else if (schema.type === 'array' && hasOwn(schema, 'items')) {
      controlType = 'FormArray';
    } else {
      controlType = 'FormControl';
    }
    // TODO: detect when to set controlType = null and abort
    // if (!hasOwn(schema, 'type')) schema.type = 'string';
    if (dataPointer !== '') {
      if (!hasOwn(fieldMap, dataPointer)) fieldMap[dataPointer] = {};
      fieldMap[dataPointer]['schemaPointer'] = schemaPointer;
      fieldMap[dataPointer]['schemaType'] = schema.type;
      if (controlType) {
        fieldMap[dataPointer]['templatePointer'] = templatePointer;
        fieldMap[dataPointer]['templateType'] = controlType;
      }
    }
    let validators: any = getControlValidators(schema);
    switch (controlType) {
      case 'FormGroup':
        let groupControls: any = {};
        _.forOwn(schema.properties, (item, key) => {
          if (key !== 'ui:order') {
            groupControls[key] = this.buildFormGroupTemplate(
              item, formReferences, fieldMap, rootSchema,
              dataPointer + '/' + key,
              schemaPointer + '/properties/' + key,
              templatePointer + '/controls/' + key
            );
          }
        });
        setObjectInputOptions(schema, groupControls);
        return { controlType, 'controls': groupControls, validators };
      case 'FormArray':
        let arrayControls: any[];
        if (isArray(schema.items)) {
          arrayControls = _.map(schema.items,
            (item, index) => this.buildFormGroupTemplate(
              item, formReferences, fieldMap, rootSchema,
              dataPointer + '/' + index,
              schemaPointer + '/items/' + index,
              templatePointer + '/controls/' + index
            )
          );
        } else {
          arrayControls = [this.buildFormGroupTemplate(
            schema.items, formReferences, fieldMap, rootSchema,
            dataPointer + '/-',
            schemaPointer + '/items',
            templatePointer + '/controls/-'
          )];
        }
        return { controlType, 'controls': arrayControls, validators };
      case 'FormControl':
        let value: any = fieldMap[dataPointer]['value'];
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
          return new FormControl(template.value, validatorFns);
      }
    }
    return null;
  }

  /**
   * 'updateInputOptions' function
   *
   * @param {any} layout
   * @param {any} schema
   * @return {void}
   */
  private updateInputOptions(layout: any, schema: any) {
    _.forEach(this.listInputOptions(layout.type), option => {
      let newValue = this.getInputOptionValue(option, layout, schema);
      if (isPresent(newValue)) {
        if (option.slice(0, 3) === 'ui:') {
          layout[option.slice(3)] = newValue;
        } else {
          layout[option] = newValue;
        }
      }
    });
    if (inArray(schema.type, ['integer']) && !hasOwn(layout, 'multipleOf')) {
      layout.multipleOf = 1;
    }
  }

  /**
   * 'listInputOptions' function
   *
   * @param {string | string[]} inputType -
   * @return {string[]} -
   */
  private listInputOptions(inputType: string | string[]): string[] {
    let type: string[] = (isPresent(inputType) && isArray(inputType)) ?
      <string[]>inputType : [<string>inputType];
    let optionsToUpdate: string[] = [
      'title', 'notitle', 'disabled', 'description', 'validationMessage',
      'onChange', 'feedback', 'disableSuccessState', 'disableErrorState',
      'placeholder', 'ngModelOptions', 'readonly', 'copyValueTo', 'condition',
      'destroyStrategy', 'htmlClass', 'fieldHtmlClass', 'labelHtmlClass', 'enum',
      'ui:rootFieldId', 'ui:help', 'ui:disabled', 'ui:readonly', 'ui:order',
      'ui:placeholder', 'ui:autofocus', 'ui:options',
      // 'classNames', 'label', 'errors', 'help', 'hidden', 'required', 'displayLabel',
    ];
    if (inArray(['text', 'textarea', 'search'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate.concat('minLength', 'maxLength', 'pattern');
    }
    if (inArray(['text', 'textarea', 'search', 'email', 'url', 'date', 'datetime',
      'date-time', 'datetime-local'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate.concat('format');
    }
    if (inArray(['date', 'datetime', 'date-time', 'datetime-local',
      'number', 'integer', 'range'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate.concat('minimum', 'maximum');
    }
    if (inArray(['number', 'integer', 'range'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate
        .concat('exclusiveMinimum', 'exclusiveMaximum', 'multipleOf');
    }
    if (inArray('fieldset', type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate
        .concat('minProperties', 'maxProperties', 'dependencies');
    }
    if (inArray(['array', 'checkboxes'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate
        .concat('minItems', 'maxItems', 'uniqueItems');
    }
    return optionsToUpdate;
  }

  /**
   * 'getInputOptionValue' function
   *
   * @param {[type]} valueName
   * @param {[type]} layout
   * @param {[type]} schema
   * @return {[type]}
   */
  private getInputOptionValue(option: string, layout: any = {}, schema: any = {}): any {
    // Set any new validators from layout
    if (hasOwn(layout, option) && isFunction(JsonValidators[option]) && (
      !hasOwn(schema, option) || (schema[option] !== layout[option] &&
        !(option.slice(0, 3) === 'min' && schema[option] < layout[option]) &&
        !(option.slice(0, 3) === 'max' && schema[option] > layout[option])
      )
    )) {
       JsonPointer.set(
         this.rootFormGroupTemplate,
         this.fieldMap[layout.key]['templatePath'] + '/validators/' + option,
         [layout[option]]
       );
    }
    if (isSet(layout[option])) return layout[option];
    if (
      isObject(schema['x-schema-form']) && isSet(schema['x-schema-form'][option])
    ) return schema['x-schema-form'][option];
    if (isSet(schema[option])) return schema[option];
    // if (option === 'notitle' || option === 'readonly') return false;
    return null;
  }

  /**
   * 'formatFormData' function
   *
   * @param {any} formData - Angular 2 FormGroup data object
   * @return {any} - formatted data object
   */
  private formatFormData(formData: any): any {
    let formattedData = {};
    forOwnDeep(formData, (value, key, ignore, pointer) => {
      let schemaType: SchemaPrimitiveType | SchemaPrimitiveType[] =
        this.fieldMap[pointer]['schemaType'];
      if (isSet(value) &&
        inArray(schemaType, ['string', 'integer', 'number', 'boolean', 'null'])
      ) {
        // let newValue = toSchemaType(value, schemaType);
        let newValue = toJavaScriptType(value, <SchemaPrimitiveType>schemaType);
        if (isPresent(newValue)) JsonPointer.set(formattedData, pointer, newValue);
      }
    });
    return formattedData;
  }

  private submitForm() {
    this.onSubmit.emit(this.formatFormData(this.rootFormGroup.value));
  }
}
