import { DataSourcePlugin } from '@grafana/data';
import { GeminiDataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
// import VariableQueryEditor from './components/VariableQueryEditor';
import { GeminiQuery, GeminiOptions } from './types';

export const plugin = new DataSourcePlugin<GeminiDataSource, GeminiQuery, GeminiOptions>(GeminiDataSource)
	.setConfigEditor(ConfigEditor)
	.setQueryEditor(QueryEditor);
// .setVariableQueryEditor();
