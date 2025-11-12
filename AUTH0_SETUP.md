# Auth0 Setup Guide

This guide will help you set up Auth0 authentication for the MultiTool application.

## Prerequisites

- An Auth0 account (sign up at [https://auth0.com](https://auth0.com))
- Node.js and npm installed

## Step 1: Create an Auth0 Application

1. Log in to your [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** > **Applications**
3. Click **Create Application**
4. Choose a name (e.g., "MultiTool")
5. Select **Single Page Web Applications**
6. Click **Create**

## Step 2: Configure Application Settings

In your newly created application:

1. Go to the **Settings** tab
2. Note down your **Domain** and **Client ID**
3. Add the following to **Allowed Callback URLs**:
   ```
   http://localhost:3000
   ```
4. Add the following to **Allowed Logout URLs**:
   ```
   http://localhost:3000
   ```
5. Add the following to **Allowed Web Origins**:
   ```
   http://localhost:3000
   ```
6. Click **Save Changes**

## Step 3: Configure Auth0 API (Required for JWT Tokens)

**This step is REQUIRED** to get valid JWT tokens for your backend API.

1. Go to **Applications** > **APIs** in Auth0 Dashboard
2. Click **Create API**
3. Set the following:
   - **Name**: `MultiTool API` (or any name you prefer)
   - **Identifier**: `https://multitool-api.com` (this is your API audience)
   - **Signing Algorithm**: `RS256`
4. Click **Create**
5. (Optional) In the **Permissions** tab, you can add scopes like `compress:pdf`, `convert:pdf`, etc.

> **Important:** The identifier (audience) must match exactly what you use in your environment variables and backend validation.

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in the root of your project:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Auth0 credentials:
   ```env
   REACT_APP_AUTH0_DOMAIN=your-tenant.auth0.com
   REACT_APP_AUTH0_CLIENT_ID=your-client-id
   REACT_APP_AUTH0_AUDIENCE=https://multitool-api.com
   REACT_APP_BACKEND_API_URL=http://localhost:8085
   ```

   Replace:
   - `your-tenant.auth0.com` with your Auth0 Domain
   - `your-client-id` with your Auth0 Client ID
   - `https://multitool-api.com` with your API Identifier from Step 3

## Step 5: Additional API Configuration (Optional)

If you want to add custom permissions/scopes:

1. In your Auth0 API, go to the **Permissions** tab
2. Add scopes such as:
   - `compress:pdf` - Permission to compress PDFs
   - `convert:pdf` - Permission to convert PDFs
   - `generate:password` - Permission to generate passwords
3. You can then check these permissions in your backend

## Step 6: Run the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Navigate to `http://localhost:3000`
4. Click **Sign In** or **Sign Up** to test authentication

## Features Implemented

- ✅ Auth0 authentication with login/signup
- ✅ Protected routes requiring authentication
- ✅ JWT token integration for API calls
- ✅ PDF compression with backend API
- ✅ Adjustable compression level (0-100)
- ✅ User profile display in navigation
- ✅ Secure logout functionality

## Troubleshooting

### "Invalid state" error
- Make sure your callback URLs are correctly configured in Auth0
- Check that your domain and client ID are correct in `.env.local`

### Authentication not working
- Verify your `.env.local` file exists and contains correct values
- Restart your development server after changing environment variables
- Clear browser cache and cookies

### API calls failing with "Invalid token" or "Unauthorized"
- **Make sure you created an Auth0 API** (Step 3) - this is required!
- Verify the `REACT_APP_AUTH0_AUDIENCE` in your `.env.local` matches your Auth0 API Identifier exactly
- Ensure your backend server is running at the configured URL
- Check that the backend is configured to accept JWT tokens from Auth0
- Verify CORS settings on your backend allow requests from `http://localhost:3000`
- The backend should validate tokens using your Auth0 domain's JWKS endpoint

### Token is opaque (not a JWT)
- This means the API audience is not configured correctly
- Verify you created an Auth0 API and set the audience in your `.env.local`
- Restart your development server after changing environment variables

## Backend API Requirements

Your backend service at `http://localhost:8085/api/pdf/v2/compress` should:

1. Accept POST requests with `multipart/form-data`
2. Validate JWT token from `Authorization: Bearer <token>` header
3. Accept two form fields:
   - `file`: PDF file to compress
   - `compressionLevel`: Number between 0-100
4. Return the compressed PDF file as a blob response
5. Set appropriate CORS headers

Example backend validation (Node.js/Express):
```javascript
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// JWT validation middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${YOUR_AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: 'https://multitool-api.com', // Must match your API identifier
  issuer: `https://${YOUR_AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

// Apply to your routes
app.post('/api/pdf/v2/compress', checkJwt, (req, res) => {
  // Token is valid, proceed with compression
  // User info available in req.user
});
```

Example for Java/Spring Boot:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Value("${auth0.audience}")
    private String audience;
    
    @Value("${auth0.domain}")
    private String domain;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .mvcMatchers("/api/pdf/**").authenticated()
            .and()
            .oauth2ResourceServer().jwt()
            .decoder(jwtDecoder());
    }

    JwtDecoder jwtDecoder() {
        OAuth2TokenValidator<Jwt> withAudience = new AudienceValidator(audience);
        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(domain);
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(withAudience, withIssuer);

        NimbusJwtDecoder jwtDecoder = JwtDecoders.fromOidcIssuerLocation(domain);
        jwtDecoder.setJwtValidator(validator);
        return jwtDecoder;
    }
}
```

## Production Deployment

For production deployment:

1. Update Auth0 application settings with your production URLs
2. Set production environment variables
3. Configure Auth0 custom domain (optional)
4. Enable social login providers if needed (Google, GitHub, etc.)

## Additional Resources

- [Auth0 React SDK Documentation](https://auth0.com/docs/quickstart/spa/react)
- [Auth0 JWT Validation](https://auth0.com/docs/secure/tokens/json-web-tokens/validate-json-web-tokens)
- [MultiTool GitHub Repository](https://github.com/your-repo)

