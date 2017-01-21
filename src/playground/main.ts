import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { PlaygroundModule } from './playground.module';

// enableProdMode();

export function main() {
  platformBrowserDynamic().bootstrapModule(PlaygroundModule);
}

if (document.readyState === 'complete') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', main);
}
