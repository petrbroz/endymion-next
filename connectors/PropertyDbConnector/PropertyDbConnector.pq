[Version = "0.0.6"]
section PropertyDbConnector;

[DataSource.Kind="PropertyDbConnector", Publish="PropertyDbConnector.Publish"]
shared PropertyDbConnector.Contents = (#"Base URL" as text) =>
    let
        attrs = PropertyDbConnector.GetPropertyDbAttributes(#"Base URL"),
        avs = PropertyDbConnector.GetPropertyDbAvs(#"Base URL"),
        ids = PropertyDbConnector.GetPropertyDbIds(#"Base URL"),
        offs = PropertyDbConnector.GetPropertyDbOffsets(#"Base URL"),
        vals = PropertyDbConnector.GetPropertyDbValues(#"Base URL"),
        avsWithDbids = Table.Join(avs, "Attribute-Value-Pair ID", offs, "Offset", JoinKind.FullOuter),
        avsWithDbidsSorted = Table.Sort(avsWithDbids, { "Attribute-Value-Pair ID" }),
        avsWithDbidsFilled = Table.FillDown(avsWithDbidsSorted, { "DBID" }),
        avsWithDbidsFilledWithAttrs = Table.Join(avsWithDbidsFilled, "Attribute ID", attrs, "Attribute ID"),
        avsWithDbidsFilledWithAttrsAndVals = Table.Join(avsWithDbidsFilledWithAttrs, "Value ID", vals, "Value ID"),
        avsWithDbidsFilledWithAttrsAndValsAndExternalIds = Table.Join(avsWithDbidsFilledWithAttrsAndVals, "DBID", ids, "DBID"),
        filtered = Table.SelectRows(avsWithDbidsFilledWithAttrsAndValsAndExternalIds, each not Text.StartsWith([Category], "__") and not Text.EndsWith([Category], "__"))
    in
        Table.SelectColumns(filtered, {
            "DBID",
            "External ID",
            "Category",
            "Name",
            "Value",
            "Units",
            "Flags"
        });

PropertyDbConnector = [
    Authentication = [
        Anonymous = []
    ]
];

PropertyDbConnector.Publish = [
    Beta = true,
    Category = "Other",
    ButtonText = { Extension.LoadString("ButtonTitle"), Extension.LoadString("ButtonHelp") },
    LearnMoreUrl = "https://github.com/petrbroz/endymion-next",
    SourceImage = PropertyDbConnector.Icons,
    SourceTypeImage = PropertyDbConnector.Icons
];

PropertyDbConnector.Icons = [
    Icon16 = { Extension.Contents("PropertyDbConnector16.png"), Extension.Contents("PropertyDbConnector20.png"), Extension.Contents("PropertyDbConnector24.png"), Extension.Contents("PropertyDbConnector32.png") },
    Icon32 = { Extension.Contents("PropertyDbConnector32.png"), Extension.Contents("PropertyDbConnector40.png"), Extension.Contents("PropertyDbConnector48.png"), Extension.Contents("PropertyDbConnector64.png") }
];

PropertyDbConnector.GetPropertyDbIds = (baseUrl as text) =>
    let
        json = PropertyDbConnector.GetAsset(baseUrl & "/objects_ids.json.gz"),
        ids = Table.FromList(List.Skip(json, 1), null, { "External ID" })
    in
        Table.AddIndexColumn(ids, "DBID", 1);

PropertyDbConnector.GetPropertyDbOffsets = (baseUrl as text) =>
    let
        json = PropertyDbConnector.GetAsset(baseUrl & "/objects_offs.json.gz"),
        offs = Table.FromValue(List.Skip(json, 1), [DefaultColumnName = "Offset"])
    in
        Table.AddIndexColumn(offs, "DBID", 1);

PropertyDbConnector.GetPropertyDbAvs = (baseUrl as text) =>
    let
        json = PropertyDbConnector.GetAsset(baseUrl & "/objects_avs.json.gz"),
        split = List.Split(json, 2),
        avs = Table.FromRows(split,  { "Attribute ID", "Value ID" })
    in
        Table.AddIndexColumn(avs, "Attribute-Value-Pair ID", 0);

PropertyDbConnector.GetPropertyDbAttributes = (baseUrl as text) =>
    let
        json = PropertyDbConnector.GetAsset(baseUrl & "/objects_attrs.json.gz"),
        attrs = Table.FromRows(List.Skip(json, 1), { "Name", "Category", "Flags", "Units", "Extra 1", "Extra 2", "Extra 3", "Extra 4" })
    in
        Table.AddIndexColumn(attrs, "Attribute ID", 1);

PropertyDbConnector.GetPropertyDbValues = (baseUrl as text) =>
    let
        json = PropertyDbConnector.GetAsset(baseUrl & "/objects_vals.json.gz"),
        strings = List.Transform(json, each if Value.Is(_, type number) then Number.ToText(_) else _),
        vals = Table.FromList(List.Skip(strings, 1), null, { "Value" })
    in
        Table.AddIndexColumn(vals, "Value ID", 1);

PropertyDbConnector.GetAsset = (url as text) =>
    let
        response = Web.Contents(url),
        decompressed = Binary.Decompress(response, Compression.GZip),
        json = Json.Document(decompressed)
    in
        json;
