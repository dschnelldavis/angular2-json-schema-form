import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryService } from '../widget-library/widget-library.service';
import { WidgetLibraryModule } from '../widget-library/widget-library.module';

import { FrameworkLibraryService } from './framework-library.service';
import { NoFrameworkComponent } from './no-framework.component';

@NgModule({
  imports:         [
    CommonModule, WidgetLibraryModule,
  ],
  declarations:    [ NoFrameworkComponent ],
  exports:         [
    NoFrameworkComponent,
  ],
  entryComponents: [ NoFrameworkComponent ]
})
export class FrameworkLibraryModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: FrameworkLibraryModule,
      providers: [ WidgetLibraryService, FrameworkLibraryService ]
    }
  }
}
