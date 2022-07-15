import { Snippet } from "./primitives";
import { curry, isFunction, isArray } from "lodash";
import { Text } from "@codemirror/state";
import { nanoid } from "nanoid";


export type FormulaColumn = {
  name: string,
  formula: string
}

export type ResultRow = {[name: string]: any}

function evaluateFormula (source: string, snippets: Snippet[], doc: Text) {

  const API = {
    VALUES_OF_TYPE: (type: string): Snippet[] => {
      return snippets.filter((snippet) => snippet.type === type)
    },

    ON_SAME_LINE: curry((a: Snippet, b: Snippet): boolean => {
      const lineStartA = doc.lineAt(a.span[0]).number
      const lineEndA = doc.lineAt(a.span[1]).number
      const lineStartB = doc.lineAt(b.span[0]).number
      const lineEndB = doc.lineAt(b.span[1]).number

      return (
        lineStartA === lineEndA &&
        lineStartB === lineEndB &&
        lineStartA === lineStartB
      )
    }),

    FILTER: curry((list: any[], condition: any): any[] => {
      return list.filter((item: any) => {
        if (isFunction(condition)) {

          return condition(item)
        }
        return item
      })
    }),

    FIRST: (list: any[]): any => {
      return list[0]
    },


    SECOND: (list: any[]): any => {
      return list[1];
    }
  }

  let fn = new Function('API', `
    with (API) {
      return ${source}
    }
  `)

  return fn(API)
}

export function evaluateColumns (columns: FormulaColumn[], snippets: Snippet[], doc: Text) : ResultRow[]  {
  let resultRows : ResultRow[] = [];


  for (const column of columns) {
    if (resultRows.length === 0) {
      const result = evaluateFormula(column.formula, snippets, doc)

      if (isArray(result)) {
        for (const item of result) {
          resultRows.push({ [column.name]: item })
        }

      } else {
        resultRows.push({ [column.name]: result })
      }
    }
  }

  return resultRows
}