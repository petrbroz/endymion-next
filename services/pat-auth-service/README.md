# pat-auth-service

Simple Node.js application that generates access tokens for [Autodesk Platform Services](https://aps.autodesk.com) based on Personal Access Tokens, or PATs.

## How does it work?

The server app supports a single endpoint - `POST /token` - that 3rd parties can call with a JSON payload including their PATs to get an access token in exchange.

### Example request

```json
{
    "personal_access_token": "4dc0b07e..."
}
```

### Example response

```json
{
    "access_token": "eyJhbGci...",
    "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
    "token_type": "Bearer",
    "expires_in": 3599,
    "refresh_token": "Awajh2pm..."
}
```

## Running locally

- Clone the repository
- Install Node.js dependencies: `npm install`
- Set the required env. variables (see the _.env.template_ file for the complete list)
- Run the Node.js app: `npm start`

> If you're using Visual Studio Code, there's a launch configuration setup for this app. You just need to create a copy of the _.env.template_ file, rename it to _.env_, and enter all the required env. variables there.
