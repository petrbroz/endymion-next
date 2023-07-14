[Version = "0.0.5"]
section CustomSharesConnector;

[DataSource.Kind="CustomSharesConnector", Publish="CustomSharesConnector.Publish"]
shared CustomSharesConnector.Contents = (shareUrl as text) =>
    let
        share = CustomSharesConnector.GetShare(shareUrl),
        urn = share[URN],
        guid = share[GUID],
        region = share[Region],
        accessToken = share[AccessToken],
        tree = CustomSharesConnector.GetTree(urn, guid, region, accessToken),
        FlattenTreeNodeRecursive = (node as record, hierarchy as list) =>
            if Record.HasFields(node, "objects")
            then {{ node[objectid], hierarchy }} & List.Combine(List.Transform(node[objects], each @FlattenTreeNodeRecursive(_, hierarchy & { node[name] })))
            else {{ node[objectid], hierarchy }},
        hierarchy = Table.FromRows(FlattenTreeNodeRecursive(tree, {}), { "objectid", "hierarchy" }),
        properties = CustomSharesConnector.GetProperties(urn, guid, region, accessToken)
    in
        Table.Join(properties, "objectid", hierarchy, "objectid");

CustomSharesConnector = [
    Authentication = [
        Anonymous = []
    ]
];

CustomSharesConnector.Publish = [
    Beta = true,
    Category = "Other",
    ButtonText = { Extension.LoadString("ButtonTitle"), Extension.LoadString("ButtonHelp") },
    LearnMoreUrl = "https://github.com/petrbroz/endymion-next",
    SourceImage = CustomSharesConnector.Icons,
    SourceTypeImage = CustomSharesConnector.Icons
];

CustomSharesConnector.Icons = [
    Icon16 = { Extension.Contents("CustomSharesConnector16.png"), Extension.Contents("CustomSharesConnector20.png"), Extension.Contents("CustomSharesConnector24.png"), Extension.Contents("CustomSharesConnector32.png") },
    Icon32 = { Extension.Contents("CustomSharesConnector32.png"), Extension.Contents("CustomSharesConnector40.png"), Extension.Contents("CustomSharesConnector48.png"), Extension.Contents("CustomSharesConnector64.png") }
];

CustomSharesConnector.GetShare = (shareUrl as text) =>
    let
        response = Web.Contents(shareUrl, [
            Headers = [
                #"Accept" = "application/json"
            ]
        ]),
        json = Json.Document(response),
        credentials = json[credentials],
        accessToken = credentials[access_token],
        urn = json[urn],
        region = Record.FieldOrDefault(json, "region", "US"),
        guid = Record.FieldOrDefault(json, "guid",
            let
                views = CustomSharesConnector.GetViews(urn, region, accessToken),
                firstView = List.First(views)
            in
                firstView[guid]
        )
    in
        [
            URN = urn,
            GUID = guid,
            Region = region,
            AccessToken = accessToken
        ];

CustomSharesConnector.GetViews = (urn as text, region as text, accessToken as text) =>
    let
        base_path =
            if region = "US" then "modelderivative/v2"
            else if region = "EMEA" then "modelderivative/v2/regions/eu"
            else error "Unsuported region.",
        url = "https://developer.api.autodesk.com/" & base_path & "/designdata/" & urn & "/metadata",
        response = Web.Contents(url, [
            Headers = [
                #"Accept" = "application/json",
                #"Authorization" = "Bearer " & accessToken
            ]
        ]),
        json = Json.Document(response),
        data = json[data]
    in
        data[metadata];

CustomSharesConnector.GetTree = (urn as text, guid as text, region as text, accessToken as text) =>
    let
        base_path =
            if region = "US" then "modelderivative/v2"
            else if region = "EMEA" then "modelderivative/v2/regions/eu"
            else error "Unsupported region.",
        url = "https://developer.api.autodesk.com/" & base_path & "/designdata/" & urn & "/metadata/" & guid,
        response = Web.Contents(url, [
            Headers = [
                #"Accept" = "application/json",
                #"Authorization" = "Bearer " & accessToken
            ],
            ManualStatusHandling = { 202 }
        ]),
        metadata = Value.Metadata(response),
        json = if metadata[Response.Status] = 202 then error "Request is being processed. Please try again later." else Json.Document(response),
        data = json[data],
        objects = data[objects]
    in
        List.First(objects);

CustomSharesConnector.GetProperties = (urn as text, guid as text, region as text, accessToken as text) =>
    let
        base_path =
            if region = "US" then "modelderivative/v2"
            else if region = "EMEA" then "modelderivative/v2/regions/eu"
            else error "Unsupported region.",
        url = "https://developer.api.autodesk.com/" & base_path & "/designdata/" & urn & "/metadata/" & guid & "/properties?forceget=true",
        response = Web.Contents(url, [
            Headers = [
                #"Accept" = "application/json",
                #"Authorization" = "Bearer " & accessToken
            ],
            ManualStatusHandling = { 202 }
        ]),
        metadata = Value.Metadata(response),
        json = if metadata[Response.Status] = 202 then error "Request is being processed. Please try again later." else Json.Document(response),
        data = json[data],
        properties = Table.FromRecords(data[collection])
    in
        properties;
