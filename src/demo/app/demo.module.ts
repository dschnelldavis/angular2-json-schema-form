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

import { Framework } from '../../lib/src/framework-library/framework';

import { FrameworkNoFramework } from '../../lib/src/framework-library/framework.no-framework';

import { Bootstrap3FrameworkModule } from '../../lib/src/framework-library/bootstrap-3-framework/bootstrap-3-framework.module';
import { FrameworkBootstrap3 } from '../../lib/src/framework-library/framework.bootstrap3';

import { Bootstrap4FrameworkModule } from '../../lib/src/framework-library/bootstrap-4-framework/bootstrap-4-framework.module';
import { FrameworkBootstrap4 } from '../../lib/src/framework-library/framework.bootstrap4';

import { MaterialDesignFrameworkModule } from '../../lib/src/framework-library/material-design-framework/material-design-framework.module';
import { FrameworkMaterialDesign } from '../../lib/src/framework-library/framework.material-design';

let language = '';

@NgModule({
  declarations: [ AceEditorDirective, DemoComponent, DemoRootComponent ],
  imports: [
    BrowserModule, BrowserAnimationsModule, FlexLayoutModule, FormsModule,
    HttpClientModule, MatButtonModule, MatCardModule, MatCheckboxModule,
    MatIconModule, MatMenuModule, MatSelectModule, MatToolbarModule,
    RouterModule.forRoot(routes), JsonSchemaFormModule,
    Bootstrap3FrameworkModule,
    Bootstrap4FrameworkModule,
    MaterialDesignFrameworkModule
  ],
  providers: [
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
    },
    { provide: Framework, useClass: FrameworkNoFramework, multi: true },
    { provide: Framework, useClass: FrameworkBootstrap3, multi: true },
    { provide: Framework, useClass: FrameworkBootstrap4, multi: true },
    { provide: Framework, useClass: FrameworkMaterialDesign, multi: true }
  ],
  bootstrap: [ DemoRootComponent ]
})
export class DemoModule { }
