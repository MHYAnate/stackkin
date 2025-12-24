import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLError } from 'graphql/error';

const coerceJSON = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new GraphQLError('Invalid JSON string');
    }
  }
  return value;
};

export const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type for storing arbitrary JSON values',
  
  serialize(value) {
    // Ensure we return valid JSON
    if (value === null || value === undefined) {
      return null;
    }
    
    // If it's already an object/array, return it
    if (typeof value === 'object' || Array.isArray(value)) {
      return value;
    }
    
    // Try to parse if it's a string
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    return value;
  },
  
  parseValue(value) {
    return coerceJSON(value);
  },
  
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
        try {
          return JSON.parse(ast.value);
        } catch (error) {
          throw new GraphQLError('Invalid JSON string literal');
        }
      
      case Kind.OBJECT:
        return parseObject(ast);
      
      case Kind.LIST:
        return ast.values.map(parseValue);
      
      case Kind.INT:
      case Kind.FLOAT:
        return Number(ast.value);
      
      case Kind.BOOLEAN:
        return ast.value;
      
      case Kind.NULL:
        return null;
      
      default:
        throw new GraphQLError(`Cannot parse JSON value of kind: ${ast.kind}`);
    }
  }
});

// Helper function to parse GraphQL object literal
const parseObject = (ast) => {
  const value = {};
  ast.fields.forEach(field => {
    value[field.name.value] = parseValue(field.value);
  });
  return value;
};

// Helper function to parse values
const parseValue = (ast) => {
  switch (ast.kind) {
    case Kind.STRING:
      try {
        return JSON.parse(ast.value);
      } catch {
        return ast.value;
      }
    
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    
    case Kind.BOOLEAN:
      return ast.value;
    
    case Kind.NULL:
      return null;
    
    case Kind.OBJECT:
      return parseObject(ast);
    
    case Kind.LIST:
      return ast.values.map(parseValue);
    
    default:
      throw new GraphQLError(`Cannot parse value of kind: ${ast.kind}`);
  }
};

export default JSONScalar;