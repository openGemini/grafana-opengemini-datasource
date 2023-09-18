import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
// import VariableQueryEditor from './components/VariableQueryEditor';
import { GeminiQuery, GeminiOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, GeminiQuery, GeminiOptions>(DataSource)
	.setConfigEditor(ConfigEditor)
	.setQueryEditor(QueryEditor);
// .setVariableQueryEditor();
