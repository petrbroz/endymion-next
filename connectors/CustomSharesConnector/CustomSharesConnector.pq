[Version = "0.0.2"]
section CustomSharesConnector;

[DataSource.Kind="CustomSharesConnector", Publish="CustomSharesConnector.Publish"]
shared CustomSharesConnector.Contents = (shareUrl as text) =>
    let
        share = CustomSharesConnector.GetShare(shareUrl),
        urn = share[URN],
        accessToken = share[AccessToken],
        views = CustomSharesConnector.GetViews(urn, accessToken),
        firstView = List.First(views),
        guid = firstView[guid],
        properties = CustomSharesConnector.GetProperties(urn, guid, accessToken)
    in
        properties;

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
        response = Web.Contents(shareUrl, [ Headers = [ #"Accept" = "application/json" ] ]),
        json = Json.Document(response),
        urn = json[urn],
        credentials = json[credentials],
        access_token = credentials[access_token]
    in
        [
            AccessToken = access_token,
            URN = urn
        ];

CustomSharesConnector.GetViews = (urn as text, accessToken as text) =>
    let
        // TODO: support different geos
        url = "https://developer.api.autodesk.com/modelderivative/v2/designdata/" & urn & "/metadata",
        response = Web.Contents(url, [ Headers = [ #"Accept" = "application/json", #"Authorization" = "Bearer " & accessToken ] ]),
        json = Json.Document(response),
        data = json[data]
    in
        data[metadata];

CustomSharesConnector.GetProperties = (urn as text, guid as text, accessToken as text) =>
    let
        // TODO: support different geos
        url = "https://developer.api.autodesk.com/modelderivative/v2/designdata/" & urn & "/metadata/" & guid & "/properties",
        response = Web.Contents(url, [ Headers = [ #"Accept" = "application/json", #"Authorization" = "Bearer " & accessToken ] ]),
        json = Json.Document(response),
        data = json[data],
        properties = Table.FromRecords(data[collection])
    in
        properties;
