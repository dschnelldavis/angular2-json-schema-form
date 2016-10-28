/**
 * Converts JSON Schema version 3 to JSON Schema version 4
 *
 * Based on geraintluff's JSON Schema compatibility function
 * https://github.com/geraintluff/json-schema-compatibility
 *
 * @param {object} originalSchema - JSON schema (version 3)
 * @return {object} - JSON schema (version 4)
 */
export function convertJsonSchema3to4(schema: any): any {
  if (typeof schema !== 'object') return schema;

  const isArray = (item: any): boolean => Array.isArray(item) ||
    Object.prototype.toString.call(item) === '[object Array]';
  const convertTypes = (types, replace: boolean = false): boolean | string[] => {
    let newTypes: any[] = [];
    for (let type of isArray(types) ? types : [types]) {
      newTypes.push(typeof type === 'object' ? type : { 'type': type });
      if (typeof type === 'object') replace = true;
    }
    return replace && newTypes;
  };

  let newSchema = isArray(schema) ? [].concat(schema) : Object.assign({}, schema);
  let converted: boolean = false;

  // convert multiple types to anyOf
  if (newSchema.type) {
    if (typeof newSchema.type !== 'string') {
      converted = true;
      let anyOf = convertTypes(newSchema.type);
      if (anyOf) {
        newSchema.anyOf = anyOf;
        delete newSchema.type;
      }
    } else if (newSchema.type === 'any') {
      delete newSchema.type;
    }
  }

  // convert extends to allOf
  if (newSchema.extends) {
    converted = true;
    newSchema.allOf = isArray(newSchema.extends) ?
      newSchema.extends : [newSchema.extends];
    delete newSchema.extends;
  }

  // convert disallow to not
  if (newSchema.disallow) {
    converted = true;
    newSchema.not = (typeof newSchema.disallow === 'string') ?
      { 'type': newSchema.disallow } :
      { 'anyOf': convertTypes(newSchema.disallow, true) };
    delete newSchema.disallow;
  }

  // move required from individual items to required array
  if (newSchema.properties) {
    let requiredArray = isArray(newSchema.required) ? newSchema.required : [];
    for (let key of Object.keys(newSchema.properties)) {
      if (typeof newSchema.properties[key].required === 'boolean') {
        if (newSchema.properties[key].required) {
          requiredArray.push(key);
          converted = true;
        }
        delete newSchema.properties[key].required;
      }
    }
    if (requiredArray.length) newSchema.required = requiredArray;
  }

  // convert dependencies to arrays
  if (newSchema.dependencies) {
    for (let key of Object.keys(newSchema.dependencies)) {
      if (typeof newSchema.dependencies[key] === 'string') {
        converted = true;
        newSchema.dependencies[key] = [newSchema.dependencies[key]];
      }
    }
  }

  // delete boolean required key
  if (typeof newSchema.required === 'boolean') {
    converted = true;
    delete newSchema.required;
  }

  // convert divisibleBy to multipleOf
  if (newSchema.divisibleBy) {
    converted = true;
    newSchema.multipleOf = newSchema.divisibleBy;
    delete newSchema.divisibleBy;
  }

  // convert sub schemas
  for (let key of Object.keys(newSchema)) {
    if (['properties', 'patternProperties', 'dependencies'].indexOf(key) > -1) {
      for (let subKey of Object.keys(newSchema[key])) {
        newSchema[key][subKey] = convertJsonSchema3to4(newSchema[key][subKey]);
      }
    } else if (key !== 'enum') {
      if (isArray(newSchema[key])) {
        for (let subSchema of newSchema[key]) {
          subSchema = convertJsonSchema3to4(subSchema);
        }
      } else if (typeof newSchema[key] === 'object') {
        newSchema[key] = convertJsonSchema3to4(newSchema[key]);
      }
    }
  }

  if (converted === true) {

    // update or delete schema identifier
    if (newSchema.$schema) {
      if (newSchema.$schema === 'http://json-schema.org/draft-03/schema#') {
        newSchema.$schema = 'http://json-schema.org/draft-04/schema#';
      } else {
        delete newSchema.$schema;
      }
    }

    // update id
    if (newSchema.id) newSchema.id += '-CONVERTED-TO-DRAFT-04';
  }

  return newSchema;
}
