import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
/**
 * unused @angular/material modules:
 * MatDialogModule, MatGridListModule, MatListModule, MatMenuModule,
 * MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule,
 * MatSidenavModule, MatSnackBarModule, MatSortModule, MatTableModule,
 * MatToolbarModule,
 */

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { Framework } from '../framework';
import { SEMANTIC_UI_FRAMEWORK_COMPONENTS } from './index';
import { SemanticUIFramework } from './semantic-ui.framework';

import { FlatpickrModule } from 'angularx-flatpickr';
import { NgSemanticModule } from 'ng-semantic';


@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, FlexLayoutModule,
    NgSemanticModule, WidgetLibraryModule, FlatpickrModule.forRoot()
  ],
  declarations:    [...SEMANTIC_UI_FRAMEWORK_COMPONENTS],
  exports:         [...SEMANTIC_UI_FRAMEWORK_COMPONENTS],
  entryComponents: [...SEMANTIC_UI_FRAMEWORK_COMPONENTS]
})
export class SemanticUIFrameworkModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SemanticUIFrameworkModule,
      providers: [
        { provide: Framework, useClass: SemanticUIFramework, multi: true }
      ]
    };
  }
}
