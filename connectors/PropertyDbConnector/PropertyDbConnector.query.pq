// Use this file to write queries to test your data connector
let
    result = PropertyDbConnector.Contents("http://192.168.0.104:8000")
in
    result
