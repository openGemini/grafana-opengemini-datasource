# openGemini data source plugin

OpenGemini is a global open-source cloud-native distributed time series database. It provides standalone and distributed versions with excellent read and write performance and efficient data analysis capabilities. Supports mainstream development languages and multi-form deployment (such as cloud, Docker, and physical machine), integrates storage and analysis, and is easy to expand. It is dedicated to efficiently storing and analyzing massive time series data in IoT and O&M monitoring scenarios to further reduce enterprise operation and O&M costs and improve product quality and production efficiency.

## Configure the data source

To configure basic settings for the data source, complete the following steps:

1.  Click **Connections** in the left-side menu.
1.  Under Your connections, click **Data sources**.
1.  Enter `openGemini` in the search bar.
1.  Select **openGemini**.

    The **Settings** tab of the data source is displayed.

1.  Set the data source's basic configuration options carefully

| Name                  | Description                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| **Name**              | Sets the name you use to refer to the data source in panels and queries.                               |
| **Default**           | Sets whether the data source is pre-selected for new panels.                                           |
| **URL**               | The HTTP protocol, IP address, and port of your openGemini API. openGemini's default API port is 8086. |
| **Min time interval** | _(Optional)_ Refer to [Min time interval](#configure-min-time-interval).                               |
| **Database**          | Sets the database name to query                                                                        |

1. network settings

| Name                | Description                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Access**          | Only Server access mode is functional. Direct browser access is deprecated.                                                                                |
| **Allowed cookies** | Defines which cookies are forwarded to the data source.All other cookies are deleted                                                                       |
| **User**            | Sets the username to sign into openGemini                                                                                                                  |
| **Password**        | Sets the password to sign into openGemini                                                                                                                  |
| **HTTP mode**       | Sets the HTTP method used to query your data source.The POST verb allows for larger queries that would return an error using the GET verb.Defaults to GET. |

## Min time interval

The **Min time interval** setting defines a lower limit for the auto group-by time interval.

This value must be formatted as a number followed by a valid time identifier:

| Identifier | Description |
| ---------- | ----------- |
| `y`        | year        |
| `M`        | month       |
| `w`        | week        |
| `d`        | day         |
| `h`        | hour        |
| `m`        | minute      |
| `s`        | second      |
| `ms`       | millisecond |
