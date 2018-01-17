import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';

import { JsonSchemaFormService } from '../../json-schema-form.service';

import { Bootstrap4FrameworkComponent } from './bootstrap-4-framework.component';

@NgModule({
  imports:         [ CommonModule, WidgetLibraryModule ],
  declarations:    [ Bootstrap4FrameworkComponent ],
  exports:         [ Bootstrap4FrameworkComponent ],
  entryComponents: [ Bootstrap4FrameworkComponent ]
})
export class Bootstrap4FrameworkModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: Bootstrap4FrameworkModule,
      providers: [ JsonSchemaFormService ]
    }
  }
}
