import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  MatButtonModule, MatCardModule, MatCheckboxModule, MatIconModule,
  MatMenuModule, MatSelectModule, MatToolbarModule
} from '@angular/material';
import { RouterModule } from '@angular/router';

import { JsonSchemaFormModule } from '../../lib/src/json-schema-form.module';
import { JsonSchemaFormIntl } from '../../lib/src/json-schema-form-intl';
import { JsonSchemaFormIntlFr } from '../../lib/src/i18n/json-schema-form-intl-fr';
// To include JsonSchemaFormModule after downloading from NPM, use this instead:
// import { JsonSchemaFormModule } from 'angular2-json-schema-form';

import { AceEditorDirective } from './ace-editor.directive';
import { DemoComponent } from './demo.component';
import { DemoRootComponent } from './demo-root.component';

import { routes } from './demo.routes';
import { ActivatedRoute, Router } from '@angular/router';


let language = '';

@NgModule({
  declarations: [ AceEditorDirective, DemoComponent, DemoRootComponent ],
  imports: [
    BrowserModule, BrowserAnimationsModule, FlexLayoutModule, FormsModule,
    HttpClientModule, MatButtonModule, MatCardModule, MatCheckboxModule,
    MatIconModule, MatMenuModule, MatSelectModule, MatToolbarModule,
    RouterModule.forRoot(routes), JsonSchemaFormModule
  ],
  providers: [
    /*
    {provide: JsonSchemaFormIntl, useClass: JsonSchemaFormIntlFr
    },
    */
    {
        provide: JsonSchemaFormIntl,  useFactory:
           function(route: ActivatedRoute) {
              route.queryParams.subscribe(
                params => {
                  language = params['language'];
                });
                switch (language) {
                  case 'fr':
                    return new JsonSchemaFormIntlFr();
                  default:
                    return new JsonSchemaFormIntl();
                }
           },
           deps: [ActivatedRoute]
    }
  ],
  bootstrap: [ DemoRootComponent ]
})
export class DemoModule { }
