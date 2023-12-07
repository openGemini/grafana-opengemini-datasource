# openGemini data source plugin

OpenGemini is a global open-source cloud-native distributed time series database. It provides standalone and distributed versions with excellent read and write performance and efficient data analysis capabilities. Supports mainstream development languages and multi-form deployment (such as cloud, Docker, and physical machine), integrates storage and analysis, and is easy to expand. It is dedicated to efficiently storing and analyzing massive time series data in IoT and O&M monitoring scenarios to further reduce enterprise operation and O&M costs and improve product quality and production efficiency.

## Plugin usage

1. Click left menu**Connections**

   ![img](https://github.com/openGemini/grafana-opengemini-datasource/raw/main/src/img/screenshots/a7810e4beb7d94cd2dfb962d9a507cf0.png)

2. Select openGemini

   ![img](https://github.com/openGemini/grafana-opengemini-datasource/raw/main/src/img/screenshots/06870503a4d8bfc339483d98f5af1512.png)

3. Click**Add new data source**

   ![img](https://github.com/openGemini/grafana-opengemini-datasource/raw/main/src/img/screenshots/fe8a81f0ca0190912e2a4c797548a44f.png)

## Datasource configuration

1. Configure parameters for linking to openGemini, such as HTTP URL, user name, password, database and other related information

   ![img](https://github.com/openGemini/grafana-opengemini-datasource/raw/main/src/img/screenshots/edb33e147e67d90ddca04b9baca41363.png)

2. Configuration item description

   - **Name** Set the name of the datasource
   - **Default** Default datasource
   - **URL** The HTTP protocol, IP address, and port of your InfluxDB API. InfluxDB’s default API port is 8086.
   - **Allowed cookies** Defines which cookies are forwarded to the data source. All other cookies are deleted.
   - **Timeout** Timeout
   - **Database** Default database
   - **HTTP Method** Sets the HTTP method used to query your data source. The POST verb allows for larger queries that would return an error using the GET verb. Defaults to GET.
   - **Min time interval** Defines a lower limit for the auto group-by time interval.

## Query

Query syntax: [openGemini docs](https://docs.opengemini.org)

**Format as**：Choose to format the data as time series, table, log.

![img](https://github.com/openGemini/grafana-opengemini-datasource/raw/main/src/img/screenshots/a0458a5c4ca9c0db57553cac50b83d19.png)

**Alias by**: Support replace the measurement name,column name or tag name

- $measurement replace measurement name
- $col replace column name
- $tag_exampletag replace exampletag tag value

For example, query the CPU usage of each node, query statement

```sql
SELECT mean("CpuUsage") FROM $database.."system" WHERE $timeFilter GROUP BY time($__interval), "host" fill(null)
```

Alias by filling in $tag_host indicates the presentation of the default measurement name with the host value

![img](https://github.com/openGemini/grafana-opengemini-datasource/raw/main/src/img/screenshots/654c365a651647d57760eb16c4291d18.png)

Use time series and table format to display the effect as shown in the following figure:

![img](https://github.com/openGemini/grafana-opengemini-datasource/raw/main/src/img/screenshots/a91c972ec763ed6a5de7ee8dfdc11adf.png)

​ time series

![img](https://github.com/openGemini/grafana-opengemini-datasource/raw/main/src/img/screenshots/a6b117bda8eae61ea99b4759201004dd.png)

​ table

Query logs. The query statement is as follows:

```sql
select * from mst181998 limit 100
```

![img](https://github.com/openGemini/grafana-opengemini-datasource/raw/main/src/img/screenshots/a714ea310ef0800d5d6635759e3b1361.png)
