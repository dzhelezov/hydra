import {
  parse,
  visit,
  buildASTSchema,
  GraphQLSchema,
  validateSchema,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  DirectiveNode,
  GraphQLEnumType,
  GraphQLInterfaceType,
  InterfaceTypeDefinitionNode,
  GraphQLUnionType,
  GraphQLNamedType,
} from 'graphql'
import * as fs from 'fs-extra'
import Debug from 'debug'
import { cloneDeep } from 'lodash'
import { SCHEMA_DEFINITIONS_PREAMBLE } from './constant'
import { SchemaDirective } from './SchemaDirective'
import { FTSDirective } from './FTSDirective'
import path from 'path'

const debug = Debug('qnode-cli:schema-parser')

export const DIRECTIVES: SchemaDirective[] = [new FTSDirective()]

export type SchemaNode =
  | ObjectTypeDefinitionNode
  | FieldDefinitionNode
  | DirectiveNode

export interface Visitor {
  /**
   * Generic visit function for the AST schema traversal.
   * Only ObjectTypeDefinition and FieldDefinition nodes are included in the path during the
   * traversal
   *
   * May throw validation errors
   *
   * @param path: DFS path in the schema tree ending at the directive node of interest
   */
  visit: (path: SchemaNode[]) => void
}

export interface Visitors {
  /**
   * A map from the node name to the Visitor
   *
   * During a DFS traversal of the AST tree if a directive node
   * name matches the key in the directives map, the corresponding visitor is called
   */
  directives: { [name: string]: Visitor }
}

/**
 * Parse GraphQL schema
 * @constructor(schemaPath: string)
 */
export class GraphQLSchemaParser {
  // GraphQL shchema
  schema: GraphQLSchema
  // List of the object types defined in schema
  private _objectTypeDefinations: ObjectTypeDefinitionNode[]
  private namedTypes: GraphQLNamedType[]

  constructor(schemaPath: string) {
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema not found')
    }
    const contents = this.getUnifiedSchema(schemaPath)
    this.schema = GraphQLSchemaParser.buildSchema(contents)
    this.namedTypes = [
      ...Object.values(this.schema.getTypeMap()).filter(
        (t) => !t.name.startsWith('__') // filter out auxiliarry GraphQL types;
      ),
    ]
    this._objectTypeDefinations = GraphQLSchemaParser.createObjectTypeDefinations(
      this.schema
    )
  }

  private getUnifiedSchema(schemaPath: string): string {
    let schemaString = ''
    if (fs.lstatSync(schemaPath).isDirectory()) {
      fs.readdirSync(schemaPath).forEach((file) => {
        if (
          fs.lstatSync(path.resolve(schemaPath, file)).isFile() &&
          path.extname(file) === '.graphql'
        ) {
          schemaString = schemaString.concat(
            fs.readFileSync(path.resolve(schemaPath, file), 'utf8'),
            '\n\n'
          )
        }
      })
    } else if (fs.lstatSync(schemaPath).isFile()) {
      schemaString = fs.readFileSync(schemaPath, 'utf8')
    } else {
      throw new Error('Error reading schema file(s)')
    }
    return schemaString
  }

  private static buildPreamble(): string {
    let preamble = SCHEMA_DEFINITIONS_PREAMBLE
    DIRECTIVES.map((d) => (preamble += d.preamble + '\n'))
    return preamble
  }

  /**
   * Read GrapqhQL schema and build a schema from it
   */
  static buildSchema(contents: string): GraphQLSchema {
    const schema = GraphQLSchemaParser.buildPreamble().concat(contents)
    const ast = parse(schema)
    // in order to build AST with undeclared directive, we need to
    // switch off SDL validation
    const schemaAST = buildASTSchema(ast)

    const errors = validateSchema(schemaAST)

    if (errors.length > 0) {
      // There are errors
      let errorMsg = `Schema is not valid. Please fix the following errors: \n`
      errors.forEach((e) => (errorMsg += `\t ${e.name}: ${e.message}\n`))
      debug(errorMsg)
      throw new Error(errorMsg)
    }

    return schemaAST
  }

  getEnumTypes(): GraphQLEnumType[] {
    return [
      ...this.namedTypes.filter((t) => t instanceof GraphQLEnumType),
    ] as GraphQLEnumType[]
  }

  getInterfaceTypes(): GraphQLInterfaceType[] {
    return [
      ...this.namedTypes.filter((t) => t instanceof GraphQLInterfaceType),
    ] as GraphQLInterfaceType[]
  }

  getUnionTypes(): GraphQLUnionType[] {
    return [
      ...this.namedTypes.filter((t) => t instanceof GraphQLUnionType),
    ] as GraphQLUnionType[]
  }

  /**
   * Get object type definations from the schema. Build-in and scalar types are excluded.
   */
  static createObjectTypeDefinations(
    schema: GraphQLSchema
  ): ObjectTypeDefinitionNode[] {
    return [
      ...Object.values(schema.getTypeMap())
        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        .filter((t) => !t.name.match(/^__/) && !t.name.match(/Query/)) // skip the top-level Query type
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .map((t) => t.astNode),
    ]
      .filter(Boolean) // Remove undefineds and nulls
      .filter(
        (typeDefinationNode) =>
          typeDefinationNode?.kind === 'ObjectTypeDefinition'
      ) as ObjectTypeDefinitionNode[]
  }

  /**
   * Returns fields for a given GraphQL object
   * @param objDefinationNode ObjectTypeDefinitionNode
   */
  getFields(
    objDefinationNode: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode
  ): FieldDefinitionNode[] {
    if (objDefinationNode.fields) return [...objDefinationNode.fields]
    return []
  }

  /**
   * Returns GraphQL object type definations
   */
  getObjectDefinations(): ObjectTypeDefinitionNode[] {
    return this._objectTypeDefinations
  }

  /**
   * DFS traversal of the AST
   */
  dfsTraversal(visitors: Visitors): void {
    // we traverse starting from each definition
    this._objectTypeDefinations.map((objType) => {
      const path: SchemaNode[] = []
      visit(objType, {
        enter: (node) => {
          if (
            node.kind !== 'Directive' &&
            node.kind !== 'ObjectTypeDefinition' &&
            node.kind !== 'FieldDefinition'
          ) {
            // skip non-definition fields;
            return false
          }
          path.push(node)
          if (node.kind === 'Directive') {
            if (node.name.value in visitors.directives) {
              visitors.directives[node.name.value].visit(cloneDeep(path))
            }
          }
        },
        leave: () => path.pop(),
      })
    })
  }
}
