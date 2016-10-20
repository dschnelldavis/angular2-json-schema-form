import { Directive, ElementRef, Renderer, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { isBlank, toJavaScriptType } from '../validators/validator-functions';

export const INTEGER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => IntegerValueAccessor),
  multi: true
};

/**
 * The accessor for writing a integer value and listening to changes that is used by the
 * {@link NgModel}, {@link FormControlDirective}, and {@link FormControlName} directives.
 *
 *  ### Example
 *  ```
 *  <input type="number" schematype="integer" [(ngModel)]="age">
 *  ```
 */
@Directive({
  selector:
      'input[type=number][formControlName][schematype=integer],input[type=number][formControl][schematype=integer],input[type=number][ngModel][schematype=integer]',
  host: {
    '(change)': 'onChange($event.target.value)',
    '(input)': 'onChange($event.target.value)',
    '(blur)': 'onTouched()'
  },
  providers: [INTEGER_VALUE_ACCESSOR]
})
export class IntegerValueAccessor implements ControlValueAccessor {
  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(private _renderer: Renderer, private _elementRef: ElementRef) {}

  writeValue(value: number): void {
    const normalizedValue = isBlank(value) ? '' : value;
    this._renderer.setElementProperty(this._elementRef.nativeElement, 'value', normalizedValue);
  }

  registerOnChange(fn: (_: number) => void): void {
    this.onChange = (value) => { fn(value === '' ? null : <number>toJavaScriptType(value, 'integer')); };
  }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this._renderer.setElementProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
  }
}
