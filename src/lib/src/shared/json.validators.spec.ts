import { JsonValidators } from '.';
import { AbstractControl } from '@angular/forms';

describe('JsonValidators', () => {
    let control: AbstractControl;
    let controlValue: any;

    beforeEach(() => {
        controlValue = null;
        control = <any>{
            get value() {
                return controlValue;
            }
        };
    });

describe('required', () => {});

    describe('type', () => {
        describe('valid', () => {
            it('should be valid when matches type', () => {
                controlValue = 12;
                expect(JsonValidators.type('number')(control)).toBeNull();
                expect(JsonValidators.type('integer')(control)).toBeNull();
            });
            it('should be valid when null', () => {
                expect(JsonValidators.type('number')(control)).toBeNull();
            });
        });
        describe('invalid', () => {
            it('should be invalid when not of type', () => {
                controlValue = 12;
                expect(JsonValidators.type('string')(control)).toEqual({
                    type: {
                        requiredType: 'string',
                        currentValue: 12
                    }
                });
            });
            it('should be invalid when not of 1 or more are not or type', () => {
                controlValue = 1.2;
                expect(JsonValidators.type(['string', 'boolean', 'integer'])(control)).toEqual({
                    type: {
                        requiredType: ['string', 'boolean', 'integer'],
                        currentValue: 1.2
                    }
                });
            });
            it('should be invalid when valid and inverted', () => {
                controlValue = 12;
                expect(JsonValidators.type('number')(control, true)).toEqual({
                    type: {
                        requiredType: 'number',
                        currentValue: 12
                    }
                });
            });
        });
    });

    describe('enum', () => {});
    describe('const', () => {});
describe('minLength', () => {});
describe('maxLength', () => {});
describe('pattern', () => {});
    describe('format', () => {});
  describe('minimum', () => {});
    describe('exclusiveMinimum', () => {});
  describe('maximum', () => {});
    describe('exclusiveMaximum', () => {});

    describe('multipleOf', () => {
        describe('valid', () => {
            it('should be vaild when multiple', () => {
                controlValue = 12;
                expect(JsonValidators.multipleOf(1)(control)).toBeNull();
                expect(JsonValidators.multipleOf(2)(control)).toBeNull();
                expect(JsonValidators.multipleOf(3)(control)).toBeNull();
                expect(JsonValidators.multipleOf(4)(control)).toBeNull();
                expect(JsonValidators.multipleOf(6)(control)).toBeNull();
                expect(JsonValidators.multipleOf(12)(control)).toBeNull();
            });
            it('should be valid when invalid and inverted', () => {
                controlValue = 12;
                expect(JsonValidators.multipleOf(5)(control, true)).toBeNull();
            });
        });
        describe('invalid', () => {
            it('should be invalid when not multiple ', () => {
                controlValue = 12;
                expect(JsonValidators.multipleOf(5)(control)).toEqual({
                    multipleOf: {
                        multipleOfValue: 5,
                        currentValue: 12
                    }
                });
            });
            it('should be invalid when valid and inverted', () => {
                controlValue = 12;
                expect(JsonValidators.multipleOf(3)(control, true)).toEqual({
                    multipleOf: {
                        multipleOfValue: 3,
                        currentValue: 12
                    }
                });
            });
        });
    });

    describe('minProperties', () => {});
    describe('maxProperties', () => {});
    describe('dependencies', () => {});

    describe('minItems', () => {
        describe('valid', () => {
            it('should be valid when minItems = null', () => {
                expect(JsonValidators.minItems(null)(control)).toBeNull();
            });
            it('should be valid when value = minItems', () => {
                controlValue = [1, 2, 3];
                expect(JsonValidators.minItems(3)(control)).toBeNull();
            });
            it('should be valid when value > minItems', () => {
                controlValue = [1, 2, 3, 4];
                expect(JsonValidators.minItems(3)(control)).toBeNull();
            });
            it('should be valid when value < minItems and inverted', () => {
                controlValue = [1, 2];
                expect(JsonValidators.minItems(3)(control, true)).toBeNull();
            });
        });
        describe('invalid', () => {
            it('should be invalid when value < minItems', () => {
                controlValue = [1, 2];
                expect(JsonValidators.minItems(3)(control)).toEqual({
                    minItems: {
                        minimumItems: 3,
                        currentItems: 2
                    }
                });
            });
            it('should be invalid when no items', () => {
                controlValue = [];
                expect(JsonValidators.minItems(3)(control)).toEqual({
                    minItems: {
                        minimumItems: 3,
                        currentItems: 0
                    }
                });
            });
            it('should be invalid when value > minItems and inverted', () => {
                controlValue = [1, 2, 3, 4];
                expect(JsonValidators.minItems(3)(control, true)).toEqual({
                    minItems: {
                        minimumItems: 3,
                        currentItems: 4
                    }
                });
            });
        });
    });

    describe('maxItems', () => {
        describe('valid', () => {
            it('should be valid when maxItems = null', () => {
                expect(JsonValidators.maxItems(null)(control)).toBeNull();
            });
            it('should be valid when value < maxItems', () => {
                controlValue = [1, 2];
                expect(JsonValidators.maxItems(3)(control)).toBeNull();
            });
            it('should be valid when value = maxItems', () => {
                controlValue = [1, 2, 3];
                expect(JsonValidators.maxItems(3)(control)).toBeNull();
            });
            it('should be valid when value > maxItems and inverted', () => {
                controlValue = [1, 2, 3, 4];
                expect(JsonValidators.maxItems(3)(control, true)).toBeNull();
            });
        });
        describe('invalid', () => {
            it('should be invalid when value > maxItems', () => {
                controlValue = [1, 2, 3, 4];
                expect(JsonValidators.maxItems(3)(control)).toEqual({
                    maxItems: {
                        maximumItems: 3,
                        currentItems: 4
                    }
                });
            });
            it('should be invalid when value <= maxItems and inverted', () => {
                controlValue = [1, 2];
                expect(JsonValidators.maxItems(3)(control, true)).toEqual({
                    maxItems: {
                        maximumItems: 3,
                        currentItems: 2
                    }
                });
            });
        });
    });

    describe('uniqueItems', () => {
        describe('valid', () => {
            it('should be valid when all items unique', () => {
                controlValue = [1, 2, 3, 4];
                expect(JsonValidators.uniqueItems()(control)).toBeNull();
            });
            it('should be valid when no items', () => {
                controlValue = [];
                expect(JsonValidators.uniqueItems()(control)).toBeNull();
            });
            it('should be valid when no value', () => {
                expect(JsonValidators.uniqueItems()(control)).toBeNull();
            });
            it('should be valid when duplicates and inverted', () => {
                controlValue = [1, 3, 5, 2, 3, 4, 5];
                expect(JsonValidators.uniqueItems()(control, true)).toBeNull();
            });
        });
        describe('invalid', () => {
            it('should be invalid when there are duplicates', () => {
                controlValue = [1, 3, 5, 2, 3, 4, 5];
                expect(JsonValidators.uniqueItems()(control)).toEqual({
                    uniqueItems: {
                        duplicateItems: [3, 5]
                    }
                });
            });
            it('should be invalid when unique and inverted', () => {
                controlValue = [1, 3, 5];
                expect(JsonValidators.uniqueItems()(control, true)).toEqual({
                    uniqueItems: {
                        duplicateItems: []
                    }
                });
            });
        });
    });

    describe('contains', () => {});
describe('nullValidator', () => {});
    describe('composeAnyOf', () => {});
    describe('composeOneOf', () => {});
    describe('composeAllOf', () => {});
    describe('composeNot', () => {});
describe('compose', () => {});
describe('composeAsync', () => {});
});
