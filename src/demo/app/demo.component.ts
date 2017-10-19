import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { Http } from '@angular/http';

import 'rxjs/add/operator/map';

import { Examples } from './example-schemas.model';
import { JsonPointer } from '../../lib/src/shared';

@Component({
  selector: 'demo',
  templateUrl: 'demo.component.html',
  animations: [
    trigger('expandSection', [
      state('in', style({ height: '*' })),
      transition(':enter', [
        style({ height: 0 }), animate(100),
      ]),
      transition(':leave', [
        style({ height: '*' }),
        animate(100, style({ height: 0 })),
      ]),
    ]),
  ],
})
export class DemoComponent implements OnInit {
  examples: any = Examples;
  frameworkList: any = ['material-design', 'bootstrap-3', 'no-framework'];
  frameworks: any = {
    'material-design': 'Material Design framework',
    'bootstrap-3': 'Bootstrap 3 framework',
    'no-framework': 'No Framework (plain HTML controls)',
  };
  selectedSet: string = 'ng-jsf';
  selectedSetName: string = '';
  selectedExample: string = 'ng-jsf-flex-layout';
  selectedExampleName: string = 'Flexbox layout';
  selectedFramework: string = 'material-design';
  visible: { [item: string]: boolean } = {
    options: true,
    schema: true,
    form: true,
    output: true
  };

  formActive = false;
  jsonFormSchema: string;
  jsonFormValid = false;
  jsonFormStatusMessage: string = 'Loading form...';
  jsonFormObject: any;
  jsonFormOptions: any = {
    addSubmit: true, // Add a submit button if layout does not have one
    loadExternalAssets: true, // Load external css and JavaScript for frameworks
    formDefaults: { feedback: true }, // Show inline feedback icons
    debug: false,
    returnEmptyFields: false,
  };
  liveFormData: any = {};
  formValidationErrors: any;
  formIsValid = null;
  submittedFormData: any = null;
  aceEditorOptions: any = {
    highlightActiveLine: true,
    maxLines: 1000,
    printMargin: false,
    autoScrollEditorIntoView: true,
  };
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: Http,
  ) { }

  ngOnInit() {
    // Subscribe to query string to detect schema to load
    this.route.queryParams.subscribe(
      params => {
        if (params['set']) {
          this.selectedSet = params['set'];
          this.selectedSetName = ({
            'ng-jsf': '',
            'asf': 'Angular Schema Form:',
            'rsf': 'React Schema Form:',
            'jsf': 'JSONForm:'
          })[this.selectedSet];
        }
        if (params['example']) {
          this.selectedExample = params['example'];
          this.selectedExampleName = this.examples[this.selectedSet].schemas
            .find(schema => schema.file === this.selectedExample).name;
        }
        if (params['framework']) {
          this.selectedFramework = params['framework'];
        }
        this.loadSelectedExample();
      }
    );
  }

  onSubmit(data: any) {
    this.submittedFormData = data;
  }

  get prettySubmittedFormData() {
    return JSON.stringify(this.submittedFormData, null, 2);
  }

  onChanges(data: any) {
    this.liveFormData = data;
  }

  get prettyLiveFormData() {
    return JSON.stringify(this.liveFormData, null, 2);
  }

  isValid(isValid: boolean): void {
    this.formIsValid = isValid;
  }

  validationErrors(data: any): void {
    this.formValidationErrors = data;
  }

  get prettyValidationErrors() {
    if (!this.formValidationErrors) { return null; }
    let errorArray = [];
    for (let error of this.formValidationErrors) {
      let message = error.message;
      let dataPathArray = JsonPointer.parse(error.dataPath);
      if (dataPathArray.length) {
        let field = dataPathArray[0];
        for (let i = 1; i < dataPathArray.length; i++) {
          const key = dataPathArray[i];
          field += /^\d+$/.test(key) ? `[${key}]` : `.${key}`;
        }
        errorArray.push(`${field}: ${message}`);
      } else {
        errorArray.push(message);
      }
    }
    return errorArray.join('<br>');
  }

  loadSelectedExample(
    selectedSet: string = this.selectedSet,
    selectedSetName: string = this.selectedSetName,
    selectedExample: string = this.selectedExample,
    selectedExampleName: string = this.selectedExampleName
  ) {
    if (this.menuTrigger.menuOpen) { this.menuTrigger.closeMenu(); }
    if (selectedExample !== this.selectedExample) {
      this.selectedSet = selectedSet;
      this.selectedSetName = selectedSetName;
      this.selectedExample = selectedExample;
      this.selectedExampleName = selectedExampleName;
      this.router.navigateByUrl(
        '/?set=' + selectedSet +
        '&example=' + selectedExample +
        '&framework=' + this.selectedFramework
      );
      this.liveFormData = {};
      this.submittedFormData = null;
      this.formIsValid = null;
      this.formValidationErrors = null;
    }
    this.http
      .get('assets/example-schemas/' + this.selectedExample + '.json')
      .map(schema => schema.text())
      .subscribe(schema => {
        this.jsonFormSchema = schema;
        this.generateForm(this.jsonFormSchema);
      });
    // this.resizeAceEditor();
  }

  loadSelectedFramework(selectedFramework: string) {
    this.router.navigateByUrl(
      '/?set=' + this.selectedSet +
      '&example=' + this.selectedExample +
      '&framework=' + selectedFramework
    );
    this.generateForm(this.jsonFormSchema);
  }

  // Display the form entered by the user
  // (runs whenever the user changes the jsonform object in the ACE input field)
  generateForm(newFormString: string) {
    if (!newFormString) { return; }
    this.jsonFormStatusMessage = 'Loading form...';
    this.formActive = false;
    this.liveFormData = {};
    this.submittedFormData = null;

    // Most examples should be written in pure JSON,
    // but if an example schema includes a function,
    // it will be compiled it as Javascript instead
    try {

      // Parse entered content as JSON
      this.jsonFormObject = JSON.parse(newFormString);
      this.jsonFormValid = true;
    } catch (jsonError) {
      try {

        // If entered content is not valid JSON,
        // parse as JavaScript instead to include functions
        let newFormObject: any = null;
        /* tslint:disable */
        eval('newFormObject = ' + newFormString);
        /* tslint:enable */
        this.jsonFormObject = newFormObject;
        this.jsonFormValid = true;
      } catch (javascriptError) {

        // If entered content is not valid JSON or JavaScript, show error
        this.jsonFormValid = false;
        this.jsonFormStatusMessage =
          'Entered content is not currently a valid JSON Form object.\n' +
          'As soon as it is, you will see your form here. So keep typing. :-)\n\n' +
          'JavaScript parser returned:\n\n' + jsonError;
        return;
      }
    }
    this.formActive = true;
  }

  toggleVisible(item: string) {
    this.visible[item] = !this.visible[item];
  }

  toggleFormOption(option: string) {
    if (option === 'feedback') {
      this.jsonFormOptions.formDefaults.feedback =
        !this.jsonFormOptions.formDefaults.feedback;
    } else {
      this.jsonFormOptions[option] = !this.jsonFormOptions[option];
    }
    this.generateForm(this.jsonFormSchema);
  }
}
