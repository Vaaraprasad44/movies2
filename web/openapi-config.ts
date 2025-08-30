import type { ConfigFile } from '@rtk-query/codegen-openapi'

const config: ConfigFile = {
  schemaFile: '../PythonApi/openapi.json',
  apiFile: './src/store/api/empty-api.ts',
  apiImport: 'emptySplitApi',
  outputFiles: {
    './src/store/api/generated/movies.ts': {
      filterEndpoints: [/Movie/]
    },
  },
  exportName: 'moviesApi',
  hooks: true,
}

export default config