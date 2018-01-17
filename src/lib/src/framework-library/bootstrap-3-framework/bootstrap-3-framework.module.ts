import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';

import { JsonSchemaFormService } from '../../json-schema-form.service';

import { Bootstrap3FrameworkComponent } from './bootstrap-3-framework.component';

@NgModule({
  imports:         [ CommonModule, WidgetLibraryModule ],
  declarations:    [ Bootstrap3FrameworkComponent ],
  exports:         [ Bootstrap3FrameworkComponent ],
  entryComponents: [ Bootstrap3FrameworkComponent ]
})
export class Bootstrap3FrameworkModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: Bootstrap3FrameworkModule,
      providers: [ JsonSchemaFormService ]
    }
  }
}
