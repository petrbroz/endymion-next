# endymion-next

Experimental remake of https://aps.autodesk.com/en/docs/endymion/v1/developers_guide/overview, allowing developers to build [PowerBI](https://powerbi.com) reports incorporating design data - visuals as well as metadata - from [Autodesk Platform Services](https://aps.autodesk.com).

The project provides various types of components:

- _connectors_ - [custom PowerBI connectors](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility) for importing design metadata
- _visuals_ - [custom PowerBI visuals](https://powerbi.microsoft.com/en-us/developers/custom-visualization/) for displaying 2D and 3D designs
- _services_ - backend apps and services that may be required for some of the workflows

For more details, refer to the individual components' README files.

## Supported Scenarios

PowerBI reports that want to access data in Autodesk Platform Services must authenticate with the platform. Unfortunately, due to the security measures of custom PowerBI visuals, this is very difficult to do directly within the report. Below we outline a couple of solutions to solve this:

- [Custom Shares](./docs/custom-shares/)
- [Cached Derivatives](./docs/cached-derivatives/)
