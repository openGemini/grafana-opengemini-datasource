import { TemplateSrv } from '@grafana/runtime';
import { MetadataQueryType } from './types';

export const buildMetaQuery = (
	options: { type: MetadataQueryType; fromMeasurement?: string; rp?: string; database?: string },
	templateSrv?: TemplateSrv,
) => {
	let query = '';
	let { type, fromMeasurement, rp, database } = options;

	if (database === '$database' && templateSrv) {
		database = templateSrv.replace(database);
	}
	switch (type) {
		case 'RETENTION_POLICIES':
			return 'SHOW RETENTION POLICIES on "' + database + '"';
		case 'FIELD_KEYS':
			query = `SHOW FIELD KEYS on ${database}`;
			break;
		case 'TAG_KEYS':
			query = `SHOW TAG KEYS on ${database}`;
			break;
		case 'MEASUREMENTS':
			query = `SHOW MEASUREMENTS on ${database}`;
			break;
		case 'DATABASES':
			query = 'SHOW DATABASES';
			return query;
	}

	if (fromMeasurement) {
		if (!fromMeasurement.match('^/.*/') && !fromMeasurement.match(/^merge\(.*\)/)) {
			fromMeasurement = `"${fromMeasurement}"`;
		}

		if (rp && rp !== 'default') {
			rp = `"${rp}"`;
			fromMeasurement = `${rp}.${fromMeasurement}`;
		}
		query += ` FROM ${fromMeasurement}`;
	}
	return query;
};
