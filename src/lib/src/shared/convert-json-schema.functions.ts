/**
 * 'convertJsonSchemaToDraft6' function
 *
 * Converts JSON Schema version 3 or 4 to JSON Schema version 6
 *
 * Initially based on geraintluff's JSON Schema 3 to 4 compatibility function
 * https://github.com/geraintluff/json-schema-compatibility
 * Also uses suggestions from AJV's JSON Schema 4 to 6 migration guide
 * https://github.com/epoberezkin/ajv/releases/tag/5.0.0
 *
 * @param {object} originalSchema - JSON schema (version 3, 4, or 6)
 * @return {object} - JSON schema (version 6)
 */
export function convertJsonSchemaToDraft6(schema: any): any {

  if (typeof schema !== 'object') { return schema; }
  if (Array.isArray(schema)) {
    return [ ...schema.map(subSchema => convertJsonSchemaToDraft6(subSchema)) ];
  }
  const newSchema = { ...schema };

  if (newSchema.$ref && typeof newSchema.$ref === 'string') {

    // return regular $ref object
    if (Object.keys(newSchema).length === 1) { return newSchema; }

    // convert overloaded $ref object to allOf
    const refLink = newSchema.$ref;
    delete newSchema.$ref;
    return {
      'allOf': [
        { $ref: refLink },
        convertJsonSchemaToDraft6(newSchema)
      ]
    };
  }

  // convert extends to allOf
  if (newSchema.extends) {
    newSchema.allOf = Array.isArray(newSchema.extends) ?
      newSchema.extends.map(subSchema => convertJsonSchemaToDraft6(subSchema)) :
      [ convertJsonSchemaToDraft6(newSchema.extends) ];
    delete newSchema.extends;
  }

  // convert disallow to not
  if (newSchema.disallow) {
    if (typeof newSchema.disallow === 'string') {
      newSchema.not = { type: newSchema.disallow };
    } else if (Array.isArray(newSchema.disallow)) {
      newSchema.not = {
        anyOf: newSchema.disallow
          .map(type => typeof type === 'string' ? { type } : type)
      };
    }
    delete newSchema.disallow;
  }

  // delete boolean required key
  if (typeof newSchema.required === 'boolean') {
    delete newSchema.required;
  }

  // move required from individual items to required array
  if (newSchema.properties) {
    const requiredKeys = new Set(newSchema.required || []);
    Object.keys(newSchema.properties)
      .filter(key => newSchema.properties[key].required === true)
      .forEach(key => requiredKeys.add(key));
    if (requiredKeys.size) { newSchema.required = Array.from(requiredKeys); }

  // move incorrectly placed required list inside array object
  } else if (Array.isArray(newSchema.required) &&
    ((newSchema.items || {}).properties || (newSchema.additionalItems || {}).properties)
  ) {
    const getRequired = (object, key) => Array.isArray(object[key].required) ?
      Array.from(new Set([ ...object[key].required, ...object.required ])) :
      [ ...object.required ];
    if ((newSchema.items || {}).properties) {
      newSchema.items = { ...newSchema.items };
      newSchema.items.required = getRequired(newSchema, 'items');
      delete newSchema.required;
    } else { // (newSchema.additionalItems || {}).properties
      newSchema.additionalItems = { ...newSchema.additionalItems };
      newSchema.additionalItems.required = getRequired(newSchema, 'additionalItems');
      delete newSchema.required;
    }
  }

  // convert dependencies to arrays
  if (newSchema.dependencies) {
    newSchema.dependencies = { ...newSchema.dependencies };
    Object.keys(newSchema.dependencies)
      .filter(key => typeof newSchema.dependencies[key] === 'string')
      .forEach(key => newSchema.dependencies[key] = [ newSchema.dependencies[key] ]);
  }

  // convert divisibleBy to multipleOf
  if (newSchema.divisibleBy) {
    newSchema.multipleOf = newSchema.divisibleBy;
    delete newSchema.divisibleBy;
  }

  // fix boolean exclusiveMinimum
  if (newSchema.minimum && newSchema.exclusiveMinimum === true) {
    newSchema.exclusiveMinimum = newSchema.minimum;
    delete newSchema.minimum;
  } else if (typeof newSchema.exclusiveMinimum !== 'number') {
    delete newSchema.exclusiveMinimum;
  }

  // fix boolean exclusiveMaximum
  if (newSchema.maximum && newSchema.exclusiveMaximum === true) {
    newSchema.exclusiveMaximum = newSchema.maximum;
    delete newSchema.maximum;
  } else if (typeof newSchema.exclusiveMaximum !== 'number') {
    delete newSchema.exclusiveMaximum;
  }

  // update or delete $schema identifier
  if (
    newSchema.$schema === 'http://json-schema.org/draft-03/schema#' ||
    newSchema.$schema === 'http://json-schema.org/draft-04/schema#'
  ) {
    newSchema.$schema = 'http://json-schema.org/draft-06/schema#';
  } else if (newSchema.$schema) {
    const description = 'Converted to draft 6 from ' + newSchema.$schema;
    if (newSchema.description) {
      newSchema.description += '\n' + description;
    } else {
      newSchema.description = description
    }
    delete newSchema.$schema;
  }

  // convert id to $id
  if (newSchema.id && !newSchema.$id) {
    newSchema.$id = newSchema.id + '-CONVERTED-TO-DRAFT-06';
    delete newSchema.id;
  }

  // convert sub schemas
  Object.keys(newSchema)
    .filter(key => typeof newSchema[key] === 'object')
    .forEach(key => {
      if (
        [ 'definitions', 'dependencies', 'properties', 'patternProperties' ]
          .includes(key) && !Array.isArray(newSchema[key])
      ) {
        const newKey = {};
        for (const subKey of Object.keys(newSchema[key])) {
          newKey[subKey] = convertJsonSchemaToDraft6(newSchema[key][subKey]);
        }
        newSchema[key] = newKey;
      } else if (
        [ 'items', 'additionalItems', 'additionalProperties',
          'allOf', 'anyOf', 'oneOf', 'not' ].includes(key)
      ) {
        newSchema[key] = convertJsonSchemaToDraft6(newSchema[key]);
      }
    });

  return newSchema;
}
