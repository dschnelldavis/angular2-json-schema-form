import {
  AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormArray, FormControl, FormGroup, FormBuilder, NgForm, Validators
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';

import { JsonPointer } from '../json-schema-form/utilities/jsonpointer';

@Component({
  moduleId: module.id,
  selector: 'playground',
  templateUrl: 'playground.component.html',
  styleUrls: [ 'playground.component.css' ]
})
export class PlaygroundComponent implements OnInit, AfterViewInit {
  private examples: any = {
    exampleSetList: ['ng2jsf', 'asf', 'jsf'],
    exampleSets: {
      'ng2jsf': 'Angular 2 JSON Schema Form examples',
      'asf': 'Angular Schema Form compatibility examples',
      'jsf': 'JSONForm compatibility examples',
    },
    exampleList: {
      'ng2jsf': [ 'json-schema-draft04', 'json-schema-draft03', ],
      'asf': [
        'asf-simple', 'asf-basic-json-schema-type',
        'asf-bootstrap-grid', 'asf-complex-key-support', 'asf-array',
        'asf-tab-array', 'asf-titlemap-examples', 'asf-kitchen-sink',
        'asf-hack-conditional-required',
      ],
      'jsf': [
        'gettingstarted',
        'schema-basic', 'schema-morecomplex', 'schema-array',
        'fields-common', 'fields-password', 'fields-textarea',
        'fields-ace', 'fields-color', 'fields-checkbox', 'fields-checkboxes',
        'fields-select', 'fields-radios', 'fields-radiobuttons',
        'fields-range', 'fields-imageselect', 'fields-fieldset',
        'fields-advancedfieldset', 'fields-authfieldset', 'fields-section',
        'fields-actions', 'fields-array', 'fields-tabarray',
        'fields-tabarray-maxitems', 'fields-tabarray-value',
        'fields-selectfieldset', 'fields-selectfieldset-key', 'fields-submit',
        'fields-help', 'fields-hidden', 'fields-questions',
        'templating-idx', 'templating-value', 'templating-values',
        'templating-tpldata', 'events', 'previousvalues',
      ],
    },
    examples: {
      'ng2jsf': {
        'json-schema-draft04': 'JSON Meta-Schema - Version 4',
        'json-schema-draft03': 'JSON Meta-Schema - Version3',
      },
      'asf': {
        'asf-simple': 'Simple',
        'asf-basic-json-schema-type': 'Basic JSON Schema Type',
        'asf-bootstrap-grid': 'Bootstrap Grid',
        'asf-complex-key-support': 'Complex Key Support',
        'asf-array': 'Array',
        'asf-tab-array': 'Tab Array',
        'asf-titlemap-examples': 'TitleMap Examples',
        'asf-kitchen-sink': 'Kitchen Sink',
        'asf-hack-conditional-required': 'Hack: Conditional Required',
      },
      'jsf': {
        'gettingstarted': 'Getting started',
        'schema-basic': 'JSON Schema - A basic example',
        'schema-morecomplex': 'JSON Schema - Slightly more complex example',
        'schema-array': 'JSON Schema - Arrays',
        'fields-common': 'Fields - Common properties',
        'fields-password': 'Fields - Gathering secrets: the password type',
        'fields-textarea': 'Fields - Large text: the textarea type',
        'fields-ace': 'Fields - Code (JavaScript, JSON...): the ace type',
        'fields-color': 'Fields - Color picker: the color type',
        'fields-checkbox': 'Fields - Boolean flag: the checkbox type',
        'fields-checkboxes': 'Fields - Multiple options: the checkboxes type',
        'fields-select': 'Fields - Selection list: the select type',
        'fields-radios': 'Fields - A list of radio buttons: the radios type',
        'fields-radiobuttons': 'Fields - Radio buttons as real buttons: the radio buttons type',
        'fields-range': 'Fields - Number: the range type',
        'fields-imageselect': 'Fields - Image selector: the imageselect type',
        'fields-fieldset': 'Fields - Grouping: the fieldset type',
        'fields-advancedfieldset': 'Fields - Advanced options section: the advancedfieldset type',
        'fields-authfieldset': 'Fields - Authentication settings section: the authfieldset type',
        'fields-section': 'Fields - Generic group: the section type',
        'fields-actions': 'Fields - Group of buttons: the actions type',
        'fields-array': 'Fields - Generic array: the array type',
        'fields-tabarray': 'Fields - Arrays with tabs: the tabarray type',
        'fields-tabarray-maxitems': 'Fields - Arrays with tabs: the tabarray type w/ maxItems',
        'fields-tabarray-value': 'Fields - Arrays with tabs: the tabarray type w/ default & legend',
        'fields-selectfieldset': 'Fields - Alternative: the selectfieldset type',
        'fields-selectfieldset-key': 'Fields - Alternative with schema key',
        'fields-submit': 'Fields - Submit the form: the submit type',
        'fields-help': 'Fields - Guide users: the help type',
        'fields-hidden': 'Fields - Hidden form values: the hidden type',
        'fields-questions': 'Fields - Series of questions: the questions type',
        'templating-idx': 'Templating - item index with idx',
        'templating-value': 'Templating - tab legend with value and valueInLegend',
        'templating-values': 'Templating - values.xxx to reference another field',
        'templating-tpldata': 'Templating - Using the tpldata property',
        'events': 'Using event handlers',
        'previousvalues': 'Using previously submitted values',
      },
    },
  };
  private selectedSet: string = 'asf';
  private selectedExample: string = 'asf-basic-json-schema-type';

  private formActive: boolean = false;
  private aceHeight: number = 600;
  private greatform: any;
  private jsonFormSchema: string;
  private jsonFormValid: boolean = false;
  private jsonFormErrorMessage: string = 'Loading form...';
  private jsonFormObject: any;
  private dataObject: any = {};
  private aceEditorOptions: any = {
    highlightActiveLine: true,
    maxLines: 1000,
    printMargin: false,
    autoScrollEditorIntoView: true,
  };

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: Http,
  ) { }

  ngOnInit() {
    // Checks query string for the name of a form to load
    this.route.queryParams.subscribe(
      params => {
        if (params['set']) this.selectedSet = params['set'];
        if (params['example']) this.selectedExample = params['example'];
      }
    );
  }

  ngAfterViewInit() {
    this.loadSelectedExample();
  }

  onSubmit(data: any) {
    this.dataObject = data;
  }

  get prettyData() {
    return JSON.stringify(this.dataObject, null, 2);
  }

  private resizeAceEditor() {
    this.aceHeight = window.innerHeight - 230;
  }

  private loadSelectedSet(selectedSet?: string) {
    if (selectedSet && selectedSet !== this.selectedSet) {
      this.selectedSet = selectedSet;
      this.selectedExample = this.examples.exampleList[selectedSet][0];
      this.router.navigateByUrl('/?set=' + selectedSet + '&example=' + this.selectedExample);
      this.loadSelectedExample();
    }
  }

  // Load and display the selected schema
  // (runs whenever the user selects a schema from the drop-down menu)
  private loadSelectedExample(selectedSet?: string, selectedExample?: string) {
    if (selectedExample && selectedExample !== this.selectedExample) {
      this.selectedSet = selectedSet;
      this.selectedExample = selectedExample;
      this.router.navigateByUrl('/?set=' + selectedSet + '&example=' + selectedExample);
    }
    this.http.get(
      'playground/examples/' + this.selectedExample + '.json'
    ).map(schema => schema.text()).subscribe(schema => {
      this.jsonFormSchema = schema;
      this.generateForm(this.jsonFormSchema);
    });
  };

  // Display the form entered by the user
  // (runs whenever the user changes the jsonform object in the ACE input field)
  private generateForm(newFormString: string) {
    if (!newFormString) { return; }
    this.formActive = false;
    this.dataObject = {};

    // Most examples should be written in pure JSON, but if a schema includes
    // a function, the playground will compile it as Javascript instead
    try {

      // Parse entered content as JSON
      this.jsonFormObject = JSON.parse(newFormString);
      this.jsonFormValid = true;
    } catch (jsonError) {
      try {

        // If entered content is not valid JSON,
        // parse as JavaScript instead to include functions
        let newFormObject: any = null;
        eval('newFormObject = ' + newFormString);
        this.jsonFormObject = newFormObject;
        this.jsonFormValid = true;
      } catch (javascriptError) {

        // If entered content is not valid JSON or JavaScript, show error
        this.jsonFormValid = false;
        this.jsonFormErrorMessage =
          'Entered content is not yet a valid JSON Form object.\n' +
          'JavaScript parser returned:\n\n' + jsonError;
        return;
      }
    }
    this.formActive = true;
  };
}
